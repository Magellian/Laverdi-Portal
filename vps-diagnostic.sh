#!/bin/bash
# VPS Network & Service Diagnostic Script
# Run this in the DO web console to check everything

echo "======================================"
echo "🔍 VPS DIAGNOSTIC REPORT"
echo "======================================"
echo ""

echo "📅 Timestamp: $(date)"
echo ""

echo "======================================"
echo "1️⃣  NETWORK STATUS"
echo "======================================"
echo "Public IP: $(hostname -I | awk '{print $1}')"
echo "Hostname: $(hostname)"
echo ""
echo "DNS Resolution:"
nslookup google.com 2>&1 | head -5
echo ""
echo "Internet Connectivity:"
timeout 3 curl -s -o /dev/null -w "HTTP %{http_code} to google.com\n" https://google.com || echo "❌ No internet"
echo ""

echo "======================================"
echo "2️⃣  DOCKER CONTAINERS"
echo "======================================"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "======================================"
echo "3️⃣  PORT AVAILABILITY"
echo "======================================"
echo "Port 80 (nginx): $(netstat -tlnp 2>/dev/null | grep :80 | wc -l) listeners"
echo "Port 443 (nginx): $(netstat -tlnp 2>/dev/null | grep :443 | wc -l) listeners"
echo "Port 3000 (portal): $(netstat -tlnp 2>/dev/null | grep :3000 | wc -l) listeners"
echo "Port 5000 (agent): $(netstat -tlnp 2>/dev/null | grep :5000 | wc -l) listeners"
echo "Port 8000 (command-center): $(netstat -tlnp 2>/dev/null | grep :8000 | wc -l) listeners"
echo ""

echo "======================================"
echo "4️⃣  SERVICE HEALTH"
echo "======================================"
echo "Portal (localhost:3000):"
timeout 3 curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:3000 || echo "  ❌ No response"

echo "Agent (localhost:5000):"
timeout 3 curl -s http://localhost:5000/health && echo "" || echo "  ❌ No response"

echo "Command Center (localhost:8000):"
timeout 3 curl -s -o /dev/null -w "  HTTP %{http_code}\n" http://localhost:8000 || echo "  ❌ No response"

echo ""

echo "======================================"
echo "5️⃣  DISK & MEMORY"
echo "======================================"
df -h / | tail -1 | awk '{print "Disk: " $3 " used / " $2 " total (" $5 ")"}'
free -h | grep Mem | awk '{print "RAM: " $3 " used / " $2 " total"}'
echo ""

echo "======================================"
echo "6️⃣  DOCKER LOGS (Last 5 lines each)"
echo "======================================"
for container in laverdi-portal laverdi-nginx laverdi-agent laverdi-command-center; do
  if docker ps -a --format "{{.Names}}" | grep -q "^${container}$"; then
    echo ""
    echo "📋 $container:"
    docker logs $container 2>&1 | tail -5
  fi
done

echo ""
echo "======================================"
echo "✅ DIAGNOSTIC COMPLETE"
echo "======================================"
