# Laverdi E2E Automation - Priority Build Roadmap

**Goal:** Complete functional Stripe → Droplet → User Dashboard automation  
**Target Completion:** 4-5 hours  
**Status:** Starting NOW

---

## Priority-Ordered Build List

### 🔴 PRIORITY 1: Droplet Provisioner (Foundation)
**Why First:** Everything depends on this. Without it, nothing gets created.

**What to Build:**
- [ ] `lib/digitalocean.ts` — Wrapper for DO API calls
- [ ] `lib/droplet-provisioner.ts` — Main provisioning logic
- [ ] `lib/user-data-template.sh` — Bootstrap script for new droplets
- [ ] Database migration: `user_droplets` table in Supabase

**Estimated Time:** 1.5-2 hours  
**Output:** Function that takes (userId, tier) → creates droplet, returns IP

---

### 🟠 PRIORITY 2: Stripe Webhook Handler (Trigger)
**Why Second:** Connects signups to provisioner. User pays → droplet gets created.

**What to Build:**
- [ ] `pages/api/webhooks/stripe.ts` — Listen for payment events
- [ ] Handle `customer.subscription.created` event
- [ ] Call provisioner when subscription successful
- [ ] Error handling & retry logic

**Estimated Time:** 1 hour  
**Output:** Webhook that creates droplet when user upgrades to Starter/Pro

---

### 🟡 PRIORITY 3: DO Callback Webhook (Completion)
**Why Third:** Tells portal when droplet is ready. User sees IP on dashboard.

**What to Build:**
- [ ] `pages/api/webhooks/do-callback.ts` — Receive "I'm ready" from new droplet
- [ ] Update Supabase: status='ready', store IP
- [ ] Generate pairing token
- [ ] Send email notification to user

**Estimated Time:** 45 min  
**Output:** Webhook that marks droplet ready + notifies user

---

### 🟢 PRIORITY 4: Dashboard Integration (Visibility)
**Why Fourth:** Users see their droplet status + IP. Can click "Open Agent".

**What to Build:**
- [ ] Update `pages/dashboard/agent.tsx` — Show droplet status/IP
- [ ] Add "Test Connection" button (curl droplet health)
- [ ] Show "Provisioning..." while creating
- [ ] Show "Ready!" with IP once done

**Estimated Time:** 45 min  
**Output:** Dashboard that shows droplet status in real-time

---

### 🔵 PRIORITY 5: Testing & Integration Tests (Validation)
**Why Fifth:** Verify the whole flow works end-to-end.

**What to Build:**
- [ ] Manual test: Sign up → Pay → Watch droplet create → See IP on dashboard
- [ ] Automated tests: Provisioner unit tests, webhook validation
- [ ] Error scenarios: Payment fails, droplet fails, callback timeout

**Estimated Time:** 1 hour  
**Output:** Confidence that the system actually works

---

## Build Sequence (Recommended)

```
1. Priority 1: Droplet Provisioner (test locally with mock DO API)
   ↓
2. Priority 2: Stripe Webhook (connect to provisioner)
   ↓
3. Priority 3: DO Callback (return status to portal)
   ↓
4. Priority 4: Dashboard (show results to user)
   ↓
5. Priority 5: End-to-End Test (full flow verification)
```

---

## Agent Suggestions

### Agent 1: Backend Engineer (Provisioning + Webhooks)
**Specialty:** Building the provisioning engine and webhook handlers  
**Tasks:**
- Priority 1: Droplet provisioner (lib files + DB migration)
- Priority 2: Stripe webhook handler
- Priority 3: DO callback webhook

**Suggested Model:** Claude Opus (best for complex backend logic)

**Session Mode:** Persistent (`thread: true`)

---

### Agent 2: Frontend Engineer (Dashboard + Integration)
**Specialty:** UI components, real-time updates, user feedback  
**Tasks:**
- Priority 4: Dashboard integration (show droplet status, IP, connection test)
- Priority 5: Integration tests and manual testing

**Suggested Model:** Claude Sonnet (good for UI/iteration)

**Session Mode:** Persistent (`thread: true`)

---

## What I'll Do (Orchestrator)

- [ ] Manage handoffs between agents
- [ ] Verify outputs
- [ ] Integration testing
- [ ] Deployment to VPS when ready

---

## Resources Both Agents Need

**Environment Variables (for testing):**
```bash
DO_API_TOKEN=<your_do_token> (from DigitalOcean)
STRIPE_SECRET_KEY=<your_stripe_secret> (from Stripe dashboard)
SUPABASE_URL=https://dcvrkpgvxqdcboostkpz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key> (from Supabase settings)
```
**NOTE: Keep secrets in `.env.local`, never commit to git**

**Git Repo:**
- `C:\Users\chris\.openclaw\workspace`
- Portal code is running on VPS at `64.23.142.154:3000`
- Agent service at `64.23.142.154:5000`
- All code should be committed to git

**Testing Strategy:**
1. Local dev first (mock DO API)
2. Deploy to VPS and test real flow
3. Stripe test mode (use test credit card: 4242 4242 4242 4242)

---

## Start Command (Ready to Execute)

When you say "GO", I will:

1. **Spawn Agent 1 (Backend):**
   - Task: Build Priority 1 + 2 + 3
   - Thread: Persistent
   - Model: Opus

2. **Spawn Agent 2 (Frontend):**
   - Task: Build Priority 4 + 5
   - Thread: Persistent
   - Model: Sonnet

3. **I will:**
   - Monitor progress
   - Handle integration points
   - Commit to git
   - Test deployments

---

## Questions Before We Start

1. ✅ **DO API Token:** I have it from your MEMORY.md
2. ❓ **Stripe Keys:** Do you have STRIPE_SECRET_KEY in `.env`?
3. ❓ **Supabase Service Role Key:** Needed for server-side operations. Get from Supabase dashboard.
4. ❓ **Portal source:** Is the full Next.js portal backed up in git, or only on VPS?

**Ready to answer these + then say "GO"?**
