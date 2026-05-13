# Project: AI Receptionist for Fife RV Center

## Status: ✅ ALL DECISIONS LOCKED - BUILD APPROVED - STARTING IMMEDIATELY

### Context
- **Client:** Fife RV Center (Fife, WA — near Tacoma)
- **Use Case:** After-hours AI sales receptionist + lead capture
- **Scope:** Phase 1 only — Main sales line, after-hours, sales focus
- **Timezone:** America/Los_Angeles (Pacific)
- **Priority:** High (revenue-generating)

---

## PHASE 1 SPECIFICATION (LOCKED)

### Key Requirement: Flexible Call Routing
The system must support **dynamic, flexible routing** to handle:
- Seasonal schedule variations (summer vs. winter hours)
- Unexpected closures or staff changes
- Holiday exceptions
- Manual on/off control without IT support

**Solution:** Three-tier routing control (time-based + manual toggle + transfer line)  
**Details:** See memory/fife-rv-routing-control.md

---

## PHASE 1 SPECIFICATION (CORE)

### Phone Lines
- **Main Sales Line (AI Answer):** (253) 284-6600 ← **PHASE 1 TARGET**
- Fife Service & Parts: (253) 284-6650 (reference only, for routing)
- Port Orchard Sales/Service/Parts: (360) 813-7430 (reference only, for routing)

### Hours (LOCKED)
- **Monday-Friday:** After-hours only (evenings + nights)
- **Saturday-Sunday:** Closed (store open, humans answer)
- **Holidays & Disasters:** Closed (AI OFF, manual control available)
- **Exact times:** TBD (e.g., 6 PM - 8 AM)

### Core Capabilities (In Priority Order)
1. ✅ Answer after-hours calls
2. ✅ Capture sales leads (appointment requests, inquiries)
3. ✅ Answer questions about RV inventory (from firervcenter.com)
4. ✅ Provide directions & location info
5. ✅ Route/message for Fife Service & Parts
6. ✅ Route/message for Port Orchard
7. ✅ Take messages for employees
8. ✅ Handle concurrent calls (if platform supports)

### Opening Script
```
"Thanks for calling Fife RV Center—this is our automated assistant. 
We're currently closed, but I can still help you check RV availability, 
answer questions, take a message, or get you set up with a visit. 
What can I help you with tonight?"
```

### Primary Sales Flow
1. "Are you looking for a new or used RV?"
2. "What type are you interested in—travel trailer, fifth wheel, motorhome, toy hauler, or something else?"
3. "Are you looking to buy soon, or just starting your search?"
4. "Is there a specific RV from our website you're calling about?"
5. "Do you have a trade-in?"
6. "What's your name and best phone number in case we get disconnected?"
7. "Would you like someone to call you back, or would you like to request a time to come in?"

### Sales Close Line
```
"We've had a lot of demand lately. Would you like me to request 
a time for you to come in and take a look?"
```

### Website Knowledge Source
**firervcenter.com** — AI reads and answers from:
- RV inventory & listings
- RV details on listing pages
- Directions & location
- Store information
- General dealership info
- Service/parts page info

**Safety Rule:** Answer only from known sources. If unsure, use fallback:
```
"I can help get that started and have the right person confirm 
the details when we open."
```

### HARD RESTRICTIONS (DANGER ZONES)
The AI must NOT:
- ❌ Promise final pricing
- ❌ Guarantee inventory availability
- ❌ Promise financing approval
- ❌ Quote or guarantee trade value
- ❌ Diagnose service issues
- ❌ Give repair estimates
- ❌ Guarantee parts fitment
- ❌ Make warranty/legal commitments
- ❌ Share employee personal information
- ❌ Commit dealership to delivery timing, discounts, holds, or deal terms

Use safe fallback for all edge cases above.

### Output JSON Format (Every Call)
```json
{
  "call_type": "sales_lead | service_message | parts_message | port_orchard_message | employee_message | general_question",
  "caller_name": "string",
  "phone": "string",
  "email": "string (optional)",
  "intent": "string (what they're looking for)",
  "department": "sales | service | parts | port_orchard | general",
  "location": "Fife | Port Orchard",
  "rv_interest": {
    "new_or_used": "new | used | unknown",
    "category": "travel_trailer | fifth_wheel | motorhome | toy_hauler | unknown",
    "stock_number_or_unit": "string (if mentioned)",
    "budget": "string (if mentioned)",
    "timeline": "looking_soon | exploring | unknown",
    "trade_in": "yes | no | unknown"
  },
  "appointment_request": {
    "requested": true,
    "preferred_day": "string (optional)",
    "preferred_time": "string (optional)",
    "appointment_type": "sales_visit | callback | service | parts"
  },
  "employee_message": {
    "employee_requested": "string",
    "reason": "string",
    "urgency": "high | normal",
    "best_callback_time": "string"
  },
  "notes": "string (additional context)",
  "needs_human_followup": "boolean",
  "priority": "normal | high",
  "source": "after_hours_ai",
  "created_at": "ISO-8601 timestamp"
}
```

