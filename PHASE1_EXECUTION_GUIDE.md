# PHASE 1: NGINX SSL CERTIFICATE MOUNTING - EXECUTION GUIDE

**Status:** READY TO EXECUTE  
**Estimated Time:** 1-2 hours  
**Priority:** CRITICAL (Production HTTPS not working)  
**Date:** 2026-04-17

---

## PROBLEM STATEMENT

After Docker storage migration, HTTPS is not working on laverdi.tech. The Let's Encrypt certificates exist on the VPS host at `/etc/letsencrypt/live/laverdi.tech/` but are not mounted into the nginx container.

**Current State:**
- ❌ HTTPS not accessible
- ❌ SSL certificate not mounted
- ❌ nginx.conf has HTTPS disabled
- ❌ docker-compose.yml missing volume mount

**Target State:**
- ✅ HTTPS accessible at https://laverdi.tech
- ✅ SSL certificate mounted and accessible to nginx
- ✅ HTTP redirects to HTTPS
- ✅ Security headers configured

---

## PREREQUISITES

Before starting, verify you have:
- [ ] SSH access to VPS host
- [ ] Docker Compose running on VPS
- [ ] Let's Encrypt certificates at `/etc/letsencrypt/live/laverdi.tech/`
- [ ] Current nginx.conf backed up (for rollback)

---

## STEP 1: VERIFY CERTIFICATES ON HOST (5 MIN)

**SSH to VPS:**
```bash
ssh user@laverdi-vps
# OR if using key
ssh -i /path/to/key user@laverdi-vps
```

**Check certificate files:**
```bash
ls -la /etc/letsencrypt/live/laverdi.tech/
```

**Expected output:**
```
-rw-r--r-- 1 root root 2000 Apr 10 12:00 fullchain.pem
-rw-r--r-- 1 root root 1234 Apr 10 12:00 privkey.pem
-rw-r--r-- 1 root root 1700 Apr 10 12:00 cert.pem
-rw-r--r-- 1 root root 890  Apr 10 12:00 chain.pem
```

**If certificates don't exist:**
```bash
# Issue new certificates with certbot
sudo certbot certonly --standalone -d laverdi.tech

# Or renew existing
sudo certbot renew --force-renewal
```

✅ **Status Check:** Certificates exist and readable

---

## STEP 2: UPDATE docker-compose.yml (5 MIN)

**File Location:** `/root/laverdi-portal/docker-compose.yml`

**Current nginx section:**
```yaml
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

**Updated nginx section (ADD the /etc/letsencrypt mount):**
```yaml
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

**What we changed:**
- Added `- /etc/letsencrypt:/etc/letsencrypt:ro` to mount host certificates into container
- `:ro` flag = read-only (nginx can read but not modify)
- This allows nginx to access `/etc/letsencrypt/live/laverdi.tech/` inside the container

**To apply changes:**
```bash
# Navigate to project
cd /root/laverdi-portal

# Save the updated file (use your editor)
# nano docker-compose.yml
# OR
# vi docker-compose.yml
```

✅ **Status Check:** docker-compose.yml updated with /etc/letsencrypt mount

---

## STEP 3: ENABLE HTTPS IN nginx.conf (10 MIN)

**File Location:** `/root/laverdi-portal/nginx.conf`

**Find the commented HTTPS server block** (should be around lines 40-80):

**BEFORE (commented out):**
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

**AFTER (uncommented and configured):**
```nginx
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
        }
    }
```

**Key changes:**
- Uncommented entire server block
- Changed `listen 443 ssl;` to `listen 443 ssl http2;` (enables HTTP/2)
- Added `X-Forwarded-Proto` header for proper protocol detection
- Added security headers (HSTS, CSP, etc.)

**Keep existing HTTP server:**
```nginx
    server {
        listen 80;
        server_name _;
        
        # Redirect all HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
```

✅ **Status Check:** nginx.conf updated with HTTPS configuration

---

## STEP 4: RESTART DOCKER CONTAINERS (5 MIN)

**Navigate to project:**
```bash
cd /root/laverdi-portal
```

**Stop and start containers:**
```bash
# Stop all containers
docker-compose down

# Start containers
docker-compose up -d

# Wait for startup
sleep 5

# Check logs
docker-compose logs nginx
```

**Expected output in logs:**
```
laverdi-nginx | nginx: configuration test is successful
laverdi-nginx | 2026/04/17 13:25:01 [notice] 1#1: master process started
```

**If you see errors:**
```bash
# Check nginx configuration syntax
docker-compose exec nginx nginx -t

# View detailed error logs
docker-compose logs --tail=50 nginx
```

✅ **Status Check:** Containers restarted successfully

---

## STEP 5: TEST HTTPS ACCESS (10 MIN)

**Test 1: HTTPS Certificate Verification**
```bash
# From VPS or local machine
curl -I https://laverdi.tech

# Expected output:
# HTTP/2 200
# server: nginx/1.25.0
# strict-transport-security: max-age=31536000; includeSubDomains
# date: Thu, 17 Apr 2026 13:30:00 GMT
```

**Test 2: Verbose SSL Details**
```bash
curl -vI https://laverdi.tech 2>&1 | grep -A 5 "SSL"

# Should show:
# SSL certificate verify ok
# issuer: C=US; O=Let's Encrypt; CN=R3
# expire date: Apr 17 12:00:00 2027 GMT
```

**Test 3: HTTP Redirect**
```bash
curl -I http://laverdi.tech

# Expected: 301 redirect
# Location: https://laverdi.tech
```

**Test 4: Browser Test**
- Open https://laverdi.tech in browser
- Check for 🔒 lock icon (not ⚠️ warning)
- Open DevTools (F12 → Console)
- Verify no "mixed content" warnings
- Check Security tab for certificate info

