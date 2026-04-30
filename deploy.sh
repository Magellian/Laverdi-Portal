#!/bin/bash
# deploy.sh - Deploy Laverdi Portal to VPS
# Usage: ./deploy.sh [staging|production]

set -e

ENV=${1:-production}
VPS_HOST="root@64.23.142.154"
VPS_PATH="/root/laverdi-portal"
APP_NAME="laverdi-portal"

echo "🚀 Deploying Laverdi Portal to $ENV"

# 1. Build locally
echo "📦 Building Next.js app..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"

# 2. Create deployment package
echo "📦 Creating deployment package..."
tar -czf laverdi-portal-deploy.tar.gz \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    --exclude=.env \
    .next \
    pages \
    components \
    lib \
    public \
    package.json \
    package-lock.json \
    next.config.js \
    Dockerfile \
    .dockerignore \
    .env.production

if [ $? -ne 0 ]; then
    echo "❌ Package creation failed"
    exit 1
fi
echo "✅ Package created: laverdi-portal-deploy.tar.gz"

# 3. SCP to VPS
echo "📤 Uploading to VPS..."
scp -o ConnectTimeout=10 laverdi-portal-deploy.tar.gz $VPS_HOST:/tmp/
if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi
echo "✅ Upload successful"

# 4. Deploy on VPS
echo "🔧 Deploying on VPS..."
ssh $VPS_HOST << 'DEPLOY_SCRIPT'
set -e
cd /root/laverdi-portal

# Extract
echo "📦 Extracting files..."
tar -xzf /tmp/laverdi-portal-deploy.tar.gz

# Install deps
echo "📦 Installing dependencies..."
npm install --production

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t laverdi-portal:latest .

# Stop old container
echo "🛑 Stopping old container..."
docker stop laverdi-portal 2>/dev/null || true
sleep 2

# Remove old container
echo "🗑️ Removing old container..."
docker rm laverdi-portal 2>/dev/null || true

# Run new container
echo "🚀 Starting new container..."
docker run -d \
  --name laverdi-portal \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  laverdi-portal:latest

sleep 3

# Health check
echo "🏥 Checking health..."
curl -f http://localhost:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Portal healthy"
else
    echo "❌ Health check failed"
    exit 1
fi

echo "✅ Deployment complete!"
DEPLOY_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

# 5. Cleanup
echo "🧹 Cleaning up..."
rm -f laverdi-portal-deploy.tar.gz
ssh $VPS_HOST "rm -f /tmp/laverdi-portal-deploy.tar.gz"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT SUCCESSFUL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Portal: https://laverdi.tech"
echo "VPS: $VPS_HOST"
echo "Container: $APP_NAME (running)"
echo ""
echo "Next steps:"
echo "1. Test at https://laverdi.tech"
echo "2. Check logs: docker logs laverdi-portal"
echo "3. Monitor usage: /api/usage/stats"
echo ""
