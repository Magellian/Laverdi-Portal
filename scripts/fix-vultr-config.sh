#!/bin/bash
# Fix Hermes profile to use Vultr Serverless Inference
#
# One-off operational script from initial setup. Reads secrets from this
# script's own environment instead of hardcoding them — export
# VULTR_INFERENCE_KEY and DASHBOARD_PASSWORD_HASH before running.
set -e
: "${VULTR_INFERENCE_KEY:?Set VULTR_INFERENCE_KEY before running}"
: "${DASHBOARD_PASSWORD_HASH:?Set DASHBOARD_PASSWORD_HASH before running}"

cat > /root/.hermes/profiles/user-cmqx0egxq/config.yaml << EOF
model: deepseek-v4-flash
providers:
  openai:
    apiKey: ${VULTR_INFERENCE_KEY}
    baseUrl: https://api.vultrinference.com/v1
dashboard:
  basic_auth:
    username: admin
    password_hash: ${DASHBOARD_PASSWORD_HASH}
EOF

cat > /root/.hermes/profiles/user-cmqx0egxq/.env << EOF
OPENAI_API_KEY=${VULTR_INFERENCE_KEY}
OPENAI_BASE_URL=https://api.vultrinference.com/v1
GATEWAY_ALLOW_ALL_USERS=true
HERMES_DASHBOARD=true
EOF

# Restart gateway
systemctl restart hermes-cmqx0egxq0005nx0i6sdzr9qf

# Restart dashboard
pkill -f "hermes.*dashboard" 2>/dev/null || true
sleep 3
nohup hermes --profile user-cmqx0egxq dashboard --port 9000 --host 0.0.0.0 --no-open --isolated --skip-build > /tmp/hermes-dashboard.log 2>&1 &
sleep 5
echo "Gateway status:"
systemctl status hermes-cmqx0egxq0005nx0i6sdzr9qf --no-pager | head -5
echo "Dashboard:"
ss -tlnp | grep 9000
