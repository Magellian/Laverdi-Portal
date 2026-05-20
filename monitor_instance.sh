#!/bin/bash
INSTANCE_IP="45.63.39.68"
MAX_WAIT=180  # 3 minutes
WAIT_INTERVAL=5

echo "Monitoring instance at $INSTANCE_IP for initialization..."
echo "Waiting for SSH to be available..."

for i in $(seq 1 $((MAX_WAIT / WAIT_INTERVAL))); do
  if timeout 3 ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$INSTANCE_IP "echo OK" &>/dev/null; then
    echo "✓ SSH is available after $(($i * $WAIT_INTERVAL)) seconds"
    
    echo ""
    echo "Checking for openclaw.json..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$INSTANCE_IP "test -f /opt/openclaw-config/openclaw.json && echo '✓ openclaw.json exists' || echo '✗ openclaw.json not found'"
    
    echo ""
    echo "Checking for gateway-token.json..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$INSTANCE_IP "test -f /opt/openclaw-config/gateway-token.json && echo '✓ gateway-token.json exists' || echo '✗ gateway-token.json not found'"
    
    echo ""
    echo "Reading openclaw.json (gateway.auth section)..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$INSTANCE_IP "cat /opt/openclaw-config/openclaw.json | grep -A 5 '\"auth\"'" 2>/dev/null
    
    echo ""
    echo "Reading gateway-token.json..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null root@$INSTANCE_IP "cat /opt/openclaw-config/gateway-token.json" 2>/dev/null
    
    exit 0
  fi
  
  echo "  Attempt $i: SSH not ready yet, waiting..."
  sleep $WAIT_INTERVAL
done

echo "✗ Instance did not become available within ${MAX_WAIT} seconds"
exit 1
