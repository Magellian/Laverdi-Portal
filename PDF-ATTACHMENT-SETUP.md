# PDF Attachment Setup

## Step 1: Convert HTML to PDF ✅ IN PROGRESS

**File:** `C:\Users\chris\.openclaw\workspace\QUICKSTART-GUIDE-PDF.html`

**How to Convert:**
1. The HTML file should now be open in your browser
2. Press `Ctrl+P` (or Cmd+P on Mac)
3. Click "Save as PDF"
4. Save as: `LaVerdi-QuickStart-Guide.pdf`
5. **Location:** `C:\Users\chris\.openclaw\workspace\`

**Done:** PDF ready for attachment ✅

---

## Step 2: Add PDF to Email Template ✅ DONE

**File Updated:** `C:\Users\chris\Desktop\workspace\src\laverdi-portal\lib\email.ts`

**Changes Made:**
- Updated welcome email with link to guide
- Added note about attached PDF
- Added project ideas list
- Added community links
- Added dashboard button
- Placeholder for attachment code added

**Current Status:** Email template ready, needs PDF path

---

## Step 3: Enable PDF Attachment (NEXT)

Once you have the PDF file, uncomment this line in `email.ts`:

```javascript
attachments: [{ 
  filename: 'LaVerdi-QuickStart-Guide.pdf', 
  path: './LaVerdi-QuickStart-Guide.pdf' 
}]
```

**Or use absolute path:**
```javascript
attachments: [{ 
  filename: 'LaVerdi-QuickStart-Guide.pdf', 
  path: 'C:\\Users\\chris\\.openclaw\\workspace\\LaVerdi-QuickStart-Guide.pdf' 
}]
```

---

## Step 4: Test Signup Flow (NEXT)

1. **Restart portal:** Kill dev server, restart at localhost:3000
2. **Create test account:** Sign up with test email
3. **Check email:** Open test email and verify:
   - ✅ API key displayed
   - ✅ PDF attached
   - ✅ Dashboard link works
   - ✅ Professional branding
4. **Verify delivery:** Check SendGrid dashboard for successful send

---

## Quick Checklist

- [ ] **Step 1:** Convert HTML → PDF (browser print)
- [ ] **Step 2:** Email template updated (DONE)
- [ ] **Step 3:** Add PDF path to email attachment code
- [ ] **Step 4:** Test with real signup
- [ ] **Step 5:** Deploy to production

---

## Email Template Location

**File:** `C:\Users\chris\Desktop\workspace\src\laverdi-portal\lib\email.ts`

**Function:** `sendWelcomeEmail()`

**What It Does:**
- Sends branded welcome email from noreply@laverdi.tech
- Includes API key
- Links to dashboard
- Will attach PDF guide (once path added)
- Shows support & community links

---

## SendGrid Configuration

**API Key:** SG.REDACTED_SENDGRID_KEY

**Domain:** laverdi.tech

**From Email:** noreply@laverdi.tech

**Status:** ✅ Verified in SendGrid (check dashboard to confirm)

---

## When You're Done

Users will receive:
```
📧 Subject: Welcome to LaVerdi OpenClaw - Your API Key + Quick Start Guide 🚀

From: noreply@laverdi.tech

Body:
- Welcome message
- API key (prominently displayed)
- Project ideas list
- Dashboard link
- Support & community links

Attachment: LaVerdi-QuickStart-Guide.pdf
- All 10+ project ideas
- Setup instructions (Telegram, WhatsApp, Discord)
- Week 1 roadmap
- Troubleshooting
- Everything they need to succeed
```

**Result:** ✅ Complete onboarding in one email!

---

## Production Deployment

Once tested locally:

1. Commit changes to git
2. Deploy portal to VPS
3. SendGrid will automatically send welcome emails
4. Monitor SendGrid dashboard for delivery rates

Done! 🚀
