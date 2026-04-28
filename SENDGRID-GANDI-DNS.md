# SendGrid Domain Setup - Gandi DNS Instructions

## Quick Summary

Your domain **laverdi.tech** is registered with **Gandi.net**.

You need to add 3 DNS records to enable SendGrid email sending.

**Time needed:** ~10 minutes (mostly waiting for DNS propagation)

## Step 1: Get DNS Records from SendGrid

1. Go to https://app.sendgrid.com
2. Click **Settings → Sender Authentication**
3. Click **Authenticate Your Domain**
4. Enter: `laverdi.tech`
5. Click **Next**

SendGrid will show you 3 records to add. **Copy them exactly.**

## Step 2: Access Gandi DNS Manager

1. Go to https://www.gandi.net
2. **Log in** with your account
3. Click **Domain** in the menu
4. Find **laverdi.tech** in your domain list
5. Click the domain name
6. Click **DNS Records** tab (or **Manage Zone**)

## Step 3: Add SendGrid DNS Records

You'll be adding 3 records. In Gandi, the process is:

### Add Record 1 - CNAME (sendgrid._domainkey)

1. Click **Add a DNS Record**
2. **Name:** `sendgrid._domainkey`
3. **Type:** CNAME
4. **Value:** `sendgrid.net`
5. **Click Save**

### Add Record 2 - CNAME (em)

1. Click **Add a DNS Record**
2. **Name:** `em`
3. **Type:** CNAME
4. **Value:** `sendgrid.net`
5. **Click Save**

### Add Record 3 - TXT (SPF)

1. Click **Add a DNS Record**
2. **Name:** `laverdi.tech` (or leave blank)
3. **Type:** TXT
4. **Value:** `v=spf1 sendgrid.net ~all`
5. **Click Save**

## Step 4: Wait for DNS Propagation

DNS changes take 5-10 minutes to propagate worldwide.

**You can check propagation here:**
- https://mxtoolbox.com (search laverdi.tech)
- https://dns.google.com (search laverdi.tech)

## Step 5: Verify in SendGrid

1. Go back to https://app.sendgrid.com
2. **Settings → Sender Authentication**
3. Click **Verify Domain**
4. Wait for verification ✅

Once verified, you'll see green checkmarks on all 3 records.

## Step 6: Update Configuration

Edit `.env.local`:

```bash
SENDGRID_API_KEY=SG.REDACTED_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@laverdi.tech
EMAIL_ENABLED=true
```

## Step 7: Test Email Sending

```bash
node C:\Users\chris\.openclaw\workspace\test-sendgrid.js your-email@example.com
```

You should receive a test email from `noreply@laverdi.tech`.

## Expected DNS Records in Gandi

After adding all 3, your DNS records should look like:

```
Type    Name                           Value
────────────────────────────────────────────────────
A       laverdi.tech                   64.23.142.154
TXT     laverdi.tech                   v=spf1 sendgrid.net ~all
CNAME   em                             sendgrid.net
CNAME   sendgrid._domainkey            sendgrid.net
MX      laverdi.tech                   [Your existing MX record]
NS      (nameservers)                  [Gandi nameservers]
```

## Troubleshooting in Gandi

### Can't find DNS Records section?
- In Gandi dashboard, look for **"Manage Zone"** or **"DNS Records"**
- Click on laverdi.tech domain
- Look for a **"DNS"** or **"Zone file"** tab

### Record not appearing?
- Make sure you **saved** each record
- Wait 5 minutes for Gandi to process
- Reload the page

### Need to edit existing SPF?
If laverdi.tech already has an SPF record, you need to **edit it** instead of creating new:

**Find this:**
```
v=spf1 ... ~all
```

**Change to:**
```
v=spf1 sendgrid.net ... ~all
```

(Keep any existing entries, just add `sendgrid.net`)

## Verify DNS Records Are Live

Check from terminal:

```bash
# Check CNAME records
nslookup em.laverdi.tech
nslookup sendgrid._domainkey.laverdi.tech

# Check SPF
dig laverdi.tech TXT

# Should show:
# v=spf1 sendgrid.net ~all
```

## Timeline

- **Now:** Add records in Gandi (2 min)
- **5-10 min:** DNS propagates
- **10-15 min:** SendGrid verifies ✅
- **Immediately:** Emails work!

## After Verification

Once SendGrid confirms ✅:

- Users receive emails from `noreply@laverdi.tech`
- Professional branding ✅
- Full email delivery capability ✅
- Can send unlimited emails ✅

---

## Current Status

✅ Domain: laverdi.tech (Gandi)
✅ Registrar: gandi.net
✅ VPS IP: 64.23.142.154
⏳ **Next:** Add 3 DNS records in Gandi dashboard
⏳ **Then:** Verify in SendGrid
✅ **Done:** Emails work!

**Start here:** https://www.gandi.net → Log in → Domains → laverdi.tech → DNS Records
