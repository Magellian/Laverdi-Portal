# Laverdi Portal - Go Live Deployment Guide

**Status:** Ready for production deployment  
**Target Launch:** 2026-04-18  
**Current Environment:** Docker containers on DigitalOcean VPS  

---

## Pre-Launch Checklist

### 🔍 Code Quality
- [ ] All pages load without console errors
- [ ] TypeScript compilation clean (no warnings)
- [ ] All API endpoints tested
- [ ] Error handling working (try/catch everywhere)
- [ ] No hardcoded secrets or API keys in code
- [ ] All environment variables documented in `.env.example`

### 🔐 Security
- [ ] SSL certificate valid (Let's Encrypt - auto-renewing)
- [ ] HTTPS redirect working (HTTP → HTTPS)
- [ ] Supabase RLS policies active on all tables
- [ ] API keys properly masked in frontend
- [ ] Passwords hashed (Supabase handles)
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] No SQL injection vectors
- [ ] Input validation on all forms

### 🗄️ Database
- [ ] All 5 tables exist with correct schema
- [ ] Indexes created on frequently queried columns
- [ ] RLS policies tested
- [ ] Service role key validated
- [ ] Backups configured (Supabase automatic)
- [ ] Data migration scripts tested (if needed)

### 💳 Payments
- [ ] Stripe test mode verified (works with test cards)
- [ ] Webhook endpoint live at `/api/webhooks/stripe`
- [ ] Webhook secret configured in `.env.production`
- [ ] Test subscription flow end-to-end
- [ ] Invoice generation tested
- [ ] Refund flow documented
- [ ] Error handling for payment failures

### 📧 Email
- [ ] SendGrid account set up (or alternative)
- [ ] Verification email template created
- [ ] Password reset email template created
- [ ] Invoice email template created
- [ ] From address: noreply@laverdi.tech (SPF/DKIM configured)
- [ ] Test email delivery
- [ ] Bounced email handling

### 📊 Monitoring & Logging
- [ ] Error logging service (Sentry or similar)
- [ ] Performance monitoring (Vercel Analytics or similar)
- [ ] Uptime monitoring (UptimeRobot or similar)
- [ ] Database query logging
- [ ] API response time tracking
- [ ] Alert thresholds set for:
  - API response time > 1s
  - Error rate > 1%
  - Database connection failure
  - Payment webhook failures

### 🎨 Visual & UX
- [ ] Landing page looks professional
- [ ] Signup/login pages polished
- [ ] Dashboard responsive on mobile
- [ ] Molty animation smooth (60 FPS)
- [ ] All buttons/links working
- [ ] Font/color scheme consistent
- [ ] Accessibility check (WCAG 2.0 AA)
- [ ] Mobile viewport metadata correct

### 📱 Mobile Testing
- [ ] Responsive design tested on:
  - [ ] iPhone 12/13/14 (Safari)
  - [ ] Android latest (Chrome)
  - [ ] iPad (Safari)
  - [ ] Tablet landscape
- [ ] Touch interactions working
- [ ] Canvas rendering smooth
- [ ] Performance acceptable

### 📈 Performance
- [ ] Landing page load: < 2s
- [ ] Signup page load: < 2s
- [ ] Dashboard load: < 3s
- [ ] API endpoints respond: < 500ms
- [ ] Molty animation: 60 FPS, no jank
- [ ] Zero Core Web Vitals issues
- [ ] Images optimized (Next.js Image component)
- [ ] Bundle size acceptable (< 300KB main)

