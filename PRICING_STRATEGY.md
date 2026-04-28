# Laverdi Portal - Pricing Strategy

**Status:** Ready for implementation  
**Target Launch:** 2026-04-18  

---

## 🎯 Three-Tier Pricing Model

### **STARTER** (Free)
**Perfect for:** Individuals, hobbyists, testing

**Features:**
- ✅ 5,000 API requests/month
- ✅ 1 OpenClaw remote agent instance
- ✅ Basic API key management
- ✅ Email support (24-48h response)
- ✅ Community forum access
- ✅ Basic documentation

**Price:** Free / $0/month

**Ideal Customer Profile:**
- Individual developers
- Learning/testing users
- Small side projects

**Conversion Path:** Free → Pro

---

### **PROFESSIONAL** ($49/month)
**Perfect for:** Growing teams, production use

**Features:**
- ✅ 50,000 API requests/month  
- ✅ 3 OpenClaw remote agent instances
- ✅ Advanced API key management (rotation, expiry)
- ✅ Priority email support (24h response)
- ✅ Usage analytics dashboard
- ✅ Webhook support
- ✅ Custom integrations
- ✅ Monthly billing reports
- ✅ Access to beta features

**Price:** $49/month (billed annually: $470/year)

**Ideal Customer Profile:**
- Growing SaaS companies
- Agencies building automation
- Mid-market teams

**LTV:** ~$588/year (12 months)

---

### **ENTERPRISE** (Custom)
**Perfect for:** Large teams, mission-critical systems

**Features:**
- ✅ Unlimited API requests
- ✅ Unlimited instances (up to your infrastructure)
- ✅ Dedicated account manager
- ✅ Priority support (1-hour response, phone/Slack)
- ✅ Custom SLA guarantee (99.9% uptime)
- ✅ Advanced security features
- ✅ Custom integrations & API endpoints
- ✅ White-label options
- ✅ On-premises deployment option
- ✅ Compliance support (SOC2, HIPAA, GDPR)

**Price:** Custom (typically $500-5,000+/month)

**Ideal Customer Profile:**
- Enterprise customers
- High-volume automation users
- Regulated industries

**Sales Process:** Demo → Trial → Custom proposal

---

## 💰 Cost Analysis (Per Customer)

### Infrastructure Costs

**DigitalOcean Droplets (per instance):**
- Starter: 1x Basic ($6/mo) = $6/month
- Professional: 3x Basic ($6/mo) = $18/month
- Enterprise: Custom scaling

**Supabase (shared database):**
- ~$25/month for all customers (shared)
- Cost per user: ~$0.50/month (at 50 users)

**Stripe Processing:**
- 2.9% + $0.30 per transaction
- Pro: $49 × 2.9% + $0.30 = $1.71 per charge

**Total COGS per Professional customer:**
- Droplets: $18/month
- Database (share): ~$0.50/month
- Stripe fee: ~$1.71/month
- **Total: ~$20.21/month**

### Profit Per Tier

| Tier | Price | COGS | Margin | Margin % |
|------|-------|------|--------|----------|
| Starter | $0 | $6 | -$6 | N/A |
| Professional | $49 | $20 | $29 | **59%** |
| Enterprise | $1,000 | $100 | $900 | **90%** |

---

## 📊 Financial Projections

### Year 1 Conservative Forecast

**Assumptions:**
- 50 Starter users (free trial conversion funnel)
- 15 Pro conversions
- 1 Enterprise deal (Q4)

**Revenue:**
```
Pro: 15 customers × $49/month × 12 = $8,820
Enterprise: 1 customer × $2,000/month × 3 months = $6,000
Total Year 1: ~$14,820
```

**Costs:**
```
Droplets (Pro only): 15 × $18 × 12 = $3,240
Supabase: $25 × 12 = $300
Stripe fees: ~$300
Support (part-time): ~$2,000
Marketing: ~$1,000
Hosting/Other: ~$500
Total Year 1 Costs: ~$7,340
```

**Gross Profit Year 1:** ~$7,480 (50% margin)

### Growth Trajectory

**Year 2 Target:**
- 100 Starter users
- 50 Pro customers
- 3 Enterprise deals
- **Revenue: ~$80,000**

**Year 3 Target:**
- 500 Starter users
- 150 Pro customers
- 10 Enterprise deals
- **Revenue: ~$240,000+**

---

## 🚀 Launch Strategy

### Phase 1: Soft Launch (2026-04-18)
- All 3 tiers live
- Free tier default for everyone
- Pro tier offer in dashboard (CTA button)
- Enterprise: "Contact us" form

### Phase 2: Early Adoption (2026-04-18 - 2026-05-15)
- Target: Sign up first 20 free users
- Goal: Convert 3-5 to Pro
- Gather feedback on pricing/features

### Phase 3: Scale (2026-05-15+)
- Marketing push
- Feature improvements based on feedback
- Enterprise sales outreach

---

## 📋 Feature Parity & Upgrade Path

### Starter → Professional

**What's blocked:**
- 6th+ API key (Pro allows unlimited)
- 2nd+ instance creation
- Webhook access
- Advanced analytics

**What changes:**
- API request quota: 5k → 50k
- Instance count: 1 → 3
- Support: Community → Priority
- Price: $0 → $49/month

