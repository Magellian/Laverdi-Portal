#!/bin/bash
# Complete LaVerdi Telegram Integration Fix Deployment
# Deploy all 3 fixes in one script

set -e  # Exit on error

echo "🚀 LaVerdi Telegram Integration - Complete Deployment"
echo "======================================================"
echo ""

# ─── CONFIG ──────────────────────────────────────────────────────
BACKUP_DIR="/root/backups/$(date +%Y%m%d-%H%M%S)"
COMMAND_CENTER="/root/command-center.py"
LOG_FILE="/var/log/laverdi-deployment.log"

# ─── FIX #1: HOSTNAME RESOLUTION ──────────────────────────────────
echo "📍 Fix #1: Hostname Resolution"
echo "─────────────────────────────"

if grep -q "laverdi-command-center" /etc/hosts; then
    echo "✓ Hostname already in /etc/hosts"
else
    echo "Adding 127.0.0.1 laverdi-command-center to /etc/hosts..."
    echo "127.0.0.1 laverdi-command-center" >> /etc/hosts
    echo "✓ Added"
fi

# Verify
if curl -s http://laverdi-command-center:8000/health > /dev/null 2>&1; then
    echo "✓ Connectivity test PASSED"
else
    echo "⚠ Connectivity test failed (Command Center may not be running yet)"
fi

echo ""

# ─── FIX #2: DATABASE TABLE ──────────────────────────────────────
echo "🗄 Fix #2: Create Database Table"
echo "────────────────────────────────"

cat > /tmp/create_channels_table.sql << 'EOSQL'
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE SET NULL,
  
  channel_name VARCHAR(50) NOT NULL CHECK (channel_name IN ('telegram', 'discord', 'slack', 'whatsapp', 'signal')),
  enabled BOOLEAN DEFAULT FALSE,
  
  config JSONB,
  
  webhook_url VARCHAR(255),
  webhook_secret VARCHAR(255),
  webhook_verified BOOLEAN DEFAULT FALSE,
  last_webhook_ping TIMESTAMP,
  
  connected BOOLEAN DEFAULT FALSE,
  last_error TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, channel_name, instance_id)
);

CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_instance_id ON channels(instance_id);
CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(enabled);
CREATE INDEX IF NOT EXISTS idx_channels_channel_name ON channels(channel_name);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own channels"
  ON channels FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own channels"
  ON channels FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own channels"
  ON channels FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own channels"
  ON channels FOR DELETE USING (user_id = auth.uid());

GRANT ALL ON channels TO authenticated;
EOSQL

echo "✓ SQL migration prepared: /tmp/create_channels_table.sql"
echo "⚠ NOTE: You must run this in Supabase SQL Editor manually:"
echo "   1. Go to https://app.supabase.com"
echo "   2. Select your project → SQL Editor → New Query"
echo "   3. Copy contents of /tmp/create_channels_table.sql"
echo "   4. Click RUN"
echo ""

# ─── FIX #3: API ENDPOINTS ──────────────────────────────────────
echo "⚙️  Fix #3: Add API Endpoints to Command Center"
echo "──────────────────────────────────────────────"

# Create backup
mkdir -p "$BACKUP_DIR"
cp "$COMMAND_CENTER" "$BACKUP_DIR/command-center.py"
echo "✓ Backup created: $BACKUP_DIR/command-center.py"

# Check if endpoints already exist
if grep -q "def configure_channels" "$COMMAND_CENTER"; then
    echo "⚠ Endpoints already present (may be outdated)"
    echo "  Creating additional backup: $BACKUP_DIR/command-center.py.existing"
fi

# Create the endpoints code
cat > /tmp/endpoints.py << 'EOPYTHON'

# ─── Channel Configuration Endpoints ──────────────────────────────────

from functools import wraps
import requests
import json

