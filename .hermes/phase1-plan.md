# Phase 1 Foundation Implementation Plan

> **For Hermes:** Use Claude Code as primary builder, Codex as fallback. Ops tasks handled directly.

**Goal:** Solidify the foundation — working tiers, backups, legal pages, monitoring. Stripe live switch LAST.

---

### Task 1: Verify & Fix Tier Enforcement
- Ensure Pro (5 agents) and Enterprise (20 agents) limits actually work
- Verify `getModelConfig` assigns correct models per tier
- Test by attempting to exceed limits

### Task 2: Privacy Policy + Terms of Service
- Create `/app/legal/privacy/page.tsx` — Privacy Policy
- Create `/app/legal/terms/page.tsx` — Terms of Service
- Link from footer

### Task 3: Fix Dead Footer Links
- Docs → point to a real docs page or `/dashboard` for now
- About → simple about page `/app/about/page.tsx`
- Blog → link to external or `/about`
- Contact → mailto:support@laverdi.tech
- Security → link to `/legal/privacy`

### Task 4: Auto-DB Backups
- Cron on VPS: daily pg_dump to NAS or local archive
- 7-day retention, rotate old backups

### Task 5: Health Check Monitoring
- Cron-based uptime monitor checking `/api/health`
- Alert to Telegram if down
