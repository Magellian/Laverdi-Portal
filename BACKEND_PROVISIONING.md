# Backend Provisioning System

Automatically provisions OpenClaw instances on DigitalOcean droplets when users upgrade their subscription.

---

## Architecture Overview

```
User Upgrades Subscription
    ↓
Stripe Webhook → /api/webhooks/stripe
    ↓
Parse Event (customer.subscription.created/updated/deleted)
    ↓
Provision Droplet (DO API)
    ↓
Store Droplet Info (user_droplets table)
    ↓
User Dashboard Shows Agent IP/Port
    ↓
User Connects to Agent via HTTP/WebSocket
```

---

## Files & Functions

### 1. `lib/droplet-provisioner.ts`
Core provisioning logic.

**Functions:**
- `createUserDroplet(config)` - Creates a new DO droplet with OpenClaw bootstrap script
- `deleteUserDroplet(dropletId)` - Deletes a user's droplet
- `getDropletStatus(dropletId)` - Polls DO API for droplet status
- `storeDropletInfo(userId, dropletId, ip, tier)` - Saves droplet to database
- `updateDropletStatus(dropletId, status)` - Updates droplet status in DB
- `getUserDroplet(userId)` - Retrieves user's droplet from database

**Example:**
```typescript
const droplet = await createUserDroplet({
  userId: "user-123",
  tier: "starter",
  email: "user@example.com",
  apiKey: "sk_laverdi_abc123",
});

// Returns:
// {
//   dropletId: 561234567,
//   ipAddress: "192.0.2.1",
//   status: "new"
// }
```

### 2. `pages/api/webhooks/stripe.ts`
Stripe webhook handler.

**Triggers On:**
- `customer.subscription.created` - User upgrades from free
- `customer.subscription.updated` - User changes tier
- `customer.subscription.deleted` - User cancels subscription

**Flow:**
1. Verify webhook signature
2. Parse Stripe event
3. Map to tier (free/starter/pro)
4. Call provisioning functions
5. Return 200 OK to Stripe

### 3. `pages/api/droplet/info.ts`
User endpoint to get agent connection details.

**Endpoint:** `GET /api/droplet/info`

**Auth:** Bearer token (Supabase JWT)

**Response:**
```json
{
  "success": true,
  "data": {
    "dropletId": 561234567,
    "ipAddress": "192.0.2.1",
    "port": 18789,
    "status": "active",
    "endpoint": "http://192.0.2.1:18789",
    "websocketUrl": "ws://192.0.2.1:18789",
    "apiKey": "sk_laverdi_abc123",
    "tier": "starter",
    "createdAt": "2026-04-18T15:30:00Z"
  }
}
```

### 4. `pages/dashboard/agent.tsx`
Dashboard page showing droplet status and connection details.

**Features:**
- Shows provisioning status (provisioning / active / error)
- Displays IP, port, endpoint, WebSocket URL
- Copy-to-clipboard buttons
- Usage info (tier, provisioning date)
- Connection guide

---

## Database Schema

### `user_droplets` Table
Tracks provisioned instances per user.

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (FK to users)
droplet_id INTEGER NOT NULL UNIQUE
ip_address INET NOT NULL
tier TEXT ('starter' | 'pro')
status TEXT ('provisioning' | 'active' | 'error' | 'deleted')
error_message TEXT
gateway_port INTEGER (default: 18789)
api_endpoint TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP
```

### `droplet_audit_log` Table
Audit trail of droplet operations.

```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL
droplet_id INTEGER
action TEXT (e.g., 'provision', 'delete', 'error')
status TEXT
details JSONB
created_at TIMESTAMP
```

---

## Configuration

### Environment Variables
Required in `.env.production`:

```bash
# DigitalOcean
DIGITALOCEAN_API_KEY=dop_v1_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Droplet Configuration
In `generateUserDataScript()`:

```typescript
const size = config.tier === "pro" ? "s-2vcpu-4gb" : "s-1vcpu-2gb";
const region = "sfo3"; // San Francisco
const image = "ubuntu-22-04-x64"; // Ubuntu 22.04
```

Change region/size as needed for different tiers.

---

## Provisioning Flow

### 1. User Upgrades to Starter
```
Stripe Charge → Webhook → Handle Subscription Created
  ↓
Get user ID from customer
  ↓
Check tier: "starter"
  ↓
Call createUserDroplet()
  ↓
Generate user_data script with:
   - User's API key
   - Supabase credentials
   - Primary model: Claude Sonnet 4.6
  ↓
Create DO droplet (2vCPU, 1GB RAM)
  ↓
Store in user_droplets table (status: "provisioning")
  ↓
Return 200 to Stripe
  ↓
[After 1-2 min] Droplet boots, OpenClaw starts
  ↓
User sees "Active" status in dashboard
```

### 2. User Upgrades from Starter → Pro
```
Subscription Updated Event
  ↓
Check existing droplet
  ↓
Delete old droplet (Starter size)
  ↓
Create new droplet (Pro size: 2vCPU, 4GB)
  ↓
Repeat provisioning flow
```

