# Test Signup Flow - Real Email Test

## ⏱️ Timing

Dev server is now starting. Give it ~30 seconds to be ready at: **http://localhost:3000**

## 🧪 Test Steps

### 1. Open Portal
- URL: http://localhost:3000
- Wait for page to load
- Click "Sign Up"

### 2. Create Test Account
**Email:** Use a real email you can check (or test account)
- `your-test-email@gmail.com` (or similar)
- Password: Any password (secure, min 8 chars)
- Confirm password

### 3. Sign Up
- Click "Sign Up" button
- Wait for redirect to dashboard
- You should see:
  - ✅ API key displayed (sk-do-...)
  - ✅ "Free" tier selected
  - ✅ Dashboard loaded

### 4. Check Email
- Go to your inbox
- Look for email from: **noreply@laverdi.tech**
- Subject: "Welcome to LaVerdi OpenClaw - Your API Key + Quick Start Guide 🚀"

### 5. Verify Email Content
In the email, you should see:
- ✅ Welcome message
- ✅ Your API key (redacted or full)
- ✅ Project ideas list
- ✅ Dashboard link (clickable)
- ✅ Support email: support@laverdi.tech
- ✅ Community Discord link
- ✅ **PDF attached** (once we add it)

### 6. Check SendGrid Dashboard
- Go to: https://app.sendgrid.com
- Login with your SendGrid account
- Go to: **Activity** → **Email Activity**
- You should see:
  - ✅ Email sent to your test address
  - ✅ Status: "Delivered" or "Open"
  - ✅ From: noreply@laverdi.tech

---

## 📝 Expected Email

```
FROM: noreply@laverdi.tech
SUBJECT: Welcome to LaVerdi OpenClaw - Your API Key + Quick Start Guide 🚀

BODY:
Welcome to LaVerdi OpenClaw! 🚀

Thank you for signing up for the free plan!

Your API Key
[sk-do-XXXXXXXXXXXXXXXXXXXXX]
⚠️ Keep this API key secure. Do not share it with anyone.

📖 Quick Start Guide
We've attached a complete quick start guide with:
✅ 10+ project ideas to get started (trading automation, email AI, web scraping, and more)
✅ Step-by-step setup for 3 messaging channels (Telegram, WhatsApp, Discord)
✅ Week 1 roadmap with daily milestones
✅ Troubleshooting & support resources

Next Steps
1. Download your guide (attached as PDF)
2. Visit your dashboard: https://laverdi.tech/dashboard
3. Set up messaging (Telegram recommended for fastest setup)
4. Deploy your first automation within 24 hours

[Go to Dashboard →]

Questions?
Support: support@laverdi.tech
Community: Join Discord
Docs: Full Documentation

---
LaVerdi OpenClaw • laverdi.tech
© 2026 LaVerdi. All rights reserved.

ATTACHMENT: LaVerdi-QuickStart-Guide.pdf (currently placeholder)
```

---

## ✅ Verification Checklist

After running the test:

- [ ] Portal loads at localhost:3000
- [ ] Signup form appears
- [ ] Account created successfully
- [ ] Dashboard loads with API key
- [ ] Email received from noreply@laverdi.tech
- [ ] Email has correct subject line
- [ ] Email displays API key
- [ ] Email has all links
- [ ] Email is branded (blue #3B82F6)
- [ ] SendGrid shows delivery success
- [ ] (Optional) PDF attachment ready to test

---

## 🔧 Troubleshooting

### Portal Won't Load
- Check: `npm run dev` still running
- Try: http://localhost:3000 (or check console for actual port)
- Restart: Kill dev server, run `npm run dev` again

### No Email Received
- Check: `.env.local` has `SENDGRID_API_KEY` set
- Check: Email not in spam folder
- Check: SendGrid dashboard for errors
- Check: Console logs for email errors

### Email Has Wrong Sender
- Should be: `noreply@laverdi.tech`
- Check: `.env.local` has correct `SENDGRID_FROM_EMAIL`
- Check: SendGrid verified domain (should be ✅)

### Email Missing Content
- Styled emails can break in some clients
- Gmail usually handles HTML fine
- If missing, check browser console for template errors

---

## Next After Testing

✅ **Test passes?**
1. Add PDF path to email template
2. Do one more test signup to confirm PDF attaches
3. Deploy to production

❌ **Test fails?**
1. Check console logs in dev server
2. Check SendGrid dashboard for error messages
3. Verify .env.local settings

---

## When You're Done Testing

1. **Document results** in memory
2. **Fix any issues** found
3. **Deploy to production** when ready
4. **Monitor SendGrid** for real user signups

🚀 **You're almost at the finish line!**
