#!/bin/bash
# LaVerdi Fix #3: API Endpoints - Inline Deployment
# Copy-paste this entire script into SSH and run it

set -e

echo "🚀 LaVerdi Fix #3: API Endpoints Deployment"
echo "============================================"
echo ""

COMMAND_CENTER="/root/command-center.py"
BACKUP_DIR="/root/backups/$(date +%Y%m%d-%H%M%S)"

# ─── STEP 1: Verify hostname (Fix #1) ────────────────────────
echo "📍 Verifying Fix #1: Hostname"
if grep -q "laverdi-command-center" /etc/hosts; then
    echo "✓ Hostname already added"
else
    echo "Adding hostname..."
    echo "127.0.0.1 laverdi-command-center" >> /etc/hosts
    echo "✓ Added"
fi

echo ""

# ─── STEP 2: Backup command-center.py ────────────────────────
echo "💾 Creating Backup"
mkdir -p "$BACKUP_DIR"
cp "$COMMAND_CENTER" "$BACKUP_DIR/command-center.py"
echo "✓ Backup: $BACKUP_DIR/command-center.py"

echo ""

# ─── STEP 3: Inject API endpoints ────────────────────────────
echo "⚙️  Injecting API Endpoints"

# Use Python to inject the endpoints before "if __name__"
python3 << 'EOPYTH'
import os

command_center_path = '/root/command-center.py'

# Read original file
with open(command_center_path, 'r') as f:
    content = f.read()

# Check if endpoints already exist
if 'def configure_channels' in content:
    print("⚠ Endpoints already present (skipping injection)")
    exit(0)

# API endpoints code
endpoints_code = '''
# ─── Channel Configuration Endpoints ──────────────────────────────────

@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Store channel credentials and set up webhooks."""
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
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                
                if not bot_token.count(':') == 1:
                    results[channel_name] = {'success': False, 'error': 'Invalid token format'}
                    continue
                
                try:
                    resp = requests.get(
                        f'https://api.telegram.org/bot{bot_token}/getMe',
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': f'Telegram API error: {resp.status_code}'}
                        continue
                    
                    telegram_user = resp.json()
                    if not telegram_user.get('ok'):
                        results[channel_name] = {'success': False, 'error': telegram_user.get('description')}
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
                    
                    results[channel_name] = {'success': True, 'botUsername': bot_info.get('username')}
                
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': f'Request error: {str(e)}'}
            
            # ─── Discord Validation ──────────────────────────────
            elif channel_name == 'discord':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                
                try:
                    resp = requests.get(
                        'https://discordapp.com/api/users/@me',
                        headers={'Authorization': f'Bot {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': 'Invalid Discord token'}
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
                    results[channel_name] = {'success': True, 'botUsername': discord_user.get('username')}
                
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            else:
                insert_channel(user_id=user_id, channel_name=channel_name, config=config)
                results[channel_name] = {'success': True, 'note': f'{channel_name} stored'}
        
        return jsonify({'success': True, 'channels': results}), 200
    
    except Exception as e:
        app.logger.error(f"Error in configure_channels: {e}", exc_info=True)
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500


@app.route('/api/get-channels', methods=['GET'])
def get_channels():
    """Fetch stored channel configuration for a user."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        channels_data = query_channels(user_id)
        response = {'channels': {}}
        
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


def insert_channel(user_id: str, channel_name: str, config: dict):
    """Insert or update channel configuration in Supabase."""
    try:
        headers = {
            'apikey': os.getenv('SUPABASE_ANON_KEY'),
            'Authorization': f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
            'Content-Type': 'application/json'
        }
        
        payload = {
            'user_id': user_id,
            'channel_name': channel_name,
            'enabled': config.get('enabled', True),
            'config': config,
            'connected': bool(config.get('botToken') or config.get('botId')),
            'updated_at': 'now()'
        }
        
        resp = requests.post(
            f'{os.getenv("SUPABASE_URL")}/rest/v1/channels?on_conflict=user_id,channel_name',
            headers=headers,
            json=payload
        )
        
        if not resp.ok:
            app.logger.error(f"Supabase error: {resp.text}")
            raise Exception(f"Failed to insert: {resp.text}")
        
        app.logger.info(f"✓ Stored {channel_name} for {user_id}")
        return resp.json()
    except Exception as e:
        app.logger.error(f"Error in insert_channel: {e}")
        raise


def query_channels(user_id: str):
    """Query channels for a user."""
    try:
        headers = {
            'apikey': os.getenv('SUPABASE_ANON_KEY'),
            'Authorization': f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
            'Content-Type': 'application/json'
        }
        
        resp = requests.get(
            f"{os.getenv('SUPABASE_URL')}/rest/v1/channels?user_id=eq.{user_id}",
            headers=headers
        )
        
        if not resp.ok:
            raise Exception(f"Query failed: {resp.text}")
        
        return resp.json()
    except Exception as e:
        app.logger.error(f"Error in query_channels: {e}")
        raise


def require_auth(request):
    """Verify API token."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    expected = os.getenv('LAVERDI_ADMIN_API_TOKEN', 'laverdi-admin-api-2026')
    return token == expected

'''

# Find insertion point
lines = content.split('\n')
insertion_idx = None

for i, line in enumerate(lines):
    if "if __name__ == '__main__':" in line:
        insertion_idx = i
        break

if insertion_idx is None:
    print("❌ ERROR: Could not find insertion point")
    exit(1)

# Inject code
new_lines = lines[:insertion_idx] + ['', endpoints_code, ''] + lines[insertion_idx:]
new_content = '\n'.join(new_lines)

# Write back
with open(command_center_path, 'w') as f:
    f.write(new_content)

print(f"✓ Injected endpoints at line {insertion_idx}")

EOPYTH

if [ $? -ne 0 ]; then
    echo "❌ Injection failed"
    echo "Restoring backup..."
    cp "$BACKUP_DIR/command-center.py" "$COMMAND_CENTER"
    exit 1
fi

echo "✓ Endpoints injected"

echo ""

# ─── STEP 4: Restart command center ──────────────────────────
echo "🔄 Restarting Command Center"

pm2 restart command-center 2>&1 || true
sleep 3

pm2 list | grep command-center || echo "⚠ Command center status unclear"

echo ""

# ─── STEP 5: Verify ──────────────────────────────────────────
echo "✅ Verification"

echo "Testing API endpoint..."
curl -s -X POST http://laverdi-command-center:8000/api/configure-channels \
  -H "Authorization: Bearer laverdi-admin-api-2026" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","channels":{"telegram":{"botToken":"invalid"}}}' | jq . || echo "⚠ Endpoint test returned non-JSON"

echo ""
echo "═════════════════════════════════════════════════════════"
echo "✅ Fix #3 COMPLETE"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Run Fix #2 (database) in Supabase SQL Editor manually:"
echo "   - Go to https://app.supabase.com"
echo "   - SQL Editor → New Query"
echo "   - Create channels table (see documentation)"
echo ""
echo "2. Create test Telegram bot (@BotFather)"
echo ""
echo "3. Test in portal: https://laverdi.tech"
echo "   Dashboard → Channels → Telegram → Paste token"
echo ""
echo "Logs: pm2 logs command-center"
echo "Rollback: cp $BACKUP_DIR/command-center.py /root/command-center.py && pm2 restart command-center"
echo ""
