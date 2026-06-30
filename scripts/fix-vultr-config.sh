#!/bin/bash
# Fix Hermes profile to use Vultr Serverless Inference

cat > /root/.hermes/profiles/user-cmqx0egxq/config.yaml << 'EOF'
model: deepseek-v4-flash
providers:
  openai:
    apiKey: 5Q6AQULLLXA37KCIHRS2ZJIFEVE2VI6AXTJA
    baseUrl: https://api.vultrinference.com/v1
dashboard:
  basic_auth:
    username: admin
    password_hash: scrypt$16384$8$1$34Y23YZEt//hRtd7rmjcGQ==$h1T+O1eCQw4j6spmiz3CTAURMCN/VORCp7bs3OOJK30=
EOF

cat > /root/.hermes/profiles/user-cmqx0egxq/.env << 'EOF'
OPENAI_API_KEY=5Q6AQULLLXA37KCIHRS2ZJIFEVE2VI6AXTJA
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
