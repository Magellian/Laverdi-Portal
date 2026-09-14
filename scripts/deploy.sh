#!/bin/bash
# deploy.sh — Deploy LaVerdi Portal on VPS
set -e

cd /root/laverdi-portal

# Fix CRLF in shell scripts
sed -i 's/\r$//' start.sh scripts/*.sh 2>/dev/null || true

# Override CMD to skip migration script (run migrations manually)
sed -i 's|CMD \["./start.sh"\]|CMD ["npm", "start"]|' Dockerfile

# Build and start
docker compose down 2>/dev/null || true
docker compose up -d --build 2>&1

echo "=== Waiting for services ==="
sleep 15

# Show status
docker compose ps
echo "==="
docker compose logs app --tail 10
