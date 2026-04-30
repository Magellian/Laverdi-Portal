# Laverdi.tech OpenClaw SaaS Portal

A production-ready Next.js SaaS portal for OpenClaw subscriptions with Stripe payment integration, Supabase authentication, and comprehensive admin features.

## 🚀 Features

- **Authentication**: Email/password auth via Supabase
- **Subscriptions**: Three-tier pricing (Starter $99/mo, Professional $249/mo, Enterprise custom)
- **Payments**: Stripe Checkout integration with automatic webhook handling
- **Dashboard**: User dashboard with API key management and usage analytics
- **Email Integration**: Welcome emails with API keys and payment receipts
- **Database**: PostgreSQL via Supabase with Row Level Security
- **Admin Panel**: Basic admin dashboard with user list and usage statistics
- **Docker**: Fully containerized for VPS deployment
- **Nginx**: Reverse proxy with SSL, security headers, and rate limiting

## 📋 Prerequisites

- **Node.js** 18+ or Docker
- **Supabase** account with PostgreSQL database
- **Stripe** account with API keys
- **SendGrid** account (or SMTP server) for email

## ⚙️ Configuration

### 1. Clone and Install

```bash
git clone <repo-url>
cd laverdi-portal
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid recommended)
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@laverdi.tech

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### 3. Database Setup

#### Option A: Using Supabase Dashboard

1. Go to SQL Editor in Supabase Dashboard
2. Create a new query
3. Copy and paste the contents of `migrations/001_create_tables.sql`
4. Execute the query

#### Option B: Using Command Line

```bash
npm run db:migration
```

## 🏃 Running Locally

### Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t laverdi-portal:latest .
```

### Run with Docker Compose

1. Create `.env` file in project root with all required variables
2. Run Docker Compose:

```bash
docker-compose up -d
```

The app will be available at:
- HTTP: `http://localhost`
- HTTPS: `https://localhost` (if certificates are configured)

### Production Deployment to VPS

#### 1. Prepare Your VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/laverdi-portal
cd /opt/laverdi-portal
```

#### 2. Deploy Application

```bash
# Copy files to VPS
scp -r . root@your-vps-ip:/opt/laverdi-portal/

# SSH into VPS and start containers
ssh root@your-vps-ip
cd /opt/laverdi-portal
docker-compose up -d
```

#### 3. Configure SSL/TLS

Generate self-signed certificates (for testing):

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

For production, use Let's Encrypt via Certbot:

```bash
docker run --rm -it -v /opt/laverdi-portal/certs:/etc/letsencrypt certbot/certbot \
  certonly --standalone -d your-domain.com
```

Then update `docker-compose.yml` to mount the certificates.

#### 4. Verify Deployment

```bash
# Check running containers
docker ps

# View logs
docker-compose logs -f web

# Health check
curl http://localhost/health
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/callback` - User creation after signup

### Checkout
- `POST /api/stripe/checkout` - Create checkout session

### Webhooks
- `POST /api/stripe/webhook` - Stripe webhook handler

### Admin
- `GET /api/admin/users` - List all users (requires auth)
- `GET /api/admin/stats` - Get usage statistics (requires auth)

## 🔐 Security Features

- Row Level Security (RLS) on all database tables
- Stripe webhook signature verification
- HTTPS with HSTS headers
- X-Frame-Options and CSP headers
- Rate limiting (100 req/s for general, 1000 req/s for API)
- Non-root Docker user
- Health checks enabled

## 📈 Monitoring

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f web
```

### Database Monitoring

Monitor usage in Supabase Dashboard:
- Storage usage
- Query performance
- Real-time logs

### Application Monitoring

Implement monitoring by:
1. Adding application-level logging
2. Integrating with services like Datadog, New Relic, or Sentry
3. Setting up alerts for errors and performance issues

## 🛠️ Troubleshooting

### Docker Issues

**Port already in use:**
```bash
docker-compose down
docker system prune
docker-compose up -d
```

**Container won't start:**
```bash
docker-compose logs web
# Check environment variables in .env
```

**Database connection errors:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
- Check Supabase project is active
- Verify database tables exist

### Stripe Issues

**Webhook not working:**
- Verify `STRIPE_WEBHOOK_SECRET` is from Stripe dashboard
- Check webhook is configured to `https://your-domain.com/api/stripe/webhook`
- View webhook logs in Stripe dashboard

**Checkout session fails:**
- Verify `STRIPE_SECRET_KEY` is correct
- Check `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` matches account
- Ensure price IDs in `lib/stripe.ts` exist in Stripe account

### Email Issues

**Emails not sending:**
- Verify `SENDGRID_API_KEY` is valid
- Check `SENDGRID_FROM_EMAIL` is verified in SendGrid
- View SendGrid activity/logs for bounce/rejection reasons

## 📚 Project Structure

```
laverdi-portal/
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # User dashboard
│   ├── checkout/      # Checkout flow
│   └── index.tsx      # Landing page
├── components/        # Reusable React components
├── lib/              # Utilities and services
│   ├── supabase.ts  # Supabase client
│   ├── stripe.ts    # Stripe integration
│   ├── auth.ts      # Auth utilities
│   ├── email.ts     # Email service
│   └── api-key.ts   # API key generation
├── styles/           # Global styles
├── migrations/       # Database migrations
├── Dockerfile        # Production image
├── docker-compose.yml # Container orchestration
├── nginx.conf        # Reverse proxy config
└── README.md        # This file
```

## 🚀 Next Steps

1. **Stripe Setup**
   - Create Stripe product and prices
   - Add webhook endpoint URL to Stripe dashboard
   - Configure webhook events (checkout.session.completed, subscription updates)

2. **SendGrid Setup**
   - Create SendGrid API key
   - Verify sender email
   - Customize email templates in `lib/email.ts`

3. **Supabase Setup**
   - Enable email authentication
   - Configure email templates
   - Set up custom domain

4. **Admin Dashboard**
   - Implement proper authentication
   - Add more analytics
   - Create user management interface

5. **Testing**
   - Test complete signup flow
   - Test payment webhook
   - Test email delivery
   - Load test the application

## 📄 License

Proprietary - Laverdi.tech

## 💬 Support

For issues or questions:
- Email: support@laverdi.tech
- Website: https://laverdi.tech
