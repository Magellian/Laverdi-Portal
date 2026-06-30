#!/bin/bash
# provision-container.sh — Called by the portal to spin up a new OpenClaw agent container
# Usage: ./provision-container.sh <instance_id> <port> <pairing_token> <model_primary> <model_fallback> <tier> <callback_url> <callback_secret>

set -euo pipefail

INSTANCE_ID="$1"
PORT="$2"
PAIRING_TOKEN="$3"
MODEL_PRIMARY="$4"
MODEL_FALLBACK="$5"
TIER="$6"
CALLBACK_URL="$7"
CALLBACK_SECRET="$8"

CONTAINER_NAME="openclaw-${INSTANCE_ID}"
VOLUME_NAME="openclaw-data-${INSTANCE_ID}"
IMAGE="laverdi/openclaw:latest"

echo "=== Provisioning agent: ${INSTANCE_ID} ==="
echo "Port: ${PORT}"
echo "Model: ${MODEL_PRIMARY} (fallback: ${MODEL_FALLBACK})"
echo "Tier: ${TIER}"

# Pull latest image if needed
docker pull "${IMAGE}" 2>/dev/null || echo "Using cached image"

# Create volume if it doesn't exist
docker volume create "${VOLUME_NAME}" 2>/dev/null || true

# Stop and remove existing container if any (idempotent)
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

# Create the OpenClaw config (written to volume)
docker run --rm -v "${VOLUME_NAME}:/root/.openclaw" "${IMAGE}" sh -c "
mkdir -p /root/.openclaw
cat > /root/.openclaw/openclaw.json << 'CONFIGEOF'
{
  \"agents\": {
    \"defaults\": {
      \"model\": \"${MODEL_PRIMARY}\"
    }
  },
  \"gateway\": {
    \"bind\": \"0.0.0.0:18789\",
    \"devicePairing\": {
      \"autoApprove\": true
    }
  }
}
CONFIGEOF
"

# Run the container
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "127.0.0.1:${PORT}:18789" \
  -v "${VOLUME_NAME}:/root/.openclaw" \
  "${IMAGE}"

echo "Container started: ${CONTAINER_NAME}"

# Wait for health check (up to 60 seconds)
echo "Waiting for agent to become healthy..."
for i in $(seq 1 30); do
  if docker exec "${CONTAINER_NAME}" curl -sf http://localhost:18789/health > /dev/null 2>&1; then
    echo "Agent is healthy!"

    # Get container ID
    CONTAINER_ID=$(docker inspect --format='{{.Id}}' "${CONTAINER_NAME}" 2>/dev/null || echo "")

    # Notify the portal
    curl -sf -X POST "${CALLBACK_URL}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${CALLBACK_SECRET}" \
      -d "{\"instanceId\": \"${INSTANCE_ID}\", \"containerId\": \"${CONTAINER_ID}\"}" \
      && echo "Callback sent successfully" \
      || echo "WARNING: Callback failed (portal may not know agent is ready)"

    exit 0
  fi
  sleep 2
done

echo "ERROR: Agent failed to become healthy within 60 seconds"
exit 1