✅ **Status Check:** HTTPS working, certificate valid, no errors

---

## STEP 6: DOCUMENT FOR FUTURE DEPLOYMENTS (10 MIN)

**Create file:** `/root/laverdi-portal/DEPLOYMENT_SSL.md`

```markdown
# SSL Certificate Management - Laverdi Portal

## Certificate Location
- **Host path:** `/etc/letsencrypt/live/laverdi.tech/`
- **Container path:** `/etc/letsencrypt/` (mounted as read-only)

## Certificate Files
- `fullchain.pem` - Full SSL certificate chain
- `privkey.pem` - Private key (KEEP SECURE)
- `cert.pem` - Just the certificate
- `chain.pem` - Certificate chain only

## Docker Compose Configuration
The `docker-compose.yml` must include this volume mount in the nginx service:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

The `:ro` flag makes it read-only, preventing nginx from modifying certificates.

## NGINX Configuration (nginx.conf)
The HTTPS server block listens on port 443 with SSL and HTTP/2:
```nginx
server {
    listen 443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/laverdi.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/laverdi.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
```

## Certificate Renewal
Let's Encrypt certificates expire every 90 days. Renewal is automated via certbot cron job.

### Check Certificate Expiration
```bash
openssl x509 -in /etc/letsencrypt/live/laverdi.tech/fullchain.pem -text -noout | grep "Not After"
```

### Manual Renewal (if needed)
```bash
sudo certbot renew --force-renewal

# Then reload nginx to pick up new certs
docker-compose restart nginx
```

## HTTP to HTTPS Redirect
The HTTP server on port 80 automatically redirects all traffic to HTTPS:
```nginx
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

## Security Headers
The following headers are set on all HTTPS responses:
- `Strict-Transport-Security` - Forces HTTPS for 1 year
- `X-Frame-Options` - Prevents clickjacking
- `X-Content-Type-Options` - Prevents MIME sniffing
- `X-XSS-Protection` - Enables browser XSS filter
- `Referrer-Policy` - Controls referrer leakage

## Monitoring
To monitor certificate expiration:
```bash
# From VPS
certbot certificates

# From local machine (requires curl)
curl https://laverdi.tech -v 2>&1 | grep "expire date"
```

## Troubleshooting

### HTTPS not working after deploy
1. Verify host directory exists: `ls -la /etc/letsencrypt/live/laverdi.tech/`
2. Verify docker-compose.yml has volume mount: `grep -A 5 "volumes:" docker-compose.yml`
3. Check nginx.conf paths are correct: `grep "ssl_certificate" nginx.conf`
4. Restart containers: `docker-compose down && docker-compose up -d`
5. Check logs: `docker-compose logs nginx`

### Certificate warnings in browser
- Check certificate not expired: `openssl x509 -in /etc/letsencrypt/live/laverdi.tech/fullchain.pem -text | grep "Not After"`
- Check certificate matches domain: `openssl x509 -noout -text | grep -A1 "Subject Alternative Name"`
- If expired, renew: `sudo certbot renew --force-renewal && docker-compose restart nginx`

### Mixed content warnings
- Some resources loading over HTTP when page is HTTPS
- Fix: Find hardcoded `http://` in code and change to `https://` or protocol-relative `//`
- Check: `grep -r "http://" lib/ pages/ components/`

### Port 443 already in use
```bash
# Find what's using port 443
sudo lsof -i :443

# Kill the process if needed
sudo kill -9 <PID>
```

## Next Deployment
For new deployments to a different VPS:
1. Ensure `/etc/letsencrypt/live/laverdi.tech/` exists on host
2. Add volume mount to docker-compose.yml
3. Enable HTTPS block in nginx.conf
4. Run `docker-compose up -d`
5. Test HTTPS with `curl -I https://laverdi.tech`
```

✅ **Status Check:** DEPLOYMENT_SSL.md created with complete documentation

---

## ROLLBACK PLAN

If something goes wrong:

```bash
# Stop containers
cd /root/laverdi-portal
docker-compose down

# Revert changes
git checkout docker-compose.yml
git checkout nginx.conf

# Start containers
docker-compose up -d

# Verify HTTP works
curl -I http://laverdi.tech
```

---

## POST-DEPLOYMENT CHECKLIST

- [ ] HTTPS accessible at https://laverdi.tech
- [ ] SSL certificate valid (verified with curl and browser)
- [ ] HTTP → HTTPS redirect working
- [ ] No mixed content warnings (check browser F12)
- [ ] Security headers present in response
- [ ] `DEPLOYMENT_SSL.md` created and committed
- [ ] Team notified of HTTPS availability
- [ ] Monitor nginx logs: `docker-compose logs -f nginx`

---

## SUCCESS CRITERIA

✅ **Phase 1 Complete When:**
1. `curl -I https://laverdi.tech` returns HTTP/2 200
2. Browser shows 🔒 lock icon at https://laverdi.tech
3. No SSL/certificate errors in browser console
4. HTTP automatically redirects to HTTPS
5. Security headers present in response (check with curl -v)
6. DEPLOYMENT_SSL.md created

---

## NEXT STEPS

Once Phase 1 is complete and deployed:
1. Verify HTTPS stable for 15 minutes
2. Check logs for any errors: `docker-compose logs nginx`
3. Move to Phase 2: Molty Character Animation Overhaul
4. Then Phase 3: Landing Page Redesign

---

**Status:** READY FOR EXECUTION  
**Time:** ~1-2 hours  
**Blockers:** None  
**Risk Level:** LOW (easy rollback)
