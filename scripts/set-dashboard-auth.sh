#!/bin/bash
cd /usr/local/lib/hermes-agent

# Set dashboard auth in profile config
hermes --profile user-cmqx0egxq config set dashboard.basic_auth.username admin
: "${DASHBOARD_PASSWORD_HASH:?Set DASHBOARD_PASSWORD_HASH before running}"
hermes --profile user-cmqx0egxq config set dashboard.basic_auth.password_hash "${DASHBOARD_PASSWORD_HASH}"

# Kill any existing dashboard
pkill -f "hermes.*dashboard" 2>/dev/null || true
sleep 2

# Start dashboard on port 9000
nohup hermes --profile user-cmqx0egxq dashboard --port 9000 --host 0.0.0.0 --no-open --isolated --skip-build > /tmp/hermes-dashboard.log 2>&1 &

sleep 5
cat /tmp/hermes-dashboard.log | tail -10
echo "---"
ss -tlnp | grep 9000
