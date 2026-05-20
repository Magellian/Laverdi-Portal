#!/bin/bash

###############################################################################
# Portal Server Provisioning Script
# Purpose: Provision a gateway server with authentication tokens and config
# Usage: ./do-provision.sh <server_host> <api_endpoint> <auth_token>
###############################################################################

set -euo pipefail

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="${1:-}"
API_ENDPOINT="${2:-}"
AUTH_TOKEN="${3:-}"

# Derived paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="/etc/portal-gateway"
LOG_FILE="/var/log/portal-gateway-provision.log"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

validate_inputs() {
    if [[ -z "$SERVER_HOST" ]]; then
        error "Missing required argument: server_host"
    fi
    
    if [[ -z "$API_ENDPOINT" ]]; then
        error "Missing required argument: api_endpoint"
    fi
    
    if [[ -z "$AUTH_TOKEN" ]]; then
        error "Missing required argument: auth_token"
    fi
    
    log "Inputs validated successfully"
}

verify_ssh_connection() {
    log "Verifying SSH connection to $SERVER_HOST..."
    
    if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "$SERVER_HOST" "echo 'SSH connection OK'" > /dev/null 2>&1; then
        error "Failed to connect to $SERVER_HOST via SSH"
    fi
    
    log "SSH connection verified"
}

create_config_files() {
    log "Creating configuration files..."
    
    # Create temporary directory for config files
    TEMP_CONFIG=$(mktemp -d)
    trap "rm -rf $TEMP_CONFIG" EXIT
    
    # Create gateway config file
    cat > "$TEMP_CONFIG/gateway.env" << EOF
# Portal Gateway Configuration
API_ENDPOINT=$API_ENDPOINT
AUTH_TOKEN=$AUTH_TOKEN
PROVISIONED_AT=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GATEWAY_VERSION=1.0.0
EOF
    
    log "Configuration files created in $TEMP_CONFIG"
}

upload_config_files() {
    log "Uploading configuration files to $SERVER_HOST..."
    
    # Ensure config directory exists
    ssh "$SERVER_HOST" "sudo mkdir -p $CONFIG_DIR && sudo chown \$USER:"\$USER" $CONFIG_DIR" || error "Failed to create config directory"
    
    # Upload gateway.env
    scp "$TEMP_CONFIG/gateway.env" "$SERVER_HOST:$CONFIG_DIR/gateway.env" || error "Failed to upload gateway.env"
    
    log "Configuration files uploaded successfully"
}

setup_environment() {
    log "Setting up environment on $SERVER_HOST..."
    
    # Set environment variables and create systemd service
    ssh "$SERVER_HOST" << 'REMOTE_SCRIPT'
set -euo pipefail

CONFIG_DIR="/etc/portal-gateway"

# Source the config file
if [[ -f "$CONFIG_DIR/gateway.env" ]]; then
    export $(cat "$CONFIG_DIR/gateway.env" | grep -v '^#' | xargs)
fi

# Verify auth token is set
if [[ -z "${AUTH_TOKEN:-}" ]]; then
    exit 1
fi

# Create systemd service file for gateway
sudo tee /etc/systemd/system/portal-gateway.service > /dev/null << 'SYSTEMD_SERVICE'
[Unit]
Description=Portal Gateway Service
After=network.target

[Service]
Type=simple
User=portal
Environment="$(cat /etc/portal-gateway/gateway.env | grep -v '^#')"
ExecStart=/usr/local/bin/portal-gateway
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SYSTEMD_SERVICE

sudo systemctl daemon-reload
sudo systemctl enable portal-gateway.service
REMOTE_SCRIPT
    
    log "Environment setup completed on $SERVER_HOST"
}

verify_provisioning() {
    log "Verifying provisioning..."
    
    # Verify config file exists and is readable
    ssh "$SERVER_HOST" "test -f $CONFIG_DIR/gateway.env && echo 'Config file verified'" > /dev/null || error "Config file verification failed"
    
    # Verify auth token is accessible
    local token=$(ssh "$SERVER_HOST" "grep AUTH_TOKEN $CONFIG_DIR/gateway.env | cut -d'=' -f2")
    if [[ "$token" != "$AUTH_TOKEN" ]]; then
        error "Auth token verification failed"
    fi
    
    log "Provisioning verification completed successfully"
}

send_callback() {
    log "Sending provisioning callback to API endpoint..."
    
    local callback_url="$API_ENDPOINT/webhooks/do-callback"
    local callback_payload=$(cat <<EOF
{
    "server_host": "$SERVER_HOST",
    "auth_token": "$AUTH_TOKEN",
    "status": "provisioned",
    "provisioned_at": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
    "gateway_url": "https://$SERVER_HOST"
}
EOF
)
    
    # Send callback with auth token
    curl -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$callback_payload" \
        "$callback_url" || warn "Callback submission may have failed, but provisioning continues"
    
    log "Callback sent to API endpoint"
}

###############################################################################
# Main Provisioning Flow
###############################################################################

main() {
    log "Starting portal server provisioning..."
    log "Server: $SERVER_HOST"
    log "API Endpoint: $API_ENDPOINT"
    
    validate_inputs
    verify_ssh_connection
    create_config_files
    upload_config_files
    setup_environment
    verify_provisioning
    send_callback
    
    log "Portal server provisioning completed successfully!"
    log "Next steps:"
    log "  1. Verify gateway service: ssh $SERVER_HOST 'sudo systemctl status portal-gateway'"
    log "  2. Check logs: ssh $SERVER_HOST 'sudo journalctl -u portal-gateway -f'"
}

# Run main function
main
