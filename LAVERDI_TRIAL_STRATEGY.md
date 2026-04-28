# Laverdi Portal: Free Trial + Paid Tier Strategy
## Ready-to-Launch Implementation Guide

**Status:** Week-of-launch ready  
**Last Updated:** 2026-04-16  
**Target Platforms:** DigitalOcean App Platform, Supabase, Stripe

---

## Executive Summary

This document outlines a **pragmatic, industry-validated free trial + paid tier system** for Laverdi Portal (AI SaaS). The approach balances user acquisition (14-day free trial) with revenue protection (rate-limiting, auto-downgrade, clear upgrade prompts).

**Key decisions:**
- **Trial duration:** 14 days (sweet spot between Notion/Slack at 14d and Figma at 30d)
- **Free tier limits:** 100 API calls/day, 5 projects, email support only
- **Paid tiers:** Starter ($29/mo, 2K calls/day) → Professional ($99/mo, 20K calls/day)
- **Storage:** Supabase (trial expiry tracking), Stripe (billing logic)
- **Throttling:** Middleware-based rate limiting in Next.js

---

## 1. TRIAL SETUP & TIER DEFINITIONS

### 1.1 Trial Architecture

| Tier | Duration | API Calls/Day | Projects | Support | Auto-Downgrade | Price |
|------|----------|---------------|----------|---------|-----------------|-------|
| **Trial** | 14 days | 100 | 5 | Email | → Free (Day 15) | $0 |
| **Free** | Unlimited | 50 | 2 | Community forum | N/A | $0 |
| **Starter** | Unlimited | 2,000 | 10 | Email (24h) | — | $29/mo |
| **Pro** | Unlimited | 20,000 | 50 | Priority email (4h) | — | $99/mo |
| **Enterprise** | Unlimited | Unlimited | Unlimited | Phone + Slack | — | Custom |

### 1.2 Trial Expiration Handling

**When trial ends (Day 15):**
1. User is auto-downgraded to **Free tier** (no payment card required to start)
2. API calls immediately drop to 50/day limit
3. Email notification sent: "Your trial ended. Still 100% free on our Free plan."
4. Soft upgrade prompt shown in dashboard (non-intrusive)

**Why this works:**
- Removes friction (no payment = lower conversion barrier)
- Natural upgrade moment: users hit the 50/day limit within days
- Reduces churn: free users still get value, stay engaged

---

## 2. DATABASE ARCHITECTURE (Supabase + Stripe)

### 2.1 Supabase Schema

