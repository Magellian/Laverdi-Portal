# ✅ Final Deployment Checklist - Tier-Based Model System

## Status: CODE DEPLOYED ✅ | DATABASE PENDING ⏳

### What's Done
- ✅ API endpoints deployed to portal
- ✅ Environment variables configured
- ✅ Portal rebuilt and restarted
- ✅ OpenClaw gateway running at http://64.23.142.154:8824/

### What's Left: Database Migration (5 minutes)

## Step 1: Open Supabase Dashboard

1. Go to: https://app.supabase.com
2. Log in with your account
3. Select project: **dcvrkpgvxqdcboostkpz**

## Step 2: Run SQL Migration

1. Click **SQL Editor** in left sidebar
2. Click **New Query** (top right)
3. **Copy-paste the entire contents of `migration-tier-model-system.sql`**
4. Click **Run** button (or Cmd+Enter)

### Expected Output:
```
Query executed successfully
Lines: 1-150
```

### What Gets Created:
- ✅ `model_tier_map` table (tier → model mapping)
- ✅ `instances` table (OpenClaw container tracking)
- ✅ 4 columns added to `users` table
- ✅ RLS policies for security
- ✅ 3 indexes for performance

## Step 3: Verify Migration

Run this query to confirm:

```sql
SELECT * FROM model_tier_map ORDER BY price_monthly;
```

Should return:
```
| tier          | model_id                          | price_monthly | description                    |
|---------------|-----------------------------------|---------------|--------------------------------|
| free          | anthropic-claude-haiku-4.5       | 0             | Best bang-for-buck...          |
| starter       | anthropic-claude-4.6-sonnet      | 99            | General-purpose...             |
| professional  | anthropic-claude-opus-4.6        | 249           | Most capable...                |
```

## Step 4: Test the System (Optional)

### Test 1: Check tier mapping endpoint
```bash
curl http://64.23.142.154/api/models/tier-mapping
```

Expected: Returns 3 tiers with model IDs

### Test 2: Verify portal is running
```bash
open http://64.23.142.154
```

Should see Laverdi landing page (no errors)

### Test 3: Make a test payment
1. Go to http://64.23.142.154/plans
2. Click "Upgrade to Starter"
3. Enter test card: 4242 4242 4242 4242
4. Complete payment
5. Watch for:
   - ✅ User tier updates to 'starter'
   - ✅ OpenClaw container provisioned
   - ✅ Confirmation email sent
   - ✅ Redirect to dashboard showing new tier

## Troubleshooting

### "Table already exists" error
This is fine - the migration uses `IF NOT EXISTS` so it's idempotent. Just means the table was already there.

### "Permission denied" error
Make sure you're using your **Supabase account** that owns the project.

### "Query executed" but nothing appears
Refresh the page and check the SQL Editor history.

## What Happens Next

1. **User signs up**
   - Portal creates account with tier='free'
   - Assigned model: `anthropic-claude-haiku-4.5`
   - Can access free OpenClaw instance

2. **User upgrades to Starter ($99/mo)**
   - Clicks "Upgrade" → Stripe checkout
   - Pays with credit card
   - Webhook fires automatically
   - Portal updates tier to 'starter'
   - New OpenClaw container provisioned with `anthropic-claude-4.6-sonnet`
   - Email sent with access details

3. **All inference requests**
   - Use DO Inference API: `https://inference.do-ai.run/v1`
   - Use shared key (tied to your account, usage-based billing)
   - Model determined by user's tier
   - No credentials leak to users

## Important Notes

✅ **Security**: No API keys in code or frontend
✅ **Billing**: DO charges per-token, tied to your account
✅ **Scaling**: Can add new tiers by inserting rows in `model_tier_map`
✅ **Zero Setup**: Everything is configured and ready to go

## Files for Reference

- `tier-model-mapping.md` — System design
- `TIER-MODEL-INTEGRATION-GUIDE.md` — Detailed implementation
- `migration-tier-model-system.sql` — SQL to run (THIS STEP)
- `SESSION-2026-04-22-SUMMARY.md` — What was built

---

**Next Action**: Run the SQL migration in Supabase, then test with a free signup + test payment.

**Estimated Time**: 5 minutes
