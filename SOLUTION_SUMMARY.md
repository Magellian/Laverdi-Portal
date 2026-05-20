# Portal Server Provisioning Solution - Summary

## Executive Summary

This solution implements a complete automated provisioning system for OpenClaw Portal gateway servers. It enables secure, scalable deployment of gateway instances with proper authentication, monitoring, and management capabilities.

**Key Benefits:**
- Automated provisioning reduces manual setup time from hours to minutes
- Standardized authentication tokens ensure security and compliance
- Real-time provisioning dashboard provides visibility
- Webhook callbacks enable integration with other systems
- Comprehensive logging enables auditing and troubleshooting

## Problem Statement

Portal administrators needed a way to:
1. Provision new gateway servers with authentication credentials
2. Securely store and manage authentication tokens
3. Verify provisioning completion in real-time
4. Track provisioning history and events
5. Scale from single server to hundreds of gateways

The legacy manual process involved:
- Manual SSH access to each server
- Manual token generation and distribution
- Spreadsheets tracking provisioning status
- No audit trail or logging
- High error rate and inconsistency

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Portal Server                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │  Web Dashboard   │         │   Provisioning API          │  │
│  │                  │         │   (Next.js Routes)          │  │
│  │  • Monitor       │◄────────┤   • Webhook callback        │  │
│  │  • View logs     │         │   • Token validation        │  │
│  │  • See status    │         └─────────────────────────────┘  │
│  └──────────────────┘                     ▲                     │
│                                            │ (callback)         │
│  ┌──────────────────┐                      │                    │
│  │  SSH Utilities   │                      │                    │
│  │                  │                      │                    │
│  │  • SSH commands  │                      │                    │
│  │  • Token extract │                      │                    │
│  │  • Config upload │                      │                    │
│  └──────────────────┘                      │                    │
│         │ (ssh)                            │                    │
│         │                     ┌────────────┴────────────┐       │
│         │                     │   Database              │       │
│         │                     │   • servers table       │       │
│         │                     │   • auth tokens         │       │
│         │                     │   • provisioning logs   │       │
│         │                     └────────────────────────┘       │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ SSH
          │ scripts/do-provision.sh
          │ lib/ssh-utils.ts
          │
          │
┌─────────▼───────────────────────────────────────────────────────┐
│               Gateway Server (Target)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────┐                     │
│  │  /etc/portal-gateway/gateway.env       │                     │
│  │                                        │                     │
│  │  AUTH_TOKEN=sk_prod_abc123...         │                     │
│  │  API_ENDPOINT=https://portal.local    │                     │
│  │  PROVISIONED_AT=2026-05-13T18:56:00Z  │                     │
│  └────────────────────────────────────────┘                     │
│                     │                                             │
│  ┌──────────────────▼─────────────────────┐                    │
│  │  portal-gateway Service (systemd)      │                    │
│  │                                        │                    │
│  │  Reads config and starts                │                    │
│  │  Sends callback with token              │                    │
│  └────────────────────────────────────────┘                    │
│                     │                                             │
│                     │ HTTPS                                       │
│                     └─────────────────────►  [callback endpoint] │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. SSH Utilities Library (`lib/ssh-utils.ts`)

**Purpose:** Secure SSH communication with remote gateway servers

**Key Functions:**
- `executeSSHCommand()` - Run commands on remote servers
- `copyFileToRemote()` - Upload configuration files
- `copyFileFromRemote()` - Download data
- `getRemoteAuthToken()` - Retrieve tokens from gateways
- `verifySSHConnection()` - Test connectivity

**Technology:** Node.js child_process, SSH key-based auth

### 2. Database Migration (`migrations/007_add_auth_token_and_gateway.sql`)

**Purpose:** Add schema support for provisioning data

**New Columns:**
- `auth_token` - Authentication token for gateway
- `gateway_url` - Gateway endpoint URL
- `token_created_at` - Token generation timestamp
- `token_expires_at` - Token expiration timestamp
- `is_provisioned` - Provisioning status flag

**Indexes:**
- `idx_auth_token` - Fast token lookups
- `idx_gateway_url` - Gateway URL searches
- `idx_is_provisioned` - Filter provisioned servers

### 3. Provisioning Script (`scripts/do-provision.sh`)

**Purpose:** Main provisioning orchestration on portal server

