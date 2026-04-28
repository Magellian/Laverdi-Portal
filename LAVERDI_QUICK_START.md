# LAVERDI PORTAL v1 - QUICK START GUIDE
## For Teams Running Tests & Deployment

**Use this guide when:**
- Starting Phase 3 testing
- Deploying to production
- Troubleshooting deployment issues
- Rolling back if needed

---

## 🟢 PHASE 3: LOCAL TESTING (45 min)

### Prerequisites
- Node.js 18+, Docker installed
- Access to C:\Users\chris\Desktop\workspace\src\laverdi-portal
- Fresh Supabase anon key (from Chris)

### Quick Test (5 min)
```bash
cd C:\Users\chris\Desktop\workspace\src\laverdi-portal

# Update env with fresh key
nano .env.production  # Replace NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build
npm run build

# Should finish with "✓ ready - started server on 0.0.0.0:3000"
```

### Start Dev Server
```bash
npm run dev

# Visit http://localhost:3000
# Should see landing page with Molty animation
```

### Run 5 Test Scenarios (15 min each)

#### Scenario 1: Sign Up & Free Tier
```
1. Click "Sign Up"
2. Enter: email@test.com / password123
3. Should redirect to dashboard
4. Verify:
   - TrialBanner shows "Free plan — Upgrade to continue"
   - Usage shows "0 / 100 calls used"
   - Banner dismissible (click X)
✅ Pass if: Dashboard loads, banner appears, dismissible works
```

#### Scenario 2: Rate Limiting
```
1. Create API key in dashboard
2. Make test API calls:
   for i in {1..105}; do
     curl -X POST http://localhost:3000/api/admin/api-keys \
       -H "Authorization: Bearer <token>" \
       -d '{"user_id": "<id>", "name": "test"}'
   done
3. Verify:
   - Calls 1-100: succeed
   - Calls 101-105: return 429 "Monthly call limit exceeded"
   - X-RateLimit-Remaining header present
✅ Pass if: Call 101 returns 429
```

#### Scenario 3: Dashboard Warnings
```
1. In Supabase, manually set user.monthly_call_limit = 10
2. Make 7 API calls (70%)
3. Dashboard shows yellow warning
4. Make 9 calls total (90%)
5. Dashboard shows red warning
✅ Pass if: Both warnings appear at correct thresholds
```

#### Scenario 4: Database Schema
```
1. Go to Supabase SQL Editor
2. Run:
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'users'
   ORDER BY column_name;
3. Verify columns exist:
   - trial_expires_at
   - monthly_call_limit
   - tier (with CHECK constraint)
✅ Pass if: All 3 columns present
```

#### Scenario 5: Email Stubs
```
1. In npm run dev terminal, look for:
   [EMAIL STUB] sendTrialReminderEmail → ...
2. Make a test call (should trigger logging)
✅ Pass if: Stub logs appear in terminal
```

### All Scenarios Passed?
```bash
# Build production version
npm run build

# Check for errors
npm run type-check

# Ready for Docker
```

---

## 🔴 PHASE 4: PRODUCTION DEPLOYMENT (1 hour)

### SSH to VPS
```bash
ssh root@64.23.142.154
cd /opt/laverdi-portal
```

### Backup & Update
```bash
# Backup current state
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest code
git pull origin main

# Update .env if needed
nano .env.production  # Update NEXT_PUBLIC_SUPABASE_ANON_KEY if needed

# Verify env
grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.production
```

### Run Migration
```bash
# Option A: Via npm
npm install
npm run db:migration

# Option B: Via Supabase SQL Editor
# (Copy migrations/003_add_free_trial_columns.sql, paste in SQL editor, run)

# Verify
psql -U postgres -d postgres -h dcvrkpgvxqdcboostkpz.supabase.co \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='users';"
```

### Rebuild & Restart
```bash
# Stop current
docker-compose down

# Build
docker-compose build

# Start
docker-compose up -d

# Wait
sleep 10

# Verify
docker-compose ps
# Should show: laverdi-portal (Up), laverdi-nginx (Up)

# Check logs
docker logs laverdi-portal | tail -20
docker logs laverdi-nginx | tail -20
```

### Smoke Test
```bash
# Landing page
curl -s https://laverdi.tech | head -20

# API endpoint (should return 401)
curl -X POST https://laverdi.tech/api/admin/api-keys \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "name": "test"}'

# Should see: {"error": "Unauthorized"}
```

### ✅ Deployed Successfully?
- [ ] Both containers running
- [ ] No errors in docker logs
- [ ] Landing page loads (200 OK)
- [ ] API returns 401 (not 500)

---

## 🚀 PHASE 5: LAUNCH (15 min before)

### Final Pre-Launch Checks
```bash
# From VPS
docker-compose ps  # Both Up?
curl https://laverdi.tech | grep "Molty"  # Page loads?

# From local machine
curl https://laverdi.tech | head -5  # Works from internet?
```

### Test Account
```
Email: test@laverdi.tech
Password: GeneratedAtSignup
Tier: free (default)
Calls: 100/month
```

### Create Test Account
1. Go to https://laverdi.tech
2. Click "Sign Up"
3. Create account with test email
4. Verify dashboard loads
5. Create API key
6. Test rate limit (make 101 calls, verify 429 on call 101)

