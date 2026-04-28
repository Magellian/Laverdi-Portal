# CARRYOVER — LaVerdi Portal (2026-04-26 13:20 PDT)

## IMMEDIATE NEXT STEP: Test Full Signup Flow

Everything is deployed and ready. Just needs a live test.

**Test:** Sign up at https://laverdi.tech/auth/signup with a fresh email

**Expected flow:**
1. Supabase Auth creates account
2. Frontend calls `POST /api/auth/create-profile` → creates user with `starter` tier + 14-day trial
3. Welcome email fires via SendGrid HTTP API from `noreply@laverdi.tech`
4. Provisioning fires → calls Command Center at `http://laverdi-command-center:8000/api/provision-container`
5. Command Center creates Docker container (OpenClaw instance)
6. Instance record created in `instances` table → dashboard shows status
7. Dashboard displays: amber "Provisioning..." badge → green "Online" + IP/port + "Open Web Interface" link + workspace file browser

**Watch logs:** `ssh root@10.242.212.97 "docker logs laverdi-portal -f --tail 0"`
(ZeroTier IP is more reliable than public IP for SSH)

---

## What Was Fixed This Session

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Email timeout | SMTP port 587 blocked by DO | Rewrote to SendGrid HTTP API v3 |
| Sender not verified | No email receiving for laverdi.tech | Set up ImprovMX forwarding + SendGrid Single Sender verification |
| Command Center unreachable | Docker containers not on same network | Connected to `laverdi-net`, changed URL to Docker DNS |
| Dashboard missing instance status | `provision-async.ts` didn't write to `instances` table | Rewrote to create proper instance records |
| Container using stale code | Docker image baked-in, not using host edits | Recreated with bind mount `-v /root/laverdi-portal:/app` |
| SENDGRID_API_KEY empty | Key was in `.env.production` not `.env.local` | Copied key to `.env.local` |
| Provisioning self-call wrong port | `NEXT_PUBLIC_APP_URL=http://localhost:3001` | Changed to `https://laverdi.tech` |

---

## Infrastructure State

### VPS (64.23.142.154)
- **Portal:** Docker container `laverdi-portal`, port 3000, bind-mounted from `/root/laverdi-portal`
- **Command Center:** Docker container `laverdi-command-center`, port 8000, healthy
- **Nginx:** Host-level, proxying HTTPS → port 3000
- **Docker network:** `laverdi-net` (portal + command center connected)
- **OpenClaw image:** `laverdi-openclaw:latest` ready for provisioning
- **SSH:** Use ZeroTier IP `10.242.212.97` (more reliable than public IP)

### Key Files on VPS
- `/root/laverdi-portal/.env.local` — all env vars (SendGrid, Supabase, Stripe, VPS API)
- `/root/laverdi-portal/lib/email.ts` — SendGrid HTTP API (no SMTP)
- `/root/laverdi-portal/pages/api/agents/provision-async.ts` — creates instances records
- `/root/laverdi-portal/pages/api/auth/create-profile.ts` — signup profile creation
- `/root/laverdi-portal/pages/dashboard/index.tsx` — dashboard with instance status card

### Database (Supabase: dcvrkpgvxqdcboostkpz)
- **Status:** CLEAN — zero data in all tables
- **RLS:** Disabled on `users` table (temporary — re-enable before production)
- **Instances schema:** `id, user_id, container_id (NOT NULL), model_id (NOT NULL), ip_address, port (NOT NULL), status, created_at, updated_at`

### Email
- **Provider:** SendGrid HTTP API v3
- **From:** `noreply@laverdi.tech` (verified Single Sender)
- **Forwarding:** ImprovMX catch-all → `chrislaverdiere@gmail.com`
- **DNS:** MX records (ImprovMX), SPF (Gandi + ImprovMX + SendGrid), DMARC configured

---

## Known Issues / Warnings

1. **RLS disabled** on `users` table — re-enable with proper policies before real users
2. **PowerShell escaping** — JSON in SSH commands gets mangled. Always use file-based approach (write .js/.json locally, SCP, execute)
3. **SSH flaky** — DO shared droplet, use ZeroTier IP when possible
4. **Node.js 18 deprecation** — Supabase warns about it, upgrade container base image eventually
5. **`VPS_ADMIN_TOKEN=change-me-in-production`** — still using default token, change before production

---

## After Successful Test

1. Verify email arrives in inbox (not spam)
2. Verify dashboard shows instance with correct status
3. Verify OpenClaw container is running (`docker ps | grep openclaw`)
4. Test accessing the OpenClaw instance via the dashboard link
5. Then move on to: Stripe payment flow, proper RLS policies, production hardening
