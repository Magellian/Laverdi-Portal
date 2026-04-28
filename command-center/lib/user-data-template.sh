#!/bin/bash
#
# User Data Script - Runs on first boot of new droplet
# This script initializes the OpenClaw Agent on the droplet
#
# Injected variables (from provisioner):
# - AGENT_WEBHOOK_URL: Base URL to send "ready" callback to
# - USER_ID: User UUID from Supabase
# - DROPLET_ID: DigitalOcean droplet ID
# - PAIRING_TOKEN: Token for agent-to-portal authentication
#
set -euo pipefail

# Logging
LOGFILE="/var/log/openclaw-bootstrap.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=== OpenClaw Agent Bootstrap Starting ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# System updates
echo "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install dependencies
echo "Installing dependencies..."
apt-get install -y -qq \
  curl \
  wget \
  git \
  nodejs \
  npm \
  htop \
  net-tools \
  openssl

# Create openclaw user
if ! id -u openclaw > /dev/null 2>&1; then
  echo "Creating openclaw system user..."
  useradd -m -d /home/openclaw -s /bin/bash -c "OpenClaw Agent" openclaw
  usermod -aG sudo openclaw
fi

# Create agent home directory
AGENT_HOME="/home/openclaw/agent"
mkdir -p "$AGENT_HOME"
chown -R openclaw:openclaw "$AGENT_HOME"
cd "$AGENT_HOME"

# Create environment file
echo "Setting up environment..."
cat > "$AGENT_HOME/.env" << EOF
# OpenClaw Agent Bootstrap Environment
NODE_ENV=production
AGENT_PORT=5000
AGENT_HEALTH_PORT=5001

# Portal callback
PORTAL_WEBHOOK_URL="AGENT_WEBHOOK_URL"
USER_ID="USER_ID"
DROPLET_ID="DROPLET_ID"
PAIRING_TOKEN="PAIRING_TOKEN"

# Agent identification
AGENT_NAME="Agent-DROPLET_ID"
AGENT_REGION="AGENT_REGION"

# Timestamps
BOOTSTRAPPED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

# Create minimal agent health check endpoint
echo "Setting up agent service..."
cat > "$AGENT_HOME/agent.js" << 'AGENT_JS'
const http = require('http');
const os = require('os');

// Read environment
const PORT = parseInt(process.env.AGENT_PORT || '5000', 10);
const HEALTH_PORT = parseInt(process.env.AGENT_PORT_HEALTH || '5001', 10);
const PORTAL_WEBHOOK_URL = process.env.PORTAL_WEBHOOK_URL;
const USER_ID = process.env.USER_ID;
const DROPLET_ID = process.env.DROPLET_ID;
const PAIRING_TOKEN = process.env.PAIRING_TOKEN;

// Get IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
};

const localIP = getLocalIP();

// Main agent server (placeholder)
const agentServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      agent: 'openclaw-agent',
      status: 'ready',
      uptime: process.uptime()
    }));
  }
});

agentServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[Agent] Listening on port ${PORT}`);
  console.log(`[Agent] Local IP: ${localIP}`);
});

// Health check server
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(HEALTH_PORT, '0.0.0.0', () => {
  console.log(`[Health] Listening on port ${HEALTH_PORT}`);
});

// On startup, call the portal webhook to signal "ready"
setTimeout(async () => {
  try {
    const { createConnection } = require('http');
    const callbackUrl = `${PORTAL_WEBHOOK_URL}/api/webhooks/do-callback`;
    const payload = JSON.stringify({
      user_id: USER_ID,
      droplet_id: parseInt(DROPLET_ID),
      status: 'ready',
      ip_address: localIP,
      pairing_token: PAIRING_TOKEN,
      bootstrapped_at: new Date().toISOString(),
    });

    console.log(`[Bootstrap] Calling portal: ${callbackUrl}`);
    
    const req = http.request(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('[Bootstrap] Portal acknowledged ready status');
        } else {
          console.warn(`[Bootstrap] Portal returned ${res.statusCode}: ${data}`);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[Bootstrap] Failed to call portal: ${err.message}`);
    });

    req.write(payload);
    req.end();
  } catch (error) {
    console.error(`[Bootstrap] Error in portal callback: ${error.message}`);
  }
}, 2000); // Wait 2 seconds for server to fully start

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Agent] Shutting down gracefully...');
  agentServer.close(() => process.exit(0));
});
AGENT_JS

chmod +x "$AGENT_HOME/agent.js"

# Create systemd service
echo "Creating systemd service..."
cat > "/etc/systemd/system/openclaw-agent.service" << EOF
[Unit]
Description=OpenClaw Agent Service
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=$AGENT_HOME
EnvironmentFile=$AGENT_HOME/.env
ExecStart=/usr/bin/node $AGENT_HOME/agent.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable openclaw-agent.service
systemctl start openclaw-agent.service

echo "=== OpenClaw Agent Bootstrap Complete ==="
echo "Service status:"
systemctl status openclaw-agent.service || true

# Wait a moment for the service to start and call the webhook
sleep 3

# Verify service is running
if systemctl is-active --quiet openclaw-agent.service; then
  echo "✓ Agent service is running"
else
  echo "✗ Agent service failed to start (check /var/log/openclaw-bootstrap.log)"
fi

echo "Bootstrap completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
