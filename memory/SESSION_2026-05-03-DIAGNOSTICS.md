# SESSION 2026-05-03 — DIAGNOSTIC REPORT: VULTR TEST INSTANCES

**TIMESTAMP:** 2026-05-03 19:27 PDT  
**TASK:** Figure out what's broken with Vultr test instances and fix it

## Current State

**Vultr Dashboard:** Test instances ARE spinning up  
**Payment Flow:** Webhook appears to be firing (instances being created)  
**Problem:** Unknown — need to investigate instances directly

## Issues Identified So Far

### 1. Server Connectivity
- **64.23.253.97:** Unreachable (SSH timeout)
- **Status:** May be offline or networking issue
- **Action:** Check DigitalOcean account / server health

### 2. Configuration Confusion
- **Config mentions "Vultr"** but actually references **DigitalOcean inference API**
- File: `laverdi-vultr-plugin/openclaw-config.json`
- Contains: DigitalOcean API token, inference endpoint
- **Problem:** Naming is misleading — needs clarification

### 3. Stripe Test Prices (Just Fixed ✅)
- **Starter:** `price_1TTCBoPgT412N4djUecXZkuL` ($29.99/mo)
- **Professional:** `price_1TTCBrPgT412N4dj8F5FwL7p` ($99.99/mo)
- **Status:** Ready to test

## What We Need to Check

1. **Server Status**
   - [ ] Is 64.23.253.97 running?
   - [ ] Check DigitalOcean account for droplet status
   - [ ] Verify SSH access works

2. **Vultr Instances**
   - [ ] Log into Vultr account
   - [ ] Check instance list — what was created?
   - [ ] Check instance logs/status
   - [ ] Verify OpenClaw is running inside

3. **Payment Webhook**
   - [ ] Check webhook logs on portal
   - [ ] Verify Stripe is posting updates
   - [ ] Confirm instance data is reaching Supabase

4. **Database**
   - [ ] Check `instances` table — is data being recorded?
   - [ ] Check `profiles` table — tier column correct?

## Investigation Results (19:44 PDT)

### ✅ ACCESSIBLE
- **Portal:** https://laverdi.tech (HTTP 200, alive)
- **Local OpenClaw:** ws://127.0.0.1:18789 (fully operational, Telegram bot working)
- **Vultr Instance:** 149.28.13.155 (SSH reachable, requires password auth)

### ❌ UNREACHABLE / OFFLINE
- **Command Center:** 66.42.70.66:8000 (Connection refused)
- **Old Server:** 64.23.253.97 (SSH timeout)

### 🤔 UNKNOWNS
- **Instance Status:** 149.28.13.155 running Docker? OpenClaw inside?
- **Provisioning Script:** Was it ever executed by Vultr?
- **Webhook Logs:** Where are they stored? (No `/api/webhook-logs` endpoint)

## Key Finding
**Command center is offline** — This is the provisioning orchestrator. If it's down, Vultr instances probably weren't provisioned with OpenClaw at all.

## Next Steps (Priority Order)

### IMMEDIATE
1. **Restart command center** on 66.42.70.66 (or is it meant to be on 64.23.253.97?)
2. Check admin panel for webhook/provisioning history
3. Verify Stripe webhook is actually configured and firing

### THEN
1. SSH into 149.28.13.155 and check if Docker/OpenClaw exist
2. If not: Re-trigger provisioning with new payment
3. If yes: Debug why instance isn't responding

### FINALLY  
1. Fix broken infrastructure
2. Run end-to-end payment → provision → connect test
3. Document for future reference

## Vultr Account (Confirmed)
- Status: ✅ Account active, funded
- API Key: Not found in workspace yet
- Provisioning: ??? (unclear if it's actually being called)

