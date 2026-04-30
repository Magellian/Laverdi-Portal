# Test & Deployment Guide - Laverdi Portal

**Status:** Ready for production testing  
**Date:** 2026-04-18  
**Portal URL:** http://64.23.142.154:3000

---

## Phase 1: Local Testing (Before VPS Deploy)

### 1.1 Build & Start Dev Server

```bash
cd C:\Users\chris\Desktop\workspace\src\laverdi-portal
npm run build
npm run dev
```

Expected: Port 3000 active, zero build errors

### 1.2 Test Core Features

**Landing Page (/):**
- [ ] Hero loads with Molty 2D animation
- [ ] Pricing cards visible (Free/Starter/Pro)
- [ ] "Start Trial" buttons clickable
- [ ] Responsive on mobile

**Signup Flow (/auth/signup):**
- [ ] Email + password input working
- [ ] Submit creates Supabase user
- [ ] Auto-redirect to dashboard
- [ ] User appears in Supabase `users` table

**Dashboard (/dashboard):**
- [ ] User authenticated (JWT works)
- [ ] Can navigate to sub-pages
- [ ] Billing/API keys/settings load

### 1.3 Test Pricing Model

**Free Tier:**
- [ ] GET `/api/models/available` returns only Haiku
- [ ] Monthly credits = 100
- [ ] Model cost: $0.00028 per 1M tokens (our markup)

**Starter Tier (Upgrade via Stripe):**
- [ ] GET `/api/models/available` returns Haiku + Sonnet + GPT-4o Mini + Gemini Flash
- [ ] Monthly credits = 1,000
- [ ] All 4 models selectable

**Pro Tier (Upgrade):**
- [ ] GET `/api/models/available` returns 10+ models
- [ ] Monthly credits = 5,000
- [ ] Anthropic + OpenAI + Google + open-source all available

Test via:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/models/available
```

### 1.4 Test Credit Calculation

**Test API Call Usage:**
```bash
POST /api/usage/stats
{
  "tokens": 1000,
  "model": "anthropic-haiku-4.5"
}

Expected response:
{
  "credits_used": 0.00028,  # (1000 * 0.00028) / 1,000,000
  "credits_remaining": 99.99972
}
```

### 1.5 Test Multi-Agent

**Create Agents:**
```bash
POST /api/agents/provision
{ "agentName": "Support Bot" }

POST /api/agents/provision
{ "agentName": "Data Analyzer" }

POST /api/agents/provision
{ "agentName": "Email Processor" }
```

Expected:
- [ ] All 3 agents provision successfully (Starter tier allows 3)
- [ ] Shared credit pool shown in GET `/api/agents`
- [ ] Usage from any agent counts toward shared limit

### 1.6 Test Integrations (Stubs)

**Integration endpoints should exist:**
- [ ] GET `/api/integrations` (empty list initially)
- [ ] POST `/api/integrations` (creates stub)
- [ ] GET `/api/integrations/:id/setup` (returns setup instructions)

---

## Phase 2: VPS Deployment

### 2.1 Pre-Deployment Checklist

**Environment Variables (.env.production):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = dcvrkpgvxqdcboostkpz.supabase.co
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = (service key)
- [ ] `STRIPE_SECRET_KEY` = sk_test_...
- [ ] `STRIPE_WEBHOOK_SECRET` = whsec_...
- [ ] `DIGITALOCEAN_API_KEY` = dop_v1_...
- [ ] `DO_GRADIENT_API_KEY` = sk-do-...
- [ ] `NEXT_PUBLIC_APP_URL` = https://laverdi.tech (or IP for now)

**Database Migrations:**
- [ ] Run `001_add_user_droplets.sql`
- [ ] Run `002_add_provider_keys.sql`
- [ ] Run `003_multi_agent_support.sql`
- [ ] Run `004_integrations_schema.sql`

**VPS Preparation:**
- [ ] SSH access working (root@64.23.142.154, sandygirl75)
- [ ] Docker installed and running
- [ ] Nginx ready for proxy
- [ ] SSL cert ready (Let's Encrypt)

### 2.2 Deploy to VPS

```bash
# 1. SSH into VPS
ssh root@64.23.142.154

# 2. Clone/update code
cd /root/laverdi-portal
git pull origin main  # Or extract tarball

# 3. Update .env.production
nano .env.production

# 4. Build Docker image
docker build -t laverdi-portal:latest .

# 5. Stop old container
docker stop laverdi-portal
docker rm laverdi-portal

