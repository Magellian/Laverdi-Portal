# QUICK REFERENCE CARD - Laverdi Portal Phases 1-3

**Print this. Tape it to your monitor. You'll refer to it constantly.**

---

## PHASE 1: NGINX SSL (1-2 HOURS) 🔒

### Files to Edit
```
1. docker-compose.yml
   Find: nginx service volumes
   Add: - /etc/letsencrypt:/etc/letsencrypt:ro

2. nginx.conf
   Uncomment: HTTPS server block (lines ~40-80)
   Remove: Temporary HTTP server block
   Verify: ssl_certificate paths correct
```

### Commands
```bash
# SSH to VPS
ssh user@laverdi-vps

# Verify certs exist
ls /etc/letsencrypt/live/laverdi.tech/

# Restart containers
cd /root/laverdi-portal
docker-compose down
docker-compose up -d

# Test HTTPS
curl -I https://laverdi.tech
# Expected: HTTP/2 200 ✓
```

### Success
- ✅ `curl -I https://laverdi.tech` → HTTP/2 200
- ✅ Browser: 🔒 lock icon
- ✅ Security headers present (check with curl -v)

---

## PHASE 2: MOLTY ANIMATION (2-3 HOURS) 🎨

### New Method to Add
```typescript
// In lib/three/MoltyCharacter.ts

constrainOrientationToUpright() {
  const euler = new THREE.Euler().setFromQuaternion(this.group.quaternion)
  euler.y = 0  // ← LOCK Y-AXIS (STAY UPRIGHT)
  euler.x = Math.max(-0.3, Math.min(0.3, euler.x))  // Clamp X
  euler.z = Math.max(-0.1, Math.min(0.1, euler.z))  // Clamp Z
  this.group.quaternion.setFromEuler(euler)
}
```

### Call in animate()
```typescript
// In lib/three/MoltyCharacter.ts animate() method
animate(deltaTime: number) {
  // ... existing code ...
  this.constrainOrientationToUpright()  // ← ADD THIS LINE
  // ... rest of animation ...
}
```

### ParticleSystem Changes
```typescript
// lib/three/ParticleSystem.ts
private particleCount = 1250  // ← Changed from 2500 (50% reduction)

update(deltaTime: number) {
  for (const particle of this.particles) {
    particle.update(deltaTime * 0.25)  // ← 4x slower (0.25 = 1/4)
  }
}
```

### New File: IconParticle.ts
```
Create: lib/three/IconParticle.ts
6 icon types: email, checkmark, gear, document, link, clock
Each with unique color from brand palette
```

### Success
- ✅ Molty stays upright during zoom
- ✅ Particles: 1250 (50% reduction)
- ✅ Movement: 3-4x slower (visually obvious)
- ✅ Icons: semantic not generic
- ✅ FPS: 60 desktop, 30+ mobile

---

## PHASE 3: LANDING PAGE (3-4 HOURS) 📄

### Brand Colors
```css
--teal: #0EA5E9      /* Primary CTAs */
--orange: #FF6B35    /* Accents */
--bg: #F8FAFC        /* Background */
--text: #1E293B      /* Text */
--border: #E2E8F0    /* Borders */
```

### 10 Sections (in order)
```
1. Header/Nav      - Logo, links, Sign Up button
2. Hero            - Text + CTAs on left, Molty on right
3. Trial Banner    - 🎉 Free 2-week trial message
4. How It Works    - 3 columns: Tell → Happens → Done
5. Why Choose Us   - 4 feature cards
6. Pricing         - Free, Starter ($29), Pro ($99), Enterprise
7. Quickstart      - 3-step timeline (5 minutes)
8. Community       - Twitter, Discord, GitHub
9. Security/Trust  - Your VPS, No Tracking, Open Source
10. Footer CTA     - "Ready to Automate?" + footer
```

