# Fife RV AI Receptionist — Implementation Guide

**Status:** Phase 1 Spec Complete — Ready for Build  
**Created:** 2026-04-30  
**Last Updated:** 2026-04-30

---

## 📋 QUICK START CHECKLIST

### Before Implementation
- [ ] Confirm after-hours hours with Fife RV (e.g., 6 PM - 8 AM weekdays + all day weekend)
- [ ] Confirm lead notification email address(es) — single or list
- [ ] **Email alerts: Real-time (instant per lead)**
- [ ] Confirm CRM system (for Phase 1.5 integration)
  - [ ] HubSpot / [ ] Pipedrive / [ ] Airtable / [ ] Other / [ ] None yet
- [ ] Confirm tone/style (friendly, professional, etc.)
- [ ] Confirm special messaging (promotions, key phrases)

### Build Phase 1: Infrastructure
- [ ] Create Vultr Seattle account
- [ ] Provision 2 vCPU instance (VX1 or Cloud Compute High Performance)
- [ ] Deploy OpenClaw gateway to Vultr Seattle
- [ ] Set up Supabase project
  - Create `calls` table (call metadata)
  - Create `leads` table (sales leads)
  - Create `messages` table (service/parts/employee messages)
  - Create `appointment_requests` table
- [ ] Configure SendGrid or Mailgun for email alerts
- [ ] Build webhook handler (receives Retell events → stores in Supabase)

### Build Phase 2: Retell Agent
- [ ] Create Retell account + get API key
- [ ] Create Retell agent with system prompt (see below)
- [ ] Integrate website knowledge (fifervcenter.com inventory)
- [ ] Set up webhook endpoint in Retell (→ OpenClaw gateway)
- [ ] Test agent in Retell test mode

### Build Phase 3: Automation & Integration
- [ ] Set up n8n or Zapier workflow:
  - Receive lead JSON from webhook
  - Send email alert to team
  - Post to Google Sheet
  - Send SMS alert (optional)
  - Create calendar event (optional)
- [ ] Configure email template for alerts
- [ ] Test end-to-end workflow

### Build Phase 4: Phone Routing
- [ ] Route (253) 284-6600 to Retell AI (final step)
- [ ] Test with live calls
- [ ] Monitor first 24-48 hours

### Post-Launch
- [ ] Train Fife RV team on lead notification system
- [ ] Set up daily monitoring dashboard
- [ ] Iterate prompts based on first week of calls
- [ ] Document runbook for ongoing maintenance

---

## 🤖 RETELL AGENT SYSTEM PROMPT (COMPLETE)

Use this as the foundation for the Retell AI agent:

