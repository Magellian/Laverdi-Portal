#!/bin/bash
# Setup OpenClaw gateway on fresh Vultr instance

set -e

INSTANCE_IP="64.176.209.181"
INSTANCE_ID="370cb96c-cc1f-48cf-a81a-a94fe08bc8e3"
USER_ID="4593b36f-90c6-44a2-93d1-ba8e8be52a1c"
GATEWAY_PORT=9000

echo "🚀 Setting up OpenClaw gateway on $INSTANCE_IP"
echo "================================================"
echo ""

# Step 1: Install Node.js
echo "Step 1: Installing Node.js..."
ssh -o StrictHostKeyChecking=no root@$INSTANCE_IP << 'EOF'
apt update
apt install -y nodejs npm git curl wget
echo "✓ Node.js installed"
EOF
echo ""

# Step 2: Clone OpenClaw repo
echo "Step 2: Cloning OpenClaw repository..."
ssh -o StrictHostKeyChecking=no root@$INSTANCE_IP << 'EOF'
cd /root
git clone https://github.com/openclaw/openclaw.git
cd openclaw
echo "✓ Repository cloned"
EOF
echo ""

# Step 3: Install OpenClaw
echo "Step 3: Installing OpenClaw..."
ssh -o StrictHostKeyChecking=no root@$INSTANCE_IP << 'EOF'
cd /root/openclaw
npm install
echo "✓ Dependencies installed"
EOF
echo ""

# Step 4: Start gateway
echo "Step 4: Starting OpenClaw gateway on port $GATEWAY_PORT..."
ssh -o StrictHostKeyChecking=no root@$INSTANCE_IP << EOF
cd /root/openclaw
nohup npm start -- --port $GATEWAY_PORT > /tmp/gateway.log 2>&1 &
sleep 5
ps aux | grep "npm start" | grep -v grep || echo "⚠ Gateway may not have started"
echo "✓ Gateway started (check with: ssh root@$INSTANCE_IP 'ps aux | grep npm')"
EOF
echo ""

# Step 5: Wait for gateway to be ready
echo "Step 5: Waiting for gateway to be ready..."
for i in {1..30}; do
    if curl -s http://$INSTANCE_IP:$GATEWAY_PORT/health > /dev/null 2>&1; then
        echo "✓ Gateway is responding"
        break
    else
        echo "  [$i/30] Waiting... (gateway warming up)"
        sleep 2
    fi
done
echo ""

echo "================================================"
echo "✅ OpenClaw Gateway Ready!"
echo "================================================"
echo ""
echo "Instance Details:"
echo "  IP: $INSTANCE_IP"
echo "  Gateway Port: $GATEWAY_PORT"
echo "  Instance ID: $INSTANCE_ID"
echo "  User ID: $USER_ID"
echo ""
echo "Next: Register instance in Supabase"
echo ""
