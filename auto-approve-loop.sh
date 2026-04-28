#!/bin/sh
# Runs in background inside the OpenClaw container
# Polls every 10 seconds and auto-approves any pending device pairing requests

echo "Auto-approve loop started"

while true; do
    # Get all pending request IDs (lines containing UUIDs in the pending section)
    PENDING_IDS=$(openclaw devices list 2>&1 | grep "new pairing" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -5)
    
    for REQUEST_ID in $PENDING_IDS; do
        echo "Auto-approving: $REQUEST_ID"
        openclaw devices approve "$REQUEST_ID" 2>&1 || true
    done
    
    sleep 10
done
