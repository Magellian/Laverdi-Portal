#!/bin/bash
# Add Vultr integration to LaVerdi portal (64.23.253.97)
# Run from local machine: bash deploy-portal.sh

set -euo pipefail

REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-64.23.253.97}"
PORTAL_DIR="${PORTAL_DIR:-/opt/laverdi}"

echo "Adding Vultr API routes to LaVerdi portal..."

# Create API routes on remote
ssh "$REMOTE_USER@$REMOTE_HOST" bash << 'EOF'
  set -e
  PORTAL_DIR=/opt/laverdi  # adjust if needed
  
  # Find the Next.js app directory
  if [ -d "$PORTAL_DIR/app" ]; then
    API_DIR="$PORTAL_DIR/app/api/vultr"
  elif [ -d "$PORTAL_DIR/src/app" ]; then
    API_DIR="$PORTAL_DIR/src/app/api/vultr"
  else
    echo "Could not find Next.js app directory at $PORTAL_DIR"
    exit 1
  fi
  
  mkdir -p "$API_DIR/chat"
  mkdir -p "$API_DIR/models"
  echo "Created API dirs at $API_DIR"
EOF

# Copy API routes
rsync -avz \
  ../laverdi-vultr-plugin/src/app/api/vultr/chat/route.ts \
  "$REMOTE_USER@$REMOTE_HOST:/tmp/vultr-chat-route.ts"

rsync -avz \
  ../laverdi-vultr-plugin/src/app/api/vultr/models/route.ts \
  "$REMOTE_USER@$REMOTE_HOST:/tmp/vultr-models-route.ts"

ssh "$REMOTE_USER@$REMOTE_HOST" bash << 'EOF'
  set -e
  PORTAL_DIR=/opt/laverdi
  
  if [ -d "$PORTAL_DIR/app" ]; then
    API_DIR="$PORTAL_DIR/app/api/vultr"
  else
    API_DIR="$PORTAL_DIR/src/app/api/vultr"
  fi
  
  mv /tmp/vultr-chat-route.ts "$API_DIR/chat/route.ts"
  mv /tmp/vultr-models-route.ts "$API_DIR/models/route.ts"
  
  # Add env vars to .env.local
  ENV_FILE="$PORTAL_DIR/.env.local"
  touch "$ENV_FILE"
  
  grep -q "VULTR_API_KEY" "$ENV_FILE" || \
    echo "VULTR_API_KEY=sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt" >> "$ENV_FILE"
  
  grep -q "VULTR_BASE_URL" "$ENV_FILE" || \
    echo "VULTR_BASE_URL=https://inference.do-ai.run/v1" >> "$ENV_FILE"
  
  grep -q "NEXT_PUBLIC_VULTR_WRAPPER_URL" "$ENV_FILE" || \
    echo "NEXT_PUBLIC_VULTR_WRAPPER_URL=http://64.23.253.97:3030" >> "$ENV_FILE"
  
  echo "Env vars added to $ENV_FILE"
  echo "Rebuilding portal..."
  
  cd "$PORTAL_DIR"
  npm run build 2>&1 | tail -20
  
  # Restart portal
  pm2 restart laverdi 2>/dev/null || pm2 restart next 2>/dev/null || \
    echo "Note: restart portal manually"
EOF

echo "Done! Test at https://laverdi.tech/api/vultr/models"
