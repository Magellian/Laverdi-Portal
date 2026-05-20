# Portal Server Provisioning Setup

## Overview

This document provides step-by-step instructions for provisioning OpenClaw Portal servers with authentication tokens and gateway configuration. The provisioning process automates the deployment of gateway services and establishes secure communication between portal and gateway servers.

## Architecture

The provisioning system consists of three main components:

1. **do-provision.sh** - Bash script that runs on the portal server to provision a gateway server
2. **do-callback.ts** - API webhook endpoint that receives provisioning callbacks
3. **ssh-utils.ts** - Utility library for secure SSH communication

## Prerequisites

### Portal Server Requirements

- Node.js 16+ and npm/yarn
- Access to the database (MySQL/MariaDB or SQLite)
- SSH key-based authentication configured for target servers
- Network access to all gateway servers

### Gateway Server Requirements

- SSH server running and accessible from portal server
- sudo privileges for service installation (optional)
- systemd for service management
- Basic Linux utilities: curl, grep, cut

## Database Setup

### 1. Run Migration

Execute the database migration to add required columns:

```bash
# Using Node.js
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('portal.db');
const migration = fs.readFileSync('migrations/007_add_auth_token_and_gateway.sql', 'utf8');
db.exec(migration);
console.log('Migration applied successfully');
"
```

Or manually execute SQL:

```sql
ALTER TABLE servers ADD COLUMN auth_token VARCHAR(512) NULL;
ALTER TABLE servers ADD COLUMN gateway_url VARCHAR(255) NULL;
ALTER TABLE servers ADD COLUMN token_created_at TIMESTAMP NULL;
ALTER TABLE servers ADD COLUMN token_expires_at TIMESTAMP NULL;
ALTER TABLE servers ADD COLUMN is_provisioned BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_auth_token ON servers(auth_token);
CREATE INDEX idx_gateway_url ON servers(gateway_url);
CREATE INDEX idx_is_provisioned ON servers(is_provisioned);

ALTER TABLE servers ADD CONSTRAINT unique_auth_token UNIQUE (auth_token);
```

### 2. Verify Database Tables

Ensure the `provisioning_logs` table exists:

```sql
CREATE TABLE IF NOT EXISTS provisioning_logs (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  server_id INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id)
);
```

## SSH Configuration

### 1. Generate SSH Key (if not already done)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/portal_gateway -C "portal-gateway-provisioning"
```

### 2. Configure SSH Access

Copy the public key to all gateway servers:

```bash
ssh-copy-id -i ~/.ssh/portal_gateway.pub user@gateway-server-1
ssh-copy-id -i ~/.ssh/portal_gateway.pub user@gateway-server-2
```

### 3. Verify SSH Connectivity

```bash
ssh -i ~/.ssh/portal_gateway user@gateway-server-1 "echo 'SSH connection OK'"
```

## Deployment Steps

### Step 1: Deploy Portal API Code

Copy the API endpoint code to your portal server:

```bash
# Copy webhook handler
cp pages/api/webhooks/do-callback.ts /path/to/portal/pages/api/webhooks/

# Copy dashboard
cp pages/dashboard/index.tsx /path/to/portal/pages/dashboard/

# Copy SSH utilities
cp lib/ssh-utils.ts /path/to/portal/lib/
```

### Step 2: Deploy Provisioning Script

```bash
# Copy provisioning script
cp scripts/do-provision.sh /usr/local/bin/
chmod +x /usr/local/bin/do-provision.sh

# Verify permissions
ls -la /usr/local/bin/do-provision.sh
```

### Step 3: Verify Next.js API Routes

Ensure the webhook endpoint is accessible:

```bash
# Test endpoint availability
curl -X POST http://localhost:3000/api/webhooks/do-callback \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Provisioning a Server

### Basic Usage

```bash
do-provision.sh <server_host> <api_endpoint> <auth_token>
```

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `server_host` | Hostname or IP of gateway server | `gateway.example.com` |
| `api_endpoint` | Portal API endpoint | `https://portal.example.com` |
| `auth_token` | Authentication token for API requests | `sk_prod_abc123...` |

### Example

```bash
do-provision.sh gateway.example.com https://portal.example.com sk_prod_2x5K9vL8m3pQ7r

# Output:
# [2026-05-13 18:56:00] Starting portal server provisioning...
# [2026-05-13 18:56:00] Server: gateway.example.com
# [2026-05-13 18:56:00] API Endpoint: https://portal.example.com
# [2026-05-13 18:56:01] SSH connection verified
# [2026-05-13 18:56:02] Configuration files uploaded successfully
# [2026-05-13 18:56:03] Environment setup completed on gateway.example.com
# [2026-05-13 18:56:04] Provisioning verification completed successfully
# [2026-05-13 18:56:05] Callback sent to API endpoint
# [2026-05-13 18:56:05] Portal server provisioning completed successfully!
```

### Batch Provisioning

To provision multiple servers:

