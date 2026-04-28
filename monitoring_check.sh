#!/bin/bash

CHECK_NUM=$1

echo "=== [$(date +'%H:%M:%S')] CHECK $CHECK_NUM ==="
echo "1. Container Status:"
docker-compose ps

echo ""
echo "2. HTTPS Health:"
curl -s -I https://laverdi.tech | head -3

echo ""
echo "3. Application Logs (Last 10 lines):"
docker logs laverdi-portal --tail 10 2>&1

echo ""
echo "4. System Resources:"
docker stats --no-stream --no-trunc 2>&1

echo ""
echo "5. Nginx Status:"
docker logs laverdi-nginx --tail 5 2>&1

echo "=== CHECK COMPLETE ==="
