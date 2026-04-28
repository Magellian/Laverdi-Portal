#!/bin/bash
# Auto-approve pending device pairing requests
# Run this on the container to approve all pending devices

CONTAINER_ID="openclaw-e64c80d4-daea-4b6e-8df9-60ef2f476b0c"

# Get all pending pairing request IDs
PENDING=$(docker exec $CONTAINER_ID openclaw devices list 2>&1 | grep -oP '(?<=│ )[0-9a-f-]{36}(?= │)' | head -1)

if [ -z "$PENDING" ]; then
    echo "No pending pairing requests"
    exit 0
fi

echo "Found pending request: $PENDING"
docker exec $CONTAINER_ID openclaw devices approve "$PENDING"
echo "✅ Approved"
