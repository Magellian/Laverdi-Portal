#!/bin/bash
set -e

echo "=== Fixing container networking ==="

# Stop both containers
docker stop laverdi-portal laverdi-command-center

# Remove them (data is in volumes/env, so this is safe)
docker rm laverdi-portal laverdi-command-center

# Ensure laverdi-network exists
docker network inspect laverdi-network >/dev/null 2>&1 || docker network create laverdi-network
echo "✓ laverdi-network ready"

# Recreate Command Center on laverdi-network
docker run -d \
  --name laverdi-command-center \
  --restart unless-stopped \
  --network laverdi-network \
  -p 8000:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/laverdi/users:/var/lib/laverdi/users \
  -e VPS_ADMIN_TOKEN=change-me-in-production \
  -e ANTHROPIC_API_KEY=sk-ant-REDACTED_ANTHROPIC_KEY \
  -e PUBLIC_IP=64.23.253.97 \
  laverdi-command-center:latest
echo "✓ Command Center started on laverdi-network"

# Recreate Portal on laverdi-network with correct VPS_API_URL
docker run -d \
  --name laverdi-portal \
  --restart unless-stopped \
  --network laverdi-network \
  -p 3000:3000 \
  --env-file /root/laverdi-portal/.env.local \
  -e VPS_API_URL=http://laverdi-command-center:8000 \
  laverdi-portal:latest
echo "✓ Portal started on laverdi-network"

# Wait and verify
sleep 5
echo ""
echo "=== Verification ==="
docker exec laverdi-portal wget -qO- --timeout=3 http://laverdi-command-center:8000/health
echo ""
echo "✓ Portal can reach Command Center by name"

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
