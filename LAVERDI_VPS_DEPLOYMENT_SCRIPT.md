# Laverdi Portal VPS Deployment — Friday 10 AM

**Status:** Ready for deployment  
**Target:** DigitalOcean VPS (64.23.142.154)  
**Domain:** laverdi.tech  
**Timeline:** Friday 2026-04-17, 10:00 AM PST  

---

## Pre-Deployment Checklist (2026-04-16 Night)

✅ **Code:** All 23 files refactored for PKCE flow  
✅ **Auth:** Middleware + secure cookies configured  
✅ **Database:** RLS policies updated (11 new, explicit TO authenticated)  
✅ **Character:** Molty geometry + animations finalized  
✅ **Testing:** Full integration test passed (localhost:3001)  
✅ **Credentials:** Stripe keys + Supabase keys ready  
✅ **Build:** Next.js prod build verified (0 errors)  

---

## Deployment Steps (Friday 10 AM)

### Step 1: VPS SSH Connection
```bash
ssh -i "path/to/key" root@64.23.142.154
```

### Step 2: Navigate to Portal Directory
```bash
cd /root/laverdi-portal
```

### Step 3: Pull Latest Code
```bash
git pull origin main
# Or if no git: copy files manually via scp
```

### Step 4: Update Environment
- Verify `.env.production` has all credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

### Step 5: Docker Build & Deploy
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Step 6: Verify Services
```bash
docker-compose ps
# Expected output:
# laverdi-portal     running
# laverdi-nginx      running
```

### Step 7: Test HTTP Endpoint
```bash
curl http://localhost:3000
# Should return HTML (landing page)
```

### Step 8: Test HTTPS (via nginx)
```bash
curl https://laverdi.tech
# Should redirect from http → https
```

### Step 9: Monitor Logs
```bash
docker-compose logs -f laverdi-portal
# Watch for errors during first requests
```

### Step 10: Run Health Check
```bash
# Test signup endpoint
curl -X POST https://laverdi.tech/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@laverdi.tech","password":"TestPassword123!"}'
```

---

## Post-Deployment (First 2 Hours)

### Health Monitoring
- Monitor logs for errors: `docker-compose logs -f`
- Check CPU/RAM usage (should be < 30% during normal load)
- Verify database connections (Supabase should be healthy)

### Quick Browser Tests
1. Open https://laverdi.tech
2. Click "Sign Up"
3. Create test account
4. Verify dashboard loads
5. Check DevTools (F12) for cookies (should have `sb-*-auth-token`)
6. Verify Molty renders with stumpy legs
7. Zoom test (mouse wheel) — Molty should auto-correct orientation

### Error Scenarios

**If signup fails:**
- Check `.env` Supabase credentials
- Verify RLS policies exist: `docker exec laverdi-portal npm run check-rls.sql`
- Check logs: `docker-compose logs laverdi-portal`

**If Molty doesn't render:**
- Check browser console (F12): Look for Three.js errors
- Verify WebGL is enabled in browser
- Check if it's a CORS issue in Network tab

**If HTTPS fails:**
- Verify SSL certificate is valid: `docker exec laverdi-nginx nginx -t`
- Check nginx config: `docker exec laverdi-nginx cat /etc/nginx/nginx.conf`

---

## Rollback Plan (If Issues)

### Option A: Immediate Rollback (Same VPS)
```bash
cd /root/laverdi-portal
git checkout previous-commit-hash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Option B: Full VPS Rollback (Snapshot)
- DigitalOcean has snapshots from before deployment
- Contact support to restore to previous snapshot
- Takes ~5 minutes

### Option C: Temporary DNS Reroute
- Point laverdi.tech DNS to old IP (if old server still running)
- Gives time to debug without downtime

---

## Success Criteria (Morning After)

✅ Site accessible via https://laverdi.tech  
✅ Signup/login works (users created in Supabase)  
✅ Dashboard loads with user profile  
✅ Molty renders without errors  
✅ No critical errors in logs  
✅ Response times < 500ms  
✅ HTTPS certificate valid  
✅ Cookies present in DevTools  

---

## Files Ready for Deployment

**In VPS Directory:**
- `docker-compose.yml` — Service orchestration
- `Dockerfile` — Next.js app container
- `nginx.conf` — Reverse proxy + SSL
- `.env.production` — All credentials (READY)
- `pages/`, `lib/`, `components/` — All refactored code

**In Docker:**
- Node 18-alpine base image
- Next.js 14.2.35 optimized build
- ~500MB final image size

---

## Monitoring After Go-Live

### Daily Checks
- Log file size (rotate if > 100MB)
- Database query performance (check slow query logs)
- Stripe webhook delivery status
- Error rate (should be < 0.1%)

### Weekly Checks
- Security updates (npm audit)
- SSL certificate expiration (90 days)
- Disk space usage (should be < 70%)
- Backup status (Supabase auto-backups)

---

## Communication

**Chris's Team:**
- Announce on social: "Laverdi Portal is LIVE!"
- Share landing page: https://laverdi.tech
- Invite beta testers to sign up

**Monitoring Channel:**
- Slack/Discord: #laverdi-portal-status
- 2-hour observation window (10 AM - 12 PM Friday)
- Report any issues immediately

---

**Deployment Window:** Friday 2026-04-17, 10:00 AM PST  
**Expected Duration:** 15-20 minutes  
**Rollback Available:** Yes (within 1 hour)  
**Go/No-Go Decision:** 9:45 AM Friday  