**Upgrade CTA:**
```
Modal on dashboard:
"You've reached your API key limit (1/1)
Upgrade to Professional to unlock:
  • 6+ API keys
  • 3 instances
  • Priority support
  • Webhook webhooks
  
[Upgrade Now] [Learn More]
```

### Professional → Enterprise

**What triggers conversation:**
- Approaching request limits (90%+)
- Needing >3 instances
- Compliance requirements
- Dedicated support needs

**Sales Trigger:**
```
Email on day 30 of 90% usage:
"Hey [Name],

You're crushing it! Your OpenClaw instances processed 
45k of 50k requests this month.

Ready for unlimited? Let's talk Enterprise pricing.
→ Schedule a demo
```

---

## 🎯 Pricing Page Design

### Layout
```
┌─────────────────────────────────────────────┐
│        Choose Your Plan                      │
│  (Start free, upgrade anytime)               │
└─────────────────────────────────────────────┘

[Starter]         [Professional]      [Enterprise]
  FREE               $49/month           CUSTOM
  |                  |                   |
  5k req/mo          50k req/mo          Unlimited
  1 instance         3 instances         Unlimited
  Email supp.        Priority supp.      Dedicated
  |                  |                   |
  [Get Started]      [Start Free Trial]  [Contact Sales]
                     ↓
                  (Same as Starter,
                   but charged after 14 days)
```

### Feature Comparison Table

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|-----------|
| API Requests/month | 5,000 | 50,000 | Unlimited |
| Instances | 1 | 3 | Unlimited |
| API Keys | 1 | Unlimited | Unlimited |
| Webhooks | ❌ | ✅ | ✅ |
| Custom Integrations | ❌ | ✅ | ✅ |
| Support | Community | Priority | Dedicated |
| SLA | None | None | 99.9% |
| White-label | ❌ | ❌ | ✅ |
| Price | Free | $49/mo | Custom |

---

## 💳 Payment Integration

### Stripe Setup

**Products:**
```
1. Professional Plan
   - Price: $49.00 USD/month (recurring)
   - Billing: Monthly or Annual
   - Trial: 14 days free

2. Enterprise Plan
   - Custom price (created per customer)
   - Billing: Annual or custom
```

**Webhooks:**
- `customer.subscription.created` → Create subscription record
- `customer.subscription.updated` → Update tier/limits
- `customer.subscription.deleted` → Downgrade to Free
- `invoice.paid` → Log invoice, send receipt
- `invoice.payment_failed` → Alert & retry

**Failed Payments:**
```
Day 1: Automatic retry
Day 3: Email notification
Day 7: Automatic downgrade to Starter
Day 14: Cleanup (subscription canceled)
```

---

## 📧 Email Campaigns

### Onboarding (Day 0)
```
Subject: Welcome to Laverdi! 🎉

You're now set up with the Starter plan (free).
Your instance is running at: [IP]:[PORT]

Next steps:
1. Create your first API key
2. Run a test request
3. Explore the dashboard

[Get Started Guide →]
```

### Upsell Trigger (Day 3)
```
Subject: Ready to scale?

You've created your first API key! 
Pro tip: With Professional plan, you get:
  • 10x more API requests (50k vs 5k)
  • 3 instances instead of 1
  • Priority support

[See Professional Plan →]
```

### Conversion (Day 14)
```
Subject: One more thing... 👀

Professional tier is perfect for growing teams.
Compare plans and see what fits:

[Pricing Page →]

Questions? Our support team is here to help.
```

---

## 🎁 Launch Promotions (Optional)

### Early Bird Offer
```
"Launch Special: First 50 Pro customers get 3 months free
when paying annually ($328/year instead of $470)"
```

### Referral Program
```
"Refer a friend and both get $10 credit"
(Cost: 0.2% of annual revenue for 50% growth = good ROI)
```

### Partnership Offers
```
Integrate with:
  • n8n (automation)
  • Zapier (integration)
  • Make (workflow)
  
→ Bundle discounts or co-marketing opportunities
```

---

## 📊 Metrics to Track

**Key Metrics:**
- Signups per day
- Free → Pro conversion rate (target: 10%+)
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)
- Churn rate (target: <5% monthly)
- Upgrade rate (target: 15% within 30 days)

**Dashboard Monitoring:**
```
[Stripe Dashboard]
  • Revenue this month
  • Conversion rate
  • Churn analysis
  • Upcoming renewals
```

---

## ✅ Pricing Readiness Checklist

- [ ] Stripe products created
- [ ] Stripe webhooks configured
- [ ] Pricing page designed & built
- [ ] Feature comparison table live
- [ ] Upgrade flow in dashboard
- [ ] Email templates ready
- [ ] Billing page tested
- [ ] Payment processing tested (test cards)
- [ ] Failed payment handling tested
- [ ] Cancellation flow tested
- [ ] Analytics configured
- [ ] Support escalation process documented

---

## 🎯 Success Criteria (First 30 Days)

✅ 100+ free signups  
✅ 5-10 Pro conversions  
✅ 0 critical payment issues  
✅ <1% refund rate  
✅ Pricing pages attracting organic traffic  

