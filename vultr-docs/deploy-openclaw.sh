#!/bin/bash
# Deploy vultr-mcp-server to OpenClaw VPS (45.76.242.66)
# Run from local machine: bash deploy-openclaw.sh

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-45.76.242.66}"
REMOTE_DIR="/opt/vultr-mcp-server"
API_KEY="sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt"

echo "Deploying vultr-mcp-server to $REMOTE_HOST..."

# Copy files
rsync -avz --exclude node_modules --exclude dist \
  ../vultr-mcp-server/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Install + build
ssh "$REMOTE_USER@$REMOTE_HOST" bash << EOF
  set -e
  cd $REMOTE_DIR
  npm install
  npm run build
  echo "Build successful"
EOF

# Update OpenClaw config
ssh "$REMOTE_USER@$REMOTE_HOST" bash << EOF
  CONFIG="\$HOME/.openclaw/config.json"
  # Ensure mcpServers section exists
  if [ ! -f "\$CONFIG" ]; then
    echo '{}' > "\$CONFIG"
  fi
  
  # Use Node.js to merge config safely
  node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('\$CONFIG', 'utf8'));
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers.vultr = {
      command: 'node',
      args: ['$REMOTE_DIR/dist/index.js'],
      env: {
        VULTR_API_KEY: '$API_KEY',
        VULTR_BASE_URL: 'https://inference.do-ai.run/v1'
      }
    };
    fs.writeFileSync('\$CONFIG', JSON.stringify(cfg, null, 2));
    console.log('OpenClaw config updated');
  "
EOF

echo "Done! Restart OpenClaw gateway to apply changes:"
echo "  ssh $REMOTE_USER@$REMOTE_HOST 'openclaw gateway restart'"
