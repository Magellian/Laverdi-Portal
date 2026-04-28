# Tier-Based Model Integration Guide

## Overview
This document outlines how to integrate DigitalOcean Serverless Inference with the Laverdi portal's tier system.

**Result:** Each user gets the right AI model based on their subscription tier, with zero hardcoded credentials on the VPS.

## Files Created

1. **`tier-model-mapping.md`** — System design document
2. **`api-tier-mapping.ts`** — GET endpoint returning tier → model mappings
3. **`api-provision-openclaw-user.ts`** — POST endpoint to provision user's container
4. **`stripe-webhook-update.ts`** — Updated webhook to trigger provisioning on payment
5. **`migration-tier-model-system.sql`** — Database schema updates (RUN THIS FIRST)
6. **`TIER-MODEL-INTEGRATION-GUIDE.md`** — This file

## Implementation Steps

### Step 1: Run Database Migration (Supabase)

Go to **Supabase Dashboard** → **SQL Editor** → Paste contents of `migration-tier-model-system.sql` → **Run**

This creates:
- `model_tier_map` table with tier → model mappings
- `instances` table for tracking OpenClaw containers
- Adds columns to `users` table (tier, model_id, etc.)
- Sets up RLS policies

### Step 2: Deploy API Endpoints

Copy the three TS files to your portal:

```bash
cp api-tier-mapping.ts /path/to/laverdi-portal/pages/api/models/tier-mapping.ts
cp api-provision-openclaw-user.ts /path/to/laverdi-portal/pages/api/provision-openclaw-user.ts
cp stripe-webhook-update.ts /path/to/laverdi-portal/pages/api/webhooks/stripe.ts
```

**Or if using ACP/Codex:**
Spawn a coding session to integrate these files into the portal.

### Step 3: Update Environment Variables

Add to `.env.production`:

```bash
# DO Inference (shared across all users)
DO_INFERENCE_API_KEY=sk-do-REDACTED_DO_INFERENCE_KEY

# Command Center (for container provisioning)
COMMAND_CENTER_URL=http://laverdi-command-center:8000

# Stripe Price IDs
STRIPE_PRICE_ID_STARTER=price_1TOP3SBTYRav1HpsXRTdQpB3
STRIPE_PRICE_ID_PROFESSIONAL=price_1TOOPxBTYRav1HpsXTTywQHc

# API security (for internal calls)
API_SECRET_KEY=your-secret-key-here
```

### Step 4: Test the Flow

**Test 1: Verify tier mapping endpoint**
```bash
curl http://localhost:3000/api/models/tier-mapping
```

Expected response:
```json
{
  "success": true,
  "tiers": [
    {
      "tier": "free",
      "model_id": "anthropic-claude-haiku-4.5",
      "price_monthly": 0
    },
    {
      "tier": "starter",
      "model_id": "anthropic-claude-4.6-sonnet",
      "price_monthly": 99
    },
    {
      "tier": "professional",
      "model_id": "anthropic-claude-opus-4.6",
      "price_monthly": 249
    }
  ]
}
```

**Test 2: Provision a user container**
```bash
curl -X POST http://localhost:3000/api/provision-openclaw-user \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-id-here","tier":"starter"}'
```

Expected response:
```json
{
  "success": true,
  "container": {
    "id": "openclaw-user-id",
    "model_id": "anthropic-claude-4.6-sonnet",
    "endpoint": "https://inference.do-ai.run/v1",
    "apiKey": "sk-do-...",
    "port": 8824,
    "url": "http://64.23.142.154:8824"
  }
}
```

**Test 3: Simulate Stripe webhook**
```bash
# Make a test payment in Stripe dashboard using 4242 4242 4242 4242
# Watch the webhook logs to confirm:
# - User tier updated
# - OpenClaw provisioned
# - Welcome email sent
```

### Step 5: Update Portal UI (Optional)

Add to dashboard to show user's current model:

```tsx
// pages/dashboard/index.tsx
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch user data
    fetch('/api/auth/me').then(r => r.json()).then(setUser);
  }, []);

  return (
    <div>
      <h2>Your Plan</h2>
      <p>Tier: <strong>{user?.tier || 'free'}</strong></p>
      <p>Model: <code>{user?.model_id || 'anthropic-claude-haiku-4.5'}</code></p>
      <p>Inference: {user?.openclaw_base_url}</p>
    </div>
  );
}
```

## Architecture Flow

```
User signs up
  ↓
Portal: Create user with tier='free', model_id='anthropic-claude-haiku-4.5'
  ↓
User clicks "Upgrade"
  ↓
Stripe checkout
  ↓
Payment success
  ↓
Stripe webhook → /api/webhooks/stripe
  ↓
Update user tier to 'starter' or 'professional'
  ↓
Call /api/provision-openclaw-user
  ↓
Provision Docker container with DO_INFERENCE_API_KEY
  ↓
Container starts with correct model_id + endpoint
  ↓
User accesses OpenClaw at http://64.23.142.154:{port}
  ↓
OpenClaw uses DO inference API with tier-based model
```

## Security Notes

1. **DO API Key is Shared** — All users share `sk-do-zJcFm__t2n...` (tied to your DO account)
   - Safe: Usage is tied to your account, you're billed for tokens used
   - No per-user leakage; billing per-token prevents abuse
   - If compromised, rotate via DO Control Panel

2. **Never Expose Keys in Frontend** — DO_INFERENCE_API_KEY stays server-side only
   - Portal doesn't send it to browser
   - OpenClaw container uses it internally
   - Users don't get direct API access

3. **RLS on instances Table** — Users can only see their own container info
   - Service role can create/update/delete
   - Users can only SELECT their own

## Troubleshooting

### "Model not found for tier: starter"
- Check `model_tier_map` table exists and is populated
- Run migration again if needed

### OpenClaw container fails to start
- Check Command Center logs: `docker logs laverdi-command-center`
- Verify Docker network `laverdi-net` exists
- Check port availability

### "invalid request body" from DO API
- Verify model_id is valid (check `/v1/models`)
- Ensure headers are correct: `Authorization: Bearer {key}`
- Check Content-Type is `application/json`

### User tier not updating after payment
- Check Stripe webhook is configured correctly
- Verify webhook secret in env vars
- Check portal logs for webhook processing errors

## Next Steps

1. **Deploy** the files to the portal
2. **Run** the SQL migration in Supabase
3. **Test** with a free signup and a test payment
4. **Monitor** OpenClaw container startup and inference calls
5. **Scale** by adjusting tier models or adding new tiers
