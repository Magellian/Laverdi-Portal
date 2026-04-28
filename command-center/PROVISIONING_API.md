# Provisioning API Documentation

Complete backend API for Stripe → Droplet → Portal automation.

## Overview

The provisioning system orchestrates the entire flow:

1. **User subscribes** → Stripe webhook fires
2. **Stripe webhook** calls provisioner → Creates droplet
3. **Droplet boots** → Runs bootstrap script
4. **Bootstrap script** calls DO callback webhook
5. **DO callback** marks droplet ready → User sees IP

## Architecture

```
┌─────────────┐
│   Stripe    │
│  (Payment)  │
└──────┬──────┘
       │ customer.subscription.created
       ↓
┌─────────────────────────────────┐
│  /api/webhooks/stripe.ts        │
│  (Webhook Handler)              │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  DropletProvisioner             │
│  - Create DB record             │
│  - Call DO API                  │
│  - Wait for active              │
│  - Update DB with IP            │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  DigitalOcean API               │
│  - Create droplet               │
│  - Inject user-data script      │
│  - Poll for active status       │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  New Droplet (First Boot)       │
│  - Run user-data script         │
│  - Install Node.js              │
│  - Start agent service          │
│  - Call DO callback webhook     │
└──────┬──────────────────────────┘
       │ POST /api/webhooks/do-callback
       ↓
┌─────────────────────────────────┐
│  /api/webhooks/do-callback.ts   │
│  (Webhook Handler)              │
│  - Verify pairing token         │
│  - Mark as 'ready'              │
│  - Store IP address             │
└──────┬──────────────────────────┘
       │
       ↓
┌─────────────────────────────────┐
│  Supabase (user_droplets)       │
│  - Status: 'ready'              │
│  - IP Address stored            │
│  - User can now connect         │
└─────────────────────────────────┘
```

## Database Schema

### user_droplets table

```sql
id                    UUID          (PK)
user_id               UUID          (FK → auth.users)
droplet_id            INTEGER       (DigitalOcean ID)
name                  TEXT          (Droplet name)
region                TEXT          (e.g. 'sfo3')
size                  TEXT          (e.g. 's-1vcpu-1gb')
tier                  TEXT          ('starter'|'pro'|'enterprise')

status                TEXT          ('provisioning'|'initializing'|'ready'|'failed'|'deleted')
ip_address            INET          (IPv4)
ipv6_address          TEXT          (IPv6)
pairing_token         TEXT          (For agent auth)

bootstrap_started_at  TIMESTAMP
bootstrap_completed_at TIMESTAMP
health_check_url      TEXT

created_at            TIMESTAMP
updated_at            TIMESTAMP
deleted_at            TIMESTAMP
```

## API Endpoints

### 1. Stripe Webhook
**POST** `/api/webhooks/stripe`

Receives Stripe subscription events.

**Required Headers:**
- `stripe-signature`: Webhook signature verification

**Events Handled:**
- `customer.subscription.created` → Trigger provisioning
- `customer.subscription.updated` → Log (future: handle tier changes)
- `customer.subscription.deleted` → Log
- `customer.subscription.trial_will_end` → Log

**Subscription Metadata Requirements:**
```json
{
  "user_id": "uuid-of-user",
  "tier": "starter"  // Must be in price metadata
}
```

**Example: Create Subscription**
```bash
curl -X POST https://api.stripe.com/v1/customers/{cust_id}/subscriptions \
  -u "sk_test_..." \
  -d "items[0][price]={price_id}" \
  -d "metadata[user_id]=550e8400-e29b-41d4-a716-446655440000" \
  -d "metadata[tier]=starter"
```

**Response (Success):**
```json
{
  "received": true,
  "dropletId": 123456789,
  "status": "initializing"
}
```

**Response (Error):**
```json
{
  "received": true,
  "error": "User already has an active starter droplet"
}
```

---

### 2. DO Callback Webhook
**POST** `/api/webhooks/do-callback`

Called by the newly bootstrapped droplet to signal readiness.