```
You are an AI receptionist for Fife RV Center in Fife, Washington. 

PERSONALITY & TONE
- Friendly, professional, helpful
- Knowledgeable about RVs and our inventory
- Calm and patient
- Always willing to help

OPENING
Always start with this greeting:
"Thanks for calling Fife RV Center—this is our automated assistant. 
We're currently closed, but I can still help you check RV availability, 
answer questions, take a message, or get you set up with a visit. 
What can I help you with tonight?"

PRIMARY FUNCTION: SALES LEAD CAPTURE
If the caller is interested in buying an RV, follow this flow:
1. "Are you looking for a new or used RV?"
2. "What type are you interested in—travel trailer, fifth wheel, motorhome, 
   toy hauler, or something else?"
3. "Are you looking to buy soon, or just starting your search?"
4. "Is there a specific RV from our website you're calling about?"
5. "Do you have a trade-in?"
6. "What's your name and best phone number in case we get disconnected?"
7. "Would you like someone to call you back, or would you like to request 
   a time to come in?"

When appropriate, use the close:
"We've had a lot of demand lately. Would you like me to request 
a time for you to come in and take a look?"

WEBSITE KNOWLEDGE
You can answer questions about RVs and information from fifervcenter.com:
- RV inventory (models, features, prices)
- Directions and location
- Store hours (during business hours)
- General dealership information
- Service and parts information

If you're not sure about something, use this response:
"I can help get that started and have the right person confirm 
the details when we open."

ABSOLUTE RESTRICTIONS - NEVER DO THESE
❌ Promise final pricing
❌ Guarantee inventory availability
❌ Promise financing approval
❌ Quote or guarantee trade value
❌ Diagnose service issues
❌ Give repair estimates
❌ Guarantee parts fitment
❌ Make warranty or legal commitments
❌ Share employee personal information
❌ Commit the dealership to delivery timing, discounts, holds, or deal terms

If asked about any of these, use the safe fallback:
"I can help get that started and have the right person confirm 
the details when we open."

ROUTING: SERVICE & PARTS
If the caller asks for Fife Service or Parts (253) 284-6650:
- Do NOT diagnose service issues
- Capture the message using this script:
  "I can get that to the right team. Let me grab your name, number, 
   and a quick note so they can follow up when they open."
- Provide the phone number: (253) 284-6650

ROUTING: PORT ORCHARD
If the caller asks about Port Orchard Sales/Service/Parts:
- Capture the message using this script:
  "I can get that to the right team. Let me grab your name, number, 
   and a quick note so they can follow up when they open."
- Provide the phone number: (360) 813-7430

ROUTING: SPECIFIC EMPLOYEE
If caller asks for a specific employee:
1. Capture caller name
2. Capture phone number
3. Capture employee requested
4. Capture reason for call
5. Capture urgency
6. Capture best callback time
7. Use this script:
   "I'll make sure they get the message. What's the best number 
    for them to reach you?"

HANDLING INVENTORY QUESTIONS
When answering about specific RVs:
"I'm seeing that listed on the website, but inventory can move quickly. 
I can take your information and have a salesperson confirm availability first thing."

ESCALATION: CANNOT ANSWER
If you cannot answer a question:
- Capture callback information
- Reassure the caller
- Say: "I can help get that started and have the right person confirm 
  the details when we open."

ESCALATION: UPSET CALLER
If a caller is upset or angry:
- Apologize once (sincerely)
- Do NOT argue or defend
- Capture the information
- Mark as high priority
- Use this script:
  "I'm sorry about that. I'll make sure this is flagged so the right 
   person can follow up with you as soon as possible."

CLOSING EVERY CALL
Always end with a clear next step. Choose the appropriate one:
- "I'll have someone follow up when we open."
- "I'll submit that appointment request."
- "I'll pass this message to the right person."
- "A salesperson can confirm that availability first thing."

DATA CAPTURE
For every call, capture and structure this information:
- Caller name
- Phone number
- Email (if provided)
- Intent (what they want)
- RV interest (type, new/used, budget, timeline, trade-in)
- Appointment preference (day, time, type)
- Any special notes
- Urgency level (normal or high)
- Whether human follow-up is needed

OUTPUT FORMAT
After the call ends, generate structured JSON with all captured information.
```

---

## 🛠️ INFRASTRUCTURE SETUP STEPS

### Step 1: Vultr Seattle Instance

```bash
# Create Vultr account at https://www.vultr.com
# Select Seattle data center
# Choose: 2 vCPU VX1 or Cloud Compute High Performance (~$24-43/mo)
# Deploy Ubuntu 22.04 LTS

# SSH into instance
ssh root@YOUR_VULTR_IP

# Update system
apt update && apt upgrade -y

# Install Docker + Docker Compose
apt install -y docker.io docker-compose
systemctl start docker
systemctl enable docker

# Install Node.js (for webhook handler)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify installations
docker --version
node --version
```

### Step 2: Deploy OpenClaw Gateway

```bash
# Create openclaw directory
mkdir -p /opt/openclaw
cd /opt/openclaw

# Create docker-compose.yml for OpenClaw
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  openclaw-gateway:
    image: openclaw/gateway:latest
    ports:
      - "18789:18789"
    environment:
      - GATEWAY_PORT=18789
      - GATEWAY_HOST=0.0.0.0
    volumes:
      - ./config:/root/.openclaw
    restart: always
EOF

# Start gateway
docker-compose up -d

# Verify gateway is running
curl http://localhost:18789/health
```