### 3. User Cancels Subscription
```
Subscription Deleted Event
  ↓
Find user's droplet
  ↓
Call deleteUserDroplet(dropletId)
  ↓
Mark status: "deleted"
  ↓
Droplet destroyed within seconds
```

---

## Error Handling

### Droplet Creation Fails
```typescript
try {
  const droplet = await createUserDroplet(config);
} catch (error) {
  // Log error
  // Update user_droplets status: "error"
  // Send user alert email
  // Trigger manual review
}
```

### User Data Script Fails
- Droplet boots but OpenClaw doesn't start
- Status stays "provisioning" indefinitely
- Solution: User manually SSHes in to debug
- Or: Implement health check API that polls /status every 30s

### Rate Limiting
DO API has rate limits. Currently unbuffered — if 100 users upgrade simultaneously:
- Queue requests or use batch API
- Add exponential backoff on failures
- Monitor DO API quota

---

## Testing

### Local Testing (Without Stripe)
```typescript
// In pages/api/webhooks/stripe.ts, add test endpoint:
if (process.env.NODE_ENV === "development") {
  app.post("/api/test/webhook", async (req, res) => {
    await handleSubscriptionCreated(mockSubscription);
    res.json({ success: true });
  });
}
```

### Manual Testing
1. Create test Stripe account (if not already)
2. Create test customer
3. Create test price IDs for starter/pro
4. Subscribe test customer
5. Webhook should trigger
6. Check Supabase `user_droplets` table
7. Verify droplet created in DO console

### Monitoring
```sql
-- Check provisioning status
SELECT user_id, status, created_at 
FROM user_droplets 
WHERE status = 'provisioning' 
AND created_at < NOW() - INTERVAL '5 minutes';

-- Check errors
SELECT * FROM user_droplets WHERE status = 'error';

-- View audit log
SELECT * FROM droplet_audit_log ORDER BY created_at DESC LIMIT 20;
```

---

## Stripe Webhook Setup

1. **Stripe Dashboard → Developers → Webhooks**
2. **Add Endpoint:**
   - URL: `https://laverdi.tech/api/webhooks/stripe`
   - Events: 
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
3. **Copy signing secret** → Add to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Firewall & Security

### Recommended DO Firewall Rules
```
Inbound:
  - Port 80 (HTTP, Portal)
  - Port 443 (HTTPS, Portal)
  - Port 22 (SSH, admin only)
  
Outbound:
  - All (needed for API calls, package downloads)
```

Each user droplet inherits these rules or has its own.

---

## Cost Estimation

### Monthly Cost per User
| Tier | Droplet Size | Price/Month | Notes |
|------|---|---|---|
| Free | None | $0 | No droplet |
| Starter | s-1vcpu-2gb | $6 | 1 vCPU, 2GB RAM |
| Pro | s-2vcpu-4gb | $18 | 2 vCPU, 4GB RAM |

**Pricing Strategy:**
- Starter: $29/month → Cost $6 → Margin $23
- Pro: $99/month → Cost $18 → Margin $81

---

## Future Enhancements

1. **Auto-scaling**
   - If CPU/RAM usage high, upgrade droplet size
   - Scale down if idle

2. **Backup & Recovery**
   - Automated daily snapshots
   - One-click restore on error

3. **Multi-agent per User**
   - Allow users to provision multiple agents
   - Load balancing across droplets

4. **Monitoring & Alerts**
   - Track droplet health
   - Alert user if agent goes down
   - Auto-restart on failure

5. **Model Customization**
   - Let users choose primary model (Haiku/Sonnet/Opus)
   - Custom system prompts
   - Tool/plugin installation

6. **SSO & API Auth**
   - OAuth for agent endpoints
   - Rate limiting per API key

---

## Troubleshooting

### Droplet Created but Agent Not Running
```bash
# SSH into droplet
ssh root@<ip_address>

# Check processes
ps aux | grep openclaw

# Check logs
tail -100 /var/log/syslog

# Manual OpenClaw start
openclaw gateway --port 18789

# Test endpoint
curl http://localhost:18789/status
```

### User Can't Connect
1. Verify IP in user_droplets table
2. Check DO firewall rules (port 18789 open?)
3. Verify network connectivity: `ping <ip>`
4. Check agent logs on droplet

### Webhook Not Triggering
1. Verify Stripe endpoint URL is correct
2. Check `stripe_webhook_secret` in `.env`
3. View Stripe webhook logs in dashboard
4. Manually trigger test webhook

---

## Deployment Checklist

- [ ] Set `DIGITALOCEAN_API_KEY` in production `.env`
- [ ] Set `STRIPE_WEBHOOK_SECRET` in production `.env`
- [ ] Run migration: `001_add_user_droplets.sql`
- [ ] Configure Stripe webhook endpoint
- [ ] Test with Stripe test mode
- [ ] Monitor first few droplet creations
- [ ] Set up alerts for failed provisions
- [ ] Document user connection process
