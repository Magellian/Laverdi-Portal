# Laverdi Portal E2E Automation - Audit Report

**Date:** 2026-04-19  
**Status:** ⚠️ **CRITICAL GAP IDENTIFIED**

---

## Executive Summary

**The Problem:** Your SaaS portal (Next.js app on the VPS) exists and is running, but **the automation backend (Stripe → droplet provisioning → webhook) is not implemented yet**.

**Current State:**
- ✅ VPS running (64.23.142.154)
- ✅ Laverdi Portal frontend: Live at port 3000
- ✅ Agent Service: Running at port 5000
- ✅ Command Center: Running at port 8000
- ❌ Stripe webhook handler: **MISSING**
- ❌ Droplet provisioning engine: **MISSING**
- ❌ DO callback webhook: **MISSING**
- ❌ Automated user onboarding: **MISSING**

**In Other Words:**
When you sign up today and pay, **nothing happens automatically**. You'd have to manually:
1. Create a droplet in DO console
2. SSH into it
3. Deploy the agent/command-center manually
4. Give user the IP

**What Needs to Happen:**
When user signs up → automatic droplet creation + bootstrap + user sees it on dashboard

---

## What Exists Today

### 1. ✅ Frontend Portal
- **Location:** Running at `http://64.23.142.154:3000`
- **Status:** LIVE ✅
- **Files in git:** Not clear (likely on VPS only, not fully backed up)
- **What it does:**
  - Landing page (signup form)
  - User authentication (Supabase PKCE)
  - Dashboard pages (billing, agents, integrations, usage)
  - Pricing tiers (Free, Starter, Pro)
  - Stripe payment integration (appears to be in place)

### 2. ✅ Agent Service
- **Location:** Running at `http://64.23.142.154:5000`
- **Status:** HEALTHY ✅
- **Files:** `agent-service/app.py` (Python Flask, in git)
- **What it does:**
  - Task execution engine
  - `/health` endpoint works
  - `/task` endpoint accepts jobs
  - `/tasks` endpoint returns task list
  - SQLite persistence

### 3. ✅ Command Center
- **Location:** Running at `http://64.23.142.154:8000`
- **Status:** DEPLOYED (simplified Flask version)
- **Files:** `command_center_app.py` (in git, simplified to not need requests module)
- **What it does:**
  - Agent management dashboard
  - Task submission form
  - Task history display
  - Real-time polling (every 3 seconds)

### 4. ⚠️ Docker Infrastructure
- **File:** `docker-compose.yml` in `/agent-system` and `/laverdi-deploy`
- **Status:** PARTIALLY SET UP
- **Network:** `laverdi-net` bridge (confirmed working)
- **Containers:**
  - laverdi-portal (Next.js, port 3000)
  - laverdi-nginx (reverse proxy, port 80/443)
  - laverdi-agent (Flask, port 5000)
  - laverdi-command-center (Flask, port 8000)

---

## What's MISSING (The Critical Gap)

### 1. ❌ Stripe Webhook Handler
- **File:** `pages/api/webhooks/stripe.ts` — **DOES NOT EXIST**
- **Purpose:** Listen for Stripe payment events (subscription created, payment succeeded)
- **What it should do:**
  - Validate Stripe signature
  - Extract customer ID, tier, subscription ID
  - Call droplet provisioner
  - Log event
- **Severity:** CRITICAL (blocks entire automation)

### 2. ❌ Droplet Provisioner
- **File:** `lib/droplet-provisioner.ts` — **DOES NOT EXIST**
- **Purpose:** Create DigitalOcean droplets automatically
- **What it should do:**
  - Call DO API (`POST /v2/droplets`)
  - Generate user data script (bash to install Docker, clone repo, start containers)
  - Select droplet size based on tier (free=1vCPU, starter=2vCPU, pro=4vCPU)
  - Return droplet IP and ID
  - Store in Supabase `user_droplets` table
- **Severity:** CRITICAL

### 3. ❌ DO Callback Webhook
- **File:** `pages/api/webhooks/do-callback.ts` — **DOES NOT EXIST**
- **Purpose:** Receive callback from newly booted droplet
- **What it should do:**
  - Receive POST with droplet_id, public_ip, user_id
  - Update Supabase: set status='ready', store IP
  - Generate pairing token (UUID)
  - Send email to user: "Your agent is ready at IP:port"
- **Severity:** HIGH (users need to know when ready)

### 4. ❌ User Data Bootstrap Script
- **File:** Template in `lib/user-data-template.sh` — **DOES NOT EXIST**
- **Purpose:** Script that runs on new droplet's first boot
- **What it should do:**
  - Update system packages
  - Install Docker
  - Clone your git repo
  - Build Docker images
  - Create `laverdi-net` network
  - Start containers (agent, command-center, nginx)
  - Call back to portal webhook when ready
- **Severity:** CRITICAL

### 5. ❌ Database Schema for Automation
- **Table:** `user_droplets` — **PROBABLY MISSING**
- **Columns needed:**
  - user_id (FK to auth.users)
  - droplet_id (DO droplet ID)
  - public_ip
  - status (provisioning / ready / error)
  - pairing_token
  - tier
  - created_at, updated_at
- **Severity:** HIGH

