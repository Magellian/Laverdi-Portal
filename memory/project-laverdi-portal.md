# Project: Laverdi.tech OpenClaw Subscription Portal

## Status: Planning → Development (Ready to Build)

## Overview
SaaS portal for renting managed OpenClaw environments. Users get their own agent runtime on Laverdi's VPS, with tiered model fallback system to control costs.

## Business Model

### Pricing Tiers
| Tier | Price | Primary Model | Fallback Model | Daily Token Budget |
|------|-------|---------------|----------------|-------------------|
| **Starter** | $99/mo | Sonnet 4.6 | gpt-oss (local free) | 10k tokens |
| **Professional** | $249/mo | Opus 4.6 | Sonnet 4.6 | 100k tokens |
| **Enterprise** | Custom | Negotiated | — | Custom |

### Key Features
- Managed OpenClaw environment per user
- Automatic model fallback (tiered quality)
- Token budget enforcement per tier
- Instant account creation + API key
- Email confirmation with receipt + startup PDF
- User dashboard (API key, usage, subscription management)
- Stripe + PayPal payment options
- Recurring subscription (auto-renewal)

## Tech Stack

### Frontend
- **Framework:** Next.js (React) or simple Node.js + HTML/CSS
- **Hosting:** Docker container on VPS (port 80/443)
- **Styling:** TailwindCSS (fast, professional)

### Backend
- **Runtime:** Node.js (same as OpenClaw gateway)
- **Database:** Supabase (PostgreSQL + built-in auth)
- **Authentication:** Supabase Auth (JWT)
- **Payment:** Stripe (subscriptions) + PayPal (flexibility)
- **Email:** SendGrid or Stripe built-in
- **API Key Generation:** Secure random tokens, stored in Supabase

### Infrastructure
- **VPS:** DigitalOcean 64.23.142.154
- **Port 80/443:** Laverdi.tech portal (Docker container)
- **Port 18789:** OpenClaw gateway (existing)
- **Database:** Supabase cloud (external, more reliable)
- **Docker Compose:** Manages all services

## Database Schema (Planned)

### Users Table
```sql
id (UUID, primary key)
email (string, unique)
stripe_customer_id (string)
api_key (string, unique, hashed)
tier (enum: starter, professional, enterprise)
created_at (timestamp)
updated_at (timestamp)
```

### Subscriptions Table
```sql
id (UUID)
user_id (UUID, FK)
stripe_subscription_id (string)
tier (enum)
status (active, paused, cancelled)
current_period_start (timestamp)
current_period_end (timestamp)
created_at (timestamp)
```

### API Usage Table
```sql
id (UUID)
user_id (UUID, FK)
tokens_used (integer)
requests (integer)
timestamp (timestamp)
date (date, for daily rollup)
```

## Feature Set (MVP)

### Public Website
- Landing page (features, pricing, testimonials)
- Pricing cards (Starter / Pro / Enterprise)
- "Sign Up" button → Stripe Checkout

### Post-Purchase (Automated)
1. Stripe webhook triggers
2. Create user account in Supabase
3. Generate secure API key
4. Send email:
   - Receipt (Stripe invoice)
   - Startup PDF
   - API key (in email or dashboard link)
   - Dashboard URL

### User Dashboard (Authenticated)
- Display API key (copy to clipboard)
- Current tier + renewal date
- Monthly token usage (progress bar)
- Getting started guide
- Manage subscription (pause, upgrade, cancel)
- Support / contact form

### Admin Dashboard (Future)
- User list + usage stats
- Subscription management
- Token budget monitoring
- Revenue tracking

## Deployment Plan

### Phase 1: MVP (This Week)
1. ✅ Set up Supabase project
2. ✅ Design landing page
3. ✅ Build Next.js app (frontend + backend)
4. ✅ Integrate Stripe Subscriptions
5. ✅ Build Supabase schema
6. ✅ Create user onboarding flow
7. ✅ Docker containerize + deploy to VPS
8. ✅ Point Laverdi.tech DNS to VPS

### Phase 2: Launch (Week 2)
- Beta test with internal users (yourself, Fife RV?)
- Refine email copy + PDF
- Set up monitoring / error tracking
- Go public

### Phase 3: Enhancement (Post-Launch)
- PayPal integration
- User dashboard improvements
- Token budget enforcement (hard limits)
- Admin analytics
- Support ticketing system

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Token budget blowout | Hard limits per tier, monitoring alerts |
| Single VPS failure | Backup gateway on second droplet (future) |
| Customer support | FAQ, docs, email support queue |
| Payment disputes | Clear terms, Stripe dispute handling |
| Scaling | Start with 10 users, monitor CPU/RAM |

## Next Steps

1. **Create Supabase project** (free tier OK for MVP)
2. **Design landing page** (copy + mockup)
3. **Set up Stripe account** (already have account?)
4. **Build Next.js app** (landing + auth + dashboard)
5. **Integrate Stripe Checkout**
6. **Create startup PDF** (getting started guide)
7. **Docker setup + VPS deployment**
8. **DNS: Point Laverdi.tech to VPS IP (64.23.142.154)**

## Files & Resources

- **Landing page copy:** (to be written)
- **Startup PDF:** (to be designed)
- **Stripe dashboard:** https://dashboard.stripe.com
- **Supabase console:** https://app.supabase.com
- **Docker Compose file:** `docker-compose.yml` (to be created)

## Team
- **Product/Strategy:** Chris LaVerdiere
- **Development:** Crawford
