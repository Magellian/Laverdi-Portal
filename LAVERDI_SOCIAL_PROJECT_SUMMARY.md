# LaVerdi Social — Project Summary (TL;DR)

## What Is It?
A web app that lets creators post videos to **YouTube + TikTok + Instagram + X + Facebook** from ONE dashboard.

## Why Build It?
- Market gap: No competitor supports all 5 platforms well
- Creator pain point: Takes 45+ min to post to all platforms
- Revenue opportunity: $25k Year 1 → $2.7M+ Year 3
- Customers: Content creators, agencies, e-commerce brands, real estate

## When?
- Development: 8-10 weeks (Hermes)
- Launch: RVConnector first (as premium feature), then standalone SaaS

## Pricing
- **Starter ($29/mo):** Creators, 5 videos/month
- **Professional ($49/mo):** E-commerce, 50 videos/month
- **Agency ($299/mo):** Agencies, unlimited

## Tech Stack
- Frontend: Next.js + Tailwind (reuse LaVerdi portal)
- Backend: Python FastAPI (consistent with command-center)
- Database: Supabase (multi-tenant)
- Storage: Vultr Object Storage
- Payment: Stripe (future)

## MVP Scope (What to Build First)
1. Upload video + caption
2. Post to all 5 platforms simultaneously
3. View post history
4. Connect platform accounts (OAuth)
5. Error handling + notifications

## Key Files
- `LAVERDI_SOCIAL_MARKET_VALIDATION.md` — Full analysis (16kb)
- `LAVERDI_SOCIAL_HERMES_HANDOFF.md` — Detailed spec for builder (11kb)
- `CHANNELS_STATUS_20260520.md` — API integration notes (5kb)

## Status
✅ Market validation DONE  
✅ Competitive analysis DONE  
✅ APIs verified working  
⏳ Awaiting Hermes to start development

## Next Steps
1. Hermes confirms tech stack preference
2. Set up Supabase tables + infrastructure
3. 8-10 week development sprint
4. Beta test on RVConnector
5. Launch

---

**Owner:** Chris LaVerdiere  
**Builder:** Hermes  
**First Deployment:** RVConnector site  
**Revenue Potential:** $2.7M+ by Year 3
