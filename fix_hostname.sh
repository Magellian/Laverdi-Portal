#!/bin/bash
# Fix #1: Add hostname resolution for laverdi-command-center

echo "🔧 Fixing hostname resolution..."

# Check if entry already exists
if grep -q "laverdi-command-center" /etc/hosts; then
    echo "✓ Hostname already in /etc/hosts"
else
    echo "Adding 127.0.0.1 laverdi-command-center to /etc/hosts..."
    echo "127.0.0.1 laverdi-command-center" >> /etc/hosts
    echo "✓ Added"
fi

# Verify
echo ""
echo "Current /etc/hosts entries:"
grep laverdi /etc/hosts || echo "No laverdi entries found"

# Test connectivity
echo ""
echo "Testing connectivity..."
curl -s http://laverdi-command-center:8000/health | jq . || echo "Connection test failed (Command Center may not be running)"

echo ""
echo "✓ Fix #1 complete"
