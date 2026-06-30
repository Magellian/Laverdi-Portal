#!/bin/bash
# teardown-container.sh — Stop and remove an OpenClaw agent container
# Usage: ./teardown-container.sh <instance_id> [--keep-data]

set -euo pipefail

INSTANCE_ID="$1"
KEEP_DATA="${2:-}"

CONTAINER_NAME="openclaw-${INSTANCE_ID}"
VOLUME_NAME="openclaw-data-${INSTANCE_ID}"

echo "=== Tearing down agent: ${INSTANCE_ID} ==="

# Stop and remove container
docker rm -f "${CONTAINER_NAME}" 2>/dev/null && echo "Container removed" || echo "Container not found"

# Remove volume unless --keep-data
if [ "${KEEP_DATA}" != "--keep-data" ]; then
  docker volume rm "${VOLUME_NAME}" 2>/dev/null && echo "Volume removed" || echo "Volume not found"
else
  echo "Keeping data volume: ${VOLUME_NAME}"
fi

echo "Teardown complete: ${INSTANCE_ID}"
