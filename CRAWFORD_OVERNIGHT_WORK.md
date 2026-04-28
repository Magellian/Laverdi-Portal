# Crawford Overnight Work Plan (2026-04-16 22:05 → 2026-04-17 08:00)

**Objective:** Complete all pre-deployment tasks so Friday 10 AM is a smooth, 15-minute deploy.

**Chris Status:** Sleeping (well-deserved)  
**Crawford Status:** Working through the night  
**Time Available:** ~10 hours  

---

## Task 1: Docker Build & Push (Estimated: 20-30 min)

### What to do:
1. Navigate to portal directory: `C:\Users\chris\Desktop\workspace\src\laverdi-portal`
2. Run Docker build:
   ```bash
   docker build -t laverdi-portal:latest .
   ```
3. Tag for DigitalOcean registry:
   ```bash
   docker tag laverdi-portal:latest registry.digitalocean.com/laverdi/portal:latest
   ```
4. Push to registry:
   ```bash
   docker push registry.digitalocean.com/laverdi/portal:latest
   ```

### Success Criteria:
- Build completes with 0 errors
- Image size < 600MB
- Push succeeds (no auth failures)

### If Issues:
- Check DigitalOcean registry credentials
- Verify Docker daemon is running
- Check disk space (need ~2GB free)

---

## Task 2: VPS Pre-Flight Checks (Estimated: 15 min)

### What to do:
1. SSH into VPS:
   ```bash
   ssh -i "key.pem" root@64.23.142.154
   ```
2. Verify Docker is installed & running:
   ```bash
   docker --version
   docker-compose --version
   ```
3. Check existing services:
   ```bash
   docker ps
   ```
4. Verify space on /root:
   ```bash
   df -h /root
   ```
5. Check nginx config syntax:
   ```bash
   nginx -t
   ```

### Success Criteria:
- Docker & docker-compose present
- /root has > 1GB free
- nginx config is valid
- No existing containers named "laverdi-*"

### If Issues:
- Update Docker if old: `apt-get update && apt-get upgrade docker.io`
- Free up space if needed: Remove old images `docker image prune`
- Fix nginx syntax errors before deployment

---

## Task 3: Environment Verification (Estimated: 10 min)

### What to do:
1. Verify all credentials are correct:
   ```bash
   cat /root/laverdi-portal/.env.production
   ```
   Check these exist:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET

2. Verify no secrets in git:
   ```bash
   cd /root/laverdi-portal && git log --oneline | grep -i env
   ```
   (Should only show `.env.example` updates, not actual secrets)

### Success Criteria:
- All 6 credentials present
- No secrets in git history
- File permissions: 600 (read-write for owner only)

---

## Task 4: Database Health Check (Estimated: 15 min)

### What to do:
1. Test Supabase connectivity:
   ```bash
   curl https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/
   ```
   Should return 404 (no endpoint, but auth works)

2. Verify RLS policies exist:
   ```bash
   # Connect to Supabase and check:
   SELECT policyname FROM pg_policies WHERE tablename IN ('users', 'subscriptions', 'api_keys', 'usage_logs');
   ```
   Should return 11 policies (all with "TO authenticated")

3. Verify Stripe keys work:
   ```bash
   curl https://api.stripe.com/v1/balance \
     -u sk_test_REDACTED_STRIPE_SECRET:
   ```
   Should return account balance (not auth error)

### Success Criteria:
- Supabase responds (even with 404)
- 11 RLS policies visible
- Stripe returns account data

---

## Task 5: nginx SSL Certificate Check (Estimated: 10 min)

### What to do:
1. Verify SSL certificate exists:
   ```bash
   ls -la /etc/nginx/ssl/
   # Should show: laverdi.tech.crt and laverdi.tech.key
   ```

2. Check certificate expiration:
   ```bash
   openssl x509 -in /etc/nginx/ssl/laverdi.tech.crt -noout -dates
   ```
   Should show expiration > 30 days away

3. Test nginx config:
   ```bash
   nginx -t
   # Should return: syntax is ok
   ```

### Success Criteria:
- Certificate files present
- Expiration > 30 days
- nginx config valid

---

## Task 6: Create Rollback Script (Estimated: 20 min)

### What to do:
Create `ROLLBACK.sh` in `/root/laverdi-portal/`:
```bash
#!/bin/bash
echo "Rolling back Laverdi Portal..."
docker-compose down
git checkout HEAD~1
docker-compose build --no-cache
docker-compose up -d
echo "Rollback complete. Old version running."
```