```sql
-- Core users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  
  -- Trial tracking
  trial_starts_at TIMESTAMP DEFAULT NOW(),
  trial_expires_at TIMESTAMP, -- NULL = not in trial
  trial_claimed BOOLEAN DEFAULT FALSE,
  
  -- Current tier
  tier_id TEXT NOT NULL DEFAULT 'free', -- 'free', 'trial', 'starter', 'pro', 'enterprise'
  
  -- Stripe link
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Billing
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API usage tracking
CREATE TABLE public.api_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  calls_today INT DEFAULT 0,
  last_reset_at DATE DEFAULT TODAY(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, last_reset_at)
);

-- Audit log (for support/debugging)
CREATE TABLE public.tier_changes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  old_tier TEXT,
  new_tier TEXT,
  reason TEXT, -- 'trial_expired', 'payment_failed', 'downgrade', etc.
  triggered_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Tier Limits (Stored in-app config)

```javascript
// config/tier-limits.js
export const TIER_LIMITS = {
  free: {
    calls_per_day: 50,
    projects: 2,
    support_level: 'forum',
    stripe_price_id: null,
  },
  trial: {
    calls_per_day: 100,
    projects: 5,
    support_level: 'email',
    stripe_price_id: null, // No charge during trial
    duration_days: 14,
  },
  starter: {
    calls_per_day: 2000,
    projects: 10,
    support_level: 'email_24h',
    stripe_price_id: 'price_starter_monthly',
  },
  pro: {
    calls_per_day: 20000,
    projects: 50,
    support_level: 'priority_4h',
    stripe_price_id: 'price_pro_monthly',
  },
  enterprise: {
    calls_per_day: 999999, // Unlimited
    projects: 999999,
    support_level: 'phone_slack',
    stripe_price_id: null, // Custom agreement
  },
};
```

### 2.3 Stripe Integration: Trial + Auto-Downgrade

**Stripe Setup:**

1. **Two Stripe price IDs** (use Recurring Billing, monthly)
   - `price_starter_monthly` = $29/month
   - `price_pro_monthly` = $99/month

2. **Metadata on subscriptions:**
   ```javascript
   {
     "trial_user_id": "uuid-here",
     "tier_name": "starter",
     "launch_date": "2026-04-16"
   }
   ```

3. **Webhook endpoints to handle:**
   - `customer.subscription.created` → Link Stripe subscription to user
   - `customer.subscription.updated` → Sync billing dates
   - `customer.subscription.deleted` → Mark as canceled
   - `invoice.payment_failed` (2+ attempts) → Downgrade to free tier

**Trial to Paid Flow:**

```javascript
// api/stripe/create-subscription.ts
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function POST(req) {
  const { tier, user_id } = await req.json();
  
  // Get Stripe customer or create
  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user_id)
    .single();
  
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email });
    customerId = customer.id;
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user_id);
  }
  
  // Create subscription (Stripe handles trial if configured, but we manage ours)
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: TIER_LIMITS[tier].stripe_price_id }],
    metadata: { user_id },
    collection_method: 'charge_automatically',
  });
  
  // Link to user
  await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      tier_id: tier,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq('id', user_id);
  
  return { success: true, subscription_id: subscription.id };
}
```

**Auto-Downgrade on Failed Payment:**

```javascript
// api/webhooks/stripe.ts
export async function POST(req) {
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature'),
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    
    // Find user by Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('id, tier_id')
      .eq('stripe_customer_id', customerId)
      .single();
    
    if (!user) return { ok: true };
    
    // If 2+ failures → downgrade to free
    if (invoice.attempt_count >= 2) {
      await supabase
        .from('users')
        .update({ tier_id: 'free' })
        .eq('id', user.id);
      
      await supabase.from('tier_changes').insert({
        user_id: user.id,
        old_tier: user.tier_id,
        new_tier: 'free',
        reason: 'payment_failed_2x',
      });
      
      // Email user
      await sendEmail(user.email, 'Subscription Failed – Downgraded to Free', {
        tier: 'free',
        next_steps: 'Update your payment method or contact support.'
      });
    }
  }
  
  return { ok: true };
}
```

---

## 3. API THROTTLING (Next.js Rate Limiting)

### 3.1 Rate Limiter Middleware

Use **Redis + Vercel KV** (or DigitalOcean's managed Redis) for distributed rate limiting:

```javascript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis';
import { TIER_LIMITS } from '@/config/tier-limits';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(user_id: string, tier: string) {
  const limit = TIER_LIMITS[tier].calls_per_day;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `rate:${user_id}:${today}`;
  
  const current = await redis.incr(key);
  
  // Set expiry to reset at midnight UTC
  if (current === 1) {
    await redis.expire(key, 86400); // 24 hours
  }
  
  return {
    allowed: current <= limit,
    current,
    limit,
    remaining: Math.max(0, limit - current),
  };
}

export async function getRateLimitStatus(user_id: string, tier: string) {
  const today = new Date().toISOString().split('T')[0];
  const key = `rate:${user_id}:${today}`;
  const current = (await redis.get(key)) || 0;
  const limit = TIER_LIMITS[tier].calls_per_day;
  
  return {
    current,
    limit,
    remaining: Math.max(0, limit - current),
  };
}
```

### 3.2 Middleware: Protect All API Routes

```javascript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, TIER_LIMITS } from '@/lib/rate-limit';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip rate limiting for auth, webhooks, health checks
  if (pathname.match(/^\/(api\/auth|api\/webhooks|health|api\/public)/)) {
    return NextResponse.next();
  }
  
  // Extract user from JWT or session
  const token = request.headers.get('authorization')?.split('Bearer ')[1];
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // Verify token + get tier
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('tier_id')
    .eq('id', data.user.id)
    .single();
  
  // Check rate limit
  const rateCheck = await checkRateLimit(data.user.id, user.tier_id);
  
  if (!rateCheck.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit: rateCheck.limit,
        reset_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
        upgrade: `/pricing?tier=${user.tier_id === 'free' ? 'starter' : 'pro'}`,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': '3600',
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': String(rateCheck.remaining),
        },
      }
    );
  }
  
  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(rateCheck.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateCheck.remaining));
  response.headers.set('X-RateLimit-Reset', 
    new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
  );
  
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

