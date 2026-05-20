#!/usr/bin/env python3
"""
Refactor the /api/configure-channels endpoint to handle the new format:
  OLD: {"user_id", "platform", "token"}
  NEW: {"userId", "channels": {"telegram": {"botToken": "..."}, ...}}
"""

# Read the file
with open('/root/command-center.py', 'r') as f:
    lines = f.readlines()

# Find the @app.route('/api/configure-channels') decorator
start_idx = None
for i, line in enumerate(lines):
    if "@app.route('/api/configure-channels'" in line:
        start_idx = i
        break

if start_idx is None:
    print("ERROR: Could not find /api/configure-channels endpoint")
    exit(1)

# Find the end of this function (next @app.route or if __name__)
end_idx = None
indent_level = None
for i in range(start_idx + 1, len(lines)):
    line = lines[i]
    
    # Skip decorator lines
    if line.strip().startswith('@'):
        end_idx = i
        break
    
    # Found next function def at module level
    if line.strip().startswith('def ') and not line.startswith(' '):
        end_idx = i
        break
    
    # Found if __name__
    if "if __name__" in line:
        end_idx = i
        break

if end_idx is None:
    print(f"ERROR: Could not find end of function")
    exit(1)

print(f"Found endpoint from line {start_idx} to {end_idx}")

# NEW IMPLEMENTATION
new_impl = '''@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Configure a communication channel (Telegram, Discord, etc.)"""
    try:
        data = request.json or {}
        user_id = data.get('userId') or data.get('user_id')  # Support both formats
        channels = data.get('channels', {})
        
        if not user_id:
            return {'error': 'Missing userId'}, 400
        if not channels:
            return {'error': 'No channels provided'}, 400
        
        results = {}
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        for channel_name, config in channels.items():
            if not config:
                continue
            
            results[channel_name] = {'success': False, 'error': 'Not implemented'}
            
            # Telegram validation
            if channel_name == 'telegram':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                
                if ':' not in bot_token:
                    results[channel_name] = {'success': False, 'error': 'Invalid token format'}
                    continue
                
                try:
                    # Validate with Telegram API
                    resp = http.get(f'https://api.telegram.org/bot{bot_token}/getMe', timeout=5)
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': f'Telegram error {resp.status_code}'}
                        continue
                    
                    bot_data = resp.json()
                    if not bot_data.get('ok'):
                        results[channel_name] = {'success': False, 'error': bot_data.get('description', 'Invalid token')}
                        continue
                    
                    bot_info = bot_data.get('result', {})
                    
                    # Store in database
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'telegram',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'botToken': bot_token,
                            'botId': bot_info.get('id'),
                            'botUsername': bot_info.get('username')
                        },
                        'connected': True
                    }, on_conflict='user_id,channel_name').execute()
                    
                    results[channel_name] = {'success': True, 'botUsername': bot_info.get('username')}
                
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Telegram API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # Discord (placeholder)
            elif channel_name == 'discord':
                results[channel_name] = {'success': False, 'error': 'Discord not yet implemented'}
            
            # Other platforms (placeholder)
            else:
                try:
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': channel_name,
                        'enabled': config.get('enabled', True),
                        'config': config,
                        'connected': False
                    }, on_conflict='user_id,channel_name').execute()
                    results[channel_name] = {'success': True, 'message': f'{channel_name} stored (validation pending)'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
        
        return {'success': True, 'channels': results}, 200
    
    except Exception as e:
        print(f"ERROR in configure_channels: {e}", flush=True)
        return {'error': str(e)}, 500

'''

# Replace the old implementation
new_lines = lines[:start_idx] + [new_impl + '\n'] + lines[end_idx:]

# Write back
with open('/root/command-center.py', 'w') as f:
    f.writelines(new_lines)

print(f"✓ Refactored endpoint")
print(f"✓ Old lines {start_idx}-{end_idx} replaced with new implementation")
print(f"✓ File now has {len(new_lines)} lines (was {len(lines)})")
