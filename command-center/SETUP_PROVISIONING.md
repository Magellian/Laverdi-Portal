# Provisioning System Setup Guide

Complete step-by-step to enable droplet provisioning on your portal.

## Prerequisites

- ✅ DigitalOcean account with API token
- ✅ Stripe account with test mode enabled
- ✅ Supabase project
- ✅ Node.js 18+ and npm

## Phase 1: Environment Configuration

### 1.1 Get Your API Keys

**DigitalOcean API Token:**
1. Log in to DigitalOcean dashboard
2. Navigate to API → Tokens/Keys
3. Click "Generate New Token"
4. Name it "Laverdi Provisioning"
5. Select read+write permissions
6. Copy token (starts with `dop_v1_`)

**Stripe Keys:**
1. Log in to Stripe dashboard
2. Go to Developers → API Keys
3. Copy "Secret Key" (starts with `sk_test_`)
4. Go to Developers → Webhooks
5. Click "Add endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: Select `customer.subscription.*` events
6. Copy webhook signing secret (starts with `whsec_`)

**Supabase Keys:**
1. Log in to Supabase dashboard
2. Go to Project Settings → API
3. Copy "Project URL"
4. Copy "service_role" key (under Service Role section)
5. Copy "anon" key

### 1.2 Create `.env.local`

```bash
# Copy from .env.example
cp command-center/.env.example command-center/.env.local
```

Edit `.env.local`:
```bash
DO_API_TOKEN=dop_v1_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...
PORTAL_BASE_URL=https://laverdi.dev  # or your domain
NODE_ENV=production
```

**⚠️ Security:** Never commit `.env.local` to git. Add to `.gitignore`:
```bash
.env.local
.env.*.local
```

## Phase 2: Database Setup

### 2.1 Create user_droplets Table

1. Log in to Supabase dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy entire migration from `lib/migrations/001_create_user_droplets_table.sql`
5. Click "Run"

Expected output:
```
CREATE TABLE
CREATE INDEX (×5)
CREATE FUNCTION
CREATE TRIGGER
ALTER TABLE
ALTER TABLE
CREATE POLICY (×2)
```

Verify:
1. Go to Table Editor
2. You should see `user_droplets` table
3. Check columns: user_id, droplet_id, status, ip_address, pairing_token, etc.

### 2.2 Enable RLS (Row Level Security)

Already enabled in migration, but verify:
1. Click on `user_droplets` table
2. Go to "Authentication" tab
3. Verify RLS is "ON"

## Phase 3: Stripe Setup

### 3.1 Create Pricing Tiers

In Stripe dashboard:

**Starter Plan:**
1. Products → Create product
2. Name: "Starter Agent"
3. Add pricing:
   - $4.99/month (or your price)
   - Metadata: `tier=starter`
4. Copy price ID (e.g., `price_xxx`)

**Pro Plan:**
1. Name: "Pro Agent"
2. $12.99/month
3. Metadata: `tier=pro`

**Enterprise Plan:**
1. Name: "Enterprise Agent"
2. $32.99/month
3. Metadata: `tier=enterprise`

### 3.2 Test Webhook

**Using Stripe CLI:**

```bash
# Install Stripe CLI (if not already)
# https://stripe.com/docs/stripe-cli

# Start listening
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test event
stripe trigger customer.subscription.created
```

Expected response in your console:
```
POST /api/webhooks/stripe
[Stripe] Received event: customer.subscription.created
[Stripe] Triggering provisioning...
```

## Phase 4: Test Provisioning

### 4.1 Local Testing

**Start the portal:**
```bash
cd command-center
npm install
npm run dev
```

**Create a test user in Supabase:**
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  NOW(),
  NOW(),
  NOW()
);
```

**Create a test subscription:**
```bash
USER_ID="550e8400-e29b-41d4-a716-446655440000"
PRICE_ID="price_xxxxx"  # From Stripe dashboard

# Using Stripe test mode
curl -X POST https://api.stripe.com/v1/customers \
  -u "sk_test_..." \
  -d "email=test@example.com"
# Note the customer ID

curl -X POST https://api.stripe.com/v1/customers/{cust_id}/subscriptions \
  -u "sk_test_..." \
  -d "items[0][price]=${PRICE_ID}" \
  -d "metadata[user_id]=${USER_ID}" \
  -d "metadata[tier]=starter"
```

**Monitor logs:**
1. Check Next.js console for provisioning logs
2. Check Supabase user_droplets table for status changes
3. Watch DigitalOcean dashboard for new droplet creation

### 4.2 Expected Flow

```
1. Subscription created in Stripe
   └─ HTTP POST → /api/webhooks/stripe

2. Stripe webhook handler
   ├─ Extract user_id and tier from metadata
   └─ Call DropletProvisioner.provision()

3. Provisioner executes
   ├─ Check if user already has active droplet
   ├─ Create record in user_droplets table (status=provisioning)
   ├─ Call DO API to create droplet
   ├─ Poll until droplet is active
   ├─ Get IPv4 address
   └─ Update record (status=initializing, ip_address=xxx)

4. Droplet boots up
   ├─ Run user-data script
   ├─ Install Node.js and dependencies
   ├─ Start agent service
   └─ Call DO callback webhook with pairing token

5. DO callback webhook
   ├─ Verify pairing token matches stored value
   ├─ Update record (status=ready, ip_address=xxx)
   └─ Return HTTP 200