### 6. ⚠️ Supabase Integration in Next.js
- **Status:** Partially done (auth works, but backend APIs incomplete)
- **Missing endpoints:**
  - `POST /api/droplets/provision` — trigger provisioning
  - `GET /api/droplets/status` — check provisioning status
  - `POST /api/droplets/cancel` — delete droplet on subscription cancellation
  - `GET /api/agents/list` — list user's agents
- **Severity:** HIGH

### 7. ⚠️ Integration Setup Endpoints
- **Status:** No webhook handlers for Telegram, Discord, WhatsApp, Slack, Email
- **Missing:**
  - `POST /api/webhooks/telegram`
  - `POST /api/webhooks/discord`
  - `POST /api/webhooks/whatsapp`
  - `POST /api/webhooks/slack`
  - `POST /api/webhooks/email`
- **Severity:** MEDIUM (features, not core automation)

---

## Dependency Check

### Environment Variables Needed
Check your `.env.local` (or `.env` on VPS):

```bash
# Stripe (for webhook)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DigitalOcean (for provisioning)
DO_API_TOKEN=dop_v1_...

# Supabase (for data storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # For server-side operations

# Email (for notifications)
SENDGRID_API_KEY=SG.xxx  # Optional but needed for emails

# DO Callback Webhook Security
DO_CALLBACK_SECRET=random_string_123  # For HMAC validation
```

**Status:**
- ✅ Stripe keys: Likely configured (portal charges users)
- ✅ Supabase: Configured (auth works)
- ❓ DO API token: **Not verified in `.env`**
- ❓ Email: **Not verified**
- ❓ Webhook secrets: **Not verified**

---

## Recommendation: Priority 1 (Today/Tomorrow)

Build in this order (each unlocks the next):

### 1. Create Database Schema (30 min)
```sql
CREATE TABLE user_droplets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  droplet_id BIGINT UNIQUE NOT NULL,
  public_ip VARCHAR(15),
  private_ip VARCHAR(15),
  status VARCHAR(20) DEFAULT 'provisioning',
  pairing_token VARCHAR(256),
  tier VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  UNIQUE(user_id)
);
```

### 2. Create Droplet Provisioner (1-2 hours)
**File:** `lib/droplet-provisioner.ts`
- Takes: userId, tier
- Calls DO API to create droplet
- Returns: droplet_id, public_ip

### 3. Create User Data Script (30 min)
**File:** `lib/user-data-template.sh`
- Runs on new droplet's first boot
- Installs Docker
- Clones repo, builds images
- Starts containers
- Calls callback webhook

### 4. Create Stripe Webhook Handler (1 hour)
**File:** `pages/api/webhooks/stripe.ts`
- Listens for payment events
- Calls provisioner
- Handles errors

### 5. Create DO Callback Webhook (30 min)
**File:** `pages/api/webhooks/do-callback.ts`
- Receives callback from new droplet
- Updates Supabase status
- Sends email to user

### 6. Add Dashboard Integration (30 min)
Update dashboard to show:
- Droplet status (provisioning / ready)
- Public IP (when ready)
- "Open Agent" button

**Total Time:** ~4-5 hours  
**Result:** Fully automated signup → droplet provisioning

---

## Quick Status Table

| Component | Exists | Status | Location |
|-----------|--------|--------|----------|
| Portal Frontend | ✅ | LIVE | 64.23.142.154:3000 |
| Agent Service | ✅ | HEALTHY | 64.23.142.154:5000 |
| Command Center | ✅ | LIVE | 64.23.142.154:8000 |
| Docker Network | ✅ | laverdi-net | VPS |
| Stripe Integration | ✅ | PARTIAL (payments work) | pages/api/webhooks/stripe.ts |
| Droplet Provisioner | ❌ | MISSING | lib/droplet-provisioner.ts |
| User Data Script | ❌ | MISSING | lib/user-data-template.sh |
| DO Callback Webhook | ❌ | MISSING | pages/api/webhooks/do-callback.ts |
| Database Schema | ❌ | MISSING | Supabase |
| Dashboard Display | ⚠️ | PARTIAL | pages/dashboard/agent.tsx |
| Multi-Agent Support | ❌ | MISSING | Not planned yet |
| Integrations (Telegram, Discord, etc) | ❌ | MISSING | pages/api/webhooks/* |

---

## Blockers & Questions

1. **Portal source code:** Is the full Next.js portal source backed up in git, or only on the VPS?
2. **Stripe live keys:** Are you using test or live mode currently?
3. **DO API token:** Is it in `.env` on the VPS?
4. **Supabase:** What tables exist? (users, subscriptions, agents, droplets?)
5. **Email service:** Do you have SendGrid or similar configured?

---

## Next Steps

1. **Review this audit** — does it match your understanding?
2. **Confirm blockers** — answer the questions above
3. **Build Phase 1** — database schema + provisioner
4. **Test manually** — sign up, pay, watch droplet create
5. **Add Phase 2** — webhooks + dashboard integration
6. **Go live** — enable production mode

Would you like me to:
- [ ] Create the provisioner code (with template)?
- [ ] Create the webhook handlers (Stripe + DO callback)?
- [ ] Create the database migration?
- [ ] All of the above?

Let me know what's most urgent!