```bash
#!/bin/bash

SERVERS=(
  "gateway1.example.com"
  "gateway2.example.com"
  "gateway3.example.com"
)

API_ENDPOINT="https://portal.example.com"
AUTH_TOKEN_PREFIX="sk_prod_"

for server in "${SERVERS[@]}"; do
  # Generate unique token for each server
  token="${AUTH_TOKEN_PREFIX}$(openssl rand -hex 16)"
  
  echo "Provisioning $server with token $token"
  do-provision.sh "$server" "$API_ENDPOINT" "$token"
  
  sleep 5  # Wait between provisions
done
```

## Webhook Callback

### Callback Payload

The provisioning script sends a callback to `/api/webhooks/do-callback`:

```json
{
  "server_host": "gateway.example.com",
  "auth_token": "sk_prod_abc123...",
  "status": "provisioned",
  "provisioned_at": "2026-05-13T18:56:05Z",
  "gateway_url": "https://gateway.example.com"
}
```

### Required Headers

```
Authorization: Bearer <auth_token>
Content-Type: application/json
```

### Response

#### Success (200)

```json
{
  "success": true,
  "message": "Server callback processed successfully. Status: provisioned",
  "serverId": 42
}
```

#### Failure (401/400)

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or expired auth token"
}
```

## Monitoring & Verification

### Check Provisioning Status via Dashboard

Visit the portal dashboard to view provisioning status:

```
https://portal.example.com/dashboard
```

### Query Database

```sql
SELECT 
  id, host, auth_token, gateway_url, is_provisioned, token_created_at
FROM servers
WHERE is_provisioned = TRUE
ORDER BY token_created_at DESC;
```

### View Provisioning Logs

```sql
SELECT 
  pl.id, pl.server_id, pl.event_type, pl.details, pl.created_at,
  s.host
FROM provisioning_logs pl
JOIN servers s ON pl.server_id = s.id
ORDER BY pl.created_at DESC
LIMIT 50;
```

### Check Remote Service Status

```bash
ssh gateway.example.com "sudo systemctl status portal-gateway"

# View logs
ssh gateway.example.com "sudo journalctl -u portal-gateway -f"
```

## Troubleshooting

### SSH Connection Failed

**Error:** `Failed to connect to <server> via SSH`

**Solutions:**
1. Verify SSH key is installed on gateway: `ssh-copy-id -i ~/.ssh/portal_gateway user@gateway`
2. Check SSH is running: `ssh -v user@gateway "echo test"`
3. Verify network connectivity: `ping gateway`
4. Check firewall rules: `nc -zv gateway 22`

### Auth Token Not Found

**Error:** `Auth token environment variable AUTH_TOKEN is not set`

**Solutions:**
1. Verify config file was uploaded: `ssh gateway "cat /etc/portal-gateway/gateway.env"`
2. Check file permissions: `ssh gateway "ls -la /etc/portal-gateway/gateway.env"`
3. Re-run provisioning script with correct token

### Webhook Callback Failed

**Error:** `Callback submission may have failed, but provisioning continues`

**Solutions:**
1. Verify API endpoint is reachable: `curl -X POST https://portal.example.com/api/webhooks/do-callback`
2. Check auth token is valid
3. Verify Next.js server is running
4. Check server logs for errors

### Service Won't Start

**Error:** `portal-gateway service failed to start`

**Solutions:**
1. Check service status: `systemctl status portal-gateway`
2. View error logs: `journalctl -u portal-gateway -n 50`
3. Verify environment variables are set: `systemctl show portal-gateway -p Environment`
4. Manually test gateway startup

## Security Considerations

### Auth Token Management

- Auth tokens are sensitive credentials and should be treated as secrets
- Store tokens securely using a secrets manager (HashiCorp Vault, AWS Secrets Manager, etc.)
- Rotate tokens regularly
- Use unique tokens per gateway server
- Never commit tokens to version control

### SSH Security

- Use ed25519 keys (stronger than RSA)
- Restrict key permissions: `chmod 600 ~/.ssh/portal_gateway`
- Consider using SSH agent to avoid storing passphrases
- Implement key rotation policies

### Network Security

- Restrict API endpoint access to authorized networks
- Use TLS/HTTPS for all communications
- Implement rate limiting on webhook endpoint
- Monitor for unusual provisioning patterns

### Database Security

- Encrypt auth tokens in database
- Use parameterized queries to prevent SQL injection
- Implement access controls on provisioning tables
- Audit all provisioning operations

## Maintenance

### Regular Tasks

1. **Monitor logs** - Check provisioning logs weekly for issues
2. **Token rotation** - Rotate auth tokens quarterly
3. **SSH key rotation** - Rotate SSH keys annually
4. **Database backup** - Backup provisioning data daily
5. **Security updates** - Keep systems patched and updated

### Scaling Considerations

- For large deployments (100+ servers), consider parallelizing provisioning
- Implement database connection pooling
- Monitor API endpoint performance
- Consider load balancing multiple provisioning workers

## Related Documentation

- [TOKEN_EXTRACTION_FIX.md](TOKEN_EXTRACTION_FIX.md) - Auth token extraction and validation
- [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) - Deployment verification steps
- [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md) - High-level overview of the provisioning system

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review provisioning logs in dashboard
3. Check gateway service logs: `journalctl -u portal-gateway`
4. Enable verbose logging in do-provision.sh: `bash -x do-provision.sh ...`
