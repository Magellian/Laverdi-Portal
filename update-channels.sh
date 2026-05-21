#!/bin/bash

# This script replaces the configure_channels function in command-center.py

cd /tmp

# Extract everything before the configure_channels function
head -n 549 /root/command-center.py > /tmp/cc-part1.py

# Add the improved configure_channels function
cat >> /tmp/cc-part1.py << 'NEWFUNC'
@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Configure a communication channel (Telegram, Discord, Slack, Signal)"""
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
            
            # ─── TELEGRAM ─────────────────────────────────────────────────────
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
                    
                    bot_info = bot_data.get('result', {})
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
            
            # ─── DISCORD ──────────────────────────────────────────────────────
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
                    
                    bot_user = resp.json()
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'discord',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'botToken': bot_token,
                            'botId': bot_user.get('id'),
                            'botUsername': bot_user.get('username')
                        },
                        'connected': True
                    }, on_conflict='user_id,channel_name').execute()
                    results[channel_name] = {'success': True, 'botUsername': bot_user.get('username')}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Discord API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── SLACK ────────────────────────────────────────────────────────
            elif channel_name == 'slack':
                bot_token = config.get('botToken', '').strip()
                app_token = config.get('appToken', '').strip()
                if not bot_token:
                    results[channel_name] = {'success': False, 'error': 'Missing botToken'}
                    continue
                if not app_token:
                    results[channel_name] = {'success': False, 'error': 'Missing appToken'}
                    continue
                if not bot_token.startswith('xoxb-'):
                    results[channel_name] = {'success': False, 'error': 'Invalid bot token format (must start with xoxb-)'}
                    continue
                if not app_token.startswith('xapp-'):
                    results[channel_name] = {'success': False, 'error': 'Invalid app token format (must start with xapp-)'}
                    continue
                
                try:
                    resp = http.get(
                        'https://slack.com/api/auth.test',
                        headers={'Authorization': f'Bearer {bot_token}'},
                        timeout=5
                    )
                    if not resp.ok:
                        results[channel_name] = {'success': False, 'error': f'Slack API error {resp.status_code}'}
                        continue
                    auth_data = resp.json()
                    if not auth_data.get('ok'):
                        results[channel_name] = {'success': False, 'error': auth_data.get('error', 'Invalid token')}
                        continue
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'slack',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'botToken': bot_token,
                            'appToken': app_token,
                            'teamId': auth_data.get('team_id'),
                            'botId': auth_data.get('user_id'),
                            'botUsername': auth_data.get('user')
                        },
                        'connected': True
                    }, on_conflict='user_id,channel_name').execute()
                    results[channel_name] = {'success': True, 'team': auth_data.get('team'), 'bot': auth_data.get('user')}
                except http.exceptions.Timeout:
                    results[channel_name] = {'success': False, 'error': 'Slack API timeout'}
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── SIGNAL ───────────────────────────────────────────────────────
            elif channel_name == 'signal':
                phone_number = config.get('phoneNumber', '').strip()
                if not phone_number:
                    results[channel_name] = {'success': False, 'error': 'Missing phoneNumber'}
                    continue
                if not phone_number.startswith('+'):
                    phone_number = '+' + phone_number
                if not phone_number[1:].isdigit() or len(phone_number) < 10:
                    results[channel_name] = {'success': False, 'error': 'Invalid phone number format (use E.164: +1234567890)'}
                    continue
                
                try:
                    supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'signal',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'phoneNumber': phone_number,
                            'status': 'awaiting_registration'
                        },
                        'connected': False
                    }, on_conflict='user_id,channel_name').execute()
                    results[channel_name] = {
                        'success': True,
                        'message': 'Signal configuration saved. Awaiting registration link.',
                        'phoneNumber': phone_number
                    }
                except Exception as e:
                    results[channel_name] = {'success': False, 'error': str(e)}
            
            # ─── UNKNOWN CHANNEL ──────────────────────────────────────────────
            else:
                results[channel_name] = {'success': False, 'error': f'Unknown channel type: {channel_name}'}
        
        return {'success': True, 'channels': results}, 200
    
    except Exception as e:
        return {'error': f'Configure channels error: {str(e)}'}, 500

NEWFUNC

# Add everything after the configure_channels function (starting from get_channels)
tail -n +651 /root/command-center.py >> /tmp/cc-part1.py

# Backup and replace
cp /root/command-center.py /root/command-center.bak-20260520-all-channels
cp /tmp/cc-part1.py /root/command-center.py

echo "✅ Updated command-center.py with full channel implementations"
ps aux | grep "command-center.py" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 2
nohup python3 /root/command-center.py > /tmp/cc.log 2>&1 &
sleep 3
ps aux | grep "command-center.py" | grep -v grep | head -1
echo "✅ Command center restarted"
