#!/bin/bash
# Add Telegram bot token to Hermes profile
#
# One-off operational script from initial setup. Reads secrets from this
# script's own environment instead of hardcoding them — export
# VULTR_INFERENCE_KEY and TELEGRAM_BOT_TOKEN before running.
set -e
: "${VULTR_INFERENCE_KEY:?Set VULTR_INFERENCE_KEY before running}"
: "${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN before running}"

cat > /root/.hermes/profiles/user-cmqx0egxq/.env << EOF
OPENAI_API_KEY=${VULTR_INFERENCE_KEY}
OPENAI_BASE_URL=https://api.vultrinference.com/v1
GATEWAY_ALLOW_ALL_USERS=true
HERMES_DASHBOARD=true
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
EOF

# Restart gateway to pick up Telegram
systemctl restart hermes-cmqx0egxq0005nx0i6sdzr9qf
sleep 8
journalctl -u hermes-cmqx0egxq0005nx0i6sdzr9qf --since '10 seconds ago' --no-pager
