#!/bin/bash

# Start script for the distributed task execution system
set -e

echo "🚀 Starting Agent System..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "📦 Building Docker images..."
docker-compose build

echo ""
echo "🎬 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check health
echo ""
echo "🔍 Checking service health..."

if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Agent Service (port 5000) - HEALTHY"
else
    echo "❌ Agent Service (port 5000) - FAILED"
fi

if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Command Center (port 8000) - HEALTHY"
else
    echo "❌ Command Center (port 8000) - FAILED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ System Started!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Command Center:  http://localhost:8000"
echo "🔧 Agent Service:   http://localhost:5000"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:8000 in your browser"
echo "2. Click 'Register Agent'"
echo "3. Enter: http://agent:5000"
echo "4. Send a test task (e.g., 'echo hello world')"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop:"
echo "  docker-compose down"
echo ""