### Routing Logic

**If caller asks for Fife Service:**
- Do NOT diagnose issues
- Use routing script (see below)
- Refer: (253) 284-6650

**If caller asks for Fife Parts:**
- Do NOT guarantee parts fitment
- Use routing script (see below)
- Refer: (253) 284-6650

**If caller asks for Port Orchard:**
- Use routing script (see below)
- Refer: (360) 813-7430

### Routing Script
```
"I can get that to the right team. Let me grab your name, number, 
and a quick note so they can follow up when they open."
```

### Employee Message Flow
If caller asks for a specific employee:
1. Capture caller name
2. Capture phone number
3. Capture employee requested
4. Capture reason for call
5. Capture urgency
6. Capture best callback time

Script:
```
"I'll make sure they get the message. What's the best number 
for them to reach you?"
```

### Escalation Rules

**If AI cannot answer:**
- Capture callback info
- Mark lead/message as `needs_human_followup: true`

**If caller is upset:**
- Apologize once
- Do not argue
- Capture info
- Mark priority as `high`

Script:
```
"I'm sorry about that. I'll make sure this is flagged so the right 
person can follow up with you as soon as possible."
```

### Inventory Response Rule
```
"I'm seeing that listed on the website, but inventory can move quickly. 
I can take your information and have a salesperson confirm availability first thing."
```

### Final Behavior Rules
AI always ends with a clear next step:
- "I'll have someone follow up when we open."
- "I'll submit that appointment request."
- "I'll pass this message to the right person."
- "A salesperson can confirm that availability first thing."

### Call Routing Control (DYNAMIC)

The system must support flexible scheduling:

**Option A: On/Off Switch (Admin Dashboard)**
- Simple toggle: "AI Active" / "AI Offline"
- When OFF: Calls go to voicemail or direct line
- When ON: Calls route to Retell AI
- Useful for: Seasonal changes, one-off closures, training days

**Option B: Direct Transfer Line**
- Create alternate phone line (e.g., secondary extension or direct line)
- Employees can manually route main line to AI when needed
- Useful for: Unexpected closures, staffing changes, events
- Feature: "Press 1 to activate after-hours AI"

**Option C: Time-Based Scheduling**
- Define multiple schedules (summer hours, winter hours, special events)
- System automatically switches between them
- Useful for: Seasonal variations, holiday closures
- Feature: Calendar integration with holiday exceptions

**Recommended: Combination**
- Default: Time-based scheduling (automated)
- Override: Manual on/off toggle (for unexpected situations)
- Backup: Direct transfer line (for tech-savvy staff)

**Implementation:**
- Admin dashboard with simple toggle
- Webhook checks routing status before accepting call
- Audit log of all routing changes
- SMS alert when routing changed (optional)

---

## DATA DESTINATION & AUTOMATION

### Lead Flow (Phased Approach)

**Phase 1: Email Alerts (Starting Point)**
- [ ] Webhook receives call data from Retell
- [ ] Parses lead JSON
- [ ] Sends real-time email alert to team
- [ ] Logs lead to Supabase + optional Google Sheet
- [ ] Ready for manual CRM entry or future automation

**Phase 1.5: CRM Integration (Planned)**
- [ ] Identify Fife RV's CRM system (HubSpot? Pipedrive? Airtable?)
- [ ] Set up webhook mapping to CRM
- [ ] Leads auto-sync to CRM on capture
- [ ] No manual data entry needed

**Phase 2+: Advanced Automation**
- [ ] SMS alerts (optional)
- [ ] Calendar sync
- [ ] Customer confirmation texts
- [ ] Lead scoring/routing rules

### Minimum Automation Setup
- [ ] Send lead JSON to webhook (n8n or Zapier)
- [ ] Post to Google Sheet (instant logging)
- [ ] Email alert to Fife RV sales team
- [ ] SMS alert (optional, if enabled)
- [ ] Create appointment calendar entry (if appointment requested)

### Webhook Payload Example
Every call generates this payload → webhook endpoint:
```json
{
  "call_type": "sales_lead",
  "caller_name": "John Smith",
  "phone": "(206) 555-1234",
  "intent": "Interested in a travel trailer",
  "rv_interest": {
    "category": "travel_trailer",
    "timeline": "looking_soon"
  },
  "appointment_request": {
    "requested": true,
    "preferred_day": "Saturday",
    "preferred_time": "afternoon"
  },
  "notes": "Very interested, asking about inventory",
  "priority": "normal",
  "source": "after_hours_ai",
  "created_at": "2026-04-30T20:45:00Z"
}
```