### Key Copy
```
Hero Headline:
"Automate without code. No setup required."

Subheadline:
"Talk to Molty. Watch automation happen."

Trial Badge:
"🎉 Free 2-week trial • No credit card • Cancel anytime"

Pricing:
Free: 50 calls/day, 2 projects
Starter: $29/mo, 2000 calls/day, "Most Popular"
Pro: $99/mo, 20000 calls/day
Enterprise: Custom, unlimited
```

### Responsive Breakpoints
```css
Mobile:    375px  (1 column, stacked)
Tablet:    768px  (2 columns, flexible)
Desktop: 1440px  (full 4-column pricing)
```

### CTA Routes
```
"Start Free Trial"      → /auth/signup?trial=true
"See It In Action"      → Video modal (placeholder)
"Get Started" (Free)    → /auth/signup
"Start Free Trial" (Pro)→ /auth/signup?trial=true
"Contact Sales"         → Email or form
```

### Success
- ✅ 10 sections visible and styled
- ✅ Mobile responsive (tested 375px, 768px)
- ✅ Pricing: 4 tiers display correctly
- ✅ All CTAs functional
- ✅ Molty integrated in hero
- ✅ Page load: <2 seconds
- ✅ No console errors

---

## PHASE 4: DEPLOYMENT (1-2 HOURS) 🚀

### Local Test
```bash
cd /root/laverdi-portal

# Start dev server
npm run dev

# Open browser
http://localhost:3001

# Verify:
# ✓ Page loads
# ✓ Hero visible
# ✓ Molty renders
# ✓ All sections present
# ✓ Responsive on mobile (F12)
```

### Staging
```bash
# Build image
docker build -t laverdi-portal:staging .

# Deploy
docker-compose -f docker-compose.staging.yml up -d

# Test
curl -I https://staging-laverdi.tech
```

### Production Deployment
```bash
# Backup
cp -r /root/laverdi-portal /root/laverdi-portal-backup-$(date +%Y%m%d)

# Deploy
cd /root/laverdi-portal
docker-compose down
docker build -t laverdi-portal:prod .
docker-compose up -d

# Verify
curl -I https://laverdi.tech     # HTTP/2 200 ✓
curl https://laverdi.tech | grep "Automate without code"  # Found ✓

# Monitor logs (2 hours)
docker-compose logs -f web
```

### Health Checks (every 15 min for 2 hours)
```bash
# HTTPS
curl -I https://laverdi.tech
# Expected: HTTP/2 200

# Landing page
curl https://laverdi.tech | grep "Automate"
# Should find new headline

# Signup flow
# Open browser → https://laverdi.tech
# Click "Start Free Trial"
# Should route to /auth/signup?trial=true
```

### Metrics
- CPU: <50%
- Memory: <500MB
- Error rate: 0%
- Load time: <2 seconds

### Rollback (if needed)
```bash
docker-compose down
cp -r /root/laverdi-portal-backup-YYYYMMDD/* /root/laverdi-portal/
docker-compose up -d
```

---

## TESTING CHECKLIST (QUICK)

### Phase 1 ✓
- [ ] HTTPS works: `curl -I https://laverdi.tech` → 200
- [ ] Browser lock icon (🔒) visible
- [ ] Security headers present

### Phase 2 ✓
- [ ] Molty upright during zoom
- [ ] Particles: 1250 count (50% reduction)
- [ ] Particles slow (3-4x obvious)
- [ ] 60 FPS desktop, 30+ mobile

### Phase 3 ✓
- [ ] Hero section visible
- [ ] All 10 sections present
- [ ] Mobile responsive (375px works)
- [ ] Pricing: 4 tiers visible
- [ ] CTAs functional
- [ ] <2 second load time

### Phase 4 ✓
- [ ] All phases deployed to prod
- [ ] HTTPS confirmed working
- [ ] Landing page live
- [ ] 2-hour monitoring: 0 errors
- [ ] Ready for announcement

---

## APPROVED SPECS (CONFIRMED)

