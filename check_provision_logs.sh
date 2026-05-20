#!/bin/bash

echo "[CHECK] Portal and Provision Status"
echo ""

echo "[1] Recent portal logs (npm)..."
pm2 logs web --lines 50 2>/dev/null | grep -i "provision\|vultr\|instance\|error" | tail -15

echo ""
echo "[2] Database instances..."
# Try to check if instance was recorded
curl -s http://localhost:3005/api/health 2>/dev/null

echo ""
echo "[3] Check if provision.ts has correct code..."
grep -c "GATEWAY_TOKEN\|sleep 15\|gatewayToken" /root/laverdi-portal/pages/api/provision.ts

echo ""
echo "[4] Portal process info..."
ps aux | grep -i "node.*next" | grep -v grep | head -2
