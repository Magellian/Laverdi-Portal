# Friday Morning Pre-Deployment Checklist (2026-04-17, 09:45 AM PST)

**Deployment Window:** 10:00 AM - 10:15 AM PST  
**Decision Time:** 09:45 AM (15 minutes before launch)  
**Status Check Time:** 10:15 AM (immediately after)  
**Monitoring Period:** 10:15 AM - 12:00 PM (2 hours)  

---

## Pre-Deployment Tasks (09:00 AM - 09:45 AM)

### ☐ 1. Final Code Review (5 min)
- [ ] Pull latest code from git: `git pull origin main`
- [ ] Verify no unexpected changes: `git log -1 --oneline`
- [ ] Check .env.production has all 6 credentials
- [ ] Confirm no secrets are committed: `git log --all --grep="secret\|key\|password" --oneline`

**Expected Result:** Clean working directory, latest code pulled

---

### ☐ 2. VPS Connectivity Check (5 min)
- [ ] SSH to VPS: `ssh -i "key.pem" root@64.23.142.154`
- [ ] Check disk space: `df -h` (need >500MB free in /root)
- [ ] Check Docker status: `docker ps` (should list existing containers or be empty)
- [ ] Verify nginx: `nginx -t` (should say "syntax is ok")
- [ ] Exit and document IP: "VPS is ONLINE and READY"

**Expected Result:** SSH works, Docker/nginx healthy, >500MB free space

---

### ☐ 3. Supabase Pre-Flight (5 min)
- [ ] Open https://app.supabase.com/project/dcvrkpgvxqdcboostkpz
- [ ] Check database: Click on "SQL" tab
- [ ] Verify 4 tables exist: users, subscriptions, api_keys, usage_logs
- [ ] Verify RLS is enabled on all 4 tables (should see "🔒 Row Level Security" badge)
- [ ] Check at least one RLS policy: Click on one table → "RLS Policies" → should see policies listed

**Expected Result:** All tables present, RLS enabled, at least 11 policies visible

---

### ☐ 4. Stripe Pre-Flight (5 min)
- [ ] Open https://dashboard.stripe.com/test/dashboard
- [ ] Go to "Settings" → "API Keys"
- [ ] Verify test keys visible (pk_test_... and sk_test_...)
- [ ] Go to "Webhooks" → Verify endpoint exists for laverdi.tech
- [ ] Check webhook status: Should show recent successful deliveries

**Expected Result:** Stripe keys visible, webhook endpoint active

---