Make it executable:
```bash
chmod +x ROLLBACK.sh
```

### Success Criteria:
- Script exists and is executable
- Script tested (don't actually roll back, just verify syntax)

---

## Task 7: Create Health Check Endpoint (Estimated: 15 min)

### What to do:
Create `health-check.sh` for Friday morning testing:
```bash
#!/bin/bash
echo "=== Laverdi Portal Health Check ==="
echo "Testing HTTPS endpoint..."
curl -I https://laverdi.tech | head -1

echo "Testing API health..."
curl https://laverdi.tech/api/health

echo "Testing Docker containers..."
docker-compose ps

echo "Testing database connection..."
# Add a quick DB query here

echo "=== Health check complete ==="
```

### Success Criteria:
- Script exists in `/root/laverdi-portal/`
- Script is executable
- Run it Friday morning before final go-live

---

## Task 8: Pre-Deployment Document Creation (Estimated: 30 min)

### What to create:
1. **DEPLOYMENT_LOG.txt** — Record all overnight work
   - Timestamps of each task
   - Any issues encountered
   - Fixes applied
   - Final status

2. **FRIDAY_MORNING_CHECKLIST.md** — 10-step pre-deployment check
   - Quick verification tasks (5 min each)
   - Go/No-Go decision criteria
   - Emergency contacts

3. **POSTMORTEM_TEMPLATE.md** — For after deployment
   - What went well
   - What could improve
   - Lessons learned

### Success Criteria:
- All docs created and saved
- Friday checklist is clear and actionable
- Postmortem template ready (for after 12 PM)

---

## Task 9: Load Testing (Optional, Estimated: 30 min)

### What to do:
1. Generate test load on dev server:
   ```bash
   # Run 100 requests
   for i in {1..100}; do
     curl http://localhost:3001/api/health &
   done
   wait
   ```

2. Monitor memory/CPU:
   - Check Docker stats: `docker stats`
   - Verify no memory leaks
   - Confirm response times stay < 500ms

3. Check database connection pool:
   - Verify no "too many connections" errors
   - Check Supabase connection logs

### Success Criteria:
- App handles 100 concurrent requests
- No memory leaks
- Response times consistent

---

## Task 10: Final Documentation (Estimated: 20 min)

### What to do:
1. Update MEMORY.md with overnight work summary
2. Create FRIDAY_GO_LIVE_SUMMARY.md with:
   - All checks passed ✓
   - Docker image ready ✓
   - VPS pre-flight complete ✓
   - Rollback plan ready ✓
   - Health checks automated ✓

3. Create quick-reference card:
   ```
   FRIDAY 10 AM DEPLOYMENT
   
   Commands to run (in order):
   1. ssh root@64.23.142.154
   2. cd /root/laverdi-portal && git pull
   3. docker-compose down
   4. docker-compose up -d
   5. ./health-check.sh
   
   Expected time: 15 min
   Rollback available: Yes (./ROLLBACK.sh)
   ```

---

## Overnight Work Timeline

| Time | Task | Duration | Status |
|------|------|----------|--------|
| 22:05 | Docker build & push | 30 min | ⏳ |
| 22:35 | VPS pre-flight | 15 min | ⏳ |
| 22:50 | Environment verify | 10 min | ⏳ |
| 23:00 | Database health | 15 min | ⏳ |
| 23:15 | SSL certificate | 10 min | ⏳ |
| 23:25 | Rollback script | 20 min | ⏳ |
| 23:45 | Health check setup | 15 min | ⏳ |
| 00:00 | Documentation | 30 min | ⏳ |
| 00:30 | Load testing | 30 min | ⏳ |
| 01:00 | Final summary | 20 min | ⏳ |
| 01:20 | **COMPLETE** | — | ✅ |

**Slack time:** 8h 40m (for troubleshooting)

---

## Success Criteria (Morning Checklist)

✅ Docker image built & pushed  
✅ VPS pre-checks all pass  
✅ All credentials verified  
✅ Database healthy & RLS policies active  
✅ SSL certificate valid  
✅ Rollback script ready  
✅ Health checks automated  
✅ Documentation complete  
✅ Load testing passed  
✅ All systems GREEN for 10 AM deployment  

---

**Crawford:** You've got this. Laverdi Portal goes live Friday morning. 🚀
