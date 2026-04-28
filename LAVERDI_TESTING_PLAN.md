# Laverdi Portal - Signup & Dashboard Testing Plan

**Date:** 2026-04-15  
**Status:** Ready to test  
**Issue:** create-profile API fails silently, need to debug + fix

---

## Phase 1: Signup Flow Testing

### 1.1 Email + Password Signup
- **Entry Point:** `pages/auth/signup.tsx`
- **URL:** http://localhost:3000/auth/signup
- **Form Fields:** email, password, confirmPassword
- **Validations:**
  - ✅ Passwords match
  - ✅ Password >= 8 chars
  - ✅ Valid email format (built-in HTML5)
- **Expected Flow:**
  1. User submits form
  2. `signUp(email, password)` calls Supabase auth
  3. On success, calls `/api/auth/create-profile`
  4. Redirects to `/auth/login?signup=success`

### 1.2 Profile Creation (create-profile API)
- **Endpoint:** `POST /api/auth/create-profile`
- **Request:** `{ userId: string, email: string }`
- **Response:** `{ success: true, apiKey: string }` or error
- **Database Action:**
  - Checks if user profile exists in `users` table
  - If not, inserts: `{ id, email, tier: 'starter', api_key }`
  
**⚠️ KNOWN ISSUE:** Uses `supabaseAdmin` (service role) which may fail silently
- The signup page logs error but continues (console.error)
- User auth is created, but profile row may not exist
- Dashboard load will fail with "user profile not found"

### 1.3 Login After Signup
- **Entry Point:** `pages/auth/login.tsx`
- **Flow:**
  1. User enters email + password
  2. Calls Supabase auth
  3. Fetches user profile from `users` table
  4. Redirects to `/dashboard` if successful

---

## Phase 2: Dashboard Development

### 2.1 Dashboard Page (`pages/dashboard/index.tsx`)
Current features:
- ✅ User info card (email, plan, member since)
- ✅ API key display (masked/unmasked toggle)
- ✅ Instance status (provisioning/ready/failed)
- ✅ Usage meter (API requests)
- ✅ Quick action links

**TODO:** 
- [ ] Add server setup wizard (for first-time users)
- [ ] Real instance provisioning (DigitalOcean droplet creation)
- [ ] Webhook status indicator
- [ ] Recent activity log
- [ ] Billing summary card

### 2.2 Sub-pages to Develop
1. **API Keys** (`pages/dashboard/api-keys.tsx`)
   - List API keys with creation date, usage
   - Ability to create/rotate/revoke keys
   
2. **Billing** (`pages/dashboard/billing.tsx`)
   - Invoices list
   - Payment method management
   - Usage-based pricing display
   
3. **Settings** (`pages/dashboard/settings.tsx`)
   - Update email/password
   - Notification preferences
   - Account deletion option
   
4. **Subscription** (`pages/dashboard/subscription.tsx`)
   - Current plan details
   - Upgrade/downgrade options
   - Usage limits per tier

---

## Phase 3: Testing Checklist

### 3.1 Signup Test
- [ ] Go to http://localhost:3000/auth/signup
- [ ] Enter: test@example.com / testpass123 / testpass123
- [ ] Check browser console for any errors
- [ ] Verify redirect to login page
- [ ] Check Supabase auth_users table for new user
- [ ] Check Supabase users table for new profile row
- [ ] Log in with created credentials

### 3.2 Dashboard Test
- [ ] Load dashboard after login
- [ ] Verify user data displays (email, plan, member since)
- [ ] Verify API key is visible/maskable
- [ ] Check instance status section
- [ ] Verify usage meter displays
- [ ] Click each action link (API Keys, Settings, Billing, Docs)

### 3.3 Profile Creation Debugging
If create-profile fails:
1. Check Supabase admin client config in `.env.production`
2. Verify service role key has INSERT permission on `users` table
3. Check `users` table schema (should have id, email, tier, api_key, created_at)
4. Manually insert test user via Supabase dashboard SQL

---

## Phase 4: Pricing & Marketing Preparation

### 4.1 Pricing Model
- **Starter:** Free / $0/mo
  - 5,000 API requests/month
  - 1 OpenClaw instance
  - Email support
  
- **Professional:** $49/mo
  - 50,000 API requests/month
  - 3 OpenClaw instances
  - Priority support
  - Custom integrations
  
- **Enterprise:** Custom pricing
  - Unlimited API requests
  - Unlimited instances
  - Dedicated support
  - SLA guarantee

### 4.2 Cost Analysis
**DigitalOcean Droplets (per customer instance):**
- Small droplet: $6/month
- Medium droplet: $12/month
- Large droplet: $24/month

**Supabase (shared across all customers):**
- ~$25/month for database + auth
- Scale as needed

**Stripe Processing:**
- 2.9% + $0.30 per transaction

### 4.3 Imagery & Marketing
- [ ] Screenshot dashboard
- [ ] Create feature comparison table
- [ ] Write value prop copy
- [ ] Design pricing page
- [ ] Create demo video / GIF

---

## Current Status

✅ Landing page: https://laverdi.tech (loads)  
✅ Stripe keys: Configured in portal  
⚠️ Signup flow: Ready but needs profile creation fix  
⏳ Dashboard: Needs development  
❌ API Keys page: Needs development  
❌ Billing page: Needs development  
❌ Settings page: Needs development  
❌ Pricing page: Needs design  

---

## Next Steps

1. **Debug create-profile** (find why it's failing)
2. **Test signup → login → dashboard** flow
3. **Develop dashboard sub-pages** (API keys, billing, settings)
4. **Finalize pricing tiers** & create pricing page
5. **Gather marketing assets** (screenshots, copy, imagery)
6. **Create marketing plan** for launch
7. **Go live** on laverdi.tech
8. **Advertise** on relevant channels

