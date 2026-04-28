#!/bin/bash
# Configure OpenClaw gateway with API credentials and allowed origins
# Run this after the gateway container is running:
#   ssh root@<vps> < configure-openclaw.sh

set -e

CONTAINER_NAME="openclaw-chris-1"
AUTH_FILE="/root/.openclaw/agents/main/agent/auth-profiles.json"
CONFIG_FILE="/root/.openclaw/.openclaw/openclaw.json"

echo "Configuring OpenClaw Gateway..."

# Configure auth profiles and allowed origins
docker exec $CONTAINER_NAME node << 'JSEOF'
const fs = require('fs');

const authFile = '/root/.openclaw/agents/main/agent/auth-profiles.json';
const configFile = '/root/.openclaw/.openclaw/openclaw.json';

console.log('Reading configuration files...');
const auth = JSON.parse(fs.readFileSync(authFile, 'utf8'));
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

// Add DigitalOcean credentials
if (process.env.DIGITALOCEAN_API_KEY) {
  auth.profiles['digitalocean:default'] = {
    type: 'api_key',
    provider: 'digitalocean',
    key: process.env.DIGITALOCEAN_API_KEY
  };
  auth.lastGood.digitalocean = 'digitalocean:default';
  console.log('✅ DigitalOcean API key configured');
}

// Add external origins
const newOrigins = [
  'http://64.23.142.154:8824',
  'http://10.242.212.97:8824',
  'http://0.0.0.0:8824',
  'http://localhost:8824',
  'http://127.0.0.1:8824'
];

if (config.gateway && config.gateway.controlUi) {
  const currentOrigins = config.gateway.controlUi.allowedOrigins || [];
  for (const origin of newOrigins) {
    if (!currentOrigins.includes(origin)) {
      currentOrigins.push(origin);
    }
  }
  config.gateway.controlUi.allowedOrigins = currentOrigins;
  console.log('✅ Allowed origins configured');
}

// Set gateway model
if (process.env.OPENCLAW_AGENT_MODEL) {
  config.gateway.model = process.env.OPENCLAW_AGENT_MODEL;
  console.log('✅ Agent model set to:', process.env.OPENCLAW_AGENT_MODEL);
}

fs.writeFileSync(authFile, JSON.stringify(auth, null, 2));
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log('✅ Configuration saved');
JSEOF

# Restart gateway to apply changes
echo "Restarting gateway..."
docker restart $CONTAINER_NAME
sleep 5

echo "✅ Configuration complete!"
echo "Gateway should be ready at http://64.23.142.154:8824/"
