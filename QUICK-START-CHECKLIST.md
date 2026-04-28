# Production Deployment Checklist

## Pre-Deployment (This Session)

- [x] OpenClaw gateway fixed and running at http://64.23.142.154:8824/
- [x] DO Inference API verified
- [x] Tier-model system designed
- [x] All code files created
- [x] Database migration script ready
- [x] Implementation guide written

## Deployment Steps (Next Session)

### Phase 1: Database Setup (5 min)
- [ ] Open Supabase dashboard → SQL Editor
- [ ] Paste `migration-tier-model-system.sql`
- [ ] Run migration
- [ ] Verify: `model_tier_map` table created with 3 rows
- [ ] Verify: `instances` table created

### Phase 2: Deploy Code (15 min)
- [ ] SSH to portal: `ssh root@64.23.142.154`
- [ ] Copy `api-tier-mapping.ts` → `/root/laverdi-portal/pages/api/models/tier-mapping.ts`
- [ ] Copy `api-provision-openclaw-user.ts` → `/root/laverdi-portal/pages/api/provision-openclaw-user.ts`
- [ ] Replace `/root/laverdi-portal/pages/api/webhooks/stripe.ts` with `stripe-webhook-update.ts`
- [ ] Commit changes: `cd /root/laverdi-portal && git add . && git commit -m "Add tier-based model system"`

### Phase 3: Environment Setup (5 min)
- [ ] Update `.env.production`:
  ```
  DO_INFERENCE_API_KEY=sk-do-REDACTED_DO_INFERENCE_KEY
  COMMAND_CENTER_URL=http://laverdi-command-center:8000
  STRIPE_PRICE_ID_STARTER=price_1TOP3SBTYRav1HpsXRTdQpB3
  STRIPE_PRICE_ID_PROFESSIONAL=price_1TOOPxBTYRav1HpsXTTywQHc
  API_SECRET_KEY={generate-random-key}
  ```
- [ ] Rebuild portal: `docker build -t laverdi-portal:latest /root/laverdi-portal`
- [ ] Restart container: `docker restart laverdi-portal`

### Phase 4: Test Endpoints (10 min)
- [ ] Test tier mapping:
  ```bash
  curl http://64.23.142.154/api/models/tier-mapping
  ```
  Expected: 3 tiers returned (free, starter, professional)

- [ ] Test provisioning (need a real user ID from DB):
  ```bash
  curl -X POST http://64.23.142.154/api/provision-openclaw-user \
    -H "Content-Type: application/json" \
    -d '{"userId":"test-user-id","tier":"starter"}'
  ```
  Expected: Container info returned with model_id and endpoint

- [ ] Check dashboard shows user tier and model:
  ```
  http://64.23.142.154/dashboard
  ```

### Phase 5: Live Payment Test (15 min)
- [ ] Create test account
- [ ] Go to /plans page
- [ ] Click "Upgrade to Starter"
- [ ] Pay with 4242 4242 4242 4242
- [ ] Watch for:
  - Stripe webhook fires
  - User tier updated to 'starter'
  - OpenClaw container provisioned
  - Welcome email sent
- [ ] Verify container is running:
  ```bash
  docker ps | grep openclaw
  ```
- [ ] Test OpenClaw UI at returned URL:
  ```
  http://64.23.142.154:{port}/
  ```

## Rollback Plan

If something breaks:

1. **Revert code changes:**
   ```bash
   cd /root/laverdi-portal
   git log --oneline | head -5
   git revert {commit-hash}
   ```

2. **Drop new tables (if needed):**
   ```sql
   DROP TABLE IF EXISTS instances;
   DROP TABLE IF EXISTS model_tier_map;
   ```

3. **Restart portal:**
   ```bash
   docker restart laverdi-portal
   ```

## Monitoring

After deployment, watch for:

1. **Stripe webhook logs** — Check if payments trigger provisioning
2. **Docker container logs** — Verify OpenClaw starts correctly
3. **Command Center logs** — Check if container provisioning succeeds
4. **Portal logs** — Look for errors in tier mapping or provisioning

```bash
# Watch logs live
docker logs -f laverdi-portal
docker logs -f laverdi-command-center
```

## Success Criteria

✅ New users signup with tier='free' and model='haiku'
✅ Paid users upgrade → tier updates → new container provisioned
✅ User dashboard shows current tier and model
✅ OpenClaw container starts with correct DO inference endpoint
✅ No credentials exposed in logs or containers
✅ Each tier can successfully make inference calls

## Estimated Time: ~1 hour total

- Database: 5 min
- Deploy code: 15 min
- Environment: 5 min
- Testing: 25 min
- Monitoring: 10 min

---

**Files to use:**
1. `migration-tier-model-system.sql` → Supabase SQL Editor
2. `api-tier-mapping.ts` → Portal
3. `api-provision-openclaw-user.ts` → Portal
4. `stripe-webhook-update.ts` → Portal (replaces existing)
5. `TIER-MODEL-INTEGRATION-GUIDE.md` → Reference while implementing
