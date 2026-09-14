#!/bin/bash
set -e

echo "🚀 Deploying LaVerdi Portal Phase 1..."

# Configuration
VPS_IP=${1:-104.238.157.139}
SSH_KEY=${2:-~/.ssh/hermes-deploy}
APP_DIR=${3:-/app/laverdi-portal}

echo "📍 Target VPS: $VPS_IP"
echo "🔑 SSH Key: $SSH_KEY"
echo "📂 App Directory: $APP_DIR"

# SSH connection string
SSH_CMD="ssh -i $SSH_KEY root@$VPS_IP"

echo "🔗 Testing SSH connection..."
$SSH_CMD echo "✅ SSH connection successful"

echo "📥 Cloning repository..."
$SSH_CMD "cd /app && git clone https://github.com/Magellian/laverdi-portal.git" || $SSH_CMD "cd /app/laverdi-portal && git pull"

echo "📝 Setting up environment..."
# NOTE: this script is a legacy bootstrap from an earlier deployment approach
# (different VPS IP/SSH key than the current production host — see CLAUDE.md
# for the current architecture) and is not part of the current deploy path.
# All secrets below are read from this script's own environment rather than
# hardcoded, so running it requires exporting them first.
$SSH_CMD "cat > /app/laverdi-portal/.env.production << 'EOF'
DATABASE_URL=${DATABASE_URL}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://laverdi.tech
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
NEXT_PUBLIC_STRIPE_PRICE_STARTER=${NEXT_PUBLIC_STRIPE_PRICE_STARTER}
NEXT_PUBLIC_STRIPE_PRICE_PRO=${NEXT_PUBLIC_STRIPE_PRICE_PRO}
NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE=${NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE}
EMAIL_SERVER_HOST=${EMAIL_SERVER_HOST}
EMAIL_SERVER_PORT=${EMAIL_SERVER_PORT}
EMAIL_SERVER_USER=${EMAIL_SERVER_USER}
EMAIL_SERVER_PASSWORD=${EMAIL_SERVER_PASSWORD}
EMAIL_FROM=${EMAIL_FROM}
PROVISION_CALLBACK_SECRET=${PROVISION_CALLBACK_SECRET}
NODE_ENV=production
PORT=3000
EOF"

echo "🗄️ Running Prisma migrations..."
$SSH_CMD "cd /app/laverdi-portal && npx prisma migrate deploy"

echo "🐳 Building and starting Docker container..."
$SSH_CMD "cd /app/laverdi-portal && docker-compose up -d"

echo "✅ Waiting for service to be ready..."
sleep 10

echo "🧪 Testing deployment..."
$SSH_CMD "curl -f http://localhost:3000/ || exit 1"

echo "✅ LaVerdi Portal Phase 1 deployed successfully!"
echo "🌐 Access at: http://$VPS_IP:3000"
