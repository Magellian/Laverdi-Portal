# Laverdi Portal Comprehensive Update Plan

**Report Date:** 2026-04-17  
**Status:** READY FOR IMPLEMENTATION  
**Priority Phases:** 4 (Critical → Nice-to-Have)

---

## EXECUTIVE SUMMARY

This plan addresses three interconnected updates to the Laverdi Portal:
1. **CRITICAL: NGINX SSL Certificate Mounting** (1-2 hrs) - Production blocker
2. **Animation Overhaul: Molty Character + Particles** (2-3 hrs) - UX enhancement
3. **Landing Page Marketing Redesign** (3-4 hrs) - Conversion optimization

**Total Effort:** ~7-11 hours (can spread across 3 days)  
**Risk Level:** Low (mostly cosmetic except Phase 1)  
**Deployment Strategy:** Roll out per phase with independent rollback capability

---

## PART 1: NGINX SSL CERTIFICATE MOUNTING (CRITICAL FIX)

### Problem Statement
- SSL certificates from Let's Encrypt are not mounting correctly into the nginx container after recent Docker storage migration
- Production environment is currently serving HTTP only (HTTPS disabled in nginx.conf, lines 40-50)
- Certificate paths referenced but not actually available to the container

### Current State (from `docker-compose.yml`)
```yaml
nginx:
  image: nginx:alpine
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./certs:/etc/nginx/certs:ro  # ← PROBLEM: certs folder likely empty/nonexistent
```

### Solution & Implementation

**Step 1: Configure Volume Mounts (5 min)**
- Mount `/etc/letsencrypt` from VPS host directly into nginx container
- Update `docker-compose.yml` to include:
  ```yaml
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # Add this line
    - ./certs:/etc/nginx/certs:ro
  ```

**Step 2: Verify Certificate Paths (5 min)**
- Connect to VPS host and verify `/etc/letsencrypt/live/laverdi.tech/` exists
- Certificate files needed:
  - `fullchain.pem` ✓
  - `privkey.pem` ✓
- Check file permissions (should be readable by nginx user)

**Step 3: Enable HTTPS in nginx.conf (10 min)**
- Uncomment lines 40-50 (HTTPS server block)
- Verify SSL paths match:
  ```nginx
  ssl_certificate /etc/letsencrypt/live/laverdi.tech/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/laverdi.tech/privkey.pem;
  ```
- Remove or comment out the "Temporary HTTP server" block (lines 60+)

**Step 4: Test HTTPS (5 min)**
- Restart nginx container: `docker-compose restart nginx`
- Test HTTPS access: `curl -I https://laverdi.tech`
- Verify SSL certificate validity and no cert warnings

**Step 5: Documentation (10 min)**
- Create `DEPLOYMENT_SSL.md` in project root
- Document:
  - Certificate renewal process (certbot auto-renewal)
  - Volume mount requirements for new deployments
  - Troubleshooting common SSL issues
  - Monitoring certificate expiration

### Success Criteria
- ✅ HTTPS accessible at https://laverdi.tech
- ✅ SSL certificate valid (not self-signed)
- ✅ HTTP → HTTPS redirect working
- ✅ No mixed content warnings (all resources served over HTTPS)
- ✅ Security headers properly set (HSTS, CSP, etc.)

---

## PART 2: MOLTY CHARACTER ANIMATION OVERHAUL

### Current Issues Identified
1. **Orientation:** Molty rotates freely on all axes, appears upside-down when zoomed in
2. **Particles:** 2500 particles, too fast, generic, no semantic meaning
3. **UX:** Animation feels generic, doesn't communicate "automation" concept

### Required Changes

#### A. Orientation System (MoltyCharacter.ts)

**Current Implementation:**
- Uses full 3D quaternion rotation (freedom on X, Y, Z axes)
- Head tilts and sways unpredictably
- No constraint to keep character upright

**Target Implementation:**
- Lock Y-axis rotation (always stays upright)
- Face Z-axis (toward camera) as default
- Smooth quaternion rotation ONLY on X-Z plane (no roll)
- Maintain upright during zoom in/out

