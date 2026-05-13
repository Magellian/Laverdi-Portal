# LaVerdi Portal — Current Status (2026-04-30)

**Status:** 95% Complete - Usage Tracking Integration In Progress  
**Date:** 2026-04-30 22:29 PDT  
**Server:** 64.23.253.97 (SFO3, 4 vCPU, 8GB RAM)

---

## 🎯 WHAT'S OPERATIONAL RIGHT NOW

### Portal & Authentication ✅
- **URL:** https://laverdi.tech
- **Admin:** https://laverdi.tech/admin (pw: laverdi-admin-api-2026)
- **Status:** https://laverdi.tech/status
- User signup, login, Stripe integration working
- Tier system: do-only → trial → starter → professional

### OpenClaw Agent Provisioning ✅
- Automatic Docker container creation per user
- Gateway boots cleanly on first start (race condition fixed)
- Model configuration working
- WebSocket routing through nginx
- Users can connect and chat with agents

### Full Tech Stack ✅
```
nginx (SSL/WSS, Let's Encrypt)
├── laverdi-portal (Next.js, port 3000)
├── laverdi-command-center (Flask, port 8000)
└── openclaw-{container} (per-user, ports 9000+)
```

---

## 🔄 CURRENT WORK: USAGE TRACKING (95% DONE)

### What Was Built (Session 2026-04-30)

**API Endpoints Created:**
1. ✅ `/api/usage/report` — Containers report token usage here
   - Rate-limited: 100 reports/min per container
   - Pricing config included (Opus, Sonnet, Haiku rates)
   - Stores usage in Supabase

2. ✅ `/api/usage/current-period` — Users query their spending
   - Returns current usage stats
   - Calculates cost based on tier
   - Real-time metrics

**Command Center Patched:**
- ✅ `usageReporting` config injected into containers
- ✅ Containers know where to send usage data
- ✅ API keys provisioned

**Portal Rebuilt:**
- ✅ New endpoints accessible
- ✅ Dashboard ready for UsageWidget
- ✅ Admin panel functional

---

## ⏳ PENDING: COMPLETE THE USAGE SYSTEM

**What Still Needs To Be Done:**

1. **Supabase Migrations** (SQL)
   - Create `usage_reports` table
   - Create `user_usage_summary` table
   - Add indexes for performance
   - Set up row-level security

2. **Testing Full Flow**
   - Container sends usage data to `/api/usage/report`
   - Data stored in Supabase
   - User can query `/api/usage/current-period`
   - Pricing calculated correctly

3. **Dashboard Widget**
   - Add `UsageWidget.tsx` to dashboard
   - Show current period usage
   - Show projected costs
   - Show tier limits

4. **Cost Enforcement** (Phase 2)
   - Monitor usage against tier limits
   - Warn user at 80% usage
   - Soft limit at 100%
   - Hard limit with shutdown

---

## 📊 TIER SYSTEM (LOCKED)

| Tier | Model | Cost | Token Limit | Use Case |
|------|-------|------|-------------|----------|
| do-only | Llama 2 | Free | Unlimited | Testing only |
| trial | Haiku | $0 | 50M tokens/month | 14-day trial |
| starter | Sonnet | $25/mo | 200M tokens/month | Indie/small |
| professional | Opus | $99/mo | Unlimited | Enterprise |

**Pricing** (per tier):
- Haiku: $0.80 per 1M input, $2.40 per 1M output
- Sonnet: $3.00 per 1M input, $15.00 per 1M output
- Opus: $15.00 per 1M input, $75.00 per 1M output

---

## 🔐 SECURITY & CONFIG

**Key Credentials:**
- Admin token: `laverdi-admin-api-2026` (for `/api/admin/*` endpoints)
- Stripe: bpc_1TRRHHBTYRav1HpscIgKAKmq (portal config)
- SendGrid: Configured (awaiting DNS verification)

**Known Issues:**
- NEXT_PUBLIC_ vars don't work in Docker (baked at build time)
- .env.local is in .dockerignore (can't update at runtime)
- Solution: Rebuild Docker image for config changes

---

## 🚀 NEXT IMMEDIATE STEPS

### To Complete Usage Tracking (TODAY/TOMORROW):

1. **Run SQL Migrations** (Supabase SQL editor)
   ```sql
   -- Tables needed:
   CREATE TABLE usage_reports (...)
   CREATE TABLE user_usage_summary (...)
   CREATE INDEX usage_reports_user_id (user_id)
   ```

2. **Test End-to-End**
   - Create test user
   - Start container
   - Container sends usage data
   - Verify data in Supabase
   - Query endpoint returns correct data

3. **Add Dashboard Widget**
   - Create `components/UsageWidget.tsx`
   - Display current usage
   - Show cost estimation
   - Add to dashboard

4. **Deploy & Monitor**
   - Rebuild portal Docker image
   - Restart portal service
   - Monitor usage data flow
   - Check for errors

---

## 📋 REMAINING LAVERDI TODO LIST

**High Priority (Phase 1 - CURRENT):**
- [ ] Complete usage tracking migrations + testing
- [ ] Add UsageWidget to dashboard
- [ ] Full signup → provision → usage flow test
- [ ] SendGrid DNS verification (email delivery)

**Medium Priority (Phase 1.5):**
- [ ] Stripe checkout UI fix (test mode issue)
- [ ] `gateway.trustedProxies` config
- [ ] OpenClaw image update (v2026.4.21 → latest)
- [ ] Cost enforcement (warnings, limits)

**Low Priority (Phase 2):**
- [ ] Advanced analytics
- [ ] Custom agent templates
- [ ] API key management for users
- [ ] Billing history & invoices

---

## 💻 DEPLOYMENT INFO

**Production Server:**
- IP: 64.23.253.97
- Region: SFO3 (DigitalOcean)
- Specs: 4 vCPU, 8GB RAM
- OS: Ubuntu 22.04

**Services Running:**
```bash
# Check status
systemctl status nginx
systemctl status docker

# Portal logs
docker logs laverdi-portal

# Command center logs
docker logs laverdi-command-center

# User containers
docker ps | grep openclaw
```

**To SSH:**
```bash
ssh root@64.23.253.97
```

---

## 🎯 WHAT CHRIS NEEDS TO KNOW

**LaVerdi Status:** 95% operational. Usage tracking built, just needs migrations + testing to complete.

**Current Issue:** Usage system is coded but not wired to database yet. Containers have nowhere to report usage.

**To Fix:** 
1. Create Supabase tables (SQL)
2. Test data flow
3. Add dashboard widget
4. Done — system is live

**Timeline:** 1-2 days to complete usage tracking integration + full testing

---

**Status:** ✅ Core system operational | ⏳ Usage tracking integration in progress  
**Last Updated:** 2026-04-30 22:29 PDT  
**Prepared by:** Crawford
