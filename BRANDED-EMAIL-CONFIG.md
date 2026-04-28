# 📧 LaVerdi Branded Email Configuration

## Email Addresses (All @laverdi.tech)

| Purpose | Email | Use Case |
|---------|-------|----------|
| **Transactional** | noreply@laverdi.tech | System notifications, account confirmations |
| **Support** | support@laverdi.tech | Customer support inquiries, help requests |
| **Billing** | billing@laverdi.tech | Payment confirmations, invoices, receipts |
| **Notifications** | notifications@laverdi.tech | Alerts, updates, announcements |

## Configuration

```bash
# .env.local
SENDGRID_API_KEY=SG.REDACTED_SENDGRID_KEY
SENDGRID_FROM_EMAIL=noreply@laverdi.tech
SENDGRID_SUPPORT_EMAIL=support@laverdi.tech
SENDGRID_BILLING_EMAIL=billing@laverdi.tech
SENDGRID_NOTIFICATIONS_EMAIL=notifications@laverdi.tech
NEXT_PUBLIC_APP_URL=https://laverdi.tech
EMAIL_ENABLED=true
```

## Email Templates

All email templates now include:

✅ **LaVerdi Branding:**
- Logo/branding in header
- Professional styling
- Brand colors (blue #3B82F6)
- Footer with copyright

✅ **Branded Links:**
- Dashboard link: https://laverdi.tech/dashboard
- Support link: support@laverdi.tech
- Billing link: billing@laverdi.tech

✅ **Professional Templates:**
- Welcome Email → noreply@laverdi.tech
- Instance Ready → noreply@laverdi.tech
- Payment Receipt → billing@laverdi.tech
- Trial Reminders → notifications@laverdi.tech
- Upgrade Prompts → notifications@laverdi.tech

## What Users See

**Welcome Email:**
```
From: LaVerdi <noreply@laverdi.tech>
Subject: Welcome to LaVerdi OpenClaw
Body: Professional HTML template with dashboard link
Footer: "LaVerdi OpenClaw © 2026 LaVerdi"
```

**Instance Ready:**
```
From: LaVerdi <noreply@laverdi.tech>
Subject: 🚀 Your OpenClaw Instance is Ready!
Body: IP address, setup instructions, dashboard link
Footer: "LaVerdi OpenClaw © 2026 LaVerdi"
```

**Payment Confirmation:**
```
From: LaVerdi <billing@laverdi.tech>
Subject: 💳 Payment Confirmation
Body: Plan, amount, date, invoice link
Footer: "LaVerdi OpenClaw © 2026 LaVerdi"
```

## Next Steps

1. **Wait for DNS verification** (SendGrid will verify domain)
2. **Test emails** will be sent from noreply@laverdi.tech
3. **All branding will be applied** automatically

## DNS Requirements

To send from all these addresses, you need to verify **noreply@laverdi.tech** in SendGrid.

The 3 DNS records you added:
- `sendgrid._domainkey.laverdi.tech` → sendgrid.net (DKIM)
- `em.laverdi.tech` → sendgrid.net (Click tracking)
- `laverdi.tech` → v=spf1 sendgrid.net ~all (SPF)

Once verified ✅, **any @laverdi.tech address** can send emails.

## Adding More Email Addresses

To add additional branded addresses:

1. Add to .env:
   ```bash
   SENDGRID_ALERTS_EMAIL=alerts@laverdi.tech
   ```

2. Update email.ts:
   ```typescript
   const alertsEmail = process.env.SENDGRID_ALERTS_EMAIL || 'alerts@laverdi.tech'
   ```

3. Use in templates:
   ```html
   <a href="mailto:${alertsEmail}">Report an issue</a>
   ```

## Status

✅ Configuration updated
✅ Email templates branded
✅ Branded addresses configured
⏳ DNS verification pending (SendGrid)
⏳ Email delivery pending (DNS verification)

Once DNS verifies, all emails will be fully branded and professional! 🎉

---

**Current Status:** Ready for DNS verification
**Next Action:** Wait for DNS to propagate and SendGrid to verify domain
**Timeline:** ~5-10 minutes for DNS, then immediate email delivery
