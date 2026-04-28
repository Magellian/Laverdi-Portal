#!/bin/bash

# Deploy Agent Service to VPS

echo "📦 Deploying Agent Service to VPS..."

# SCP files to VPS
scp -r agent-service root@10.242.212.97:/tmp/
scp docker-compose.agent.yml root@10.242.212.97:/tmp/

# SSH into VPS and run deployment
ssh root@10.242.212.97 << 'EOF'

echo "🔧 Setting up Agent Service..."

# Navigate to deployment directory
cd /tmp

# Build Docker image
echo "📦 Building agent-service image..."
docker build -t laverdi-agent:latest agent-service/

# Deploy with docker-compose
echo "🚀 Starting agent service..."
docker-compose -f docker-compose.agent.yml up -d

# Wait for service to be healthy
echo "⏳ Waiting for service to be healthy..."
sleep 5

# Test service
echo "✅ Testing service health..."
curl -s http://localhost:5000/health | jq .

echo "🎉 Agent Service deployed successfully!"
echo "📊 Access at: http://64.23.142.154:5000"
echo "🔗 WebSocket available for real-time updates"

EOF

echo "✅ Deployment complete!"
