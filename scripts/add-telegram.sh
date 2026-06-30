#!/bin/bash
# Add Telegram bot token to Hermes profile

cat > /root/.hermes/profiles/user-cmqx0egxq/.env << 'EOF'
OPENAI_API_KEY=5Q6AQULLLXA37KCIHRS2ZJIFEVE2VI6AXTJA
OPENAI_BASE_URL=https://api.vultrinference.com/v1
GATEWAY_ALLOW_ALL_USERS=true
HERMES_DASHBOARD=true
TELEGRAM_BOT_TOKEN=8950101342:AAGnAM-CbHg0P2RqNScsd-Hv26fGvni9aJA
EOF

# Restart gateway to pick up Telegram
systemctl restart hermes-cmqx0egxq0005nx0i6sdzr9qf
sleep 8
journalctl -u hermes-cmqx0egxq0005nx0i6sdzr9qf --since '10 seconds ago' --no-pager