### Step 3: Set Up Supabase Project

```bash
# Go to https://supabase.com
# Create new project
# Note: Project URL and API key

# Create tables in Supabase SQL editor:

-- Calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT UNIQUE NOT NULL,
  caller_name TEXT,
  phone TEXT,
  email TEXT,
  call_type VARCHAR(50),
  department VARCHAR(50),
  location VARCHAR(20),
  transcript TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recorded_url TEXT
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT REFERENCES calls(call_id),
  caller_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  intent TEXT,
  rv_new_or_used VARCHAR(20),
  rv_category VARCHAR(50),
  rv_budget TEXT,
  timeline VARCHAR(50),
  trade_in BOOLEAN,
  appointment_requested BOOLEAN,
  appointment_day TEXT,
  appointment_time TEXT,
  appointment_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  needs_human_followup BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contacted_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'new'
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT REFERENCES calls(call_id),
  caller_name TEXT,
  phone TEXT,
  employee_requested TEXT,
  message_type VARCHAR(50),
  reason TEXT,
  urgency VARCHAR(20),
  best_callback_time TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'new'
);

-- Appointment requests table
CREATE TABLE appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  preferred_day TEXT,
  preferred_time TEXT,
  appointment_type VARCHAR(50),
  confirmed BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE call_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE,
  total_calls INT,
  sales_leads INT,
  service_messages INT,
  parts_messages INT,
  employee_messages INT,
  port_orchard_messages INT,
  appointment_requests INT,
  needs_human_followup INT,
  high_priority_leads INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Build Webhook Handler (Node.js)

```bash
# Create webhook project
mkdir -p /opt/fife-rv-webhook
cd /opt/fife-rv-webhook

# Initialize Node project
npm init -y
npm install express dotenv axios

# Create .env file
cat > .env << 'EOF'
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_supabase_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=alerts@fifervcenter.com
TEAM_EMAIL=sales@fifervcenter.com
PORT=3000
EOF

# Create server.js (see next section)
```

### Step 5: Webhook Handler Code

**File: `/opt/fife-rv-webhook/server.js`**

```javascript
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_API_KEY
);

