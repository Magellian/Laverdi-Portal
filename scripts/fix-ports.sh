#!/bin/bash
set -e

cd /root/laverdi-portal

# Stop everything
docker compose down 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# Change app port from 3000 to 3001 on host
sed -i 's/"3000:3000"/"3001:3000"/' docker-compose.yml

# Update nginx to proxy to 3001
sed -i 's|proxy_pass http://localhost:3000|proxy_pass http://localhost:3001|' /etc/nginx/sites-enabled/laverdi

# Test and reload nginx
nginx -t && nginx -s reload

# Start containers
docker compose up -d

sleep 10

# Check
docker compose ps
echo "=== HEALTH ==="
curl -s http://localhost:3001/api/health
echo ""
echo "=== HTTPS ==="
curl -s -o /dev/null -w '%{http_code}' https://laverdi.tech/
echo ""
