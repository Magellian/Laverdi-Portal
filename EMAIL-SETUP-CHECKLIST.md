# 📧 Email Setup - Complete Checklist

## Current Status ✅

| Component | Status | Details |
|-----------|--------|---------|
| SendGrid API Key | ✅ Loaded | SG.-Pu... authenticated |
| Email Library | ✅ Ready | Nodemailer configured |
| Admin System | ✅ Built | Toggle + dashboard ready |
| From Email | ✅ Set | noreply@laverdi.tech |
| Domain Registrar | ✅ Found | Gandi.net |
| DNS Provider | ✅ Identified | Gandi nameservers |
| Email Enabled | ✅ True | System ready |

## 🎯 What's Left (One-Time Setup)

### ⏳ Step 1: Add DNS Records in Gandi (2 minutes)

**Go here:** https://www.gandi.net
1. Log in
2. Click **Domains**
3. Click **laverdi.tech**
4. Click **DNS Records** (or Manage Zone)
5. Add these 3 records:

```
Type    Name                           Value
────────────────────────────────────────────────────
CNAME   sendgrid._domainkey            sendgrid.net
CNAME   em                             sendgrid.net
TXT     laverdi.tech                   v=spf1 sendgrid.net ~all
```

**How to add in Gandi:**
- Click "Add a DNS Record"
- Fill Name, Type, Value
- Click Save
- Repeat for each record

### ⏳ Step 2: Wait for DNS Propagation (5-10 minutes)

- DNS changes take 5-10 minutes
- You can check status: https://mxtoolbox.com (search laverdi.tech)
- Or: https://dns.google.com

### ⏳ Step 3: Verify in SendGrid (1 minute)

1. Go to https://app.sendgrid.com
2. **Settings → Sender Authentication**
3. Click **Verify Domain**
4. Wait for green checkmarks ✅

### ✅ Step 4: Test Email Sending (1 minute)

```bash
node C:\Users\chris\.openclaw\workspace\test-sendgrid.js your-email@example.com
```

Should receive test email from `noreply@laverdi.tech`.

### ✅ Step 5: Users Can Sign Up

- Create account at https://laverdi.tech/auth/signup
- Users receive welcome email
- Email from: noreply@laverdi.tech ✅
- Contains API key + getting started

## 📋 Detailed Checklist

### Pre-Setup
- [x] SendGrid account active
- [x] API key found and tested
- [x] Domain identified (laverdi.tech)
- [x] Registrar identified (Gandi.net)
- [x] Admin system built
- [x] Portal configured

### DNS Setup (TO DO)
- [ ] Log in to https://www.gandi.net
- [ ] Navigate to laverdi.tech domain
- [ ] Open DNS Records editor
- [ ] Add CNAME: sendgrid._domainkey → sendgrid.net
- [ ] Add CNAME: em → sendgrid.net
- [ ] Add TXT: laverdi.tech → v=spf1 sendgrid.net ~all
- [ ] Save all records
- [ ] Wait 5-10 minutes
- [ ] Verify in SendGrid dashboard
- [ ] See ✅ checkmarks

### Verification (TO DO)
- [ ] Check DNS with mxtoolbox.com
- [ ] Verify domain in SendGrid
- [ ] Get green checkmarks
- [ ] Test with test-sendgrid.js
- [ ] Receive test email

### Deployment (TO DO)
- [ ] Verify emails work on dev (localhost:3000)
- [ ] Update .env on VPS with noreply@laverdi.tech
- [ ] Restart portal on VPS
- [ ] Test with production signup
- [ ] Monitor SendGrid dashboard

## 🚀 After DNS Setup

### Email Types Active
- ✅ Welcome email (API key)
- ✅ Instance ready (provisioning)
- ✅ Payment confirmation (Stripe)
- ⏳ Trial reminders (stubs ready)
- ⏳ Upgrade prompts (stubs ready)

### Admin Controls
- ✅ Toggle email on/off: `/api/admin/email-settings`
- ✅ Send test email: `/api/admin/send-test-email`
- ✅ Admin dashboard: `/admin/email-test`

### Monitoring
- Monitor in SendGrid dashboard
- Check delivery rates
- Review bounce/spam rates
- Watch for issues

## 📊 Timeline

| Step | Time | Status |
|------|------|--------|
| Add DNS records | 2 min | ⏳ TODO |
| DNS propagation | 5-10 min | ⏳ Automatic |
| SendGrid verify | 1 min | ⏳ TODO |
| Test email | 1 min | ⏳ TODO |
| Production deploy | 2 min | ⏳ TODO |
| **Total Time** | **~20 min** | |

## 🔧 Configuration Summary

```bash
# Current .env.local setup
SENDGRID_API_KEY=SG.REDACTED_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@laverdi.tech
EMAIL_ENABLED=true
```

```bash
# On VPS (.env on production)
SENDGRID_API_KEY=SG.REDACTED_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@laverdi.tech
EMAIL_ENABLED=true
```

## ✨ When It's Done

**Users will see:**
```
From: LaVerdi <noreply@laverdi.tech>
Subject: Welcome to Laverdi.tech OpenClaw

Dear user,

Thank you for signing up! Your API key is: sk-...
```

**You will see:**
- Email delivery working ✅
- Users receiving welcomes ✅
- SendGrid dashboard showing activity ✅
- Professional branding ✅

## 🆘 If Something Goes Wrong

**Records not showing up in DNS?**
- Wait 5-10 minutes
- Reload the page
- Check you added to the right domain

**SendGrid won't verify?**
- Wait longer for DNS propagation
- Check mxtoolbox.com for record status
- Verify exact record values

**Emails not sending?**
- Check EMAIL_ENABLED=true in .env
- Check SendGrid API key is correct
- Look at SendGrid dashboard for errors

**Spam folder?**
- SPF record needs to be exact
- DKIM/DMARC setup (advanced, usually not needed)
- Contact SendGrid support

## 📞 Quick Reference

| What | Where | Link |
|------|-------|------|
| Gandi login | Domain management | https://www.gandi.net |
| SendGrid settings | Email verification | https://app.sendgrid.com |
| DNS check | Troubleshooting | https://mxtoolbox.com |
| Email test | Local testing | node test-sendgrid.js |
| Admin dashboard | Configure | http://localhost:3000/admin/email-test |

---

## Next Action

**👉 Start with Step 1 above: Add DNS records in Gandi**

Takes ~20 minutes total (mostly waiting for DNS).
After that, **all email functionality works automatically**! ✨
