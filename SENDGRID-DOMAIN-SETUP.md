# SendGrid Domain Whitelabel Setup for laverdi.tech

## Overview

We'll set up SendGrid to send emails from `noreply@laverdi.tech` (or any @laverdi.tech address).

This requires:
1. Adding DNS records to your domain registrar
2. Verifying in SendGrid
3. Takes ~5-10 minutes (DNS propagation may take longer)

## ✅ Domain Information

**Domain:** laverdi.tech
**Registrar:** Gandi (gandi.net)
**Current IP:** 64.23.142.154 (VPS)
**Nameservers:** ns-185-b.gandi.net, ns-101-a.gandi.net, ns-231-c.gandi.net

You'll manage DNS records through **Gandi.net dashboard**.

## Step-by-Step Setup

### Step 1: Go to SendGrid Dashboard

1. Log in to https://app.sendgrid.com
2. Click **Settings → Sender Authentication**
3. Click **Authenticate Your Domain**
4. Select **I have a domain I want to use**
5. Enter domain: `laverdi.tech`
6. Click **Next**

### Step 2: Get DNS Records from SendGrid

SendGrid will show you 3 DNS records to add:

```
Record Type: CNAME
Host: sendgrid._domainkey.laverdi.tech
Target: sendgrid.net

Record Type: CNAME
Host: em.laverdi.tech
Target: sendgrid.net

Record Type: TXT
Host: laverdi.tech
Value: v=spf1 sendgrid.net ~all
```

**Copy these exactly** - you'll need them in the next step.

### Step 3: Add DNS Records to Your Registrar

**Where to add them depends on your registrar:**

#### DigitalOcean (if using their DNS)
```
1. Log in to DigitalOcean
2. Go to Networking → Domains
3. Click laverdi.tech
4. Add the CNAME and TXT records as shown above
```

#### Other Registrars (GoDaddy, Namecheap, AWS, etc.)
```
1. Log in to your registrar
2. Find DNS settings for laverdi.tech
3. Add DNS records (exact steps vary by registrar)
4. Save/Apply changes
```

### Step 4: Verify in SendGrid

Back in SendGrid dashboard:
1. Click **Verify Domain**
2. Wait 5-10 minutes for DNS propagation
3. SendGrid will automatically check
4. Once verified ✅, you'll see checkmarks

### Step 5: Update Configuration

Once domain is verified, update `.env.local`:

```bash
SENDGRID_FROM_EMAIL=noreply@laverdi.tech
```

Or use any other address on the domain:
```bash
SENDGRID_FROM_EMAIL=support@laverdi.tech
SENDGRID_FROM_EMAIL=notifications@laverdi.tech
```

## Current Setup

Currently configured with:
```
SENDGRID_API_KEY=SG.REDACTED_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@laverdi.tech  ← Will work after DNS setup
EMAIL_ENABLED=true
```

## DNS Records to Add

**Copy-paste these exactly:**

### Record 1 - CNAME
```
Name/Host: sendgrid._domainkey.laverdi.tech
Type: CNAME
Value/Target: sendgrid.net
```

### Record 2 - CNAME
```
Name/Host: em.laverdi.tech
Type: CNAME
Value/Target: sendgrid.net
```

### Record 3 - SPF TXT
```
Name/Host: laverdi.tech
Type: TXT
Value: v=spf1 sendgrid.net ~all
```

## Verification Checklist

- [ ] Log in to https://app.sendgrid.com
- [ ] Settings → Sender Authentication
- [ ] Authenticate Your Domain
- [ ] Enter laverdi.tech
- [ ] Write down the 3 DNS records
- [ ] Add records to domain registrar (DigitalOcean/GoDaddy/etc)
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Go back to SendGrid and click Verify
- [ ] See ✅ checkmarks
- [ ] Update .env.local with noreply@laverdi.tech
- [ ] Test email sending
- [ ] Users receive emails on signup

## Testing After Verification

Once domain is verified:

```bash
# Test email sending
node test-sendgrid.js test@example.com

# Users will receive emails from: noreply@laverdi.tech ✅
```

## How to Find Your Domain Registrar

If you don't know where laverdi.tech is registered:

```bash
# Use whois lookup
whois laverdi.tech

# Look for "Registrar" field
# Or go to https://www.whois.com and search laverdi.tech
```

## Common Registrars & DNS Access

| Registrar | DNS Management |
|-----------|---|
| DigitalOcean | Networking → Domains |
| GoDaddy | Domains → DNS |
| Namecheap | Domain List → Manage → DNS |
| AWS Route53 | Route 53 → Hosted Zones |
| Cloudflare | DNS tab |

## After Domain Verification

**Benefits:**
- ✅ Send from `noreply@laverdi.tech`
- ✅ Professional branding
- ✅ Better deliverability
- ✅ No Gmail/personal email limits
- ✅ Scale to unlimited emails

**What Users See:**
```
From: LaVerdi <noreply@laverdi.tech>
Subject: Welcome to Laverdi.tech OpenClaw
```

## Timeline

- **Now:** Add DNS records (5 min)
- **5-10 min:** DNS propagates
- **10-15 min:** SendGrid verifies ✅
- **Immediately after:** Emails start working!

---

**Next Step:** Where is laverdi.tech registered? (This determines DNS setup steps)
