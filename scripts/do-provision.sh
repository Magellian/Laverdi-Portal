#!/bin/bash
# ==============================================================================
# Laverdi.tech - DigitalOcean Cloud-Init Provisioning Script
# ==============================================================================
# This script runs ONCE when the Droplet is created.
# Variables like {{USER_ID}}, {{PAIRING_TOKEN}}, and {{CALLBACK_URL}} 
# will be dynamically injected by the Next.js backend via the DO API.

set -e

# --- 1. System Updates & Dependencies ---
echo "Updating system and installing dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common jq

# --- 2. Install Docker & Docker Compose ---
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

# --- 3. Setup OpenClaw Directory ---
echo "Setting up OpenClaw workspace..."
mkdir -p /opt/openclaw/workspace
cd /opt/openclaw

# --- 4. Generate Docker Compose File ---
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  openclaw-gateway:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw-instance
    restart: unless-stopped
    ports:
      - "8700:8700"
    environment:
      - CLAW_ENV=production
      - CLAW_PAIRING_TOKEN=${PAIRING_TOKEN}
      - CLAW_OWNER_ID=${USER_ID}
    volumes:
      - ./workspace:/workspace
      - ./config:/root/.openclaw
EOF

# --- 5. Generate .env File (Injected Variables) ---
# The Next.js API will replace the {{VARIABLES}} before sending this script to DO.
cat << EOF > .env
USER_ID={{USER_ID}}
PAIRING_TOKEN={{PAIRING_TOKEN}}
EOF

# --- 6. Start OpenClaw ---
echo "Starting OpenClaw containers..."
docker compose up -d

# --- 7. Notify Backend (Callback) ---
# Wait for Docker to spin up and get the public IP
DROPLET_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address)

echo "Notifying Laverdi.tech backend that provisioning is complete..."
curl -X POST "{{CALLBACK_URL}}" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {{WEBHOOK_SECRET}}" \
     -d '{
           "user_id": "{{USER_ID}}",
           "droplet_ip": "'$DROPLET_IP'",
           "status": "ready"
         }'

echo "Provisioning complete!"