6. User's dashboard updates
   ├─ Shows "Ready!" status
   ├─ Displays IP address
   └─ User can connect to agent
```

### 4.3 Check Droplet Status

Query Supabase:
```sql
SELECT 
  id,
  user_id,
  droplet_id,
  status,
  ip_address,
  created_at,
  bootstrap_completed_at
FROM user_droplets
ORDER BY created_at DESC
LIMIT 10;
```

Verify on DigitalOcean:
1. Dashboard → Droplets
2. Should see new droplet with naming pattern: `{Tier} Agent-{userId}-{timestamp}`
3. Check its status and IP address

### 4.4 Test Agent Connection

SSH into droplet:
```bash
ssh root@<ip_address>

# Check agent is running
systemctl status openclaw-agent.service

# Check health endpoint
curl http://localhost:5001/health
# Should return: {"status": "ok"}

# Check logs
journalctl -u openclaw-agent.service -f
```

## Phase 5: Production Deployment

### 5.1 Update Environment

On your production server:

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit with production values
nano .env.local
```

### 5.2 Deploy to VPS

```bash
# SSH into VPS
ssh ubuntu@64.23.142.154

# Pull latest code
cd /var/www/laverdi-portal
git pull origin master

# Install dependencies
npm install

# Build Next.js
npm run build

# Restart service
sudo systemctl restart laverdi-portal
```

### 5.3 Verify Webhooks

Test real Stripe webhook:

```bash
# Create a real Stripe customer
curl -X POST https://api.stripe.com/v1/customers \
  -u "sk_test_..." \
  -d "email=realuser@example.com"

# Create subscription
curl -X POST https://api.stripe.com/v1/customers/{cust_id}/subscriptions \
  -u "sk_test_..." \
  -d "items[0][price]={price_id}"

# Monitor
tail -f /var/log/laverdi-portal/error.log
```

## Troubleshooting

### Droplet Provisioning Hangs

**Problem:** Status stays "provisioning" for >5 minutes

**Solutions:**
```bash
# Check DO API token is valid
curl -X GET https://api.digitalocean.com/v2/account \
  -H "Authorization: Bearer ${DO_API_TOKEN}"

# Check droplet status in DO
# Dashboard → Droplets → Look for your droplet

# Check logs
tail -f /var/log/laverdi-portal/error.log
```

### Webhook Not Triggering

**Problem:** Stripe webhook not calling provisioner

**Solutions:**
1. Verify webhook URL in Stripe: Settings → Webhooks
2. Check URL is correct: `https://yourdomain.com/api/webhooks/stripe`
3. Verify STRIPE_WEBHOOK_SECRET matches in code
4. Test with Stripe CLI: `stripe trigger customer.subscription.created`

### Droplet Not Calling DO Callback

**Problem:** Droplet created but stays "initializing"

**Solutions:**
```bash
# SSH into droplet
ssh root@<ip_address>

# Check bootstrap logs
tail -f /var/log/openclaw-bootstrap.log

# Check service status
systemctl status openclaw-agent.service

# Check if agent is trying to reach portal
curl -v <portal_url>/api/webhooks/do-callback

# Check pairing token in DB
```

### Invalid Pairing Token

**Problem:** DO callback returns 401 Unauthorized

**Solutions:**
```sql
-- Check stored token matches
SELECT pairing_token FROM user_droplets 
WHERE droplet_id = 123456789;

-- Regenerate if needed
UPDATE user_droplets 
SET pairing_token = encode(gen_random_bytes(32), 'hex')
WHERE droplet_id = 123456789;
```

## Monitoring

### Daily Checks

```bash
# Check failed droplets
SELECT * FROM user_droplets WHERE status = 'failed' ORDER BY created_at DESC;

# Check provisioning queue (>10 min old)
SELECT * FROM user_droplets 
WHERE status = 'provisioning' 
AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at;

# Check droplet distribution
SELECT tier, COUNT(*) as count, AVG(EXTRACT(EPOCH FROM (bootstrap_completed_at - created_at))) as avg_time_seconds
FROM user_droplets
WHERE status = 'ready'
GROUP BY tier;
```

### Set Up Alerts

Recommended: Use Sentry or similar for error tracking

```bash
# In .env.local
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# In provisioning code
import * as Sentry from "@sentry/nextjs";
Sentry.captureException(error);
```

## Next Steps

- [ ] Add email notifications (SendGrid)
- [ ] Add dashboard droplet status widget
- [ ] Add droplet deletion endpoint
- [ ] Add droplet metrics/monitoring
- [ ] Add custom agent image
- [ ] Add automatic cleanup on cancellation
- [ ] Add usage analytics
- [ ] Add cost tracking per user

---

## Quick Reference

**Key Files:**
- `lib/digitalocean.ts` - DO API wrapper
- `lib/droplet-provisioner.ts` - Main provisioning logic
- `lib/user-data-template.sh` - Droplet bootstrap script
- `pages/api/webhooks/stripe.ts` - Stripe webhook handler
- `pages/api/webhooks/do-callback.ts` - Droplet ready callback

**Key Environment Variables:**
- `DO_API_TOKEN` - DigitalOcean API token
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for webhooks)
- `PORTAL_BASE_URL` - Portal base URL (for droplet callbacks)

**Support:** Check `/api/webhooks` endpoint for documentation