# 6. Run new container
docker run -d \
  --name laverdi-portal \
  -p 3000:3000 \
  --env-file .env.production \
  laverdi-portal:latest

# 7. Verify running
docker ps
docker logs laverdi-portal
```

### 2.3 Post-Deployment Health Checks

```bash
# Check HTTP 200
curl -I http://64.23.142.154:3000
# Expected: HTTP/1.1 200 OK

# Check API endpoint
curl -s http://64.23.142.154:3000/api/health | jq .
# Expected: { "status": "ok" }

# Check Supabase connection
curl -s http://64.23.142.154:3000/api/models/available \
  -H "Authorization: Bearer <test-token>" | jq .
# Expected: models list + credits
```

### 2.4 SSL/HTTPS Setup

```bash
# 1. Get Let's Encrypt cert
certbot certonly --standalone \
  -d laverdi.tech \
  -d www.laverdi.tech

# 2. Update nginx config to proxy to :3000
# /etc/nginx/sites-available/laverdi.tech

server {
    listen 443 ssl http2;
    server_name laverdi.tech www.laverdi.tech;
    
    ssl_certificate /etc/letsencrypt/live/laverdi.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/laverdi.tech/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 3. Restart nginx
systemctl restart nginx
```

---

## Phase 3: End-to-End Testing

### 3.1 User Journey: Free → Starter

**Step 1: Signup (Free Tier)**
```
1. Visit https://laverdi.tech
2. Click "Start Trial"
3. Enter email + password
4. Verify email (Supabase sends link)
5. Login → Dashboard
6. Check: GET /api/models/available
   Expected: Only Haiku available, 100 credits
```

**Step 2: Provision First Agent**
```
1. Dashboard → /dashboard/agents
2. Click "New Agent"
3. Name: "Support Bot"
4. Wait 2-3 minutes for provisioning
5. Droplet should appear in DigitalOcean console
6. Agent status: "provisioning" → "active"
```

**Step 3: Upgrade to Starter**
```
1. Dashboard → /dashboard/billing
2. Click "Upgrade to Starter"
3. Stripe Checkout loads
4. Use test card: 4242 4242 4242 4242
5. Confirm payment
6. Webhook fires → Agent limit increases to 3
7. Check: GET /api/models/available
   Expected: Haiku + Sonnet + GPT-4o Mini + Gemini Flash, 1,000 credits
```

**Step 4: Provision 2 More Agents**
```
1. /dashboard/agents → "New Agent" x 2
2. Create "Data Analyzer" and "Email Processor"
3. All 3 should appear in dashboard
4. Verify: GET /api/agents
   Expected: 3 agents, 1,000 credit pool (SHARED)
```

**Step 5: Simulate API Call & Credit Usage**
```
1. Manually log usage via Supabase
INSERT INTO usage_logs (user_id, agent_id, model, token_count)
VALUES ('<user-id>', '<agent-id>', 'anthropic-haiku-4.5', 5000);

2. Check: GET /api/usage/stats
   Expected: 
   - credits_used: 0.0014 (5000 * 0.00028 / 1M)
   - credits_remaining: 999.9986
```

**Step 6: Test Multi-Agent Credit Sharing**
```
1. Log usage from Agent 2:
INSERT INTO usage_logs (user_id, agent_id, model, token_count)
VALUES ('<user-id>', '<agent2-id>', 'anthropic-sonnet-4.6', 10000);

2. Check: GET /api/usage/stats
   Expected:
   - credits_used: 0.0014 + (10000 * 0.00105 / 1M) = 0.01650
   - credits_remaining: 999.9835
   (All agents consumed from shared 1,000)
```

**Step 7: Test Credit Limit Enforcement**
```
1. Manually deplete credits to 10:
UPDATE usage_logs SET token_count = 3571428 
WHERE user_id = '<user-id>';
-- (3.571M tokens * $0.00028 = ~990 credits)

2. Try to make API call:
POST /api/call
{ "message": "test", "agentId": "<agent-id>" }

Expected:
HTTP 429
{
  "success": false,
  "error": "Monthly credit limit exceeded"
}
```

### 3.2 Integration Testing (Stubs)

**Telegram Integration (Stub)**
```bash
1. POST /api/integrations
{
  "agentId": "<agent-id>",
  "platform": "telegram",
  "config": {
    "botToken": "123456:ABC-DEF1234...",
    "chatId": "123456789"
  }
}

Expected: Integration created, status="inactive"

2. GET /api/integrations/:id/setup
Expected: Setup instructions + webhook URL
```

**Same for Discord, WhatsApp, Slack, Email**

### 3.3 Load Testing

```bash
# Install wrk
choco install wrk

# Test concurrent signups
wrk -t12 -c400 -d30s \
  -s signup.lua \
  https://laverdi.tech/auth/signup

# Test API endpoints
wrk -t12 -c100 -d60s \
  -H "Authorization: Bearer <token>" \
  https://laverdi.tech/api/models/available
```

---

## Phase 4: Production Monitoring

### 4.1 Set Up Logging

**Supabase Logs:**
```sql
-- View recent API calls
SELECT created_at, user_id, agent_id, model, token_count, error_message
FROM usage_logs
ORDER BY created_at DESC
LIMIT 100;

-- View recent errors
SELECT * FROM usage_logs
WHERE error_message IS NOT NULL
ORDER BY created_at DESC;
```

**Docker Logs:**
```bash
docker logs -f laverdi-portal
```

### 4.2 Set Up Alerts

**Cron Job: Daily Usage Report**
```bash
0 9 * * * /root/laverdi-portal/scripts/daily-report.sh
# Sends email with: new users, total credits used, errors
```

**Cron Job: Health Check**
```bash
*/5 * * * * curl -f https://laverdi.tech/api/health || systemctl restart laverdi-portal
# Restarts portal if health check fails
```

### 4.3 Monitor Costs

Track monthly:
- **DigitalOcean costs:**
  - Droplet fees ($6-18 per agent)
  - Gradient API usage (token-based)
- **Stripe processing fees** (2.9% + $0.30)
- **Revenue per tier**

Calculate margin:
```
Revenue = Sum(subscription fees) + Sum(credit markup revenue)
Costs = DO droplets + DO Gradient API + Stripe fees + VPS
Margin = Revenue - Costs
```

---

## Phase 5: Launch Timeline

### Friday 2026-04-18
- [x] Code review complete
- [x] Test plan written
- [ ] Local testing (1-2 hours)
- [ ] Deploy to VPS (30 min)
- [ ] Smoke tests (15 min)

### Saturday 2026-04-19
- [ ] End-to-end testing (2 hours)
- [ ] Load testing (30 min)
- [ ] Fix any issues
- [ ] Create launch announcement

### Sunday 2026-04-20
- [ ] Open to beta users
- [ ] Monitor closely (24/7)
- [ ] Support on standby

### Week of 2026-04-21
- [ ] Public launch
- [ ] Marketing push
- [ ] Monitor conversion rate

---

## Success Criteria

✅ **Functionality:**
- All tiers load models correctly
- Credit calculation accurate (within 0.001)
- Multi-agent sharing works
- Credit limits enforced
- Stripe payments flow

✅ **Performance:**
- Page load <3s
- API response <500ms
- 99.9% uptime
- Handle 100+ concurrent users

✅ **Business:**
- Conversion rate >5% (free → paid)
- Average revenue per user >$10/month
- Customer retention >80%

---

## Rollback Plan

If critical issues found:

```bash
# 1. Stop new container
docker stop laverdi-portal

# 2. Revert to previous version
docker run -d \
  --name laverdi-portal \
  -p 3000:3000 \
  --env-file .env.production \
  laverdi-portal:previous

# 3. Verify working
curl -I https://laverdi.tech

# 4. Debug issue locally
# (fix + re-test before re-deploy)
```

---

## Testing Checklist (Print & Check Off)

**Pre-Deploy:**
- [ ] Build succeeds (zero errors)
- [ ] All env vars set
- [ ] Migrations run on Supabase
- [ ] Stripe test keys configured
- [ ] DO Gradient API key working

**Post-Deploy:**
- [ ] HTTP 200 on homepage
- [ ] Signup creates user
- [ ] Free tier shows only Haiku
- [ ] Starter tier shows 4 models
- [ ] Pro tier shows 10+ models
- [ ] Agent provisioning works
- [ ] Credit calculation accurate
- [ ] Credit limit enforced
- [ ] SSL/HTTPS working

**Load Test:**
- [ ] 100 concurrent users
- [ ] API <500ms response
- [ ] No memory leaks

**Business:**
- [ ] Stripe webhook fires on upgrade
- [ ] Agent limits increase per tier
- [ ] Usage dashboard shows real data

---

## Contact on Launch Day

**Issues?** SSH into VPS and check logs:
```bash
ssh root@64.23.142.154
docker logs laverdi-portal
tail -100 /var/log/syslog
```

**Need to rollback?** See Rollback Plan above.

**Questions?** Check:
1. `/api/health` endpoint
2. Docker logs
3. Supabase dashboard
4. Stripe webhook logs
