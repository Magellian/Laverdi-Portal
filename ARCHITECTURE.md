# Architecture - Laverdi.tech Portal

Technical architecture and system design documentation.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │   Landing    │  │  Auth Pages  │  │   Dashboard    │   │
│  │    (Home)    │  │ (Signup/Login)│ │  (User Portal) │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP/HTTPS (TLS 1.2+)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Reverse Proxy Layer                        │
│              (Nginx - SSL/TLS + Rate Limiting)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Application Layer                          │
│            (Next.js 14 + TypeScript)                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Pages & Components                      │  │
│  │  • Pages: / (home), /auth/*, /dashboard/*           │  │
│  │  • Components: Navbar, Footer, PricingCard          │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │            API Routes (Backend Logic)               │  │
│  │  • /api/auth/callback - User creation               │  │
│  │  • /api/stripe/checkout - Payment initiation        │  │
│  │  • /api/stripe/webhook - Payment notifications      │  │
│  │  • /api/admin/* - Admin endpoints                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │           Services & Libraries                      │  │
│  │  • supabase.ts - Database & Auth client             │  │
│  │  • stripe.ts - Payment processing                   │  │
│  │  • email.ts - Email notifications                   │  │
│  │  • auth.ts - Authentication helpers                 │  │
│  │  • api-key.ts - API key generation                  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
        ▼                  ▼                  ▼
    Supabase          Stripe API        Email Service
   (Database)       (Payments)        (SendGrid/SMTP)
   PostgreSQL       - Checkout      - Welcome Emails
   Auth             - Webhooks      - Receipts
   RLS              - Subscriptions  - Notifications
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: TailwindCSS
- **Icons**: SVG (inline)
- **Client Libraries**: 
  - `@supabase/supabase-js` - Database & auth
  - `@stripe/stripe-js` - Stripe client

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (JWT)
- **Payments**: Stripe API
- **Email**: SendGrid or Nodemailer

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Nginx
- **Hosting**: VPS (any provider)
- **SSL/TLS**: Let's Encrypt or self-signed

## Database Schema

### Tables

#### `users`
```sql
id: UUID (PK, FK to auth.users)
email: VARCHAR
tier: VARCHAR (starter | professional | enterprise)
api_key: VARCHAR (unique)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `subscriptions`
```sql
id: UUID (PK)
user_id: UUID (FK)
stripe_subscription_id: VARCHAR (unique)
stripe_customer_id: VARCHAR
status: VARCHAR (active | past_due | canceled)
current_period_start: TIMESTAMP
current_period_end: TIMESTAMP
cancel_at_period_end: BOOLEAN
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### `api_keys`
```sql
id: UUID (PK)
user_id: UUID (FK)
key: VARCHAR (unique)
name: VARCHAR
last_used_at: TIMESTAMP
created_at: TIMESTAMP
expires_at: TIMESTAMP
active: BOOLEAN
```

#### `usage_logs`
```sql
id: UUID (PK)
user_id: UUID (FK)
endpoint: VARCHAR
method: VARCHAR (GET | POST | PUT | DELETE)
status_code: INTEGER
response_time_ms: INTEGER
timestamp: TIMESTAMP
```

### Security Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Indexes**: On frequently queried columns for performance
- **Triggers**: Auto-update `updated_at` timestamps
- **Functions**: Utility functions for business logic

## API Routes

### Authentication (`/api/auth/`)
- `POST /callback` - Create user profile after signup

### Payments (`/api/stripe/`)
- `POST /checkout` - Initiate checkout session
- `POST /webhook` - Handle Stripe events

### Admin (`/api/admin/`)
- `GET /users` - List all users (requires auth)
- `GET /stats` - Usage statistics (requires auth)

## Authentication Flow

```
User → Signup Form
         │
         ▼
Supabase Auth (Create User)
         │
         ▼
API Callback (/api/auth/callback)
         │
         ▼
Create User Profile in DB
         │
         ▼
Redirect to Dashboard
```

## Payment Flow

```
User → Pricing Page
         │
         ▼
Select Plan → Click "Get Started"
         │
         ▼
POST /api/stripe/checkout
         │
         ▼
Stripe (Create Checkout Session)
         │
         ▼
Redirect to Stripe Checkout
         │
         ▼
User enters payment details
         │
         ▼
Stripe Webhook (checkout.session.completed)
         │
         ▼
POST /api/stripe/webhook
         │
         ▼
1. Create subscription record
2. Update user tier
3. Generate API key
4. Send welcome email
         │
         ▼
Redirect to /checkout/success
         │
         ▼
Redirect to /dashboard
```

## Environment Architecture

### Development
- Local Node.js development server
- Supabase project (dev instance)
- Stripe test keys
- Local or test email service

### Production
- Docker containers
- Load balancer/Nginx
- Supabase project (prod instance)
- Stripe live keys
- SendGrid or production SMTP
- SSL/TLS with Let's Encrypt

## Security Architecture

### Network Security
- HTTPS/TLS 1.2+ enforced
- Nginx security headers (HSTS, X-Frame-Options, etc.)
- Rate limiting per IP
- CORS configured

### Application Security
- Environment variables for secrets
- JWT tokens from Supabase
- Stripe webhook signature verification
- API key validation
- SQL injection prevention (via Supabase client)

### Data Security
- Row Level Security policies
- Password hashing (Supabase handles)
- Encrypted transmission (TLS)
- Backups via Supabase
- No sensitive data in logs

## Scaling Considerations

### Horizontal Scaling
- Multiple Docker containers behind load balancer
- Connection pooling for database
- CDN for static assets
- Caching layer (Redis optional)

### Vertical Scaling
- Increase container resources
- Database connection optimization
- Query optimization and indexing
- Caching strategies

### Performance Optimization
- Next.js optimizations (code splitting, SSR)
- Image optimization
- CSS/JS minification
- Database indexing
- API response caching
- Gzip compression

## Monitoring & Observability

### Application Metrics
- API response times
- Error rates
- Database query performance
- User signup/conversion rates

### Infrastructure Metrics
- Container health
- CPU/Memory usage
- Disk space
- Network bandwidth

### Logging
- Application logs (Docker)
- Nginx access/error logs
- Database logs (Supabase)
- Stripe webhook logs

### Alerting
- Container failures
- High error rates
- High response times
- Database issues
- Payment failures

## Disaster Recovery

### Backup Strategy
- Supabase automated backups
- Daily snapshots (Supabase)
- Data export for archive

### Recovery Procedures
- Database restore from backup
- Code rollback via Git
- Container restart procedures
- DNS failover (if applicable)

### RTO/RPO Goals
- **RTO**: < 1 hour (restore time objective)
- **RPO**: < 1 hour (recovery point objective)

## Cost Optimization

### Development
- Free tier services where possible
- Shared Supabase project
- Stripe test mode
- Local development environment

### Production
- Optimize container sizing
- Database connection pooling
- Caching to reduce API calls
- Reserved pricing for VPS
- Monitor and alert on usage

## Compliance & Standards

### Standards
- REST API design
- HTTPS/TLS 1.2+
- JWT authentication
- Webhooks for async operations

### Compliance
- GDPR considerations
- Data retention policies
- Payment Card Industry (PCI) compliance via Stripe
- Audit logging

## Deployment Strategy

### CI/CD Pipeline
1. Code push to GitHub
2. Run tests
3. Build Docker image
4. Push to registry
5. Deploy to VPS
6. Health checks
7. Rollback if needed

### Staging Environment
- Replicate production setup
- Test migrations
- Test payments
- Verify email delivery

### Production Deployment
- Blue-green deployment (optional)
- Rolling updates
- Health monitoring
- Automated rollback

## Future Enhancements

### Phase 2
- API rate limiting per tier
- Advanced analytics dashboard
- Custom branding options
- Multi-tenant support

### Phase 3
- Marketplace for integrations
- Webhook event delivery
- WebSocket for real-time updates
- GraphQL API

### Phase 4
- Machine learning recommendations
- Advanced security features
- Enterprise SSO
- Dedicated infrastructure