**Code Changes Required:**
```typescript
// Add constraint method to MoltyCharacter class
constrainOrientationToUpright() {
  // Extract current rotation
  const euler = new THREE.Euler().setFromQuaternion(this.group.quaternion)
  
  // Lock Y-axis rotation, allow only X and Z
  euler.y = 0  // Keep upright
  
  // Clamp X and Z rotations to prevent extreme tilt
  euler.x = Math.max(-0.3, Math.min(0.3, euler.x))
  euler.z = Math.max(-0.1, Math.min(0.1, euler.z))
  
  // Apply constrained rotation
  this.group.quaternion.setFromEuler(euler)
}

// Update animate() method - call constraint each frame
animate(deltaTime: number) {
  // ... existing code ...
  
  // After quaternion updates, constrain orientation
  this.constrainOrientationToUpright()
  
  // ... rest of animation ...
}
```

**Testing Checklist:**
- Zoom in/out → Molty stays upright ✓
- Pan camera → Molty maintains vertical orientation ✓
- Idle animation → No unpredictable rotations ✓

#### B. Particle System Redesign (ParticleSystem.ts)

**Current Implementation:**
- 2500 generic red points
- Fast movement (velocity 0.02 per frame)
- No semantic connection to automation

**Target Implementation:**
- **Reduce to 1250 particles** (50% reduction for better performance)
- **Slow speed 3-4x** (0.005-0.008 velocity instead of 0.02)
- **Replace generic particles with semantic icons:**

**Icon Set (6 types, SVG-based):**
1. ✉️ **Email** (blue accent) - Communication/notification
2. ✓ **Checkmark** (green accent) - Task completion
3. ⚙️ **Gear** (teal accent) - Automation/configuration
4. 📄 **Document** (gray accent) - File processing
5. 🔗 **Link/Chain** (purple accent) - Integration
6. ⏰ **Clock** (orange accent) - Scheduling/timing

**Implementation Strategy:**

1. Create a new `IconParticle.ts` class
   ```typescript
   export class IconParticle {
     position: THREE.Vector3
     velocity: THREE.Vector3
     iconType: 'email' | 'check' | 'gear' | 'document' | 'link' | 'clock'
     mesh: THREE.Mesh
     rotationSpeed: number
     
     constructor(
       position: THREE.Vector3,
       iconType: string,
       scene: THREE.Scene
     ) {
       // Create plane geometry with SVG texture
       // Store rotation speed for floating animation
     }
     
     update(deltaTime: number) {
       // Apply gravity-free floating motion
       // Gentle rotation around Z-axis
       // Bobbing motion
     }
   }
   ```

2. Update `ParticleSystem.ts`:
   ```typescript
   // Replace generic PointsMaterial with mesh-based particles
   private createIconMesh(iconType: string, position: THREE.Vector3) {
     const geometry = new THREE.PlaneGeometry(0.3, 0.3)
     const texture = this.getIconTexture(iconType)
     const material = new THREE.MeshBasicMaterial({
       map: texture,
       transparent: true,
       side: THREE.DoubleSide
     })
     
     const mesh = new THREE.Mesh(geometry, material)
     mesh.position.copy(position)
     return mesh
   }
   
   // Spawn icons with weighted distribution
   private getRandomIconType() {
     const weights = {
       'email': 0.20,
       'check': 0.20,
       'gear': 0.20,
       'document': 0.20,
       'link': 0.12,
       'clock': 0.08
     }
     // Weighted random selection
   }
   ```

3. SVG Icon Assets (base64 encoded or imported):
   - Create `lib/three/icons/` folder
   - Store SVG files (simple, flat, Laverdi-red themed)
   - Pre-generate canvas textures at startup

**Animation Behavior:**
- Icons float gently upward/downward (slow bobbing)
- Subtle rotation around their centers
- Particles orbit slowly around central point
- Varying speeds per icon type (optional: slower for heavy icons like document)
- Fade in/out as they enter/leave viewport

**Performance Optimization:**
- Use canvas texture atlas (single texture for all icons)
- Reuse geometries (PlaneGeometry × 6, not per-particle)
- Cull particles outside camera frustum
- Limit update to visible particles only

**Testing:**
- Performance check: 60 FPS on desktop, 30+ FPS on mobile ✓
- No memory leaks during long idle ✓
- Icons scale appropriately at different zoom levels ✓

---

## PART 3: LANDING PAGE REDESIGN

### Current State
- Generic SaaS landing page (features-focused)
- Heavy on technical jargon
- Doesn't communicate safety/low-friction positioning
- Pricing section exists but not prominent

### Target Design

