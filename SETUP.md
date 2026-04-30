# Setup Guide - Laverdi.tech Portal

Complete step-by-step setup instructions for development and production.

## 🚀 Quick Start (Development)

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd laverdi-portal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy development env template
cp .env.local.example .env.local

# Edit with your development credentials
nano .env.local
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details
4. Wait for project to initialize
5. Note your `Project URL` and `Anon Key` from Settings > API

### Step 2: Run Migrations

#### Option A: Supabase Dashboard (Recommended)

1. Go to SQL Editor
2. Click "New query"
3. Copy contents of `migrations/001_create_tables.sql`
4. Paste into editor
5. Click "Run"

#### Option B: CLI

```bash
# Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local
npm run db:migration
```

### Step 3: Verify Schema

In Supabase Dashboard, go to Table Editor and verify:
- `users` table created
- `subscriptions` table created
- `api_keys` table created
- `usage_logs` table created

## 💳 Stripe Setup

### 1. Create Stripe Account

1. Go to https://stripe.com
2. Sign up for a Stripe account
3. Go to Dashboard > Developers

### 2. Get API Keys

1. Click "API Keys" in sidebar
2. Copy "Publishable Key" (starts with `pk_`)
3. Copy "Secret Key" (starts with `sk_`)
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 3. Create Products and Prices

1. Go to Product Catalog
2. Create products:
   - **Starter Plan** ($99/month)
   - **Professional Plan** ($249/month)
3. Note the price IDs (format: `price_xxx...`)
4. Update `lib/stripe.ts` with correct price IDs

### 4. Set Up Webhook

1. Go to Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `http://localhost:3000/api/stripe/webhook` (dev) or `https://your-domain.com/api/stripe/webhook` (prod)
4. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Reveal "Signing secret"
7. Copy to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 5. Test Stripe Integration

Use Stripe test cards:
- **Visa**: 4242 4242 4242 4242
- **Failure**: 4000 0000 0000 0002

Expiry: Any future date
CVC: Any 3 digits

## 📧 Email Setup

### Option A: SendGrid (Recommended)

1. Go to https://sendgrid.com
2. Sign up or login
3. Go to Settings > API Keys
4. Create new API Key
5. Copy to `.env.local`:
   ```env
   SENDGRID_API_KEY=SG.xxx...
   SENDGRID_FROM_EMAIL=noreply@your-domain.com
   ```
6. Verify sender email in Sender Authentication

### Option B: SMTP (Gmail, Outlook, etc.)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com
```

**Note:** For Gmail, create an App Password (not your regular password)

## 🔒 Supabase Auth Setup

### 1. Enable Email Auth

In Supabase Dashboard:

1. Go to Authentication > Providers
2. Find "Email" provider
3. Toggle "Enable Email provider"
4. Configure email templates (optional)

### 2. Configure Auth Settings

1. Go to Authentication > Policies
2. Set password requirements (8+ characters recommended)
3. Configure sign-up settings

### 3. Test Authentication

1. Visit http://localhost:3000/auth/signup
2. Create test account
3. Verify you can login

## 🧪 Testing the Complete Flow

### Manual Testing Checklist

- [ ] **Signup**: Create account on `/auth/signup`
- [ ] **Login**: Sign in on `/auth/login`
- [ ] **Dashboard**: Access `/dashboard` while logged in
- [ ] **Pricing**: View `/` and click pricing cards
- [ ] **Checkout**: Initiate checkout with test Stripe card
- [ ] **Webhook**: Verify subscription created in database
- [ ] **Email**: Check that welcome email was sent
- [ ] **API Keys**: Generate new API key in dashboard
- [ ] **Settings**: Change password
- [ ] **Logout**: Sign out and verify redirect

## 📊 Admin Dashboard

### Access Admin Features

```bash
# Fetch user list
curl http://localhost:3000/api/admin/users

# Get usage statistics
curl http://localhost:3000/api/admin/stats
```

**Note:** Implement proper authentication before production!

## 🚢 Production Deployment

See `DEPLOYMENT.md` for complete VPS deployment instructions.

### TL;DR

1. Prepare VPS with Docker
2. Set production `.env` variables
3. Configure SSL/TLS certificates
4. Run `docker-compose up -d`
5. Configure Stripe webhook to production URL
6. Test complete flow

## 🐛 Troubleshooting

### Database errors

```bash
# Check Supabase connection
curl NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# Verify migrations ran
# Check Supabase Dashboard > Table Editor
```

### Stripe errors

- Verify API keys are in `.env`
- Check webhook secret matches Stripe dashboard
- View webhook attempts in Stripe > Developers > Webhooks

### Email not sending

- Verify SendGrid API key
- Check sender email is verified
- View SendGrid Activity > Logs

### Auth not working

- Clear browser cookies and cache
- Verify Supabase URL and keys
- Check Supabase > Authentication > Users

## 📚 Next Steps

1. Customize email templates in `lib/email.ts`
2. Add company logo and branding
3. Customize error pages
4. Set up analytics (Vercel, Google Analytics)
5. Configure custom domain
6. Set up monitoring and alerts
7. Create admin dashboard UI
8. Implement API key usage tracking
9. Add support chat
10. Create knowledge base/docs

## 💬 Getting Help

- Documentation: See `README.md` and `DEPLOYMENT.md`
- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.io/docs
- Next.js Docs: https://nextjs.org/docs
- Discord Community: (Add your community link)

## 🎯 Important Notes

- **Never commit secrets** to git (.env files)
- **Use test keys** in development, live keys in production
- **Always enable HTTPS** in production
- **Set up monitoring** before launch
- **Test the complete flow** end-to-end
- **Have a backup plan** for database and payments

Good luck! 🚀