### ☐ 5. Local Dev Server Health (5 min)
- [ ] Terminal: `cd C:\Users\chris\Desktop\workspace\src\laverdi-portal`
- [ ] Run: `npm run dev`
- [ ] Wait for "ready - started server on 0.0.0.0:3001"
- [ ] Browser: Open http://localhost:3001
- [ ] Verify landing page loads with Molty visible
- [ ] Click "Sign Up" (don't submit)
- [ ] Kill dev server: `Ctrl+C`

**Expected Result:** Dev server starts clean, landing page loads, signup form visible

---

### ☐ 6. Docker Build Verification (10 min)
- [ ] Terminal in portal directory: `docker-compose build --no-cache 2>&1 | tail -20`
- [ ] Wait for build to complete
- [ ] Should end with: "Successfully tagged laverdi-portal:latest"
- [ ] If errors: Review and fix before 10 AM
- [ ] **DO NOT START CONTAINERS YET** (test will do that)

**Expected Result:** Docker build succeeds with 0 errors

---

### ☐ 7. Final Documentation Check (5 min)
- [ ] Verify these files exist:
  - [ ] LAVERDI_VPS_DEPLOYMENT_SCRIPT.md
  - [ ] FRIDAY_MORNING_CHECKLIST.md (this file)
  - [ ] ROLLBACK.sh (in portal directory)
  - [ ] health-check.sh (in portal directory)
  - [ ] OVERNIGHT_STATUS_2026-04-16.md
  - [ ] CRAWFORD_OVERNIGHT_WORK.md

**Expected Result:** All deployment docs ready

---

## GO / NO-GO DECISION (09:45 AM)

### ✅ PROCEED TO DEPLOYMENT IF:
- [x] All items above are checked ✓
- [x] No unexpected errors found
- [x] VPS is online and accessible
- [x] All credentials verified in Supabase, Stripe, .env
- [x] Docker builds successfully
- [x] Dev server works locally

### ❌ PAUSE / DELAY IF:
- [ ] Any checklist item fails
- [ ] VPS is unreachable
- [ ] Docker build has errors
- [ ] Any credentials missing or invalid
- [ ] Unexpected code changes found

---

## DEPLOYMENT SEQUENCE (10:00 AM)

### Step 1: SSH to VPS (1 min)
```bash
ssh -i "key.pem" root@64.23.142.154
cd /root/laverdi-portal
```
**Expected:** Connected to VPS, in portal directory

### Step 2: Pull Latest Code (1 min)
```bash
git pull origin main
```
**Expected:** Latest code pulled (or "Already up to date")

### Step 3: Stop Current Services (1 min)
```bash
docker-compose down
```
**Expected:** Any running containers stop (or "no such service")

### Step 4: Build Docker Image (3-5 min)
```bash
docker-compose build --no-cache
```
**Expected:** Build completes with "Successfully tagged laverdi-portal:latest"

### Step 5: Start Services (2 min)
```bash
docker-compose up -d
docker-compose ps
```
**Expected:** Both "laverdi-portal" and "laverdi-nginx" show "Up" status

### Step 6: Wait for Startup (2 min)
```bash
sleep 30
docker-compose logs laverdi-portal | tail -20
```
**Expected:** See "ready - started server on 0.0.0.0:3000"

**Total Deployment Time:** ~12-15 minutes

---

## IMMEDIATE POST-DEPLOYMENT CHECKS (10:15 AM)

### ☐ Check 1: Health Script (2 min)
```bash
cd /root/laverdi-portal
./health-check.sh
```
**Expected:** "✓ HEALTH CHECK PASSED"

### ☐ Check 2: Browser Test — HTTP (2 min)
- Open http://laverdi.tech (should redirect to https)
- Should see landing page with Molty

**Expected:** Landing page loads, no errors

### ☐ Check 3: Browser Test — HTTPS (2 min)
- Open https://laverdi.tech (with SSL)
- Should see same landing page
- Check DevTools (F12) → Console for errors

**Expected:** No 404s, no "insecure connection" warnings, no console errors

### ☐ Check 4: Signup Test (3 min)
- Click "Sign Up"
- Fill in: email=`testuser-$(date +%s)@laverdi.tech`, password=`TestPass123!`
- Click "Sign Up"
- Should redirect to dashboard

**Expected:** Redirects to dashboard (may show empty state if email verification needed)

### ☐ Check 5: Dashboard Inspection (2 min)
- In dashboard, check DevTools (F12) → Application → Cookies
- Should see cookie starting with `sb-*-auth-token`
- Should be marked "HttpOnly" and "Secure"
- Check Console tab: Should have 0 errors

**Expected:** Auth cookie present, secure, no console errors

### ☐ Check 6: Molty Visual Inspection (2 min)
- Go back to landing page
- Observe Molty character
- [ ] Molty is visible
- [ ] Molty has stumpy legs (not long)
- [ ] Molty's arms have no claw triangles
- [ ] Molty's proportions look right

**Expected:** All visual checks pass

### ☐ Check 7: Monitor Logs (2 min)
```bash
docker-compose logs -f laverdi-portal | grep -i error
```
(Let it run for ~30 seconds, then Ctrl+C)

**Expected:** No error lines (or only startup warnings that are normal)

---

## MONITORING PERIOD (10:15 AM - 12:00 PM)

### Every 10 minutes:
- [ ] Check CPU/Memory: `docker stats --no-stream`
  - Expected: CPU < 30%, Memory < 300MB
- [ ] Check logs: `docker-compose logs --tail=20 laverdi-portal`
  - Expected: No new errors

### Every 30 minutes:
- [ ] Test signup again with new email
  - Expected: User created successfully
- [ ] Check Supabase: users table should have new record
  - Expected: New rows appear in real-time

### If Any Error Occurs:
1. Document the error (screenshot, logs)
2. Check logs: `docker-compose logs laverdi-portal | grep -A5 error`
3. Decide: Fix or Rollback
   - **Minor:** Fix and redeploy
   - **Critical:** Execute ROLLBACK.sh

---

## SUCCESS CRITERIA (After 2-Hour Monitoring)

✅ Zero critical errors in logs  
✅ Zero 5xx HTTP errors  
✅ All user signup tests succeeded  
✅ Molty renders without issues  
✅ HTTPS certificate is valid  
✅ CPU usage stable < 30%  
✅ Memory usage stable < 300MB  
✅ Cookies properly set (HttpOnly, Secure)  
✅ Database queries working  
✅ Stripe integration ready  

---

## ROLLBACK DECISION TREE

```
Is there a critical issue?
├─ YES, site is down → Execute ROLLBACK.sh immediately
├─ YES, auth is broken → Execute ROLLBACK.sh immediately
├─ YES, database errors → Execute ROLLBACK.sh immediately
└─ NO, all systems working? → LAUNCH SUCCESSFUL ✅
    └─ Minor cosmetic issue? → Monitor and fix in v1.1
```

---

## AFTER GO-LIVE (12:00 PM)

- [ ] Announce on social media
- [ ] Send launch email to beta testers
- [ ] Post link: https://laverdi.tech
- [ ] Continue monitoring for 24 hours (daily checks)
- [ ] Schedule post-launch review for Monday

---

## Emergency Contacts

**If issues arise:**
- SSH to VPS: `ssh root@64.23.142.154`
- Quick fix: `docker-compose restart laverdi-portal`
- Rollback: `./ROLLBACK.sh`
- Full debug: `docker-compose logs -f`

---

## Timeline Summary

| Time | Task | Status |
|------|------|--------|
| 09:00 | Begin checks | ☐ |
| 09:45 | GO/NO-GO decision | ☐ |
| 10:00 | Start deployment | ☐ |
| 10:15 | Post-deployment checks | ☐ |
| 10:20 | Health script | ☐ |
| 10:25 | Browser tests | ☐ |
| 10:45 | Monitoring starts | ☐ |
| 11:00 | Check #2 | ☐ |
| 11:30 | Check #3 | ☐ |
| 12:00 | Launch confirmed | ☐ |

---

**Document Status:** Ready  
**Last Updated:** 2026-04-16 22:15 PST  
**Deployment Window:** Friday 10:00 AM - 12:00 PM PST  

Good luck Friday morning! 🚀
