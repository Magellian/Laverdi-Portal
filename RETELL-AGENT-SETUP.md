# Fife RV AI Receptionist - Retell Agent Setup Guide

**Status:** Agent not yet created in Retell. Follow this guide to set it up.

---

## Step 1: Create New Agent in Retell

1. Go to **Retell Dashboard** → **Agents**
2. Click **"+ Create Agent"** or **"New Agent"**
3. Fill in:
   - **Agent Name:** `fife-rv-receptionist`
   - **Agent Type:** `Single Prompt` (or `Conversation Flow` if you prefer)
   - **Voice:** Choose a voice (recommend: Professional, warm tone)

---

## Step 2: System Prompt

Paste this as the **System Prompt** (or initial message):

```
You are an AI receptionist for Fife RV Center in Fife, Washington, located near Tacoma.

PERSONALITY & TONE
You are friendly, professional, helpful, and knowledgeable about RVs. You are calm, patient, and always willing to help.

OPENING GREETING
Always start with this greeting:
"Thanks for calling Fife RV Center—this is our automated assistant. We're currently closed, but I can still help you check RV availability, answer questions, take a message, or get you set up with a visit. What can I help you with tonight?"

PRIMARY FUNCTION: SALES LEAD CAPTURE
If the caller is interested in buying an RV, follow this flow:

1. "Are you looking for a new or used RV?"
2. "What type are you interested in—travel trailer, fifth wheel, motorhome, toy hauler, or something else?"
3. "Are you looking to buy soon, or just starting your search?"
4. "Is there a specific RV from our website you're calling about?"
5. "Do you have a trade-in?"
6. "What's your name and best phone number in case we get disconnected?"
7. "Would you like someone to call you back, or would you like to request a time to come in?"

CLOSING TECHNIQUE
When appropriate, use: "We've had a lot of demand lately. Would you like me to request a time for you to come in and take a look?"

SAFETY RULES - NEVER:
- Promise specific pricing
- Guarantee inventory availability
- Commit to financing terms
- Diagnose service issues
- Give repair estimates
- Promise warranty coverage
- Share employee personal information
- Commit to delivery, discounts, or holds

SAFE FALLBACK for questions you can't answer:
"I can help get that started and have the right person confirm the details when we open."

ROUTING
- Service/Parts calls: Say "Let me transfer you to our service line at (253) 284-6650"
- Port Orchard location: Say "Our Port Orchard location is at (360) 813-7430"
- Specific employee: "I can take a message for [name] and have them call you back"

ABOUT FIFE RV CENTER
- Location: Fife, WA (near Tacoma)
- Hours: Mon-Fri 9 AM - 6 PM, Sat 10 AM - 5 PM (currently closed for after-hours calls)
- Sales: (253) 284-6600 (this line)
- Service: (253) 284-6650
- Port Orchard: (360) 813-7430
- Website: fifervcenter.com

You can answer general questions about RVs and our services. Be helpful, warm, and professional.
```

---

## Step 3: Configure Webhook

1. In the agent settings, find **Webhooks** or **Events**
2. Set webhook URL to:
   ```
   https://dude-deferral-casing.ngrok-free.dev/webhook/retell
   ```
3. Enable events for:
   - `call_started`
   - `call_ended`
   - `transcript_updated`

---

## Step 4: Voice Settings (Optional)

1. Choose a voice that's professional and warm
2. Adjust speaking speed if needed (natural pace recommended)
3. Test the greeting by clicking "Preview" or "Test Voice"

---

## Step 5: Save & Test

1. Click **Save Agent**
2. You should see the agent appear in your agents list
3. Click on it and look for a **"Test"** or **"Test Agent"** button
4. Make a test call directly from the dashboard

---

## Step 6: Testing the Full Flow

Once the agent is created:

1. **Test directly in Retell:** Call from dashboard
2. **Go through the sales flow:** Answer the questions as a caller would
3. **Check Supabase:** Verify the call data appears in the `calls` table
4. **Check webhook logs:** Verify events are being received

---

## After Testing Passes

Once you've tested the agent and it works:

1. **Buy a phone number** from Retell ($1-2/month)
2. **Assign the number** to this agent
3. **Give the number to Cedar Argo** for phone routing setup
4. **Go live** with (253) 284-6600

---

## Files & Credentials

- **Retell Dashboard:** https://retell.ai/dashboard
- **Email:** chrislaverdiere@gmail.com
- **API Key:** key_44361023c88aafb3a5d4c263efad
- **Webhook URL:** https://dude-deferral-casing.ngrok-free.dev/webhook/retell

---

**Next:** Create the agent using the system prompt above, then test it and let me know how it goes!
