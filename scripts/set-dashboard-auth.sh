#!/bin/bash
cd /usr/local/lib/hermes-agent

# Set dashboard auth in profile config
hermes --profile user-cmqx0egxq config set dashboard.basic_auth.username admin
hermes --profile user-cmqx0egxq config set dashboard.basic_auth.password_hash 'scrypt$16384$8$1$34Y23YZEt//hRtd7rmjcGQ==$h1T+O1eCQw4j6spmiz3CTAURMCN/VORCp7bs3OOJK30='

# Kill any existing dashboard
pkill -f "hermes.*dashboard" 2>/dev/null || true
sleep 2

# Start dashboard on port 9000
nohup hermes --profile user-cmqx0egxq dashboard --port 9000 --host 0.0.0.0 --no-open --isolated --skip-build > /tmp/hermes-dashboard.log 2>&1 &

sleep 5
cat /tmp/hermes-dashboard.log | tail -10
echo "---"
ss -tlnp | grep 9000
