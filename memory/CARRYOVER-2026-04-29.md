# Carryover: Laverdi Portal - 2026-04-29 Mega Session

**Date:** Tuesday April 28 → Wednesday April 29, 2026
**Status:** ✅ Production ready — full payment → provisioning → agent flow working

---

## Infrastructure

- **VPS:** 64.23.253.97 (laverdi-prod-001, DigitalOcean SFO3)
- **Portal:** https://laverdi.tech (Docker: laverdi-portal, port 3000)
- **Command Center:** laverdi-command-center, port 8000
- **Supabase:** dcvrkpgvxqdcboostkpz.supabase.co
- **Stripe:** Test mode (webhook: https://laverdi.tech/api/stripe/webhook)
- **OpenClaw image:** laverdi-openclaw:latest (Node 22, no npm/update commands)
- **Dockerfile source:** /root/laverdi-openclaw/ on VPS

## Running Containers

| Container | Port | User | Status |
|-----------|------|------|--------|
| openclaw-0ee506e0-1777404496620 | 9004 | chrislaverdiere@gmail.com (pro) | ✅ healthy |
| openclaw-854c5e17-1777410761991 | 9009 | test user | ✅ healthy |
| openclaw-0110f9dd-1777340574072 | 9002 | olivelaverdiere@gmail.com | ✅ healthy |

## Admin Access

- **Admin panel:** https://laverdi.tech/admin
- **Admin password:** laverdi-admin-api-2026 (same as ADMIN_UPGRADE_TOKEN — verified via /api/admin/clients)
- **Status page:** https://laverdi.tech/status

## Tier System

| Tier | Model | Anthropic Key | RAM | CPU |
|------|-------|---------------|-----|-----|
| do-only | Llama 3.3 (DO only) | ❌ None | 768MB | 0.5 |
| trial/free | Haiku | ✅ | 768MB | 0.5 |
| starter | Sonnet | ✅ | 1GB | 0.75 |
| professional | Opus | ✅ | 2GB | 1.5 |

## What Was Built This Session

### Payment Flow Fixes
- Fixed Stripe redirect → localhost (duplicate NEXT_PUBLIC_APP_URL in .env.local)
- Fixed webhook body parsing (bodyParser: false + stream buffering)
- Fixed command center URL (127.0.0.1 → laverdi-command-center hostname)
- Fixed duplicate subscription upsert on webhook retry
- Fixed plan metadata missing from checkout session
- Fixed confirm-upgrade race condition (creates user if webhook hasn't fired yet)
- Fixed double container provisioning (confirm-upgrade no longer provisions)
- Fixed customer.subscription.updated crash (null timestamp guard)
- Fixed duplicate container guard (checks provisioning + ready status)
- Fixed gateway token mismatch (synced DB api_key to actual container config)
- Fixed container config isolation (per-container data dirs, not per-user)
- Fixed upgrade-tier path resolution (uses volume mount inspection)
- Removed invalid "network" key from openclaw.json config (was crashing all containers)

### New Features
- **Stripe Customer Portal** — Billing button on dashboard opens Stripe hosted portal
  - Config ID: bpc_1TRRHHBTYRav1HpscIgKAKmq
- **Enterprise modal** — Contact Sales button opens slide-up form, emails chrislaverdiere@gmail.com
- **Admin dashboard** — https://laverdi.tech/admin (tier override, billing toggle, trial freeze)
- **Admin audit log** — All admin actions logged to audit_logs table, viewable in admin panel
- **Onboarding flow** — 3-step welcome wizard for new users (WelcomeLanding component)
- **Status page** — https://laverdi.tech/status (live portal/DB/instance health)
- **do-only tier** — Llama 3.3 only, no Anthropic key, unlimited, for controlled trials
- **Rate limiting** — checkout (5/10min), forgot-password (3/15min), enterprise (3/hr), portal (10/5min)

### Infrastructure
- **VPS backups:** Daily tarballs at 3AM → /var/backups/laverdi/ (7-day rotation)
- **DO snapshots:** Weekly automated snapshots enabled via API
- **Trial cron:** Nightly 2AM → /api/cron/disable-expired-trials
- **Container resource limits:** Applied by tier (docker update + new containers)
- **OpenClaw image lockdown:** npm/npx removed, `openclaw update` intercepted with friendly message
- **Command center:** Per-container data dirs, upgrade-tier uses volume mount inspection

### DB Migrations Needed (run in Supabase SQL editor if not done)
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_frozen BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_email TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  notes TEXT
);
```

## Known Issues / Next Session

- Usage tracking not wired up — containers don't report token usage to Supabase (needs webhook/callback from OpenClaw gateway → portal)
- Trial expiry cron just marks DB — doesn't stop containers yet (deferred until real churn data)
- `openclaw update` wrapper is in the new image but existing containers use old image — will take effect on next reprovisioning
- Manage Plan page had React hook order bug (fixed) — subscription.tsx showEnterprise useState was inside conditional

## Key Files on VPS

- Portal: /root/laverdi-portal/
- Command center: /root/laverdi-command-center/app.py
- OpenClaw Dockerfile: /root/laverdi-openclaw/
- User data: /var/lib/laverdi/users/{user_id}/
- Backups: /var/backups/laverdi/
- Cron log: /var/log/laverdi-cron.log
- Backup log: /var/log/laverdi-backup.log
- Nginx config: /etc/nginx/sites-available/laverdi.conf

## Crontab (root@64.23.253.97)
```
0 2 * * * curl -s 'http://localhost:3000/api/cron/disable-expired-trials?token=laverdi-cron-secret-change-me' >> /var/log/laverdi-cron.log 2>&1
0 3 * * * /usr/local/bin/laverdi-backup.sh
```