### 3.3 Per-Route Usage Tracking (Optional Detail)

```javascript
// api/projects/[id]/inference.ts
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req, { params }) {
  const user_id = req.user.id; // From middleware
  const tier = req.user.tier_id;
  
  const rateCheck = await checkRateLimit(user_id, tier);
  
  if (!rateCheck.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded', details: rateCheck },
      { status: 429 }
    );
  }
  
  // Process inference request
  // ...
  
  return Response.json({ success: true, calls_remaining: rateCheck.remaining });
}
```

---

## 4. CONVERSION FLOW & MESSAGING

### 4.1 Trial Lifecycle Emails

**Day 1 (Welcome):**
```
Subject: Welcome to Laverdi Portal! 🚀 Your 14-day free trial starts now.

Hi [Name],

You've got full access to our Pro features for the next 14 days:
✅ 100 API calls per day
✅ 5 projects
✅ Email support

Get started: [Dashboard Link]

Your trial expires: [Date + Time]
```

**Day 7 (Midpoint reminder):**
```
Subject: You have 7 days left in your trial

Hi [Name],

You've made great progress! Here's what's available through [Expiry Date]:
- 100 API calls/day
- 5 live projects
- Full model access

Upgrade to keep going beyond the trial:
[Upgrade CTA] → Starter ($29/mo) | Pro ($99/mo)

Questions? Reply to this email.
```

**Day 13 (Final warning):**
```
Subject: Your trial ends in 1 day — Choose your plan

Hi [Name],

Your trial expires tomorrow. After that, you'll be on our free plan (50 calls/day).

Options:
1️⃣ Upgrade now → Keep unlimited access + priority support
2️⃣ Stay free → Limited to 50 calls/day, perfect for learning
3️⃣ Chat with us → Let's find the right fit

[Upgrade Now] [Learn More] [Contact Sales]
```

**Day 15 (Expired):**
```
Subject: Your trial has ended — Welcome to Laverdi Free! 🎉

Hi [Name],

Your trial expired, but you're not going anywhere! You're now on our free plan:
- 50 API calls/day
- 2 projects
- Community support

You can upgrade anytime if you need more:
[View Plans] → Starter | Pro

Keep building! 💪
```

### 4.2 In-App Conversion Prompts

**Dashboard Banner (Trial Active):**
```
┌─────────────────────────────────────────────┐
│ Trial expires in [X days]                   │
│ Calls remaining today: [N/100]              │
│ [Upgrade to Pro →] [See Plans]              │
└─────────────────────────────────────────────┘
```

**Rate-Limited Modal (Free Tier + 45/50 calls used):**
```
⚠️  You're almost out of calls today!

Free plan: 50 calls/day
Used today: 45 | Remaining: 5

Upgrade to get more:
• Starter: 2,000 calls/day — $29/mo
• Pro: 20,000 calls/day — $99/mo

[Upgrade Now] [Learn More]
```

**After 429 Error (Rate limit hit):**
```
You've hit your daily limit.

Free tier: 50 calls/day (resets at midnight UTC)
Upgrade to remove limits:
→ [Upgrade to Starter] [or Pro]
```

**Pricing Page Segmentation:**

- **Trial users:** "You've got X days left. Upgrade now to keep your projects."
- **Free users:** "Hit your limit? Upgrade to scale."
- **Expired trial→Free users:** "Used to have 100/day? Go Pro for 2000/day."

### 4.3 Conversion Benchmarks (Industry Standards)

| Metric | Benchmark | Laverdi Target |
|--------|-----------|----------------|
| Trial signup rate | 40-60% of visitors | 45% |
| Trial-to-paid conversion | 2-10% (median 5%) | 8% (Pro tier: $99, lower friction) |
| Days to upgrade (converters) | 7-9 days avg | 5 days (email on Day 7) |
| Trial completion rate | 60-80% | 75% |
| Free-to-paid (post-trial) | 1-3% | 2% (weekly upgrade prompt) |

