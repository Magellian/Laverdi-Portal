# Phase 1: NGINX SSL Certificate Mounting - CRITICAL FIX
**Estimated Time:** 1-2 hours  
**Priority:** 🔴 CRITICAL - Production HTTPS not working  
**Date:** 2026-04-17

---

## Overview

The Laverdi Portal is currently serving HTTP only after a Docker storage migration. SSL certificates exist on the VPS host at `/etc/letsencrypt/` but are not mounted into the nginx container. This checklist fixes that.

---

## Prerequisites

- [ ] SSH access to VPS host
- [ ] Docker Compose running
- [ ] Let's Encrypt certificates already issued for `laverdi.tech`
- [ ] Current nginx.conf backed up (if making direct edits)

---

## STEP-BY-STEP EXECUTION

### Step 1: Verify Certificates Exist on Host (5 min)
**Location:** `C:\Users\chris\Desktop\workspace\src\laverdi-portal`

```bash
# SSH to VPS
ssh user@laverdi-vps

# Check certificate files
ls -la /etc/letsencrypt/live/laverdi.tech/
```

**Expected Output:**
```
-rw-r--r-- 1 root root 2000 Apr 10 12:00 fullchain.pem
-rw-r--r-- 1 root root 1234 Apr 10 12:00 privkey.pem
-rw-r--r-- 1 root root 1700 Apr 10 12:00 cert.pem
-rw-r--r-- 1 root root 890  Apr 10 12:00 chain.pem
```

**Status:** ✓ Exists | ✗ Missing (if missing, issue new cert with certbot)

---

### Step 2: Update docker-compose.yml (5 min)

**File:** `docker-compose.yml`

**Find this section:**
```yaml
  # Optional: Nginx reverse proxy for production
  nginx:
    image: nginx:alpine
    container_name: laverdi-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - web
    restart: unless-stopped
```

**Replace with:**
```yaml
  # Optional: Nginx reverse proxy for production
  nginx:
    image: nginx:alpine
    container_name: laverdi-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro  # ← ADD THIS LINE
    depends_on:
      - web
    restart: unless-stopped
```

