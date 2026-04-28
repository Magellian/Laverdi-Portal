# SendGrid Email Setup for Laverdi Portal

## Quick Start

The email admin system is **ready to go**. You just need a SendGrid API key.

## Step 1: Get SendGrid API Key

1. Go to https://sendgrid.com
2. Sign up or log in
3. Go to **Settings → API Keys**
4. Click **"Create API Key"**
5. Name it `laverdi-portal`
6. Copy the API key (starts with `SG.`)

## Step 2: Add to Environment

Edit `.env.local` in the portal directory:

```bash
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=noreply@laverdi.tech
EMAIL_ENABLED=true
```

## Step 3: Restart Dev Server

The changes should auto-reload, but to be safe:
1. Stop the dev server (Ctrl+C)
2. Run: `npm run dev`
3. Wait for "Ready in X.Xs"

## Step 4: Enable Emails

Visit admin dashboard:
- **URL:** http://localhost:3000/admin/email-test
- **Admin Token:** `admin-token-change-me-in-production`

Or via API:
```bash
curl -X POST http://localhost:3000/api/admin/email-settings \
  -H "Authorization: Bearer admin-token-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"emailEnabled": true}'
```

## Step 5: Test Email Sending

```bash
curl -X POST http://localhost:3000/api/admin/send-test-email \
  -H "Authorization: Bearer admin-token-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com"}'
```

Check your inbox! You should receive a test email from `noreply@laverdi.tech`.

## Verify It's Working

**In Browser:**
1. Open http://localhost:3000/admin/email-test
2. Check "Email Enabled" status (should show 🟢)
3. Click "Send Test Email"
4. Verify you received it

**In Console:**
Look for:
```
[Email] Sent to your@email.com: "🧪 Test Email from Laverdi.tech"
```

**In SendGrid Dashboard:**
1. Go to https://sendgrid.com
2. Click **Mail Send → Logs**
3. You should see your test email listed

## What Happens When Email is Enabled

When users sign up or upgrade:
1. ✅ **Welcome Email** - Sent with API key
2. ✅ **Payment Confirmation** - Sent after Stripe payment
3. ✅ **Instance Ready** - Sent when OpenClaw deploys
4. ⏳ **Trial Reminders** - When trial is ending (stub)
5. ⏳ **Upgrade Prompts** - When hitting rate limits (stub)

## Troubleshooting

### "Email service not configured"
- Check that `SENDGRID_API_KEY` is set in `.env.local`
- Make sure it starts with `SG.`
- Restart dev server

### "Failed to send email"
- Check SendGrid dashboard for errors/logs
- Verify API key is correct and not revoked
- Check that `SENDGRID_FROM_EMAIL` is set

### "Email disabled" message in console
- Email toggle is OFF
- Go to http://localhost:3000/admin/email-test
- Click "Enable" button

## Production Deployment

When deploying to VPS:

1. **Add to .env.local on VPS:**
   ```bash
   ssh root@64.23.142.154
   cd /root/laverdi-portal
   # Edit .env.local with real SendGrid key
   nano .env.local
   ```

2. **Rebuild Docker image:**
   ```bash
   docker-compose down
   docker build -t laverdi-portal:latest .
   docker-compose up -d
   ```

3. **Verify emails work:**
   - Create a test user via signup
   - Check inbox for welcome email
   - Monitor SendGrid dashboard

## Admin Token Security

The default admin token is:
```
admin-token-change-me-in-production
```

**⚠️ IMPORTANT:** 
- Change in production!
- Set via `ADMIN_UPGRADE_TOKEN` env var
- Used for: email settings, user upgrades, admin functions
- Never commit real tokens to git

## Questions?

Check:
1. SendGrid docs: https://docs.sendgrid.com
2. Email admin guide: `./EMAIL-ADMIN-GUIDE.md`
3. Portal .env example: `.env.local.example`

---

**Status:** ✅ Email system ready
**Next:** Get SendGrid API key and update .env.local