**Revenue impact (1000 trial signups/month):**
- 750 complete trial (75%)
- 60 upgrade immediately (8%)
- 15 upgrade post-trial from free tier (2%)
- **Total monthly:** 75 × $29 (Starter) + 75 × ($99/3 average blended) ≈ **$4,700/mo baseline**

---

## 5. IMPLEMENTATION CHECKLIST

### Phase 1: Database & Auth (Days 1-2)

- [ ] Create Supabase tables: `users`, `api_usage`, `tier_changes`
- [ ] Add migration for `trial_expires_at`, `tier_id`, `stripe_customer_id` columns
- [ ] Set up RLS (Row-Level Security) policies on `users` and `api_usage`
  ```sql
  ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own usage"
    ON public.api_usage FOR SELECT
    USING (auth.uid() = user_id);
  ```
- [ ] Create sign-up flow: auto-set `trial_starts_at = NOW()`, `trial_expires_at = NOW() + 14 days`
- [ ] Add trigger: auto-create `api_usage` row on user creation

### Phase 2: Stripe Integration (Days 2-3)

- [ ] Create Stripe products: "Starter" ($29), "Pro" ($99)
- [ ] Generate price IDs; store in `config/tier-limits.js`
- [ ] Set up Stripe Webhook endpoint: `/api/webhooks/stripe`
  - Listen for: `customer.subscription.created`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] Implement subscription creation endpoint: `/api/stripe/create-subscription`
- [ ] Implement subscription cancellation endpoint: `/api/stripe/cancel-subscription`
- [ ] Test: Sign up for trial → upgrade to Starter → verify Supabase updates

### Phase 3: Rate Limiting (Days 3-4)

- [ ] Set up Redis: Upstash (Vercel) or DigitalOcean Managed Redis
- [ ] Implement `lib/rate-limit.ts` with `checkRateLimit()` and `getRateLimitStatus()`
- [ ] Create middleware: `middleware.ts` to guard all `/api/*` routes
- [ ] Add rate-limit headers to all API responses
- [ ] Test with curl/Postman:
  ```bash
  # Free tier (50/day)
  for i in {1..55}; do curl -H "Authorization: Bearer $TOKEN" https://laverdi.com/api/inference; done
  # Should fail on request 51 with 429
  ```

### Phase 4: Trial Expiry Job (Days 4-5)

- [ ] Create cron job (via Vercel, DigitalOcean, or Inngest) to run daily at 00:00 UTC:
  ```typescript
  // scripts/daily-trial-expiry.ts
  const { data: expired } = await supabase
    .from('users')
    .select('id, email, tier_id')
    .eq('trial_claimed', true)
    .lt('trial_expires_at', now);
  
  for (const user of expired) {
    // Only downgrade if still in trial
    if (user.tier_id === 'trial') {
      await supabase
        .from('users')
        .update({ tier_id: 'free' })
        .eq('id', user.id);
      
      await sendEmail(user.email, 'trial_expired_template');
    }
  }
  ```
- [ ] Deploy to DigitalOcean App Platform as scheduled job

### Phase 5: Email Notifications (Days 5-6)

- [ ] Choose email provider: SendGrid, Mailgun, or AWS SES
- [ ] Create email templates in your template system:
  - `trial_welcome` (Day 1)
  - `trial_midpoint` (Day 7)
  - `trial_expiring_soon` (Day 13)
  - `trial_expired` (Day 15)
  - `payment_failed_downgrade`
  - `upgrade_confirmation`
- [ ] Implement trigger: add user to email queue on signup
- [ ] Test: Sign up test user → verify welcome email arrives in 5 min

### Phase 6: Frontend UI (Days 6-7)

- [ ] Dashboard banner: Show trial days remaining + upgrade CTA
- [ ] Pricing page: Update CTAs based on user tier
- [ ] Rate-limit modal: Trigger when `calls_remaining <= 5`
- [ ] Settings page: Show current tier, subscription status, cancel option
- [ ] Inference page: Display rate-limit status in footer or sidebar
- [ ] Add loading state for upgrade flow (prevent double-clicks)

### Phase 7: Testing & Launch (Days 7-8)

**Manual tests:**
- [ ] Trial signup → verify DB + email
- [ ] Upgrade flow: Free → Starter → check Stripe, Supabase
- [ ] Rate limiting: Make 51 calls (free tier) → get 429 on 51st
- [ ] Trial expiry: Manually adjust `trial_expires_at` to yesterday → run cron → verify downgrade
- [ ] Failed payment: Cancel Stripe card → trigger webhook → verify downgrade email

