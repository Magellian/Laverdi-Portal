# Email Admin Testing Guide

## Overview

The Laverdi portal now has a complete email testing system with an admin dashboard to toggle email on/off without needing to redeploy.

## Features

### 1. Email Settings Endpoint
**Path:** `/api/admin/email-settings`

**GET - Check current settings:**
```bash
curl -X GET http://localhost:3000/api/admin/email-settings \
  -H "Authorization: Bearer admin-token-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "emailEnabled": true,
    "provider": "sendgrid",
    "fromEmail": "noreply@laverdi.tech",
    "testMode": false
  }
}
```

**POST - Toggle settings:**
```bash
curl -X POST http://localhost:3000/api/admin/email-settings \
  -H "Authorization: Bearer admin-token-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"emailEnabled": false}'
```

### 2. Send Test Email
**Path:** `/api/admin/send-test-email`

```bash
curl -X POST http://localhost:3000/api/admin/send-test-email \
  -H "Authorization: Bearer admin-token-change-me-in-production" \
  -H "Content-Type: application/json" \
  -d '{"to":"your@email.com"}'
```

### 3. Admin Dashboard
**Path:** `/admin/email-test`

Open in browser: `http://localhost:3000/admin/email-test`

Features:
- View current email settings
- Toggle email sending on/off
- Toggle test mode
- Send test emails to any address
- View configuration (provider, from address)

## Email Behavior

### When Email is ENABLED (emailEnabled: true)
- All emails are sent via your configured provider (SendGrid or SMTP)
- Signup confirmations are sent
- Welcome emails with API keys are sent
- Receipt emails are sent
- Instance ready notifications are sent

### When Email is DISABLED (emailEnabled: false)
- All email attempts are logged to console with "[Email] DISABLED" prefix
- No emails are actually sent
- Useful for testing without spamming real inboxes
- Console output shows what would have been sent

### Test Mode (testMode: true)
- Email sending is logged to console instead
- Shows email details without actually sending
- Useful for development

## Workflow

### Testing Email Without Sending

1. **Disable emails for testing:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/email-settings \
     -H "Authorization: Bearer admin-token-change-me-in-production" \
     -H "Content-Type: application/json" \
     -d '{"emailEnabled": false}'
   ```

2. **Create test users and watch console logs**
   - When users sign up, welcome emails will be logged but not sent
   - Look for `[Email] DISABLED - Would send to...` messages

3. **Check console output:**
   ```
   [Email] DISABLED - Would send to user@example.com: "Welcome to Laverdi.tech OpenClaw - Your API Key"
   ```

### Production Setup

1. **Configure SendGrid** (or SMTP):
   - Set `SENDGRID_API_KEY` env var
   - Set `SENDGRID_FROM_EMAIL` env var
   - Or configure SMTP_HOST, SMTP_USER, SMTP_PASS

2. **Enable emails:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/email-settings \
     -H "Authorization: Bearer admin-token-change-me-in-production" \
     -H "Content-Type: application/json" \
     -d '{"emailEnabled": true}'
   ```

3. **Test with real email:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/send-test-email \
     -H "Authorization: Bearer admin-token-change-me-in-production" \
     -H "Content-Type: application/json" \
     -d '{"to":"your@email.com"}'
   ```

## Current Status

- ✅ Email infrastructure exists (nodemailer + SendGrid support)
- ✅ Admin toggle endpoints created
- ✅ Test email sender implemented
- ✅ Admin dashboard UI built
- ✅ Console logging for disabled emails
- ⏳ **Next:** Configure actual SendGrid/SMTP credentials for production

## Email Types Sent

When emails are enabled, the system sends:

1. **Welcome Email** - On signup with API key
2. **Payment Confirmation** - After successful Stripe payment
3. **Receipt Email** - Invoice link after payment
4. **Instance Ready** - When OpenClaw instance is provisioned
5. **Trial Reminder** - 7 days before trial expires (stub)
6. **Trial Expired** - When trial ends (stub)
7. **Upgrade Prompt** - When user hits call limit (stub)

## Files Modified

- `lib/email.ts` - Added enable/disable logic
- `pages/api/admin/email-settings.ts` - NEW - Settings endpoint
- `pages/api/admin/send-test-email.ts` - NEW - Test email sender
- `pages/admin/email-test.tsx` - NEW - Admin dashboard

## Default Admin Token

The admin token for email testing is:
```
admin-token-change-me-in-production
```

**⚠️ IMPORTANT:** Change this in production!
- Set via `ADMIN_UPGRADE_TOKEN` env var
- Used for: email settings, user upgrades, admin functions
- Must be kept secret

## Troubleshooting

### Email not sending even when enabled?
1. Check if transporter is configured: `console.error('Email transporter not configured')`
2. Verify SendGrid API key is set: `SENDGRID_API_KEY`
3. Or verify SMTP credentials: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`

### Test email returns "Email service not available"?
1. Go to `/admin/email-test` dashboard
2. Check "Configuration" section
3. Ensure provider shows "sendgrid" or "smtp"
4. Configure the appropriate env vars

### Emails disabled but still logging "DISABLED"?
This is expected! The `[Email] DISABLED` messages confirm the system is working correctly and would send the email if enabled.

## Next Steps

1. **Get SendGrid API key** (or configure SMTP)
2. **Set env vars** in production
3. **Enable emails** via admin panel
4. **Send test email** to verify it works
5. **Monitor email delivery** in SendGrid dashboard