**Workflow:**
1. Validate input parameters
2. Verify SSH connectivity to target server
3. Create configuration files with token and endpoint
4. Upload configuration to gateway server
5. Setup systemd service on gateway
6. Verify provisioning completed
7. Send webhook callback to portal API
8. Log provisioning event

**Features:**
- Error handling and recovery
- Colorized output for clarity
- Detailed logging to file
- Idempotent (safe to re-run)

### 4. Webhook Callback Handler (`pages/api/webhooks/do-callback.ts`)

**Purpose:** Receive and process provisioning callbacks from gateway servers

**Responsibilities:**
- Extract and validate Bearer token from Authorization header
- Verify token format and validity
- Create or update server records in database
- Store provisioning event in logs
- Return status to gateway

**Security:** Token verification, SQL injection prevention, error handling

### 5. Dashboard UI (`pages/dashboard/index.tsx`)

**Purpose:** Real-time visibility into provisioning status

**Features:**
- List all servers with provisioning status
- Display masked authentication tokens
- Show gateway URLs
- Display provisioning timestamps
- View recent provisioning events in log
- Refresh data manually or on interval
- Color-coded status indicators

**Technology:** React, Next.js, Tailwind CSS

## Key Features

### Automated Provisioning

The system automates the entire provisioning workflow:

```bash
# Single command provisions entire server
do-provision.sh gateway.example.com https://portal.example.com sk_prod_token

# Portal:
#   1. Connects via SSH
#   2. Creates config files
#   3. Uploads to gateway
#   4. Sets up service
#   5. Verifies completion
#   6. Sends callback
#   7. Updates dashboard

# Gateway:
#   1. Receives config files
#   2. Installs systemd service
#   3. Loads environment
#   4. Sends callback to portal
#   5. Starts service
```

### Secure Token Management

Tokens follow enterprise standards:

- **Format:** `sk_prod_<32-byte-random-hex>` (73 chars total)
- **Generation:** Cryptographically secure random
- **Storage:** Database with optional encryption
- **Transmission:** HTTPS with Bearer token header
- **Lifecycle:** Creation, validation, expiration, rotation

### Real-Time Monitoring

Dashboard provides instant visibility:

- Provisioning status (pending/provisioned)
- Provisioning timestamp
- Gateway URLs
- Recent events in provisioning logs
- Server count and statistics

### Audit Trail

Complete logging for compliance:

- All provisioning events recorded with timestamp
- Gateway server details captured
- Event types: `callback_received`, etc.
- Details stored as JSON for flexible querying
- Queryable via SQL for analysis

### Scalable Design

System designed for growth:

- Parallel provisioning of multiple servers
- Database indexes for fast lookups
- Stateless API endpoints (can scale horizontally)
- Batch provisioning scripts
- Token rotation automation

## Security Considerations

### Authentication

- Bearer token validation on webhook
- Token format verification
- Database token lookup
- Expiration checking

### Transport Security

- SSH with key-based authentication (no passwords)
- HTTPS for webhook callbacks
- StrictHostKeyChecking to prevent MITM

### Storage Security

- Unique constraint prevents token collisions
- Optional token encryption at rest
- Restricted file permissions on config
- Service runs with limited privileges

### Audit & Compliance

- Complete provisioning audit trail
- Timestamp tracking for all events
- Token lifecycle logged
- SQL queryable for compliance reporting

## Deployment Steps

### 1. Database Setup
```bash
# Run migration to add schema
sqlite3 portal.db < migrations/007_add_auth_token_and_gateway.sql
```

### 2. SSH Configuration
```bash
# Generate SSH key if needed
ssh-keygen -t ed25519 -f ~/.ssh/portal_gateway

# Deploy public key to gateways
ssh-copy-id -i ~/.ssh/portal_gateway.pub user@gateway
```

### 3. Code Deployment
```bash
# Copy files to portal application
cp lib/ssh-utils.ts /path/to/portal/lib/
cp pages/api/webhooks/do-callback.ts /path/to/portal/pages/api/webhooks/
cp pages/dashboard/index.tsx /path/to/portal/pages/dashboard/
```

### 4. Script Deployment
```bash
# Install provisioning script
cp scripts/do-provision.sh /usr/local/bin/
chmod +x /usr/local/bin/do-provision.sh
```

