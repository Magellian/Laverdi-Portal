#!/usr/bin/env python3
"""Inject channel endpoints into command-center.py"""

import sys

# Read the original file
with open('/root/command-center.py', 'r') as f:
    lines = f.readlines()

# Find insertion point
insert_idx = None
for i, line in enumerate(lines):
    if 'if __name__ == \'__main__\':' in line:
        insert_idx = i
        break

if insert_idx is None:
    print("ERROR: Could not find insertion point")
    sys.exit(1)

# Define the endpoints code
endpoints_code = '''
# ─── Channel Configuration Endpoints ──────────────────────────────────

@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Store channel credentials (Telegram, Discord, etc)."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = data.get('userId')
    channels = data.get('channels', {})
    
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    results = {}
    
    for channel_name, config in channels.items():
        if not config:
            continue
        
        if channel_name == 'telegram':
            bot_token = config.get('botToken', '').strip()
            if not bot_token:
                results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                continue
            
            if bot_token.count(':') != 1:
                results[channel_name] = {'success': False, 'error': 'Invalid token format (need ID:TOKEN)'}
                continue
            
            try:
                resp = requests.get(f'https://api.telegram.org/bot{bot_token}/getMe', timeout=5)
                if not resp.ok:
                    results[channel_name] = {'success': False, 'error': f'Telegram error: {resp.status_code}'}
                    continue
                
                bot_data = resp.json()
                if not bot_data.get('ok'):
                    results[channel_name] = {'success': False, 'error': bot_data.get('description', 'Unknown error')}
                    continue
                
                bot_info = bot_data.get('result', {})
                channel_config = {
                    'botToken': bot_token,
                    'botId': bot_info.get('id'),
                    'botUsername': bot_info.get('username'),
                    'enabled': config.get('enabled', True)
                }
                
                insert_channel(user_id, 'telegram', channel_config)
                results[channel_name] = {'success': True, 'botUsername': bot_info.get('username')}
                app.logger.info(f"✓ Telegram bot {bot_info.get('username')} validated")
            
            except requests.exceptions.Timeout:
                results[channel_name] = {'success': False, 'error': 'Telegram API timeout'}
            except Exception as e:
                results[channel_name] = {'success': False, 'error': f'Error: {str(e)}'}
        
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
                channel_config = {
                    'botToken': bot_token,
                    'botId': discord_user.get('id'),
                    'botUsername': discord_user.get('username'),
                    'enabled': config.get('enabled', True)
                }
                
                insert_channel(user_id, 'discord', channel_config)
                results[channel_name] = {'success': True, 'botUsername': discord_user.get('username')}
            
            except Exception as e:
                results[channel_name] = {'success': False, 'error': str(e)}
        
        else:
            # Other channels (Slack, Signal, WhatsApp) - just store config
            insert_channel(user_id, channel_name, config)
            results[channel_name] = {'success': True}
    
    return jsonify({'success': True, 'channels': results}), 200


@app.route('/api/get-channels', methods=['GET'])
def get_channels():
    """Fetch stored channel configuration for a user."""
    if not require_auth(request):
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId'}), 400
    
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL', 'https://dcvrkpgvxqdcboostkpz.supabase.co'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY')
        )
        
        response = supabase.table('channels').select('*').eq('user_id', user_id).execute()
        channels_data = response.data
        
        result = {'channels': {}}
        for channel in channels_data:
            config = channel.get('config') or {}
            result['channels'][channel['channel_name']] = {
                'enabled': channel.get('enabled', False),
                'connected': channel.get('connected', False),
                'botUsername': config.get('botUsername', ''),
                'lastError': channel.get('last_error')
            }
        
        return jsonify(result), 200
    
    except Exception as e:
        app.logger.error(f"Error in get_channels: {e}")
        return jsonify({'error': str(e)}), 500


def insert_channel(user_id: str, channel_name: str, config: dict):
    """Insert or update channel configuration in Supabase."""
    try:
        supabase = create_client(
            os.getenv('SUPABASE_URL', 'https://dcvrkpgvxqdcboostkpz.supabase.co'),
            os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY')
        )
        
        payload = {
            'user_id': user_id,
            'channel_name': channel_name,
            'enabled': config.get('enabled', True),
            'config': config,
            'connected': bool(config.get('botToken') or config.get('botId'))
        }
        
        # Try upsert
        supabase.table('channels').upsert(payload, on_conflict='user_id,channel_name').execute()
        app.logger.info(f"✓ Stored {channel_name} config for {user_id}")
        return {'success': True}
    
    except Exception as e:
        app.logger.error(f"Error in insert_channel: {e}")
        raise


def require_auth(request):
    """Verify Bearer token."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return False
    token = auth_header.split(' ')[1]
    expected = os.getenv('LAVERDI_ADMIN_API_TOKEN', 'laverdi-admin-api-2026')
    return token == expected


'''

# Insert the endpoints before the "if __name__" line
new_lines = lines[:insert_idx] + [endpoints_code + '\n'] + lines[insert_idx:]

# Write back
with open('/root/command-center.py', 'w') as f:
    f.writelines(new_lines)

print(f"✓ Injected endpoints at line {insert_idx}")
print(f"✓ File now has {len(new_lines)} lines")