### Automation Workflow (n8n / Zapier)
1. Webhook receives call data
2. Parse JSON
3. Send email alert: salesperson@fifervcenter.com
4. Post to Google Sheet: Leads tab
5. (Optional) Send SMS to team lead
6. (Optional) Create calendar event if appointment requested

---

## INFRASTRUCTURE PLAN

### Deployment Region: Vultr Seattle
- **Provider:** Vultr (Seattle data center for optimal latency to Fife, WA)
- **Plan:** 2 vCPU VX1 or Cloud Compute High Performance (~$24-43/mo)
- **Status:** To be provisioned

### Architecture
```
Phone Call (253) 284-6600
    ↓
Retell AI (receptionist agent)
    ↓
Webhook → Lead Capture Service
    ↓
Supabase (lead storage) + Email Notification
    ↓
Fife RV Team Inbox
```

### Services Needed
1. **Retell AI** — Voice agent platform + phone integration
2. **Vultr Seattle** — OpenClaw gateway deployment
3. **Supabase** — Lead database + auth
4. **Email Service** — SendGrid or equivalent (notify Fife RV of new leads)

---

## IMPLEMENTATION CHECKLIST

### STEP 1: Infrastructure Setup
- [ ] Create Vultr account + Seattle instance
- [ ] Deploy OpenClaw gateway to Vultr Seattle
- [ ] Set up Supabase project (lead capture database)
- [ ] Configure email service (SendGrid or equivalent)
- [ ] Build call routing control system (on/off switch or direct transfer line)

### STEP 2: Retell AI Configuration
- [ ] Create Retell account + get API key
- [ ] Create Retell agent with system prompt (from spec above)
- [ ] Configure phone number routing: (253) 284-6600 → Retell
- [ ] Set webhook endpoint for call events

### STEP 3: Lead Capture Backend
- [ ] Build webhook handler (receives Retell call events)
- [ ] Parse call transcript + captured data
- [ ] Store leads in Supabase
- [ ] Send email notification to Fife RV on new lead

### STEP 4: Website Knowledge Integration
- [ ] Scrape/index firervcenter.com inventory
- [ ] Build knowledge retrieval system for agent
- [ ] Test agent with sample inventory questions

### STEP 5: Testing & Launch
- [ ] Test with mock calls (Retell test mode)
- [ ] Test lead capture workflow end-to-end
- [ ] Go live: Route (253) 284-6600 to Retell
- [ ] Monitor first week + iterate prompts

### STEP 6: Documentation
- [ ] Provide Fife RV with lead notification setup
- [ ] Document how to access leads in dashboard
- [ ] Set up monitoring + alerting

---

## SUCCESS METRICS (Track These)

### Call & Lead Metrics
- Total after-hours calls answered
- Sales leads captured (count & conversion rate)
- Appointment requests received
- Missed/unknown requests (debug)
- Service messages routed
- Parts messages routed
- Port Orchard messages routed
- Employee messages captured
- Calls needing human follow-up
- Hot leads marked high priority

### Quality Metrics
- Agent script adherence (opening, closing, fallbacks)
- Caller satisfaction (if feedback collected)
- Lead follow-up rate (% of leads contacted by team)
- Appointment booking rate (% of requests that convert)
- Escalation rate (% needing human help)

### Operational Metrics
- Average call duration
- Agent response time (ms)
- Webhook success rate (% leads logged successfully)
- Email/SMS delivery rate
- System uptime

---

## NEXT IMMEDIATE ACTIONS

**For Crawford:**
1. Create Vultr Seattle account + provision instance
2. Deploy OpenClaw gateway
3. Set up Supabase database
4. Build call routing control system (manual toggle + transfer line)
5. Start building Retell agent prompt (from spec)

**For Chris (Fife RV Contact):**
1. Confirm exact after-hours hours (e.g., 6 PM - 8 AM + weekends?) — _flexible, needs toggle_
2. **Email notification:** Single email or list?
   - [ ] Single email: _________________
   - [ ] Email list: ___________________, ___________________, ___________________
3. **Notification format:**
   - [ ] Real-time alert (instant email on every lead)
   - [ ] Daily digest (one email in morning with all leads from previous night)
4. Get Fife RV's business context (tone, key messaging, special promotions?)

---

## Related Files
- Specification: memory/project-ai-receptionist.md (this file)
- Vultr Research: memory/vultr-research.md
- Workspace: `src/fife-rv/` (to be created)

### Contact
- Chris LaVerdiere (client lead)
- Crawford (implementation)