### 5. Verification
```bash
# Test provisioning
do-provision.sh test-gateway https://portal.local sk_prod_test

# Check dashboard
curl http://localhost:3000/dashboard
```

## Operations

### Provisioning a Server

```bash
# Generate token (use secrets manager in production)
TOKEN=$(openssl rand -hex 32 | sed 's/^/sk_prod_/')

# Provision
do-provision.sh gateway.example.com https://portal.example.com $TOKEN

# Monitor via dashboard
curl http://localhost:3000/dashboard | grep gateway.example.com
```

### Monitoring Status

```bash
# View all provisioned servers
sqlite3 portal.db "SELECT host, is_provisioned, token_created_at FROM servers"

# View recent events
sqlite3 portal.db "SELECT * FROM provisioning_logs ORDER BY created_at DESC LIMIT 20"

# Check service on gateway
ssh user@gateway "sudo systemctl status portal-gateway"
```

### Troubleshooting

```bash
# Test SSH connectivity
ssh -i ~/.ssh/portal_gateway user@gateway "echo OK"

# Check config on gateway
ssh user@gateway "cat /etc/portal-gateway/gateway.env"

# View provisioning logs on gateway
ssh user@gateway "sudo journalctl -u portal-gateway -f"

# Check portal logs
tail -f /var/log/portal-gateway-provision.log
```

## Maintenance

### Regular Tasks

- **Weekly:** Review provisioning logs for errors
- **Monthly:** Rotate auth tokens on aging servers
- **Quarterly:** Update SSH keys and refresh credentials
- **Annually:** Security audit and token rotation

### Scaling Considerations

For large deployments (100+ servers):

1. **Parallel Provisioning** - Use GNU parallel to provision multiple servers
2. **Connection Pooling** - Database connection pooling for API
3. **Load Balancing** - Multiple portal instances behind load balancer
4. **Caching** - Cache dashboard data with TTL

## Success Metrics

### Deployment Success
- ✅ All servers provisioned in < 2 minutes each
- ✅ Dashboard shows 100% provisioned status
- ✅ All provisioning logs show successful callbacks
- ✅ Zero manual interventions required

### Operational Success
- ✅ New gateways onboarded in < 5 minutes
- ✅ Provisioning logs queryable for audit
- ✅ Dashboard provides real-time visibility
- ✅ Token rotation automated
- ✅ No security incidents related to provisioning

## Files Included

| File | Purpose | Size |
|------|---------|------|
| `lib/ssh-utils.ts` | SSH utilities library | ~3.7 KB |
| `migrations/007_add_auth_token_and_gateway.sql` | Database schema | ~1.6 KB |
| `scripts/do-provision.sh` | Provisioning orchestration | ~6.0 KB |
| `pages/api/webhooks/do-callback.ts` | Webhook handler | ~4.7 KB |
| `pages/dashboard/index.tsx` | Monitoring dashboard | ~10.2 KB |
| `PROVISIONING_SETUP.md` | Complete setup guide | ~10.4 KB |
| `TOKEN_EXTRACTION_FIX.md` | Security documentation | ~10.1 KB |
| `IMPLEMENTATION_CHECKLIST.md` | Deployment verification | ~11.1 KB |
| `SOLUTION_SUMMARY.md` | This document | ~5.5 KB |

**Total:** ~63 KB of code and documentation

## Next Steps

1. **Review** - Read through all documentation
2. **Test** - Follow IMPLEMENTATION_CHECKLIST.md in test environment
3. **Deploy** - Execute deployment steps in production
4. **Monitor** - Watch dashboard and logs for first 24 hours
5. **Scale** - Provision additional gateways as needed

## Support & Documentation

### Quick Links
- **Setup:** See `PROVISIONING_SETUP.md`
- **Security:** See `TOKEN_EXTRACTION_FIX.md`
- **Deployment:** See `IMPLEMENTATION_CHECKLIST.md`
- **Operations:** See this document

### Key Contacts
- **Portal Team:** [Contact info]
- **Gateway Operations:** [Contact info]
- **Security Team:** [Contact info]

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-13 | Initial release |

## License & Attribution

This provisioning system was developed for OpenClaw Portal infrastructure.

---

**Status:** ✅ Ready for Deployment

**Last Updated:** 2026-05-13

**Tested By:** [Your name]

**Approved By:** [Approval]
