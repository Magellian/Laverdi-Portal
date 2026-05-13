#!/bin/bash
# Deploy vultr-api-wrapper to LaVerdi VPS (64.23.253.97)
# Run from local machine: bash deploy-wrapper.sh

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-64.23.253.97}"
REMOTE_DIR="/opt/vultr-api-wrapper"
API_KEY="sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt"

echo "Deploying vultr-api-wrapper to $REMOTE_HOST..."

rsync -avz --exclude node_modules --exclude dist \
  ../vultr-api-wrapper/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

ssh "$REMOTE_USER@$REMOTE_HOST" bash << EOF
  set -e
  cd $REMOTE_DIR
  
  # Create .env
  cat > .env << 'ENVEOF'
VULTR_API_KEY=$API_KEY
VULTR_BASE_URL=https://inference.do-ai.run/v1
PORT=3030
CACHE_TTL_SEC=300
RATE_LIMIT_RPM=60
ENVEOF

  npm install
  npm run build
  
  # Install PM2 if not present
  which pm2 || npm install -g pm2
  
  # Start/restart
  pm2 stop vultr-wrapper 2>/dev/null || true
  pm2 start dist/server.js --name vultr-wrapper
  pm2 save
  
  echo "Wrapper running on port 3030"
  pm2 status vultr-wrapper
EOF

echo "Done! Wrapper available at http://$REMOTE_HOST:3030"
echo "Health: http://$REMOTE_HOST:3030/health"