### 🌐 DNS & Domain
- [ ] Domain registered (laverdi.tech)
- [ ] DNS A record points to VPS IP (64.23.142.154)
- [ ] DNS propagated (check with `nslookup`)
- [ ] MX records set up (if email needed)
- [ ] SPF/DKIM/DMARC configured (for email)
- [ ] SSL cert obtained (Let's Encrypt via certbot)
- [ ] SSL cert auto-renewal configured

### 📄 Legal & Compliance
- [ ] Privacy Policy page created & live
- [ ] Terms of Service page created & live
- [ ] GDPR consent (if EU users)
- [ ] Cookie consent banner (if needed)
- [ ] Contact page with support email

### 🆘 Support Infrastructure
- [ ] Support email address working (support@laverdi.tech)
- [ ] Email forwarding configured
- [ ] Help/FAQ page created
- [ ] Error messages user-friendly
- [ ] Feedback mechanism (optional form)

### 📊 Analytics
- [ ] Google Analytics configured
- [ ] Conversion tracking set up (signup, subscription)
- [ ] User behavior tracking
- [ ] Funnel analysis configured
- [ ] Dashboard accessible

### 🚀 Deployment Infrastructure
- [ ] Docker images built & tested
- [ ] docker-compose.yml production-ready
- [ ] Environment variables in `.env.production`
- [ ] Secrets not in repo (use `.env.production`)
- [ ] Auto-restart policies configured
- [ ] Resource limits set (memory, CPU)
- [ ] Health check endpoint working (`/api/health`)
- [ ] Graceful shutdown handling

### 📝 Documentation
- [ ] API documentation updated
- [ ] Deployment runbook created
- [ ] Troubleshooting guide written
- [ ] Architecture diagram documented
- [ ] Environment setup documented
- [ ] Backup/restore procedures documented

### 🔄 CI/CD
- [ ] GitHub Actions (or similar) configured
- [ ] Auto-build on push
- [ ] Auto-deploy on release
- [ ] Test suite runs before deploy
- [ ] Rollback plan documented

---

## Deployment Steps

### 1. Pre-Deployment (24 hours before)

```bash
# Build locally and test
cd /path/to/laverdi-portal
npm install
npm run build
npm run dev  # Test locally

# Check production env vars
cat .env.production  # Verify all keys present
```

### 2. SSH Into VPS

```bash
ssh root@64.23.142.154
```

### 3. Pull Latest Code

```bash
cd /root/laverdi-portal
git pull origin main
```

### 4. Build Docker Images

```bash
docker-compose build --no-cache
```

### 5. Run Migrations (if any)

```bash
# Supabase migrations handled via dashboard
# or CLI: supabase db push
```

### 6. Deploy Containers

```bash
docker-compose down  # Stop old containers
docker-compose up -d  # Start new containers
```

### 7. Verify Deployment

```bash
# Check containers are running
docker ps

# Check logs for errors
docker logs laverdi-portal
docker logs laverdi-nginx

# Test endpoint
curl https://laverdi.tech/api/health

# Check SSL cert
curl -I https://laverdi.tech | head -5
```

### 8. Smoke Test

Visit in browser:
- [ ] https://laverdi.tech (homepage)
- [ ] https://laverdi.tech/auth/signup (signup)
- [ ] https://laverdi.tech/auth/login (login)
- [ ] Create test account
- [ ] View dashboard
- [ ] Try API key creation
- [ ] Test settings page

### 9. Monitor Logs

```bash
# Watch logs in real-time
docker logs -f laverdi-portal
docker logs -f laverdi-nginx
```

### 10. Announce Launch

Send announcements to:
- [ ] Email list (if you have one)
- [ ] Social media (Twitter, LinkedIn)
- [ ] Product Hunt (optional)
- [ ] Discord/community servers

---

## Rollback Plan

If critical issues occur:

```bash
# Stop bad deployment
docker-compose down

# Revert to previous commit
git revert HEAD
git push origin main

# Rebuild and redeploy
docker-compose build --no-cache
docker-compose up -d

# Verify rollback
curl https://laverdi.tech/api/health
```

---

## Post-Launch Monitoring

### Hour 1
- [ ] Monitor error logs continuously
- [ ] Check user signups coming in
- [ ] Verify emails sending
- [ ] Monitor API response times
- [ ] Check database query performance

### Day 1
- [ ] Review analytics dashboard
- [ ] Monitor for any errors
- [ ] Check user feedback
- [ ] Verify payments processing (if enabled)

### Week 1
- [ ] Collect user feedback
- [ ] Iterate on reported issues
- [ ] Optimize performance based on metrics
- [ ] Plan next features

---

## Environment Variables

### Required in `.env.production`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dcvrkpgvxqdcboostkpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@laverdi.tech

# DigitalOcean
DIGITALOCEAN_API_KEY=dop_v1_...

# App Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://laverdi.tech
```

---

## Health Check Endpoint

Create `/pages/api/health.ts`:

```typescript
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  })
}
```

---

## Monitoring Dashboard

Set up alerts for:

| Metric | Alert Threshold |
|--------|-----------------|
| API Response Time | > 1000ms |
| Error Rate | > 1% |
| CPU Usage | > 80% |
| Memory Usage | > 85% |
| Database Connections | > 90 of 100 |
| Uptime | < 99.9% |

---

## Success Criteria

✅ Site loads without errors  
✅ Signup creates accounts  
✅ Login works  
✅ Dashboard displays user data  
✅ API endpoints respond  
✅ Payments process (test)  
✅ Emails send  
✅ No 5xx errors in logs  
✅ Performance within targets  
✅ Mobile responsive  

---

## Support Handoff

After launch:
1. Monitor for 48 hours continuously
2. Respond to support emails within 24h
3. Fix critical bugs ASAP
4. Document any issues found
5. Plan next iteration

---

## Post-Launch Improvements (Future)

- [ ] Add user onboarding flow
- [ ] Create knowledge base/documentation
- [ ] Set up community forum
- [ ] Build admin dashboard
- [ ] Create API client SDKs
- [ ] Add advanced features (webhooks, etc)

---

## Contact & Escalation

**During Launch:**
- Primary: Crawford (deployment lead)
- Backup: Chris (product owner)
- On-call rotation after launch

**Support:**
- Email: support@laverdi.tech
- Response time: 24 hours (SLA for paid tiers)

