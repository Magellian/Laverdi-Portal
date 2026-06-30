# Hermes Portal — Build Tasks

## Project Context

**LaVerdi.tech** (Hermes Portal) is a SaaS platform for managed Hermes AI agent hosting. Users subscribe via Stripe, get a Hermes agent instance provisioned automatically, and connect it to Telegram/Discord/Slack.

### Current Architecture
- **VPS:** 108.61.195.97 (Vultr Seattle, Ubuntu 24.04)
- **Domain:** laverdi.tech
- **Stack:** Next.js 15 (TypeScript, App Router, Tailwind), NextAuth v5, Prisma ORM, self-hosted Postgres 16
- **Docker:** App on port 3001, Postgres on 5432, nginx proxies :443 to :3001
- **Auth:** NextAuth v5 with PrismaAdapter, magic link email login
- **Billing:** Stripe checkout, webhook creates subscription + auto-provisions first agent
- **Provisioner:** Python HTTP service on port 9090 (systemd), allocates ports 9000-9999
- **Inference:** Vultr Serverless Inference API
- **Telegram:** Working, first agent live and responding

### Tier and Model Mapping
| Tier | Price | Model |
|------|-------|-------|
| Starter | $19/mo | deepseek-ai/DeepSeek-V4-Flash |
| Pro | $49/mo | moonshotai/Kimi-K2.6 |
| Enterprise | $199/mo | zai-org/GLM-5.1-FP8 |

### Stripe Price IDs
- Starter: price_1TeTlyPgT412N4dj2Uv4ue41
- Pro: price_1TeTtKPgT412N4dj0CHQfbrs
- Enterprise: price_1TeTtfPgT412N4djm9Quvt69

---

## TASKS (in order)

### Task 1: Login Button on Landing Page

The landing page (app/page.tsx) has no visible Log In button for returning subscribers. Fix this:

1. Add a Log In button to the landing page navbar/header (top-right area)
2. It should link to /login (the login page already exists at app/login/page.tsx)
3. Style it to match the existing landing page design (dark theme, consistent with CTAs)
4. If user is already authenticated, show Dashboard link instead of Log In

### Task 2: Multi-Tenant Customer Scaling

The provisioner works for one customer. Scale it for N customers:

1. Review the existing provisioner (scripts/provisioner.py, lib/provisioning/engine.ts) and Prisma schema
2. Ensure Instance model tracks: port, apiKey, tier, status per customer
3. Add tier-based instance limits: Starter=1, Pro=5, Enterprise=20
4. Dashboard Agents page (app/dashboard/agents/page.tsx) should show real instance data from DB
5. Deploy New Agent button should respect tier limits
6. Delete Agent should clean up the instance
7. Each customer brings their own Telegram bot token via the Channels page

### Task 3: Verify and Fix Telegram E2E Flow

Confirm this flow works end-to-end:
1. User signs up via Stripe checkout
2. Webhook fires, subscription created, provisioner called
3. Hermes instance spun up with correct model for tier
4. User logs into dashboard, sees their agent
5. User enters Telegram bot token on Channels page
6. Bot token saved, Hermes instance configured
7. User messages Telegram bot, gets AI responses

Fix anything that is broken. Document what works and what does not.

---

## Key Constraints
- NextAuth v5 is configured with trustHost: true for nginx proxy. Do not break this.
- Do NOT touch docker-compose.yml or Dockerfile unless necessary
- Commit after each task with a clear message
- The provisioner runs as a separate systemd service, not in Docker
