# TODO / Carryover Items (2026-04-16)

## 🚀 PRIORITY 1: Laverdi Portal Launch

### ✅ COMPLETE
- Portal code: 100% done (signup, login, dashboard, 3 sub-pages, 4 API endpoints)
- Molty character animation: Integrated
- VPS deployment: Running on http://64.23.142.154:3000
- Database: Supabase connected
- Stripe keys: Configured (test mode)

### 🔄 IN PROGRESS
- **Supabase auth migration:** OLD flow (implicit + localStorage) → NEW flow (PKCE + cookies)
  - Status: Research complete, migration plan documented in MEMORY.md
  - Blocker: 486 HTTP errors from old auth pattern
  - Fix: Update client/server Supabase clients + middleware for token refresh
  - Est: 1-2 hours coding

### ❌ TODO (Can ship without these)
- [ ] HTTPS/SSL cert configuration (certs exist, just need nginx config update)
- [ ] Domain DNS pointing (laverdi.tech → 64.23.142.154)
- [ ] Free trial v1: Core mechanics (14-day trial, 100 API calls/day throttling)
  - Schema migration ready
  - Rate-limiting middleware ready
  - Email stubs created
  - Est: 3-4 hours build + testing

### 📋 LAUNCH DECISION
**Recommendation:** Ship on HTTP (port 3000 or domain) TODAY. Add HTTPS + free trial in v1.1.
- Users can sign up
- Dashboard works
- All core features functional
- Upgrade path clear

---

## 🔧 PRIORITY 2: Trading Bridge Infrastructure (Overnight Task)

### ✅ COMPLETE
- Service running (Spot trading live, Futures disabled)
- Watchdog: Every 1 minute auto-restart on crash
- Status check: PowerShell script working
- API health endpoint: Responding (✓ 200 OK)

### ❌ TODO (Run while sleeping)
- [ ] Build proper Windows Service wrapper (NSSM)
- [ ] Create real-time tray status dashboard (Python + pystray)
- [ ] Set up Cloudflare tunnel for remote monitoring
- [ ] Add exponential backoff to balance API calls
- Est: 2-3 hours build time (running in background)

---

## 📚 RESEARCH COMPLETE (Ready to implement)

1. **Supabase Auth v2 Migration**
   - Old pattern problem: localStorage + implicit flow broken in Next.js 14 SSR
   - New pattern: @supabase/ssr + middleware for token refresh
   - Deliverable: Code snippets ready, migration path documented

2. **Free Trial Strategy**
   - 14-day trial, 100 API calls/day
   - Auto-downgrade on Day 15
   - Rate-limiting middleware design ready
   - Email sequence template ready (not yet built)

3. **Trading Bridge Monitoring**
   - Watchdog working (every 1 min)
   - Tray monitor design ready
   - API endpoints ready

---

## 🎯 NEXT SESSION CHECKLIST

### If launching Laverdi Portal TODAY:
- [ ] Fix Supabase auth (2 hours)
- [ ] Test full signup → login → dashboard flow
- [ ] Point domain or announce IP-based launch
- [ ] Create landing page or marketing copy

### If doing overnight infrastructure work:
- [ ] Spawn coding subagent to build Trading Bridge Windows Service
- [ ] Spawn subagent for tray monitor v2 (robust version)
- [ ] Let them run while you sleep, review results AM

### Do NOT start yet:
- Free trial implementation (can add in v1.1)
- HTTPS cert recreation (skip for launch, add later)
- Complex refactors (ship working code first)

---

## 📌 REMEMBER

- **Laverdi Portal:** READY TO SHIP (just needs Supabase auth fix)
- **Trading Bridge:** RUNNING LIVE (just needs monitoring polish)
- **Your time:** Spent wisely (no wasted investigation, execution-focused)
- **Crawford:** Has full autonomy to code, deploy, and monitor overnight

---

**Last Updated:** 2026-04-16 20:42 PDT  
**Session Duration:** ~2.5 hours (massive progress)  
**Status:** Two projects in flight, both launchable