// Webhook endpoint from Retell
app.post('/webhook/retell-call', async (req, res) => {
  try {
    const callData = req.body;

    // Store call in Supabase
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert([
        {
          call_id: callData.call_id,
          caller_name: callData.caller_name,
          phone: callData.phone,
          email: callData.email,
          call_type: callData.call_type,
          department: callData.department,
          location: callData.location,
          transcript: callData.transcript,
          recorded_url: callData.recorded_url
        }
      ]);

    if (callError) throw callError;

    // If sales lead, store in leads table
    if (callData.call_type === 'sales_lead') {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([
          {
            call_id: callData.call_id,
            caller_name: callData.caller_name,
            phone: callData.phone,
            email: callData.email,
            intent: callData.intent,
            rv_new_or_used: callData.rv_interest?.new_or_used,
            rv_category: callData.rv_interest?.category,
            rv_budget: callData.rv_interest?.budget,
            timeline: callData.rv_interest?.timeline,
            trade_in: callData.rv_interest?.trade_in === 'yes',
            appointment_requested: callData.appointment_request?.requested,
            appointment_day: callData.appointment_request?.preferred_day,
            appointment_time: callData.appointment_request?.preferred_time,
            appointment_type: callData.appointment_request?.appointment_type,
            priority: callData.priority,
            needs_human_followup: callData.needs_human_followup,
            notes: callData.notes
          }
        ]);

      if (leadError) throw leadError;

      // Send email alert
      await sendEmailAlert(callData);
    }

    res.json({ success: true, call_id: callData.call_id });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Email alert function
async function sendEmailAlert(callData) {
  const subject = `New ${callData.call_type === 'sales_lead' ? 'Sales Lead' : 'Message'} from After-Hours AI`;
  const htmlContent = `
    <h3>New Lead from Fife RV After-Hours AI</h3>
    <p><strong>Name:</strong> ${callData.caller_name}</p>
    <p><strong>Phone:</strong> ${callData.phone}</p>
    <p><strong>Email:</strong> ${callData.email || 'N/A'}</p>
    <p><strong>Intent:</strong> ${callData.intent}</p>
    <p><strong>RV Type:</strong> ${callData.rv_interest?.category || 'Unknown'}</p>
    <p><strong>Timeline:</strong> ${callData.rv_interest?.timeline || 'Unknown'}</p>
    <p><strong>Appointment Requested:</strong> ${callData.appointment_request?.requested ? 'Yes' : 'No'}</p>
    <p><strong>Priority:</strong> ${callData.priority}</p>
    <p><strong>Notes:</strong> ${callData.notes || 'None'}</p>
  `;

  try {
    await axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [
        {
          to: [{ email: process.env.TEAM_EMAIL }],
          subject: subject
        }
      ],
      from: { email: process.env.SENDGRID_FROM_EMAIL },
      content: [{ type: 'text/html', value: htmlContent }]
    }, {
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` }
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
```

### Step 6: Create n8n Automation Workflow

In n8n, create this workflow:

```
Webhook (receive Retell data)
  ↓
Parse JSON
  ↓
Send Email (alert team)
  ↓
Post to Google Sheet (log lead)
  ↓
(Optional) Send SMS alert
  ↓
(Optional) Create calendar event
```

---

## 📞 RETELL AI CONFIGURATION

### Create Retell Agent

1. Go to https://retell.ai
2. Create account + get API key
3. Create new agent with:
   - **Name:** Fife RV Center After-Hours Receptionist
   - **System Prompt:** (Use the prompt from this guide)
   - **Voice:** (Choose natural-sounding voice)
   - **Webhook:** https://your-vultr-ip:3000/webhook/retell-call

### Phone Number Integration

1. In Retell dashboard, set up phone number routing:
   - **Number:** (253) 284-6600
   - **Agent:** Fife RV Center After-Hours Receptionist
   - **Hours:** After-hours only (set active hours)
   - **Webhook:** https://your-vultr-ip:3000/webhook/retell-call

---

## 🧪 TESTING CHECKLIST

- [ ] Retell agent test mode (mock calls)
- [ ] Webhook endpoint receives data
- [ ] Data stored in Supabase
- [ ] Email alert sent to team
- [ ] Google Sheet populated
- [ ] Live test call to (253) 284-6600
- [ ] Lead appears in Supabase within 10s
- [ ] Email alert received within 30s

---

## 📊 MONITORING & MAINTENANCE

### Daily Checks
- [ ] New leads in Supabase
- [ ] Email alerts being received
- [ ] Gateway uptime
- [ ] No webhook errors

### Weekly
- [ ] Review lead quality
- [ ] Check conversion rates
- [ ] Refine agent prompts if needed
- [ ] Check call analytics

### Monthly
- [ ] Performance review
- [ ] Scaling needs assessment
- [ ] Cost optimization

---

## 🚀 LAUNCH DAY TIMELINE

**T-0:** System ready, all components tested  
**T+5 min:** Route (253) 284-6600 to Retell  
**T+10 min:** Monitor first incoming calls  
**T+1h:** First leads captured + team alerted  
**T+24h:** Review first 24h of data  
**T+1 week:** Optimize prompts based on feedback

---

## 📈 SUCCESS METRICS

After 1 week, measure:
- Total calls answered: _____
- Sales leads captured: _____
- Appointment requests: _____
- Team satisfaction: _____
- Lead quality feedback: _____

---

**Created by:** Crawford  
**For:** Fife RV Center  
**Date:** 2026-04-30
