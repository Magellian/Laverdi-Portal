#!/usr/bin/env python3
"""
Fix the configure_channels function to use correct database schema.
The channels table uses 'platform' and 'token', not 'channel_name' and 'config'.
"""

import re

with open('/root/command-center.py', 'r') as f:
    content = f.read()

# Find and replace the entire configure_channels function with corrected version
old_start = "@app.route('/api/configure-channels', methods=['POST'])"
old_pattern = r"@app.route\('/api/configure-channels'.*?(?=\n@app\.route)"

new_function = """@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    \"\"\"Configure a communication channel (Telegram, Discord, Slack, Signal)\"\"\"
    try:
        data = request.json or {}
        user_id = data.get('userId') or data.get('user_id')
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
            
            # ─── TELEGRAM ──────────────────────────────────────
            if channel_name == 'telegram':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                if ':' not in bot_token:
                    results[channel_name] = {'success': False, 'error': 'Invalid token format'}
                    continue
                
                try:
                    resp = http.get(f'https://api.telegram.org/bot{bot_token}/getMe', timeout=5)
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': f'Telegram error {resp.status_code}'}
                        continue
                    bot_data = resp.json()
                    if not bot_data.get('ok'):
                        results[channel_name] = {'success': False, 'error': bot_data.get('description', 'Invalid token')}
                        continue
                    
                    # Store using correct schema: platform + token
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': channel_name,
                        'token': bot_token,
                    }, on_conflict='user_id,platform').execute()
                    
                    results[channel_name] = {'success': True, 'message': f'{channel_name} configured'}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Telegram API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── DISCORD ────────────────────────────────────────
            elif channel_name == 'discord':
                bot_token = config.get('botToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                
                try:
                    resp = http.get(
                        'https://discord.com/api/v10/users/@me',
                        headers={'Authorization': f'Bot {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        if resp.status_code == 401:
                            results[channel_name] = {'success': False, 'error': 'Invalid Discord bot token'}
                        else:
                            results[channel_name] = {'success': False, 'error': f'Discord error {resp.status_code}'}
                        continue
                    
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': channel_name,
                        'token': bot_token,
                    }, on_conflict='user_id,platform').execute()
                    
                    results[channel_name] = {'success': True, 'message': f'{channel_name} configured'}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Discord API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── SLACK ──────────────────────────────────────────
            elif channel_name == 'slack':
                bot_token = config.get('botToken', '').strip()
                app_token = config.get('appToken', '').strip()
                if not bot_token or not app_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken or appToken'}
                    continue
                if not bot_token.startswith('xoxb-') or not app_token.startswith('xapp-'):
                    results[channel_name] = {'success': False, 'error': 'Invalid token format'}
                    continue
                
                try:
                    resp = http.get(
                        'https://slack.com/api/auth.test',
                        headers={'Authorization': f'Bearer {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok or not resp.json().get('ok'):
                        results[channel_name] = {'success': False, 'error': 'Invalid Slack tokens'}
                        continue
                    
                    # Store bot token as primary; app_token is for webhooks (not stored now)
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': channel_name,
                        'token': bot_token,
                    }, on_conflict='user_id,platform').execute()
                    
                    results[channel_name] = {'success': True, 'message': f'{channel_name} configured'}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Slack API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── SIGNAL ─────────────────────────────────────────
            elif channel_name == 'signal':
                phone_number = config.get('phoneNumber', '').strip()
                if not phone_number:
                    results[channel_name] = {'success': False, 'error': 'Missing phoneNumber'}
                    continue
                if not phone_number.startswith('+'):
                    phone_number = '+' + phone_number
                if not phone_number[1:].isdigit() or len(phone_number) < 10:
                    results[channel_name] = {'success': False, 'error': 'Invalid phone format'}
                    continue
                
                try:
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': channel_name,
                        'token': phone_number,
                    }, on_conflict='user_id,platform').execute()
                    
                    results[channel_name] = {'success': True, 'message': f'{channel_name} configured'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            else:
                results[channel_name] = {'success': False, 'error': f'Unknown channel: {channel_name}'}
        
        return {'success': True, 'channels': results}, 200
    
    except Exception as e:
        return {'error': f'Configure channels error: {str(e)}'}, 500

"""

# Use regex to find and replace
pattern = r"@app\.route\('/api/configure-channels'.*?def configure_channels\(\):.*?(?=\n@app\.route\('/api/get-channels')"
match = re.search(pattern, content, re.DOTALL)

if match:
    content = content[:match.start()] + new_function + "\n" + content[match.end():]
    with open('/root/command-center.py', 'w') as f:
        f.write(content)
    print("✅ Updated configure_channels function with correct schema")
else:
    print("❌ Could not find function to replace")
    print("This might be due to different formatting. Manual update needed.")