### Announce
- [ ] Email users: "Free trial tier now live!"
- [ ] Social: "Laverdi Portal v1 launches today"
- [ ] Team: "Monitor logs for first 2 hours"

### Go Live
- [ ] Point laverdi.tech domain to 64.23.142.154 (if not already)
- [ ] Start monitoring logs:
  ```bash
  docker logs -f laverdi-portal
  ```
- [ ] Be ready for issues (first 2 hours)

---

## 🚨 TROUBLESHOOTING

### Problem: "Invalid API key" error
**Symptom:** HTTP 486, "Invalid API key"
**Cause:** Supabase anon key is stale
**Fix:**
```bash
# Get fresh key from Supabase dashboard
# Update .env.production
# Restart containers: docker-compose restart laverdi-portal
```

### Problem: "Unauthorized" on all endpoints
**Symptom:** HTTP 401 on authenticated endpoints
**Cause:** JWT token validation failing
**Check:** Are authentication headers correct?
```bash
# Test with curl
curl -H "Authorization: Bearer <token>" https://laverdi.tech/api/admin/api-keys
# Should not return 401 if token is valid
```

### Problem: Rate limit always returns 429
**Symptom:** All API calls return 429, even first one
**Cause:** DB query failing, middleware failing open incorrectly
**Check:**
```bash
docker logs laverdi-portal | grep "rate-limit"
# Look for error messages
```
**Fix:**
```bash
# Restart containers
docker-compose restart laverdi-portal

# Check Supabase connection
# Verify new columns exist: trial_expires_at, monthly_call_limit
```

### Problem: Docker build fails
**Symptom:** "docker-compose build" fails
**Cause:** Dependency issue or code error
**Check:**
```bash
# Rebuild with more verbosity
docker-compose build --no-cache

# Check npm dependencies
npm install

# Run type check locally
npm run type-check
```

### Problem: No logs in container
**Symptom:** docker logs shows nothing
**Cause:** Container not running or crashed
**Check:**
```bash
docker-compose ps
# If status is "Exited", container crashed

# See what went wrong
docker logs laverdi-portal --tail=100

# Restart
docker-compose restart laverdi-portal
```

---

## 🔄 ROLLBACK (If Needed)

### Quick Rollback
```bash
# SSH to VPS
ssh root@64.23.142.154
cd /opt/laverdi-portal

# Revert code
git revert HEAD
git push origin main

# Rebuild
docker-compose down
docker-compose up -d --build

# Verify
curl https://laverdi.tech
```

### Database Rollback
```bash
# Go to Supabase → Settings → Backups → Restore
# (Takes 5-10 minutes, contact support if needed)

# Or manually undo migration:
# DROP COLUMN trial_expires_at, monthly_call_limit FROM users;
# DROP COLUMN call_count FROM usage_logs;
```

---

## 📋 DEPLOYMENT CHECKLIST

Use this before deploying:

**Pre-Deployment (30 min before)**
- [ ] All Phase 3 tests passed
- [ ] Fresh Supabase key obtained
- [ ] .env.production updated
- [ ] Code committed to git
- [ ] No uncommitted changes

**Deployment (During)**
- [ ] Migration runs without errors
- [ ] docker-compose up succeeds
- [ ] Both containers running
- [ ] No errors in docker logs
- [ ] Landing page loads (200 OK)
- [ ] API returns 401 not 500

**Post-Deployment (After)**
- [ ] Create test account
- [ ] Verify free tier (100 calls)
- [ ] Test rate limit (call 101 = 429)
- [ ] Monitor logs (no error spikes)
- [ ] Announce to users

---

## 📞 QUICK CONTACTS

**Questions/Issues during deployment:**
- Crawford: Code/deployment issues
- Chris: Go-live decisions, user communication

**Quick Commands**

```bash
# Check if containers are running
docker-compose ps

# View logs
docker logs laverdi-portal
docker logs -f laverdi-portal  # Follow in real-time

# Restart containers
docker-compose restart

# Full restart
docker-compose down && docker-compose up -d

# Stop everything
docker-compose down

# Shell into container
docker exec -it laverdi-portal bash

# Check disk space
df -h
du -sh /opt/laverdi-portal

# Check resource usage
docker stats laverdi-portal

# View .env variables
cat .env.production
grep SUPABASE .env.production
```

---

## 🎯 SUCCESS CRITERIA

Launch is successful if users can:

1. ✅ Sign up (no 500 errors)
2. ✅ See dashboard (loads within 2 sec)
3. ✅ Create API key (stores correctly)
4. ✅ Make API calls (succeeds, logged to usage_logs)
5. ✅ Hit rate limit (call 101 returns 429)
6. ✅ See upgrade prompt (banner appears)
7. ✅ Start subscription (Stripe checkout link works)

---

## 📚 RELATED DOCS

For details, see:
- **Full audit:** LAVERDI_AUDIT_REPORT_2026-04-16.md
- **Implementation details:** LAVERDI_PHASE2_IMPLEMENTATION.md
- **Detailed checklist:** LAVERDI_GO_LIVE_CHECKLIST.md
- **Executive summary:** LAVERDI_LAUNCH_SUMMARY.md

---

**Last Updated:** 2026-04-16  
**Status:** Ready for Phase 3 Testing

🚀 **Let's ship Laverdi Portal v1!**