**Required Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "droplet_id": 123456789,
  "status": "ready",
  "ip_address": "192.0.2.100",
  "ipv6_address": "2001:db8::1",
  "pairing_token": "abcdef0123456789...",
  "bootstrapped_at": "2026-04-19T22:45:30Z"
}
```

**Security:**
- Verifies `pairing_token` matches stored value in DB
- Prevents unauthorized droplets from marking as ready

**Response (Success):**
```json
{
  "acknowledged": true,
  "status": "ready",
  "message": "Droplet 123456789 marked as ready",
  "ip_address": "192.0.2.100",
  "bootstrapped_at": "2026-04-19T22:45:30Z"
}
```

**Response (Invalid Token):**
```json
{
  "error": "Invalid pairing token",
  "status": 401
}
```

---

### 3. Provisioner Status Endpoint (Optional)
**GET** `/api/provisioner/status/:userId/:tier`

Check the status of a user's droplet.

**Response:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "droplet_id": 123456789,
  "name": "Starter Agent-550e8400-123456",
  "status": "ready",
  "tier": "starter",
  "region": "sfo3",
  "ip_address": "192.0.2.100",
  "created_at": "2026-04-19T22:40:00Z",
  "bootstrap_completed_at": "2026-04-19T22:45:30Z"
}
```

---

## Environment Variables

Create `.env.local`:

```bash
# DigitalOcean
DO_API_TOKEN=dop_v1_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_ANON_KEY=eyJhbGci...

# Portal
PORTAL_BASE_URL=https://laverdi.dev
NODE_ENV=production
```

---

## Local Testing

### 1. Set Up Database
Run migration on Supabase dashboard:
```sql
-- From lib/migrations/001_create_user_droplets_table.sql
```

### 2. Create Test Stripe Price
```bash
curl -X POST https://api.stripe.com/v1/prices \
  -u "sk_test_..." \
  -d "currency=usd" \
  -d "unit_amount=400" \
  -d "recurring[interval]=month" \
  -d "recurring[interval_count]=1" \
  -d "metadata[tier]=starter"
```

### 3. Create Test Subscription
```bash
USER_ID="550e8400-e29b-41d4-a716-446655440000"
PRICE_ID="price_xxx"

curl -X POST https://api.stripe.com/v1/customers/{cust}/subscriptions \
  -u "sk_test_..." \
  -d "items[0][price]=${PRICE_ID}" \
  -d "metadata[user_id]=${USER_ID}"
```

### 4. Use Stripe CLI to Forward Webhook
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Then trigger event:
```bash
stripe trigger customer.subscription.created
```

### 5. Monitor Logs
```bash
# In next.js app
npm run dev

# Watch Supabase
# Open dashboard → SQL Editor → Run query on user_droplets
```

---

## Error Handling

### Provisioning Failures

If droplet creation fails:
1. Record is created in DB with status='provisioning'
2. Droplet create API call fails
3. Record is updated with status='failed'
4. Webhook returns HTTP 200 (success) to Stripe
5. Error is logged for manual investigation

### DO Callback Failures

If droplet's bootstrap script fails:
1. Droplet sends status='error' in callback
2. Pairing token is verified
3. Record updated with status='failed'
4. Webhook returns HTTP 200

### Token Verification

If pairing token doesn't match:
1. Callback returns HTTP 401 Unauthorized
2. No database changes
3. Droplet can retry

---

## Monitoring & Alerts

### Health Checks

Droplet exposes health endpoint:
```bash
curl http://{ip}:5001/health
# → {"status": "ok"}
```

### Logs

**Provisioner logs:**
```
[Provisioner] Starting provisioning for user xxx, tier xxx
[Provisioner] Created DB record: xxx
[Provisioner] Creating droplet: Name in region
[Provisioner] Droplet created successfully: 123456789
[Provisioner] Waiting for droplet to become active...
[Provisioner] Droplet active. IP: xxx, Status: initializing
```

**DO Callback logs:**
```
[DO-Callback] Received callback: droplet 123456789, user xxx, status ready
[DO-Callback] Invalid pairing token... (security warning)
[DO-Callback] Droplet xxx marked as ready at xxx.xxx.xxx.xxx
```

**Stripe logs:**
```
[Stripe] Received event: customer.subscription.created
[Stripe] Triggering provisioning: user=xxx, tier=starter
[Stripe] Droplet provisioned: 123456789
```

---

## Future Enhancements

- [ ] Email notifications (SendGrid integration)
- [ ] Tier upgrade/downgrade handling
- [ ] Automatic droplet cleanup on subscription cancellation
- [ ] Health check monitoring and alerting
- [ ] Droplet metrics (CPU, memory, disk) integration
- [ ] Custom agent image (instead of generic Ubuntu)
- [ ] VPC/networking configuration
- [ ] SSH key management
- [ ] Firewall rules (block all except health check port)
- [ ] Cost tracking per user/tier