**Staging deployment:**
- [ ] Deploy middleware, API routes, cron jobs to staging
- [ ] Run full E2E test suite
- [ ] Load test rate limiter: 100 concurrent users, verify no race conditions

**Launch checklist:**
- [ ] Deploy to production (DigitalOcean App Platform)
- [ ] Enable Stripe webhooks (test → live mode)
- [ ] Schedule cron job
- [ ] Monitor for errors: check logs, Sentry, error tracking
- [ ] Alert: Slack notification on payment failures, downgrade events
- [ ] Backup: Snapshot Supabase (daily)

### Phase 8: Post-Launch Monitoring (Weeks 2-4)

- [ ] Track KPIs:
  - Trial signups/day
  - Trial-to-paid conversion rate
  - Revenue/month
  - Churn rate (paid users canceling)
- [ ] Adjust email timing based on data
- [ ] A/B test: Trial duration (14 vs. 21 days)
- [ ] Gather feedback: Send exit survey to free users

---

## 6. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        Laverdi Portal                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
              ┌─────▼────┐  ┌─▼─────┐  ┌▼──────────┐
              │ Next.js   │  │ Auth  │  │ Email     │
              │ Frontend  │  │ (JWT) │  │ SendGrid  │
              └──────┬────┘  └──────┘  └───────────┘
                     │
              ┌──────▼────────────────────┐
              │  API Middleware           │
              │  (Rate Limiting + Auth)   │
              └──────┬────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼──┐  ┌─────▼──────┐  ┌──▼──────┐
   │Supabase│  │ Redis / KV │  │ Stripe  │
   │ (SQL)  │  │ (Rate Limit)│  │ API     │
   └────────┘  └────────────┘  └─────────┘
        │            
   ┌────▼──────────────────┐
   │ Postgres Database     │
   │ • users               │
   │ • api_usage           │
   │ • tier_changes        │
   └───────────────────────┘
```

---

## 7. DEPLOYMENT ON DIGITALOCEAN APP PLATFORM

### 7.1 App Spec

```yaml
name: laverdi-portal
services:
  - name: web
    github:
      repo: yourusername/laverdi-portal
      branch: main
    build_command: npm run build
    run_command: npm run start
    envs:
      - key: SUPABASE_URL
        value: ${SUPABASE_URL}
      - key: SUPABASE_SERVICE_KEY
        value: ${SUPABASE_SERVICE_KEY}
      - key: STRIPE_SECRET_KEY
        value: ${STRIPE_SECRET_KEY}
      - key: STRIPE_WEBHOOK_SECRET
        value: ${STRIPE_WEBHOOK_SECRET}
      - key: UPSTASH_REDIS_REST_URL
        value: ${UPSTASH_REDIS_REST_URL}
      - key: UPSTASH_REDIS_REST_TOKEN
        value: ${UPSTASH_REDIS_REST_TOKEN}
    http_port: 3000
    source_dir: ./
    health_check:
      http_path: /health
      initial_delay_seconds: 30
      period_seconds: 60

jobs:
  - name: daily-trial-expiry
    kind: POST_DEPLOY
    github:
      repo: yourusername/laverdi-portal
      branch: main
    build_command: npm run build
    run_command: node scripts/daily-trial-expiry.js
    envs:
      - key: SUPABASE_URL
        value: ${SUPABASE_URL}
      - key: SUPABASE_SERVICE_KEY
        value: ${SUPABASE_SERVICE_KEY}
    source_dir: ./

databases:
  - name: supabase-postgres
    engine: POSTGRES
    version: "14"
    production: true
