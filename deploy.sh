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
$SSH_CMD "cat > /app/laverdi-portal/.env.production << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://dcvrkpgvxqdcboostkpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
DATABASE_URL=${DATABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=http://$VPS_IP:3000
EMAIL_SERVER_HOST=${EMAIL_SERVER_HOST}
EMAIL_SERVER_PORT=${EMAIL_SERVER_PORT}
EMAIL_SERVER_USER=${EMAIL_SERVER_USER}
EMAIL_SERVER_PASSWORD=${EMAIL_SERVER_PASSWORD}
EMAIL_FROM=${EMAIL_FROM}
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