**What Changed:**
- Added `- /etc/letsencrypt:/etc/letsencrypt:ro` to mount the host's cert directory into the container
- `:ro` = read-only (nginx can't modify certs)

**Verification:** File edited correctly ✓

---

### Step 3: Enable HTTPS in nginx.conf (10 min)

**File:** `nginx.conf`

**Find the commented HTTPS block (lines ~40-50):**
```nginx
    # HTTPS server (disabled temporarily - using HTTP for now)
    # server {
    #     listen 443 ssl;
    #     http2 on;
    #     server_name _;
    #
    #     # SSL configuration
    #     ssl_certificate /etc/letsencrypt/live/laverdi.tech/fullchain.pem;
    #     ssl_certificate_key /etc/letsencrypt/live/laverdi.tech/privkey.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers HIGH:!aNULL:!MD5;
    #     ssl_prefer_server_ciphers on;
```

**Replace with:**
```nginx
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/laverdi.tech/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/laverdi.tech/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

        # Rate limiting
        limit_req zone=general burst=20 nodelay;

        location / {
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
            proxy_connect_timeout 60s;
        }

        # API endpoint with higher rate limit
        location /api/ {
            limit_req zone=api burst=100 nodelay;
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
            proxy_connect_timeout 60s;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://web;
            proxy_cache_valid 200 30d;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
        }
    }
```

**What Changed:**
- Uncommented entire HTTPS server block
- Changed `listen 443 ssl;` + `http2 on;` to `listen 443 ssl http2;`
- Added `X-Forwarded-Proto` header for proper protocol detection
- Kept all security headers (HSTS, etc.)

**Now find and REMOVE the temporary HTTP server (lines ~60+):**
```nginx
    # Temporary HTTP server  ← DELETE FROM HERE
    server {
        listen 80;
        http2 on;
        ...
    }                          ← TO HERE
```

**Final check:** 
- HTTPS server block present and uncommented ✓
- Temporary HTTP server removed ✓
- SSL paths correct (`/etc/letsencrypt/live/laverdi.tech/fullchain.pem` exists) ✓
- HTTP server on port 80 still exists (for redirect) ✓

---

### Step 4: Restart Containers (5 min)

```bash
# SSH to VPS
ssh user@laverdi-vps

# Navigate to project
cd /path/to/laverdi-portal

# Stop containers
docker-compose down

# Start containers
docker-compose up -d

# Wait 5 seconds for startup
sleep 5

# Check nginx status
docker-compose logs nginx
```

**Expected logs:**
```
laverdi-nginx | nginx: configuration test is successful
laverdi-nginx | 2026/04/17 13:25:01 [notice] 1#1: signal process started
```

**If errors:**
```
# Check config syntax
docker-compose exec nginx nginx -t

# View detailed logs
docker-compose logs --tail=50 nginx
```

**Status:** ✓ Containers up | ✗ Errors (fix and retry)

---

### Step 5: Test HTTPS Access (5 min)

**From VPS or local machine:**

```bash
# Test HTTPS connection
curl -I https://laverdi.tech

# Expected output:
# HTTP/2 200
# server: nginx/1.25.0
# strict-transport-security: max-age=31536000; includeSubDomains
```

**Test with verbose SSL details:**
```bash
curl -vI https://laverdi.tech 2>&1 | grep -A 5 "SSL"

# Should show:
# SSL certificate verify ok
# issuer: C=US; O=Let's Encrypt; CN=R3
# expire date: Apr 17 12:00:00 2027 GMT
```

**Test HTTP redirect:**
```bash
curl -I http://laverdi.tech

# Expected: 301 redirect to https://laverdi.tech
```

**Browser Test:**
- Open https://laverdi.tech in browser
- Check for 🔒 lock icon (not ⚠️ warning)
- Verify no mixed content warnings (F12 → Console)
- Page should load without SSL errors

**Status:** ✓ HTTPS working | ✗ Errors (troubleshoot below)

---

## TROUBLESHOOTING

### Problem: "Connection refused" on HTTPS
```bash
# Check if port 443 is listening
sudo netstat -tlnp | grep 443

# Check firewall
sudo ufw status
sudo ufw allow 443/tcp

# Restart nginx
docker-compose restart nginx
```

### Problem: "Certificate verify failed"
```bash
# Verify cert file exists in container
docker-compose exec nginx ls -la /etc/letsencrypt/live/laverdi.tech/

# If missing: Volume mount failed. Check docker-compose.yml
docker-compose down
# Fix docker-compose.yml
docker-compose up -d
```

### Problem: "SSL: CERTIFICATE_VERIFY_FAILED" or SSL handshake errors
```bash
# Check certificate dates
openssl x509 -in /etc/letsencrypt/live/laverdi.tech/fullchain.pem -text -noout | grep -A 2 "Validity"

# If expired, renew
certbot renew --force-renewal

# Restart nginx
docker-compose restart nginx
```

### Problem: Mixed content warnings (some resources over HTTP)
```bash
# Check for hardcoded http:// in Next.js pages
grep -r "http://" lib/ pages/ components/

# Fix any http:// references to use https:// or protocol-relative //
```

---

### Step 6: Document for Future Deployments (10 min)

**Create file:** `DEPLOYMENT_SSL.md` in project root

```markdown
# SSL Certificate Management

## Certificate Location
- **Host path:** `/etc/letsencrypt/live/laverdi.tech/`
- **Container path:** `/etc/letsencrypt/` (read-only mount)
- **Files:**
  - `fullchain.pem` - Full certificate chain
  - `privkey.pem` - Private key

## Docker Compose Configuration
Ensure `docker-compose.yml` includes:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

## NGINX Configuration
- HTTPS server block listens on port 443 with `ssl http2`
- Certificate paths in `nginx.conf`:
  ```nginx
  ssl_certificate /etc/letsencrypt/live/laverdi.tech/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/laverdi.tech/privkey.pem;
  ```
- HTTP port 80 redirects to HTTPS

## Renewal Process
Let's Encrypt certificates expire every 90 days. Renewal is automated via certbot cron job.

### Manual Renewal (if auto fails)
```bash
sudo certbot renew --force-renewal

# Reload nginx to pick up new certs
docker-compose restart nginx
```

### Check Expiration
```bash
openssl x509 -in /etc/letsencrypt/live/laverdi.tech/fullchain.pem -text -noout | grep "Not After"
```

## Monitoring
Watch certificate expiration with:
```bash
# Check from VPS
certbot certificates

# Check from container
curl https://laverdi.tech -v 2>&1 | grep "expire date"
```

## Troubleshooting

### HTTPS not working after deploy
1. Verify host directory exists: `/etc/letsencrypt/live/laverdi.tech/`
2. Verify docker-compose.yml has volume mount for `/etc/letsencrypt`
3. Check nginx.conf paths are correct
4. Restart: `docker-compose down && docker-compose up -d`

### Certificate warnings
- Check certificate not expired: `openssl x509 -in ... -text`
- Check certificate matches domain: `openssl x509 -noout -text | grep -A1 "Subject Alternative Name"`
- Force renewal if needed: `certbot renew --force-renewal`
```

**Status:** ✓ Documentation created | ✗ Need to add

---

## POST-DEPLOYMENT CHECKLIST

- [ ] HTTPS accessible at https://laverdi.tech
- [ ] SSL certificate valid (verified with curl/browser)
- [ ] HTTP → HTTPS redirect working
- [ ] No mixed content warnings
- [ ] Security headers present (HSTS, CSP, etc.)
- [ ] `DEPLOYMENT_SSL.md` created
- [ ] Team notified of HTTPS availability
- [ ] Update documentation/status page if needed
- [ ] Monitor nginx logs for errors: `docker-compose logs -f nginx`

---

## ROLLBACK PLAN

If something breaks:

```bash
# Revert docker-compose.yml
git checkout docker-compose.yml

# Revert nginx.conf  
git checkout nginx.conf

# Restart containers
docker-compose down
docker-compose up -d

# Verify HTTP still works
curl -I http://laverdi.tech
```

---

## Success Indicators

✅ **Phase 1 Complete When:**
1. `curl -I https://laverdi.tech` returns HTTP/2 200
2. Browser shows 🔒 lock icon at https://laverdi.tech
3. No SSL/certificate errors in logs
4. HTTP automatically redirects to HTTPS
5. Security headers present in response

---

**Completion Time:** ~1-2 hours  
**Status:** Ready to Execute  
**Next:** Phase 2 (Molty Animation) after Phase 1 deployed
