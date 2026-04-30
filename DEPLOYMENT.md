# Deployment Guide - Laverdi.tech Portal

This guide covers deployment to a VPS using Docker and Docker Compose.

## Prerequisites

- VPS with Docker and Docker Compose installed
- Domain name pointing to VPS IP
- Stripe account with API keys
- Supabase account with credentials
- SendGrid account with API key

## Step 1: Prepare Your VPS

### Install Docker and Docker Compose

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Create Application Directory

```bash
# Create and navigate to app directory
sudo mkdir -p /opt/laverdi-portal
cd /opt/laverdi-portal

# Set proper permissions
sudo chown -R $USER:$USER /opt/laverdi-portal
```

## Step 2: Deploy Application

### Copy Files to VPS

```bash
# From your local machine
scp -r . root@YOUR_VPS_IP:/opt/laverdi-portal/
```

Or if using a Git repository:

```bash
# On VPS
cd /opt/laverdi-portal
git clone YOUR_REPO_URL .
```

### Configure Environment Variables

```bash
# On VPS
cd /opt/laverdi-portal
cp .env.example .env

# Edit .env with your production values
nano .env
```

**Critical Environment Variables:**

```env
# HTTPS/TLS
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Supabase (as provided)
NEXT_PUBLIC_SUPABASE_URL=https://dcvrkpgvxqdcboostkpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe (from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SendGrid recommended)
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@your-domain.com
```

## Step 3: Set Up SSL/TLS

### Option A: Using Let's Encrypt (Recommended)

```bash
# On VPS, install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/key.pem
sudo chown $USER:$USER ./certs/*
```

### Option B: Self-Signed Certificate (Testing Only)

```bash
# Create cert directory
mkdir -p ./certs

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout ./certs/key.pem -out ./certs/cert.pem -days 365 -nodes
```

## Step 4: Start Services

```bash
# On VPS, in /opt/laverdi-portal
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f web
```

## Step 5: Database Setup

### Apply Migrations

```bash
# From inside the app or via Supabase Dashboard
# Option 1: Via dashboard
# 1. Go to Supabase SQL Editor
# 2. Create new query
# 3. Paste migrations/001_create_tables.sql
# 4. Execute

# Option 2: Via CLI (if configured)
npm run db:migration
```

## Step 6: Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Reveal signing secret
7. Copy to `.env` as `STRIPE_WEBHOOK_SECRET`
8. Restart container: `docker-compose restart web`

## Step 7: Verify Deployment

```bash
# Check application
curl https://your-domain.com/

# Check health endpoint
curl https://your-domain.com/health

# Verify API is working
curl -X GET https://your-domain.com/api/admin/stats

# Check logs
docker-compose logs -f web
docker-compose logs -f nginx
```

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f nginx
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart web
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps
```

### Backup Database

```bash
# Backup via Supabase Dashboard
# Settings > Database > Backups > Create backup

# Or via CLI if configured
pg_dump --no-acl --no-owner your_database > backup.sql
```

## Troubleshooting

### Container won't start

```bash
# View detailed logs
docker-compose logs web

# Check environment variables
docker-compose config

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid
- Ensure Supabase project is active
- Verify database tables exist

### SSL/TLS issues

```bash
# Check certificate validity
openssl x509 -in certs/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/key.pem

# Restart nginx
docker-compose restart nginx
```

### Stripe webhook failures

- Verify webhook URL is correct and accessible
- Check webhook secret in `.env` matches Stripe dashboard
- View webhook events in Stripe Dashboard > Developers > Webhooks
- Check application logs for errors

### Email not sending

- Verify SendGrid API key is valid
- Check sender email is verified in SendGrid
- View SendGrid activity log for bounce/rejection reasons
- Test with manual email send

## Performance Optimization

### Scale Containers

```bash
# Increase web service replicas in docker-compose.yml
version: '3.8'
services:
  web:
    # ... existing config
    deploy:
      replicas: 3
```

### Enable Caching

Update `nginx.conf` with aggressive caching headers:

```nginx
location ~* \.(js|css|png|jpg|jpeg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Database Optimization

- Enable Supabase connection pooling
- Set up indexes on frequently queried columns
- Monitor slow queries in Supabase dashboard

## Security Hardening

### Firewall Configuration

```bash
# On VPS
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw default deny incoming
```

### Regular Updates

```bash
# Update OS
sudo apt-get update
sudo apt-get upgrade -y

# Update Docker images
docker pull node:18-alpine
docker-compose build --no-cache
docker-compose up -d
```

### Secrets Management

- Never commit `.env` to git
- Use `.env.example` for configuration template
- Rotate API keys regularly
- Use strong, unique passwords

## Support

For deployment issues:
- Check Docker logs: `docker-compose logs -f`
- Review Stripe webhook events: https://dashboard.stripe.com/developers/webhooks
- Check Supabase logs: Supabase Dashboard > Logs
- Monitor application health: `curl https://your-domain.com/health`

Email: support@laverdi.tech