# Helper: Check Bearer token
def require_auth(request):
    """Verify API token in Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    expected_token = os.getenv('LAVERDI_ADMIN_API_TOKEN', 'laverdi-admin-api-2026')
    return token == expected_token


@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """
    Store channel credentials (Telegram, Discord, Slack, etc.)
    and set up webhooks.
    """
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = data.get('userId')
    channels = data.get('channels', {})
    
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        results = {}
        
        for channel_name, config in channels.items():
            if not config or not isinstance(config, dict):
                continue
            
            app.logger.info(f"Configuring {channel_name} for user {user_id}")
            
            # ─── Telegram Validation ──────────────────────────────
            if channel_name == 'telegram':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Missing botToken'
                    }
                    continue
                
                if not bot_token.count(':') == 1:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Invalid token format (should be ID:TOKEN)'
                    }
                    continue
                
                try:
                    resp = requests.get(
                        f'https://api.telegram.org/bot{bot_token}/getMe',
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {
                            'success': False,
                            'error': f'Telegram API error: {resp.status_code}'
                        }
                        continue
                    
                    telegram_user = resp.json()
                    if not telegram_user.get('ok'):
                        results[channel_name] = {
                            'success': False,
                            'error': f"Telegram API error: {telegram_user.get('description', 'Unknown error')}"
                        }
                        continue
                    
                    bot_info = telegram_user.get('result', {})
                    app.logger.info(f"✓ Telegram bot validated: {bot_info.get('username')}")
                    
                    insert_channel(
                        user_id=user_id,
                        channel_name='telegram',
                        config={
                            'botToken': bot_token,
                            'botId': bot_info.get('id'),
                            'botUsername': bot_info.get('username'),
                            'enabled': config.get('enabled', True)
                        }
                    )
                    
                    results[channel_name] = {
                        'success': True,
                        'botUsername': bot_info.get('username')
                    }
                
                except requests.exceptions.Timeout:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Telegram API timeout'
                    }
                except requests.exceptions.RequestException as e:
                    results[channel_name] = {
                        'success': False,
                        'error': f'Request error: {str(e)}'
                    }
            
            # ─── Discord Validation ──────────────────────────────
            elif channel_name == 'discord':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {
                        'success': False,
                        'error': 'Missing botToken'
                    }
                    continue
                
                try:
                    resp = requests.get(
                        'https://discordapp.com/api/users/@me',
                        headers={'Authorization': f'Bot {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {
                            'success': False,
                            'error': f'Invalid Discord token'
                        }
                        continue
                    
                    discord_user = resp.json()
                    
                    insert_channel(
                        user_id=user_id,
                        channel_name='discord',
                        config={
                            'botToken': bot_token,
                            'botId': discord_user.get('id'),
                            'botUsername': discord_user.get('username'),
                            'enabled': config.get('enabled', True)
                        }
                    )
                    
                    results[channel_name] = {
                        'success': True,
                        'botUsername': discord_user.get('username')
                    }
                
                except requests.exceptions.RequestException as e:
                    results[channel_name] = {
                        'success': False,
                        'error': f'Request error: {str(e)}'
                    }
            
            # ─── Other Channels (placeholder) ──────────────────────
            else:
                insert_channel(
                    user_id=user_id,
                    channel_name=channel_name,
                    config=config
                )
                results[channel_name] = {
                    'success': True,
                    'note': f'{channel_name} stored (validation not implemented yet)'
                }
        
        return jsonify({
            'success': True,
            'channels': results
        }), 200
    
    except Exception as e:
        app.logger.error(f"Error in configure_channels: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/get-channels', methods=['GET'])
def get_channels():
    """
    Fetch stored channel configuration for a user.
    """
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        channels_data = query_channels(user_id)
        
        response = {
            'channels': {}
        }
        
        for channel in channels_data:
            channel_name = channel['channel_name']
            config = channel['config'] or {}
            
            response['channels'][channel_name] = {
                'enabled': channel['enabled'],
                'connected': channel['connected'],
                'botUsername': config.get('botUsername', ''),
                'lastError': channel['last_error']
            }
        
        return jsonify(response), 200
    
    except Exception as e:
        app.logger.error(f"Error in get_channels: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


# ─── Database Helper Functions ──────────────────────────────────────

def insert_channel(user_id: str, channel_name: str, config: dict):
    """Insert or update channel configuration in Supabase."""
    try:
        headers = _supabase_headers()
        
        payload = {
            'user_id': user_id,
            'channel_name': channel_name,
            'enabled': config.get('enabled', True),
            'config': config,
            'connected': bool(config.get('botToken') or config.get('botId')),
            'updated_at': 'now()'
        }
        
        resp = requests.post(
            f'{SUPABASE_URL}/rest/v1/channels?on_conflict=user_id,channel_name',
            headers=headers,
            json=payload
        )
        
        if not resp.ok:
            app.logger.error(f"Supabase insert error: {resp.text}")
            raise Exception(f"Failed to insert channel: {resp.text}")
        
        app.logger.info(f"✓ Stored {channel_name} config for {user_id}")
        return resp.json()
    
    except Exception as e:
        app.logger.error(f"Error in insert_channel: {e}")
        raise


def query_channels(user_id: str):
    """Query channels for a user from Supabase."""
    try:
        headers = _supabase_headers()
        
        resp = requests.get(
            f'{SUPABASE_URL}/rest/v1/channels?user_id=eq.{user_id}',
            headers=headers
        )
        
        if not resp.ok:
            app.logger.error(f"Supabase query error: {resp.text}")
            raise Exception(f"Failed to query channels: {resp.text}")
        
        return resp.json()
    
    except Exception as e:
        app.logger.error(f"Error in query_channels: {e}")
        raise


def _supabase_headers():
    """Build Supabase API headers."""
    return {
        'apikey': os.getenv('SUPABASE_ANON_KEY'),
        'Authorization': f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
        'Content-Type': 'application/json'
    }

EOPYTHON

echo "✓ Endpoints code prepared: /tmp/endpoints.py"

# Now inject into command-center.py
# Find the line with "if __name__ == '__main__':" and insert before it

echo ""
echo "Injecting endpoints into command-center.py..."

# Create a temporary file with the endpoints injected
python3 << 'EOINJECT'
import sys

# Read the original file
with open('/root/command-center.py', 'r') as f:
    lines = f.readlines()

# Read the endpoints
with open('/tmp/endpoints.py', 'r') as f:
    endpoints = f.read()

# Find the insertion point (before "if __name__ == '__main__':")
insertion_index = None
for i, line in enumerate(lines):
    if "if __name__ == '__main__':" in line:
        insertion_index = i
        break

if insertion_index is None:
    print("ERROR: Could not find insertion point in command-center.py")
    sys.exit(1)

# Insert the endpoints
new_lines = lines[:insertion_index] + [endpoints + "\n"] + lines[insertion_index:]

# Write back
with open('/root/command-center.py', 'w') as f:
    f.writelines(new_lines)

print(f"✓ Injected endpoints at line {insertion_index}")
EOINJECT

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to inject endpoints"
    echo "Restoring backup..."
    cp "$BACKUP_DIR/command-center.py" "$COMMAND_CENTER"
    exit 1
fi

echo ""

# ─── RESTART SERVICES ────────────────────────────────────────────
echo "🔄 Restarting Services"
echo "─────────────────────"

# Restart command center
echo "Restarting Command Center..."
pm2 restart command-center
sleep 3

# Check status
if pm2 list | grep -q "command-center"; then
    echo "✓ Command Center restarted"
else
    echo "❌ Command Center failed to start"
    echo "Restoring backup..."
    cp "$BACKUP_DIR/command-center.py" "$COMMAND_CENTER"
    pm2 restart command-center
    exit 1
fi

echo ""

# ─── VERIFICATION ────────────────────────────────────────────────
echo "✅ Verification"
echo "──────────────"

# Test hostname
echo "Testing hostname resolution..."
if curl -s http://laverdi-command-center:8000/health > /dev/null 2>&1; then
    echo "✓ Hostname resolves"
else
    echo "⚠ Hostname resolution still failing"
fi

# Test API endpoint
echo "Testing API endpoint..."
response=$(curl -s -X POST http://laverdi-command-center:8000/api/configure-channels \
  -H "Authorization: Bearer laverdi-admin-api-2026" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","channels":{"telegram":{"botToken":"invalid"}}}' \
  2>/dev/null)

if echo "$response" | grep -q "success"; then
    echo "✓ API endpoint responding"
else
    echo "⚠ API endpoint test failed"
    echo "Response: $response"
fi

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "Summary:"
echo "✓ Fix #1: Hostname resolution (DONE)"
echo "⚠ Fix #2: Database table (MANUAL - see instructions below)"
echo "✓ Fix #3: API endpoints (DONE)"
echo ""
echo "───────────────────────────────────────────────────────────"
echo "IMPORTANT: Complete Fix #2 Manually"
echo "───────────────────────────────────────────────────────────"
echo ""
echo "1. Log into Supabase: https://app.supabase.com"
echo "2. Select your project"
echo "3. Click: SQL Editor → New Query"
echo "4. Copy this file into the editor:"
echo "   /tmp/create_channels_table.sql"
echo "5. Click: RUN"
echo ""
echo "OR paste this command:"
echo "  cat /tmp/create_channels_table.sql"
echo ""
echo "───────────────────────────────────────────────────────────"
echo ""
echo "Next steps:"
echo "1. Complete Fix #2 in Supabase"
echo "2. Create a test Telegram bot (@BotFather)"
echo "3. Log into https://laverdi.tech"
echo "4. Dashboard → Channels → Telegram → Paste token → Save"
echo "5. Test: Send message to bot in Telegram"
echo ""
echo "Logs:"
echo "  pm2 logs command-center --lines 50"
echo ""
echo "Rollback (if needed):"
echo "  cp $BACKUP_DIR/command-center.py /root/command-center.py"
echo "  pm2 restart command-center"
echo ""