✅ **Pricing:**
- Free: 50 calls/day
- Starter: $29/mo (popular)
- Pro: $99/mo
- Enterprise: Custom

✅ **Trial:**
- 2 weeks free
- No credit card
- Cancel anytime

✅ **Brand:**
- Teal: #0EA5E9
- Orange: #FF6B35
- Font: Inter

✅ **Messaging:**
- "Automate without code"
- "Your VPS, Your Data"
- Trial badge highlighted

---

## EMERGENCY PROCEDURES

### HTTPS Not Working
```bash
# Check volume mount
grep "letsencrypt" docker-compose.yml
# Should see: - /etc/letsencrypt:/etc/letsencrypt:ro

# Check nginx config
grep "ssl_certificate" nginx.conf
# Should see paths to certs

# Restart
docker-compose restart nginx

# Test
curl -v https://laverdi.tech 2>&1 | grep "SSL"
```

### Landing Page Broken
```bash
# Revert
git checkout pages/index.tsx

# Restart
npm run dev

# Test
http://localhost:3001
```

### Production Issue
```bash
# Stop
docker-compose down

# Restore backup
cp -r /root/laverdi-portal-backup/* /root/laverdi-portal/

# Start
docker-compose up -d

# Verify
curl -I https://laverdi.tech
```

### Can't Connect to VPS
```bash
# Test SSH
ssh -v user@laverdi-vps

# Check firewall
sudo ufw status

# Allow ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

---

## DOCUMENTATION REFERENCE

| Need | File |
|------|------|
| Full Phase 1 | `PHASE1_EXECUTION_GUIDE.md` |
| Full Phase 2 | `PHASE2_MOLTY_IMPLEMENTATION.md` |
| Full Phase 3 | `PHASE3_LANDING_PAGE_IMPLEMENTATION.md` |
| Full Phase 4 | `PHASE4_DEPLOYMENT_AND_TESTING.md` |
| Overview | `FINAL_EXECUTION_SUMMARY.md` |
| This card | `QUICK_REFERENCE_CARD.md` |

---

## TIMELINE AT A GLANCE

```
Day 1 (2026-04-17):  Phase 1 - NGINX SSL        (1-2 hours)
Day 2 (2026-04-18):  Phase 2 - Molty            (2-3 hours)
                     Phase 3 - Landing Page      (3-4 hours)
Day 3 (2026-04-19):  Phase 4 - Testing & Deploy (1-2 hours)

Total: 7-11 hours over 3 days
```

---

## SUCCESS INDICATORS

🟢 **Phase 1 Complete:**
- HTTPS working on laverdi.tech
- Browser shows 🔒 lock icon

🟢 **Phase 2 Complete:**
- Molty stays upright when zoomed
- Particles visible and slow

🟢 **Phase 3 Complete:**
- New landing page live
- Molty animation in hero
- Mobile responsive

🟢 **Phase 4 Complete:**
- All 3 phases deployed
- Zero errors in 2-hour monitoring
- Ready for launch

---

## FINAL CHECKLIST

Before executing:
- [ ] Read all 4 documentation files
- [ ] Understand all 3 phases
- [ ] VPS access confirmed
- [ ] Backup strategy ready
- [ ] Monitoring tools ready

During execution:
- [ ] Follow step-by-step guides
- [ ] Use checklists provided
- [ ] Test after each phase
- [ ] Watch for errors

After deployment:
- [ ] Monitor for 2 hours
- [ ] Zero error tolerance
- [ ] Health checks every 15 min
- [ ] Ready for announcement

---

**Good luck! You've got this. 🚀**

For full details on any phase, reference the detailed implementation guide.
For emergencies, use the rollback procedures.
For questions, check the troubleshooting section in each phase guide.

**Status:** ✅ READY FOR EXECUTION  
**All Deliverables:** COMPLETE  
**Risk Level:** LOW (Easy rollback available)
