#!/bin/bash
# setup-instance.sh — Configure and start a Hermes agent instance
# Usage: ./setup-instance.sh <instance_id> <port>

set -e

INSTANCE_ID="$1"
PORT="${2:-9000}"
INSTANCE_DIR="/opt/hermes-instances/${INSTANCE_ID}"

mkdir -p "${INSTANCE_DIR}"

# Write hermes config
cat > "${INSTANCE_DIR}/hermes.json" << 'EOF'
{
  "agents": {
    "defaults": {
      "model": "openai/llama3.3-70b-instruct"
    }
  },
  "providers": {
    "openai": {
      "apiKey": "sk-do-zJcFm__t2n7fAwomUx2DRMBXYvdHYhTCRMq2aDfvKCVrt0N3Sp1Or64Fkt",
      "baseUrl": "https://inference.do-ai.run/v1"
    }
  },
  "gateway": {
    "bind": "0.0.0.0:PORT_PLACEHOLDER"
  }
}
EOF

# Replace port
sed -i "s/PORT_PLACEHOLDER/${PORT}/" "${INSTANCE_DIR}/hermes.json"

# Create systemd service for this instance
cat > "/etc/systemd/system/hermes-${INSTANCE_ID}.service" << EOF
[Unit]
Description=Hermes Agent Instance ${INSTANCE_ID}
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTANCE_DIR}
Environment=HERMES_HOME=${INSTANCE_DIR}
Environment=HOME=${INSTANCE_DIR}
ExecStart=/usr/local/bin/hermes gateway --config ${INSTANCE_DIR}/hermes.json
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "hermes-${INSTANCE_ID}"
systemctl start "hermes-${INSTANCE_ID}"

echo "Instance ${INSTANCE_ID} started on port ${PORT}"
sleep 3
systemctl status "hermes-${INSTANCE_ID}" --no-pager || true
