#!/bin/bash
# LaVerdi Provisioning: Token Injection Patch
# Add this to your cloud-init script (runs on instance boot)
# 
# Purpose: Generate and inject gateway.auth.token so customers don't see
# the "paste token" prompt with no token to paste.
# 
# Integration: Add this section to your Vultr cloud-init script AFTER OpenClaw
# is installed but BEFORE the gateway starts for the first time.

set -e

echo "[LaVerdi] Generating gateway auth token..."

# Generate unique 64-char hex token (256-bit entropy)
GATEWAY_TOKEN=$(openssl rand -hex 32)

# Inject into openclaw.json
# Assumes openclaw.json exists at /opt/openclaw-config/openclaw.json
# (standard LaVerdi instance path)

CONFIG_FILE="/opt/openclaw-config/openclaw.json"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "[ERROR] openclaw.json not found at $CONFIG_FILE"
    echo "[ERROR] Provisioning may have failed or config path is different"
    exit 1
fi

echo "[LaVerdi] Injecting token into $CONFIG_FILE"

# Update the token in the config using jq
# If jq is not installed, install it first
if ! command -v jq &> /dev/null; then
    echo "[LaVerdi] Installing jq..."
    apt-get update -qq
    apt-get install -y -qq jq
fi

# Inject token
jq ".gateway.auth.token = \"$GATEWAY_TOKEN\"" "$CONFIG_FILE" > /tmp/openclaw.json.tmp
mv /tmp/openclaw.json.tmp "$CONFIG_FILE"

# Also store token in a readable format for customer reference
echo "[LaVerdi] Token: $GATEWAY_TOKEN" >> /opt/openclaw-config/token.txt
chmod 600 /opt/openclaw-config/token.txt

echo "[LaVerdi] ✅ Gateway auth token injected successfully"
echo "[LaVerdi] Token: $GATEWAY_TOKEN"

# Inject allowedOrigins to pre-authorize the dashboard redirect
# This prevents the "accept redirect" warning on first login
echo "[LaVerdi] Configuring allowed origins..."

INSTANCE_HOSTNAME=$(hostname -f)

# Build the allowedOrigins array
# Includes: instance hostname, localhost, 127.0.0.1
ALLOWED_ORIGINS="[\"https://$INSTANCE_HOSTNAME\", \"http://localhost:18789\", \"http://127.0.0.1:18789\"]"

jq ".gateway.controlUi.allowedOrigins = $ALLOWED_ORIGINS" "$CONFIG_FILE" > /tmp/openclaw.json.tmp
mv /tmp/openclaw.json.tmp "$CONFIG_FILE"

echo "[LaVerdi] ✅ Allowed origins configured: $ALLOWED_ORIGINS"

# Optional: Log the token to a file for admin retrieval
# This allows the LaVerdi admin panel to display the token to the customer
cat > /opt/openclaw-config/gateway-token.json << EOF
{
  "token": "$GATEWAY_TOKEN",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "instance_id": "${INSTANCE_ID:-unknown}",
  "hostname": "$INSTANCE_HOSTNAME",
  "allowed_origins": $ALLOWED_ORIGINS
}
EOF
chmod 600 /opt/openclaw-config/gateway-token.json

echo "[LaVerdi] Token metadata saved to /opt/openclaw-config/gateway-token.json"
echo "[LaVerdi] ✅ Ready for gateway startup - customer will connect without friction"