#### Hero Section
**Layout:** Two-column
- **Left (60%):** Text + CTAs
  - **Headline:** "No Setup Required - Just Talk"
  - **Subheadline:** "Automate your workflow without writing a line of code"
  - **Primary CTA:** "Start for Free" (high-contrast button)
  - **Secondary CTA:** "See It In Action" (video play button)
  - **Trust Badge:** "Join 100+ Builders Using Laverdi"

- **Right (40%):** Updated Molty animation
  - Upright, facing user
  - Particle icons floating around (automation theme)
  - Subtle animation loop

**Design Notes:**
- Hero font: Large, clean sans-serif (e.g., Inter Bold)
- Color scheme: Dark background (near-black), Laverdi red (#ff3333) for accents, warm secondary color (#ff6b6b or #ff8c42)
- Spacing: Generous padding/margins

#### Section 2: "How It Works"
**Layout:** 3-step horizontal flow
```
Step 1: Chat with Molty  →  Step 2: Automation Happens  →  Step 3: Results Delivered
(Simple icon)             (Simple icon)                    (Simple icon)
"Just describe what      "Molty learns your              "Your tasks run
 you want automated"      patterns and executes"          automatically"
```
**Copy Focus:** Simplicity, not features

#### Section 3: "Why Choose Laverdi"
**Layout:** 4-column card grid
1. **"Your Data Stays Yours"**
   - Icon: Shield / Server
   - Copy: "Deploy on your own VPS. No SaaS lock-in. You own your data."

2. **"No Coding Required"**
   - Icon: Chat bubble
   - Copy: "Natural language automation. Anyone can build workflows."

3. **"Community-Driven"**
   - Icon: People / Network
   - Copy: "Transparent development. Join our Discord. Help shape the future."

4. **"Works Out of the Box"**
   - Icon: Zap
   - Copy: "Zero configuration. Start automating in 5 minutes."

#### Section 4: "Pricing Tiers" (clarify with Chris)
**Placeholder Tiers:**
- **Free**: 100 API calls/month, basic automations (2-3)
  - CTA: "Start for Free"
- **Growth**: TBD API calls/month, unlimited automations
  - CTA: "Pricing Coming Soon" (or estimated price)
- **Enterprise**: Unlimited, custom integrations, priority support
  - CTA: "Contact Sales" (link to form/email)

**Design:** Cards with check marks for features, highlight "Free" tier with subtle background color

#### Section 5: "Quickstart Guide"
**Layout:** 3-step process, visual + copy
```
STEP 1: Sign Up (30 sec)         STEP 2: Chat with Molty (1 min)    STEP 3: Automate (5 min)
│                                │                                   │
└─ Create account                └─ Describe your workflow          └─ Watch it run
   (Email + password)               (Natural language)                 (Results appear)

"Done! You're automating"
```

#### Section 6: "Community & Testimonials"
- **"Join 100+ Builders"** headline
- Small testimonial cards (2-3 real or placeholder quotes)
- Discord/GitHub community links
- "Share your automations" CTA

#### Section 7: "Security & Trust"
- **Headline:** "Enterprise-Grade Security You Can Control"
- **Trust points:**
  - "Your data on your VPS" ← Key differentiator
  - "End-to-end encryption"
  - "No tracking, no ads"
  - Privacy policy link
- **Optional:** SOC 2 badge (if applicable)

#### Footer
- Links: Privacy, Terms, Docs
- Social: GitHub, Discord, Twitter (if applicable)

### Copy Guidelines

**Tone:** Friendly, confident, low-friction
- Avoid: "Enterprise," "Scalable," "Robust"
- Use: "Easy," "Quick," "Yours"

**Key Messages:**
1. "No Setup Required" (vs. complex configuration)
2. "Your VPS, Your Data" (vs. SaaS lock-in)
3. "Quickstart in Minutes" (vs. weeks of learning)
4. "Community-First" (vs. corporate silo)

---

## PART 4: IMPLEMENTATION STRATEGY

### Phase 1: NGINX SSL Cert Mounting (1-2 hours) - TODAY (2026-04-17)
**Purpose:** Fix production blocker  
**Owner:** DevOps/Backend  
**Steps:**
1. Update `docker-compose.yml` with `/etc/letsencrypt` volume
2. Uncomment HTTPS server block in `nginx.conf`
3. Test HTTPS access
4. Create `DEPLOYMENT_SSL.md` documentation
5. **Deploy immediately** (no app changes needed)

**Rollback Plan:** Easy - revert docker-compose.yml, restart container

---

### Phase 2: Molty + Particle Animation (2-3 hours) - TOMORROW (2026-04-18, AM)
**Purpose:** Enhance visual experience with semantic animations  
**Owner:** Frontend/Animation  
**Steps:**
1. Modify `lib/three/MoltyCharacter.ts`
   - Add `constrainOrientationToUpright()` method
   - Lock Y-axis rotation
   - Test orientation locking

2. Create `lib/three/IconParticle.ts`
   - New class for semantic particle rendering
   - Icon type definitions

3. Update `lib/three/ParticleSystem.ts`
   - Reduce particle count to 1250
   - Slow movement speed (3-4x slower)
   - Integrate icon rendering

4. Create `lib/three/icons/` folder
   - Add SVG assets (6 icons)
   - Generate canvas texture atlas

5. Update `components/LandingHeroScene.tsx`
   - Integrate new particle system
   - Test performance on desktop/mobile

6. Test in all components:
   - `WelcomeLanding.tsx`
   - `LandingHeroScene.tsx`
   - Dashboard animations (if used elsewhere)

**Rollback Plan:** Revert TypeScript files, revert component imports

---

### Phase 3: Landing Page Redesign (3-4 hours) - TOMORROW (2026-04-18, PM)
**Purpose:** Improve messaging and conversion  
**Owner:** Frontend/Copy  
**Steps:**
1. Rewrite `pages/index.tsx` hero section
   - Update headline/subheadline
   - Adjust layout (2-column with Molty)
   - Add new CTAs

2. Add new sections:
   - "How It Works" (3-step)
   - "Why Choose Laverdi" (4-column cards)
   - "Quickstart Guide" (3-step timeline)
   - "Community" (testimonials + links)

3. Update "Pricing" section
   - Clarify tiers with Chris
   - Finalize copy

4. Enhance "Security/Trust" messaging
   - Highlight VPS/data ownership angle

5. CSS/Styling
   - Ensure responsive design (mobile-first)
   - Test on various breakpoints

6. Test scroll animations (GSAP)
   - Ensure smooth performance

**Rollback Plan:** Revert `pages/index.tsx` and related components

---

### Phase 4: Testing & QA (1-2 hours) - NEXT DAY (2026-04-19)
**Purpose:** Verify all systems work end-to-end  
**Owner:** QA/Full Stack  
**Tests:**
1. **Signup Flow**
   - Create test account
   - Verify email confirmation
   - Access dashboard

2. **Browser/Device Testing**
   - Chrome, Firefox, Safari (desktop)
   - Mobile Safari (iOS)
   - Chrome Mobile (Android)

3. **Performance Checks**
   - Lighthouse audit
   - Molty animation FPS (60 desktop, 30+ mobile)
   - Page load time

4. **Visual Regression**
   - Compare hero section before/after
   - Check animation smoothness
   - Verify icons render correctly

5. **HTTPS/Security**
   - Verify SSL certificate valid
   - Check security headers
   - No mixed content warnings

6. **Cross-section Testing**
   - Landing page → Signup → Dashboard flow
   - Animation transitions smooth
   - Pricing clarity

**Rollback Plan:** Revert all changes if critical issues found

---

## TIMELINE RECOMMENDATION

```
TODAY (2026-04-17)
├─ Phase 1: NGINX SSL Fix (1-2 hrs)
└─ DEPLOY IMMEDIATELY (production blocker)

TOMORROW (2026-04-18)
├─ Phase 2: Molty + Particles (2-3 hrs, AM)
├─ Phase 3: Landing Page Redesign (3-4 hrs, PM)
└─ Merge + Staging Test (end of day)

NEXT DAY (2026-04-19)
├─ Phase 4: QA Testing (1-2 hrs)
└─ DEPLOY TO PRODUCTION (if all green)

TOTAL ELAPSED TIME: 3 days (spread work)
TOTAL EFFORT: ~7-11 hours
```

---

## RISK ASSESSMENT

| Phase | Risk Level | Mitigation |
|-------|-----------|-----------|
| 1: SSL Certs | **CRITICAL** | Test HTTPS before deploy; easy rollback |
| 2: Animation | Low | Test performance early; fallback to simpler particles |
| 3: Landing Page | Low | Cosmetic changes; no database impact |
| 4: Testing | Low | Comprehensive QA before deploy |

**Overall Risk:** Low (except Phase 1, which is a blocker)

---

## DEPLOYMENT STRATEGY

### Pre-Deploy Checklist
- [ ] Code reviewed by team member
- [ ] All tests passing (unit + integration)
- [ ] Staging environment mirrors production
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### Phase 1 Deployment
```bash
# 1. SSH to VPS
ssh user@vps-host

# 2. Update docker-compose.yml
vim /path/to/laverdi-portal/docker-compose.yml
# Add: - /etc/letsencrypt:/etc/letsencrypt:ro

# 3. Uncomment HTTPS in nginx.conf
vim /path/to/laverdi-portal/nginx.conf
# Uncomment lines 40-50 (HTTPS server block)

# 4. Restart containers
cd /path/to/laverdi-portal
docker-compose down
docker-compose up -d

# 5. Test
curl -I https://laverdi.tech
# Verify: HTTP/2 200, certificate valid

# 6. Monitor logs
docker-compose logs -f nginx
```

### Phase 2-3 Deployment (Git-based)
```bash
# 1. Commit changes
git add lib/three/* components/* pages/index.tsx
git commit -m "feat: Molty animation overhaul + landing page redesign"

# 2. Push to staging branch for QA
git push origin staging

# 3. Deploy to production (after QA approval)
git push origin main
# (Trigger CI/CD or manual deploy)
```

---

## QUESTIONS FOR CHRIS (REQUIRES CONFIRMATION)

1. **Pricing Tiers**
   - Confirm free tier limit (100 API calls/month?)
   - "Growth" tier pricing/limits?
   - Enterprise contact method (form vs. email link)?

2. **Landing Page Copy**
   - Any brand guidelines/tone preferences?
   - Specific keywords to include for SEO?

3. **Design & Branding**
   - Confirmed color scheme (Laverdi red + warm accent)?
   - Font preferences (already using Inter?)
   - Any logo updates needed?

4. **Video Demo**
   - Want "See It In Action" link to a demo video?
   - If yes, do we have one recorded, or create one?

5. **Community Links**
   - Discord server link ready?
   - GitHub repo URL to link?
   - Any other community platforms?

6. **Enterprise/Security**
   - Emphasis on "Your VPS" angle correct?
   - Any specific compliance claims (SOC 2, GDPR, etc.)?

---

## FILE STRUCTURE (Reference)

```
laverdi-portal/
├── docker-compose.yml          ← UPDATE VOLUMES (Phase 1)
├── nginx.conf                   ← UNCOMMENT HTTPS (Phase 1)
├── DEPLOYMENT_SSL.md            ← CREATE (Phase 1)
│
├── lib/three/
│   ├── MoltyCharacter.ts        ← UPDATE: Orientation constraint (Phase 2)
│   ├── ParticleSystem.ts        ← UPDATE: Icon particles, slower speed (Phase 2)
│   ├── IconParticle.ts          ← CREATE (Phase 2)
│   └── icons/
│       ├── email.svg            ← CREATE (Phase 2)
│       ├── check.svg
│       ├── gear.svg
│       ├── document.svg
│       ├── link.svg
│       └── clock.svg
│
├── components/
│   ├── LandingHeroScene.tsx     ← UPDATE: New icons (Phase 2)
│   └── (others unchanged)
│
└── pages/
    └── index.tsx                ← MAJOR REWRITE (Phase 3)
        - Hero section
        - How It Works
        - Why Laverdi
        - Pricing
        - Quickstart
        - Community
        - Security/Trust
```

---

## NEXT STEPS

1. **Confirm** answers to 6 questions above
2. **Begin Phase 1** immediately (SSL fix is blocking)
3. **Schedule** Phase 2-3 for tomorrow (coordinate with team)
4. **Allocate** Phase 4 (QA) for day after tomorrow
5. **Create** tickets/PRs per phase for tracking

---

## CONTACT & ESCALATIONS

- **Blocking issues:** Escalate to Chris immediately
- **Design decisions:** Defer to Chris for brand alignment
- **Technical challenges:** Document and propose solutions
- **Timeline slippage:** Flag 2+ hour overages ASAP

---

**Report Status:** ✅ Ready for Review & Implementation  
**Generated:** 2026-04-17 13:10 PDT  
**Subagent:** Implementation Planning Agent
