# Deployment Guide - Fife RV Admin Dashboard

Complete step-by-step instructions for deploying to production.

## Quick Start - Local Testing

```bash
cd fiferv-admin
npm install
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local
npm run build
npm start
```

Visit `http://localhost:3000`

## Deployment to 66.42.70.66

### Step 1: Prepare Your Server

SSH into your server:
```bash
ssh user@66.42.70.66
```

Install Node.js and npm (if not already installed):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should be v18+
npm --version   # Should be v8+
```

### Step 2: Setup Application Directory

```bash
# Create directory
sudo mkdir -p /var/www/fiferv-admin
sudo chown -R $USER:$USER /var/www/fiferv-admin
cd /var/www/fiferv-admin
```

### Step 3: Upload Application Files

Option A - Using Git:
```bash
git clone <your-repo-url> .
```

Option B - Using SCP:
```bash
# From your local machine
scp -r fiferv-admin/* user@66.42.70.66:/var/www/fiferv-admin/
```

Option C - Using rsync:
```bash
rsync -avz fiferv-admin/ user@66.42.70.66:/var/www/fiferv-admin/
```

### Step 4: Install Dependencies

```bash
cd /var/www/fiferv-admin
npm install --production
```

This installs only production dependencies and is much faster.

### Step 5: Configure Environment Variables

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

Replace with your actual Supabase credentials from:
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

### Step 6: Build Production Bundle

```bash
npm run build
```

This creates an optimized `.next` folder. Output should show:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (7/7)
```

### Step 7: Setup Process Manager (PM2)

Install PM2 globally:
```bash
sudo npm install -g pm2
```

Start the application:
```bash
pm2 start npm --name "fiferv-admin" -- start
```

Configure to start on reboot:
```bash
pm2 startup
pm2 save
```

Verify it's running:
```bash
pm2 list
pm2 logs fiferv-admin
```

### Step 8: Setup Nginx Reverse Proxy

Install Nginx (if not installed):
```bash
sudo apt-get install -y nginx
```

Create Nginx config:
```bash
sudo tee /etc/nginx/sites-available/fiferv-admin > /dev/null << 'EOF'
upstream fiferv_admin {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name 66.42.70.66 _;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 66.42.70.66;

    # SSL Configuration (update with your certificate paths)
    ssl_certificate /etc/letsencrypt/live/66.42.70.66/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/66.42.70.66/privkey.pem;
    
    # SSL best practices
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/fiferv-admin-access.log;
    error_log /var/log/nginx/fiferv-admin-error.log;

    # Proxy settings
    location / {
        proxy_pass http://fiferv_admin;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://fiferv_admin;
        proxy_cache_valid 7d;
        expires 7d;
    }

    # Gzip compression
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
}
EOF
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fiferv-admin /etc/nginx/sites-enabled/
```

Test configuration:
```bash
sudo nginx -t
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

### Step 9: Setup SSL Certificate (Let's Encrypt)

Install Certbot:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

Get certificate:
```bash
sudo certbot --nginx -d 66.42.70.66
```

This will:
- Issue an SSL certificate
- Auto-update the Nginx config
- Setup automatic renewal

Verify renewal works:
```bash
sudo certbot renew --dry-run
```

### Step 10: Verify Deployment

Check if everything is running:
```bash
# Check PM2
pm2 status

# Check Nginx
sudo systemctl status nginx

# Check application accessibility
curl -I https://66.42.70.66

# View logs
pm2 logs fiferv-admin
```

Visit in browser: `https://66.42.70.66`

## Monitoring & Maintenance

### View Real-time Logs
```bash
pm2 logs fiferv-admin
pm2 monit
```

### Monitor Server Resources
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### Update Dependencies
```bash
cd /var/www/fiferv-admin
npm update
npm audit fix
npm run build
pm2 restart fiferv-admin
```

### Backup & Restore

Backup application:
```bash
tar -czf fiferv-admin-backup-$(date +%Y%m%d).tar.gz /var/www/fiferv-admin
```

Restore from backup:
```bash
tar -xzf fiferv-admin-backup-20240115.tar.gz
cd /var/www/fiferv-admin
npm install --production
npm run build
pm2 restart fiferv-admin
```

## Troubleshooting

### Application not starting
```bash
# Check logs
pm2 logs fiferv-admin

# Verify environment variables
cat /var/www/fiferv-admin/.env.local

# Manual start to see errors
cd /var/www/fiferv-admin
npm start
```

### 502 Bad Gateway
```bash
# Check if Next.js is running
pm2 status

# Restart application
pm2 restart fiferv-admin

# Check Nginx logs
tail -f /var/log/nginx/fiferv-admin-error.log
```

### SSL Certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check Nginx SSL config
sudo nginx -t -c /etc/nginx/nginx.conf
```

### High memory usage
```bash
# Check memory
pm2 show fiferv-admin

# Increase heap size
pm2 start npm --name "fiferv-admin" --max_memory_restart 1G -- start

# Or in ecosystem.config.js
pm2 restart ecosystem.config.js
```

### Database connection errors
```bash
# Verify Supabase is accessible
curl -I https://your-project.supabase.co

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Restart with fresh connection
pm2 restart fiferv-admin
```

## Production Checklist

- [ ] Supabase project created and configured
- [ ] Database tables created with RLS policies
- [ ] `.env.local` configured with real credentials
- [ ] Application builds without errors (`npm run build`)
- [ ] PM2 installed and configured to start on reboot
- [ ] Nginx installed and reverse proxy configured
- [ ] SSL certificate issued and auto-renewal working
- [ ] Security headers configured in Nginx
- [ ] Firewall rules configured (port 80, 443 open)
- [ ] Database backups configured in Supabase
- [ ] Monitoring setup (PM2 logs, server metrics)
- [ ] Admin credentials secured
- [ ] Domain/IP accessible from internet
- [ ] Tested login and basic functionality
- [ ] Tested with real Supabase data

## Performance Optimization

### Enable Compression
Already configured in Nginx (see above)

### Enable Caching
```bash
# Redis caching (optional)
sudo apt-get install -y redis-server
redis-cli ping
```

### Monitor Performance
```bash
# Check response times
pm2 monit

# Check Node process
ps aux | grep node

# Check system load
uptime
```

## Security Hardening

### Update System
```bash
sudo apt-get update
sudo apt-get upgrade
```

### Configure Firewall
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Setup Fail2ban
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
```

## Automated Backups

Create backup script:
```bash
#!/bin/bash
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

tar -czf $BACKUP_DIR/fiferv-admin-$(date +%Y%m%d-%H%M%S).tar.gz \
  /var/www/fiferv-admin/.env.local \
  /var/www/fiferv-admin/package.json

# Keep last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Rollback Procedure

If deployment fails:

1. Stop current version:
```bash
pm2 stop fiferv-admin
```

2. Restore previous backup:
```bash
tar -xzf fiferv-admin-backup-previous.tar.gz
cd /var/www/fiferv-admin
npm install --production
npm run build
```

3. Restart:
```bash
pm2 restart fiferv-admin
```

## Support

For issues or questions:
1. Check logs: `pm2 logs fiferv-admin`
2. Check Nginx: `sudo nginx -t`
3. Verify Supabase connection
4. Check system resources: `free -h`, `df -h`
5. Review SSL: `sudo certbot certificates`

---

**Last Updated**: 2024
**Version**: 1.0.0
