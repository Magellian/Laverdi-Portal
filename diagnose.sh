#!/bin/bash

echo "=== 1. Docker daemon status (docker ps) ==="
docker ps

echo ""
echo "=== 2. All containers (docker ps -a) ==="
docker ps -a

echo ""
echo "=== 3. LaVerdi containers ==="
docker ps -a | grep -i laverdi || echo "No laverdi containers found"

echo ""
echo "=== 4. docker-compose.yml location ==="
ls -la /root/laverdi-portal/docker-compose.yml 2>/dev/null || echo "File not found"

echo ""
echo "=== 5. LaVerdi systemd services ==="
systemctl list-units --all | grep -i laverdi || echo "No laverdi systemd services found"

echo ""
echo "=== 6. Port 3000 listeners ==="
netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || lsof -i :3000 2>/dev/null || echo "Port 3000 status unknown"

echo ""
echo "=== 7. Directory listing of laverdi-portal ==="
ls -la /root/laverdi-portal/ 2>/dev/null || echo "Directory not found"

echo ""
echo "=== 8. docker-compose/docker compose version ==="
docker-compose --version 2>/dev/null || echo "docker-compose not found"
docker compose --version 2>/dev/null || echo "docker compose not found"

echo ""
echo "=== 9. Check what's running on port 3000 ==="
ps aux | grep -E "(node|npm|port.*3000)" | grep -v grep || echo "No obvious node/npm processes"

echo ""
echo "=== 10. Docker info ==="
docker info 2>/dev/null | head -20 || echo "Docker not accessible"

echo ""
echo "=== 11. Check /root/laverdi-portal for clues ==="
find /root/laverdi-portal -name "*.json" -o -name "Dockerfile*" -o -name "docker-compose*" 2>/dev/null | head -20
