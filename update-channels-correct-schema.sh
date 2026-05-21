#!/bin/bash

# Backup first
ssh root@66.42.70.66 "cp /root/command-center.py /root/command-center.bak-before-schema-fix"

# Now update the function to use correct column names
ssh root@66.42.70.66 << 'SSHCMD'
# Replace the database upsert calls to use correct schema (platform + token)
python3 << 'PYEOF'

with open('/root/command-center.py', 'r') as f:
    content = f.read()

# Replace all occurrences of the incorrect schema
replacements = [
    # Telegram
    (
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'telegram',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'botToken': bot_token,
                            'botId': bot_info.get('id'),
                            'botUsername': bot_info.get('username')
                        },
                        'connected': True
                    }, on_conflict='user_id,channel_name').execute()""",
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'telegram',
                        'token': bot_token,
                    }, on_conflict='user_id,platform').execute()"""
    ),
    # Discord  
    (
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'discord',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'botToken': bot_token,
                            'botId': bot_user.get('id'),
                            'botUsername': bot_user.get('username')
                        },
                        'connected': True
                    }, on_conflict='user_id,channel_name').execute()""",
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'discord',
                        'token': bot_token,
                    }, on_conflict='user_id,platform').execute()"""
    ),
    # Slack
    (
        """supabase.table('channels').upsert({
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
                    }, on_conflict='user_id,channel_name').execute()""",
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'slack',
                        'token': bot_token,
                    }, on_conflict='user_id,platform').execute()"""
    ),
    # Signal
    (
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'channel_name': 'signal',
                        'enabled': config.get('enabled', True),
                        'config': {
                            'phoneNumber': phone_number,
                            'status': 'awaiting_registration'
                        },
                        'connected': False
                    }, on_conflict='user_id,channel_name').execute()""",
        """supabase.table('channels').upsert({
                        'user_id': user_id,
                        'platform': 'signal',
                        'token': phone_number,
                    }, on_conflict='user_id,platform').execute()"""
    ),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"✅ Replaced one upsert call")
    else:
        print(f"⚠️ Could not find replacement pattern (may have different spacing)")

with open('/root/command-center.py', 'w') as f:
    f.write(content)

print("✅ File updated")

PYEOF

# Restart command center
pkill -f 'python3 /root/command-center.py'
sleep 2
nohup python3 /root/command-center.py > /tmp/cc.log 2>&1 &
sleep 2
ps aux | grep 'command-center.py' | grep -v grep | head -1
echo "✅ Command center restarted with corrected schema"

SSHCMD

echo "Done!"