```

### 7.2 Cost Estimate (DigitalOcean App Platform)

| Component | Cost/Mo | Notes |
|-----------|---------|-------|
| App (web service) | $12–$50 | Starts at $12 (auto-scales) |
| Basic Database (PostgreSQL) | $15 | 1GB, shared |
| Redis (external, Upstash) | Free–$50 | Free tier: 10K requests/day |
| Stripe processing | 2.9% + $0.30 | Per transaction |
| SendGrid emails | Free–$20 | Free: 100/day |
| **Total (minimal)** | **~$70–$150/mo** | Scales with usage |

---

## 8. QUICK START: Launch This Week

**Monday (Today):**
- [ ] Set up Supabase tables + Stripe products
- [ ] Create rate-limiting middleware

**Tuesday:**
- [ ] Implement trial signup flow
- [ ] Deploy Stripe webhook endpoint

**Wednesday:**
- [ ] Build upgrade modal + pricing page
- [ ] Set up email templates

**Thursday:**
- [ ] Create cron job for trial expiry
- [ ] Test full E2E flow

**Friday:**
- [ ] Deploy to staging, run QA
- [ ] Go live to production

**Week 2:**
- [ ] Monitor signups + conversion
- [ ] Adjust messaging based on data

---

## 9. FAQ & Edge Cases

### Q: What if a user downgrades from Starter → Free?
**A:** Add a `/api/stripe/cancel-subscription` endpoint that:
1. Cancels the Stripe subscription
2. Updates `tier_id = 'free'` in Supabase
3. Sends confirmation email
4. Logs to `tier_changes` with reason: `'user_downgrade'`

### Q: Can users switch tiers (Starter → Pro)?
**A:** Yes. Use Stripe's subscription update API to change the price ID:
```javascript
await stripe.subscriptions.update(subscription_id, {
  items: [{ id: line_item.id, price: new_price_id }],
  proration_behavior: 'create_prorations',
});
```
This prorates charges (credit/debit based on partial month).

### Q: What if a user's trial starts, then deletes their account mid-trial?
**A:** Use Postgres cascade delete:
```sql
ALTER TABLE public.api_usage
ADD CONSTRAINT fk_user_id
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
```
All usage records auto-delete with the user.

### Q: How do we handle timezone-specific midnight reset?
**A:** Store everything in UTC. When displaying "reset at," convert to user's timezone in JavaScript:
```javascript
const resetTime = new Date(new Date().setUTCHours(24, 0, 0, 0));
const userReset = resetTime.toLocaleString('en-US', { 
  timeZone: user.timezone // stored in DB
});
```

### Q: What about refunds for unused Starter → Free downgrade?
**A:** Stripe's `proration_behavior: 'create_prorations'` automatically credits:
- User downgraded Day 15 of 30-day month ($29): Gets ~$14.50 credit
- Apply credit to next Starter payment, or refund if canceling entirely

### Q: Can we offer longer trials for certain segments?
**A:** Yes! Add a `trial_duration_days` column to `users`:
```javascript
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + (user.trial_duration_days || 14));
```
Then adjust via coupon/promo code:
```javascript
// admin-only endpoint
POST /api/admin/extend-trial
{ user_id, extra_days: 7 }
// Sets trial_expires_at += 7 days
```

---

## 10. Success Metrics & KPIs

Track these weekly:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Trial signup rate | >40% | UTM tracking, sign-up form analytics |
| Trial completion (14d) | >75% | `COUNT(users WHERE trial_expires_at IS NOT NULL AND trial_expires_at < NOW())` |
| Trial-to-paid conversion | >5% | `COUNT(subscriptions WHERE created_at BETWEEN trial_start AND trial_end + 7 days)` |
| Paid user churn | <5%/mo | `COUNT(canceled_subscriptions) / COUNT(active_subscriptions)` |
| Avg revenue per user (ARPU) | $25–$50 | `SUM(subscription revenue) / COUNT(paying_users)` |
| Time to upgrade | <7 days | Email open → upgrade click tracking |
| Free → Paid (post-trial) | >2% | Track downgrades → free tier → re-upgrade |

---

## 11. Final Notes for Launch

1. **Go live gradually:** Start with 10% of traffic, monitor for 24h, then 100%
2. **Have support ready:** Trial signups will have questions. Brief support team on trial benefits
3. **Monitor Stripe:** Watch for failed payments, refund requests, chargebacks
4. **A/B test emails:** Try different messaging ("Try Pro free for 14 days" vs "Start your free trial")
5. **Plan post-launch:** Day 30, review conversion data and adjust trial length or pricing

**You're ready to launch this week. Good luck! 🚀**

---

**Document prepared for:** Laverdi Portal SaaS  
**Status:** Ready for implementation  
**Next step:** Assign developers to Phase 1 tasks
