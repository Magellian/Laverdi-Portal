# Fife RV After-Hours AI Receptionist Architecture

**TL;DR:** Calls to Fife RV's main line after 6 PM are routed via UC Connect's Telco API to Retell AI. Retell's conversational agent answers, gathers info, and either schedules a callback or routes urgent issues to an on-call manager. Call data flows back to Fife RV via webhooks for CRM integration.

---

## Current State (As-Is)

### Phone System Overview

```
┌──────────────────────────────────────────┐
│         PSTN / Carriers                  │
│  (Incoming calls from customers)         │
└─────────────────────┬────────────────────┘
                      │
                      │ SIP
                      ↓
┌──────────────────────────────────────────┐
│   UC Connect (ConnectUC)                 │
│   CUC Web 1.26.14 (Web Admin Panel)      │
├──────────────────────────────────────────┤
│  Telco API (Call Routing/Forwarding)     │
│  SIP Core                                │
│  Phone Extensions & Routing Logic        │
├──────────────────────────────────────────┤
│              IP Phones                   │
│  ├─ Yealink SIP-T46U (6701) - Sales    │
│  ├─ Yealink SIP-T46U (6702) - Service  │
│  ├─ Yealink SIP-T46U (6604) - Dispatch │
│  ├─ Algo 8196 (6750) - Front Desk      │
│  └─ Algo 8196 (9510) - Conference      │
└──────────────────────────────────────────┘
```

### Current Call Flow

```
Business Hours (8 AM–6 PM, Mon–Fri):
  Customer calls (206) 555-0123
    ↓
  UC Connect rings all extensions [6701, 6702, 6604]
    ↓
  Human answers → conversation
    ↓
  Call ends (human logs call manually)

After Hours (6 PM–8 AM, Weekends/Holidays):
  Customer calls (206) 555-0123
    ↓
  UC Connect routes to voicemail
    ↓
  Customer leaves message
    ↓
  Owner checks voicemail next business day
    ↓
  Owner manually calls back (if number is clear)
    ↓
  ??? If customer is waiting → lost call
```

### Current Challenges

- ❌ After-hours callers get voicemail immediately (no human contact)
- ❌ No info captured from voicemail (message is unstructured)
- ❌ Owner must manually review + callback (slow, error-prone)
- ❌ Urgent issues (breakdowns) aren't flagged
- ❌ Callbacks happen on owner's schedule, not urgent priority
- ❌ No CRM integration (no call tracking, no history)

---

## Proposed State (To-Be)

### New Architecture with Retell AI

```
┌─────────────────────────────────────────────────────────┐
│           PSTN / Carriers                               │
│  (Incoming calls from customers)                        │
└────────────────────┬────────────────────────────────────┘
                     │ SIP
                     ↓
┌─────────────────────────────────────────────────────────┐
│   UC Connect (CUC Web 1.26.14)                          │
│   Telco API (Call Routing)                              │
│                                                         │
│   Time-Based Routing Rule:                              │
│   IF time >= 18:00 OR weekend THEN                      │
│     route to Retell SIP trunk                           │
│   ELSE                                                  │
│     ring extensions [6701, 6702, 6604]                  │
└────┬────────────────────────────────────────────────────┘
     │
     │ SIP Trunk (elastic SIP)
     │ Origination: sip:sip.retellai.com
     │ Termination: [provider's SIP URI]
     ↓
┌─────────────────────────────────────────────────────────┐
│   Retell AI Platform                                    │
│   (Cloud-based, hosted by Retell)                       │
│                                                         │
│   After-Hours Receptionist Agent:                       │
│   ├─ Greet caller                                       │
│   ├─ Understand issue (sales, service, dispatch)       │
│   ├─ Collect:                                           │
│   │  ├─ Name                                            │
│   │  ├─ Phone number                                    │
│   │  ├─ Issue description                               │
│   │  ├─ RV model / unit (if applicable)                 │
│   │  └─ Urgency (emergency, urgent, routine)            │
│   ├─ Determine action:                                  │
│   │  ├─ Urgent → warm transfer to on-call manager       │
│   │  ├─ Emergency → transfer + SMS alert to manager     │
│   │  ├─ Routine → schedule callback                     │
│   │  └─ Invalid → explain hours + hang up               │
│   └─ Webhook callback to Fife RV API                    │
│                                                         │
│   Call Recording: ✓ Automatic                           │
│   Transcription: ✓ Real-time                            │
│   PII Handling: ✓ Opt-out storage                       │
└───┬────────────────────────────────────────────────────┘
    │
    │ WEBHOOK (REST API)
    │ POST https://api.fiferv.com/webhooks/retell
    │ Event: call_ended, call_analyzed
    │
    ├──→ Call metadata (ID, duration, transcript)
    ├──→ Collected info (name, phone, issue, urgency)
    ├──→ Scheduled callback time
    └──→ Recording URL
    │
    ↓
┌─────────────────────────────────────────────────────────┐
│   Fife RV Backend Services                              │
│   (Your servers, on-premises or cloud)                  │
│                                                         │
│   Webhook Handler:                                      │
│   ├─ Receive call_ended event from Retell              │
│   ├─ Parse transcript & extracted data                 │
│   ├─ Log to CRM/database                               │
│   ├─ Create callback task                              │
│   └─ Send SMS/email notification to manager            │
│                                                         │
│   Callback Scheduler:                                   │
│   ├─ Scheduled background job (cron)                   │
│   ├─ At callback time:                                 │
│   │  ├─ Fetch Retell API for agent availability       │
│   │  ├─ Call customer via Retell outbound API         │
│   │  │  (or human manager if urgent)                  │
│   │  ├─ Route to human if available                   │
│   │  └─ Log result to CRM                             │
│   └─ Retry logic if no answer                         │
│                                                         │
│   Escalation Logic:                                     │
│   ├─ Emergency detection:                              │
│   │  ├─ Keywords: "breakdown," "stranded," "danger"   │
│   │  ├─ Urgency flag = "emergency"                     │
│   │  └─ SMS alert to on-call manager: URGENT           │
│   │     Call from [name]: [issue summary]              │
│   │     Call back: [phone number]                      │
│   └─ Manager acknowledges → callback initiated        │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Call Flows

### Flow 1: Routine After-Hours Call (Schedule Callback)

```
TIME: 8:45 PM (Friday)

1. Customer dials (206) 555-0123
   ↓
2. UC Connect Telco API detects:
   - Time >= 18:00 (after 6 PM)
   - Day = Friday
   - After-hours routing enabled
   ↓
3. UC Connect routes call via SIP trunk:
   INVITE sip:sip.retellai.com
   From: <sip:customer@carrier.com>
   To: <sip:6701@sip.retellai.com>
   ↓
4. Retell AI answers within 2–3 seconds
   
   Agent: "Hi! Thanks for calling Fife RV.
            This is our after-hours line.
            How can I help you tonight?"
   ↓
5. Customer: "Hi, I need to schedule service for my camper."
   ↓
6. Retell AI processes request
   - ASR transcribes: "schedule service camper"
   - LLM intent: sales/service follow-up
   - Action: collect details for callback
   ↓
7. Agent: "Sure! I'd love to help.
            Can you tell me your name?"
   
   Customer: "It's Sarah Johnson."
   ↓
8. Agent: "Thanks, Sarah. What's the best number
            to reach you back?"
   
   Customer: "(206) 555-4455"
   ↓
9. Agent: "And what's your RV model or unit number?"
   
   Customer: "It's a 2022 Winnebago Vista, unit SN-123456."
   ↓
10. Agent: "Great! What issue did you want to discuss?"
    
    Customer: "The toilet isn't working properly. It's
               not a full emergency, but I'd like to get
               it fixed soon."
    ↓
11. Retell AI extracts:
    - Name: "Sarah Johnson"
    - Phone: "(206) 555-4455"
    - Issue: "Toilet malfunction"
    - RV: "2022 Winnebago Vista, SN-123456"
    - Urgency: "routine" (not emergency)
    - Preferred callback time: "Saturday 10 AM"
    ↓
12. Agent: "Perfect, Sarah. I've noted your information.
             Our service team will call you back
             Saturday morning around 10 AM. Is that okay?"
    
    Customer: "Yes, thank you!"
    ↓
13. Agent: "You're welcome. Goodbye!"
    
    [Call ends after ~3 minutes]
    ↓
14. Retell AI triggers webhook:
    
    POST https://api.fiferv.com/webhooks/retell
    {
      "event": "call_ended",
      "call_id": "call_xyz123",
      "from_number": "+1206554455",
      "to_number": "+1206555-0123",
      "direction": "inbound",
      "duration_seconds": 180,
      "call_status": "completed",
      "transcript": "Agent: Hi, thanks for calling Fife RV...",
      "transcript_object": [...],
      "call_analysis": {
        "customer_name": "Sarah Johnson",
        "customer_phone": "(206) 555-4455",
        "rv_model": "2022 Winnebago Vista",
        "rv_serial": "SN-123456",
        "issue_type": "plumbing_toilet",
        "issue_description": "Toilet not working properly",
        "urgency": "routine",
        "preferred_callback_time": "Saturday 10 AM",
        "service_requested": true
      },
      "recording_url": "https://retell-cdn.../call_xyz123.mp3",
      "start_timestamp": 1714026300000,
      "end_timestamp": 1714026480000
    }
    ↓
15. Fife RV Webhook Handler receives event:
    ├─ Validate signature (x-retell-signature)
    ├─ Parse JSON
    ├─ Extract call_analysis fields
    ├─ Create database record:
    │  INSERT INTO after_hours_calls:
    │  {
    │    call_id: "call_xyz123",
    │    customer_name: "Sarah Johnson",
    │    customer_phone: "(206) 555-4455",
    │    issue: "Toilet malfunction",
    │    urgency: "routine",
    │    callback_scheduled: "2026-04-19 10:00:00",
    │    status: "pending_callback"
    │  }
    ├─ Send email to service manager:
    │  Subject: "After-Hours Callback Scheduled: Sarah Johnson"
    │  Body: "New service request for Winnebago Vista (SN-123456).
    │         Toilet malfunction. Callback: Saturday 10 AM."
    ├─ Log call to CRM
    └─ Return HTTP 204 (success)
    ↓
16. Scheduled Task (Saturday 9:50 AM):
    - Check for callbacks due in next 30 minutes
    - Find: "Sarah Johnson, callback @ 10 AM"
    - Determine if human or AI callback:
      * Check: Is service manager available?
      * YES → Human calls customer
      * NO → Retell AI calls customer (outbound)
    ↓
17. Service manager calls Sarah:
    - Greeting & context: "Hi Sarah, this is Mike from Fife RV
                           service team. You called about your
                           toilet issue?"
    - Discussion: Troubleshooting, scheduling in-shop visit
    - Outcome: Service appointment booked for Tuesday 2 PM
    ↓
18. End result:
    ✓ Customer got callback within expected timeframe
    ✓ Issue addressed by human expert
    ✓ Service scheduled
    ✓ CRM fully updated with history
```

---

### Flow 2: Emergency (Immediate Escalation)

```
TIME: 2:15 AM (Sunday)

1. Customer dials (206) 555-0123 (on-road breakdown)
   ↓
2. UC Connect routes to Retell AI (after-hours)
   ↓
3. Retell AI answers
   
   Agent: "Thanks for calling Fife RV.
            What can I help you with?"
   ↓
4. Customer: "Oh man, my RV just broke down on I-5!
              The engine died and I can't get it started.
              I'm stranded here with my family!"
   ↓
5. Retell AI detects emergency keywords:
   - "broke down"
   - "stranded"
   - Urgency detection: HIGH
   ↓
6. Agent: "I'm so sorry to hear that! This sounds urgent.
            Let me get you help right away.
            First, what's your name?"
   
   Customer: "It's John Martinez."
   ↓
7. Agent: "John, I'm connecting you to our manager now.
            Please stay on the line."
   
   [Warm transfer initiated]
   ↓
8. Retell triggers emergency webhook + SMS alert:
   
   POST https://api.fiferv.com/webhooks/retell
   {
     "event": "transfer_started",
     "call_id": "call_emergency_001",
     "urgency": "EMERGENCY",
     "customer_name": "John Martinez",
     "customer_phone": "+1206555-8888",
     "issue": "Engine breakdown on I-5, stranded with family",
     "transfer_destination": "+1206555-0199", // on-call manager
     ...
   }
   ↓
9. Simultaneously, SMS to on-call manager:
   
   "🚨 EMERGENCY CALLBACK 🚨
    Customer: John Martinez (+1206555-8888)
    Issue: Engine breakdown on I-5, STRANDED with family
    Call coming in now. Answer to connect..."
   ↓
10. On-call manager (Mike):
    ├─ Sees SMS alert
    ├─ Phone rings (transferred from Retell)
    ├─ Answers: "Hi John, I'm Mike from Fife RV.
                 I see you've got a breakdown issue?"
    ├─ Conversation:
    │  ├─ "Where exactly are you on I-5?"
    │  ├─ "What's your RV model and unit number?"
    │  ├─ "Have you tried the basic troubleshooting?"
    │  ├─ "I'm dispatching our roadside assistant NOW."
    │  ├─ "They'll be there in about 40 minutes."
    │  └─ "Stay in the RV, doors locked, hazards on."
    └─ Call ends
    ↓
11. Webhook handler receives transfer_ended event:
    ├─ Create urgent incident ticket
    ├─ Escalate to dispatch team
    ├─ Send internal alert: "Roadside emergency in progress"
    ├─ Track: Dispatch ETA, resolution, customer satisfaction
    └─ Follow-up email to customer within 24 hours
    ↓
12. Result:
    ✓ Customer got immediate human assistance (not AI)
    ✓ Dispatch team notified in real-time
    ✓ Roadside help dispatched
    ✓ No wait time; warm transfer worked
    ✓ Incident logged for post-event analysis
```

---

### Flow 3: Outbound Callback by Retell AI (Routine)

```
TIME: Saturday 10:00 AM (per scheduled callback)

1. Fife RV backend detects due callback:
   SELECT * FROM after_hours_calls
   WHERE callback_scheduled <= NOW()
   AND status = 'pending_callback'
   ↓
2. Check manager availability:
   - Is service manager available? NO (at lunch)
   - Option 1: Wait for manager
   - Option 2: AI callback now (faster)
   - Decision: AI callback (routine issue, lower priority)
   ↓
3. Fife RV calls Retell API:
   
   POST https://api.retellai.com/create-phone-call
   {
     "from_number": "+1206555-0123",  // Fife RV's Retell number
     "to_number": "+1206555-4455",    // Sarah's number
     "override_agent_id": "agent_callback_routine",
     "retell_llm_dynamic_variables": {
       "customer_name": "Sarah Johnson",
       "rv_model": "2022 Winnebago Vista",
       "rv_serial": "SN-123456",
       "issue": "Toilet not working properly",
       "previous_call_transcript": "[transcript from Thu night]"
     },
     "metadata": {
       "internal_call_id": "callback_sarah_001",
       "original_call_id": "call_xyz123",
       "type": "scheduled_callback"
     }
   }
   ↓
4. Retell initiates outbound call to Sarah:
   
   Retell Agent: "Hi Sarah, this is the Fife RV service
                  team calling back about your service
                  request for your Winnebago Vista."
   ↓
5. Sarah answers:
   
   Sarah: "Oh hi! Yes, thanks for calling back."
   ↓
6. Retell agent (context-aware via dynamic variables):
   
   "I see you reported a toilet issue. Can you tell me
    if you've used the toilet since we last spoke?"
   ↓
7. Sarah describes current status:
   
   "Yes, actually it's working now, but it's not
    flushing properly. It just trickles."
   ↓
8. Retell AI processes (could escalate or continue):
   
   Option A: Continue troubleshooting (for simple issues)
   "Let me walk you through a quick fix..."
   
   Option B: Schedule in-shop service (complex issues)
   "That sounds like it needs a professional look.
    Can you come in Tuesday afternoon?"
   ↓
9. In this case: AI solves issue with simple fix
   
   "Try this: Close the ball valve under the sink for
    30 seconds. That clears air locks. Then reopen."
   ↓
10. Sarah: "Oh! That worked! It's flushing normally now."
    ↓
11. Retell AI logs resolution:
    
    "Great! I'm glad we got that sorted.
     Your service history is updated.
     Thanks for choosing Fife RV. Goodbye!"
    ↓
12. Call ends (duration: ~4 minutes)
    ↓
13. Retell webhook (call_ended):
    
    POST https://api.fiferv.com/webhooks/retell
    {
      "event": "call_ended",
      "call_id": "call_callback_sarah_001",
      "direction": "outbound",
      "duration_seconds": 240,
      "call_status": "completed",
      "call_analysis": {
        "issue_resolved": true,
        "resolution_method": "remote_troubleshooting",
        "customer_satisfied": true,
        "escalation_needed": false
      },
      ...
    }
    ↓
14. Webhook handler:
    ├─ Update database:
    │  UPDATE after_hours_calls
    │  SET status = 'resolved',
    │      resolution = 'air_lock_fix',
    │      resolved_at = NOW()
    │  WHERE call_id = 'call_xyz123'
    ├─ Send survey email to Sarah:
    │  "How was your experience with our after-hours service?"
    ├─ Mark ticket as closed
    └─ Log to CRM: Service case resolved
    ↓
15. Result:
    ✓ Customer problem solved immediately
    ✓ No dispatcher needed
    ✓ CRM updated with resolution
    ✓ Customer survey scheduled
    ✓ Analytics logged for improvements
```

---

## System Components & Integration Points

### 1. UC Connect (Time-Based Routing)

```
Component: Telco API
Purpose: Route inbound calls based on time
Config:
  Rule Name: "After-Hours-AI-Route"
  Active Hours: 18:00–08:00 (6 PM – 8 AM)
  Days: Mon–Fri + weekends
  Action: Forward to SIP trunk "retell-ai"
  Fallback: Voicemail (if SIP trunk down)
  
Integration Points:
  ├─ Inbound call detection
  ├─ Time evaluation
  ├─ SIP trunk routing
  └─ Fallback logic
```

### 2. Retell AI (Call Handling & Routing)

```
Component: After-Hours Receptionist Agent
Purpose: Answer calls, collect info, route/escalate
Config:
  Agent Type: Conversation Flow (structured)
  Voice: Professional, friendly
  Language: English
  Goals:
    ├─ Collect customer info (name, phone, issue)
    ├─ Classify issue (urgency level)
    ├─ Route to human (if urgent) or schedule callback
    └─ Transcribe + webhook to Fife RV
  
  Tools/Functions:
    ├─ Call transfer (warm → on-call manager)
    ├─ Webhook trigger (call_ended)
    └─ Recording + transcription
  
  Integration Points:
    ├─ Inbound call from UC Connect
    ├─ Warm transfer to external number
    ├─ Outbound calls (for callbacks)
    ├─ Webhook to Fife RV backend
    └─ Recording delivery
```

### 3. Fife RV Backend (Callback Orchestration)

```
Component: Webhook Handler + Callback Scheduler
Purpose: Receive call data, schedule callbacks, escalate
Tech Stack:
  ├─ HTTP endpoint (REST API)
  ├─ Database (after_hours_calls table)
  ├─ Background job scheduler (cron)
  ├─ CRM integration
  └─ SMS/Email notifications

Responsibilities:
  1. Receive & verify Retell webhook
  2. Parse call data + extracted info
  3. Create callback task in database
  4. Notify management (email/SMS)
  5. Schedule background job:
     ├─ At callback time, check availability
     ├─ If human available → human calls
     ├─ Else → Retell outbound call
  6. Track resolution + update CRM
  
Integration Points:
    ├─ Receive Retell webhooks
    ├─ Call Retell API (outbound calls)
    ├─ Store/retrieve from database
    ├─ Notify team (SMS/email)
    └─ Update CRM
```

### 4. On-Call Manager (Human Escalation)

```
Component: Alert receiver + Call handler
Purpose: Handle urgent transfers + callbacks

Flow:
  1. Receive SMS alert (for emergencies)
  2. Answer transferred call (warm transfer from Retell)
  3. Troubleshoot / dispatch
  4. Log outcome

Interface:
  ├─ SMS notifications (for emergencies)
  ├─ Incoming phone call (transferred)
  ├─ Web dashboard (view pending callbacks)
  └─ CRM notes (log resolution)
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ INBOUND CALL (after-hours)                                  │
│ Customer → PSTN → UC Connect → Retell AI                    │
├─────────────────────────────────────────────────────────────┤

1. CALL SETUP
   INVITE [to Retell SIP trunk]
   ← 200 OK [SDP negotiated]

2. CALL HANDLING (Retell AI)
   ↓ Audio stream (RTP)
   Retell ASR (Speech-to-Text)
   ↓ Text
   Retell LLM (GPT-4.1)
   ↓ Intent + Actions
   Retell TTS (Text-to-Speech)
   ↓ Audio stream (RTP)

3. CALL TERMINATION
   BYE [call ends]
   ← 200 OK

4. WEBHOOK (async after call ends)
   POST /webhooks/retell
   Body:
   {
     call_id: string,
     transcript: string,
     call_analysis: { extracted fields },
     recording_url: string,
     ...
   }
   ← Response: HTTP 204

5. BACKEND PROCESSING
   ├─ Parse webhook → extract data
   ├─ Create callback task
   ├─ Store in database
   ├─ Send notifications
   └─ Schedule background job

6. CALLBACK EXECUTION (at scheduled time)
   Retell outbound call (Fife RV API trigger)
   ↓
   Retell calls customer
   ↓
   Customer answers → AI or human handles
   ↓
   Call ends
   ↓
   Webhook confirms callback completion
```

---

## Security & Compliance Considerations

### Data Handling

```
Sensitive Data:
├─ Customer phone numbers
├─ RV serial numbers
├─ Issue descriptions (may contain sensitive info)
├─ Call recordings (audio files)
└─ Transcripts (text with customer info)

Retell AI Safeguards:
├─ PII Removal (+$0.01/min): Auto-redact SSNs, credit cards
├─ Opt-out Storage: Transcripts not stored in Retell
├─ Recording URL Timeout: Available for 10 minutes only
├─ Encryption: TLS for all calls + webhooks
└─ HIPAA-ready: SOC 2 certified, BAA available

Fife RV Responsibilities:
├─ Save recordings to your own secure storage
│  (URL expires in 10 min, so download immediately)
├─ Hash/encrypt sensitive fields in database
├─ Restrict webhook endpoint to authorized callers
│  (verify x-retell-signature header)
├─ Audit webhook access (logs)
├─ Backup data regularly
└─ Comply with local privacy laws (WA state, etc.)
```

### Network & Firewall

```
Inbound:
├─ Allow SIP/RTP from Retell IP blocks:
│  - 18.98.16.120/30 (SIP SBC)
│  - Others per Retell docs
├─ Allow HTTPS webhook from Retell
│  (or restrict to Retell's IP ranges)
└─ Ensure UC Connect can route SIP outbound

Outbound:
├─ Allow UC Connect → Retell SIP trunk
│  - sip.retellai.com:5060 (TCP/UDP)
│  - sip.retellai.com:5061 (TLS)
├─ Allow backend → Retell API
│  - api.retellai.com:443 (HTTPS)
└─ Allow SMS provider (if used for alerts)
```

### Call Recording Compliance

```
Legal Requirements (Consult with Legal):
├─ Two-party consent states (CA, PA, etc.)?
│  - Yes → Inform caller that call is being recorded
│  - Retell does this automatically
├─ Record retention policy:
│  - How long to keep recordings?
│  - Auto-delete after 90 days?
│  - GDPR: Right to deletion?
├─ Data privacy policy:
│  - Update website: "After-hours calls are AI-handled"
│  - Disclose: "Calls may be recorded and analyzed"
└─ Audit trail:
│  - Log who accessed recordings
│  - Log when data was deleted
```

---

## Potential Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Retell AI misunderstands request** | Customer frustrated, callback delayed | Detailed agent training, handoff to human for complex issues |
| **Retell service down** | Calls fail, customers get error | Fallback: UC Connect routes to voicemail automatically |
| **Network latency** | Call feels slow (1–2 sec delay) | Acceptable for after-hours; manage expectations |
| **Callback not made on time** | Customer upset (missed window) | Retry logic, SMS reminder, escalation if >2 misses |
| **Customer phone number incorrect** | Callback fails | Verify phone during initial call; manual callback option |
| **Recording not saved** | No audit trail | Download via webhook immediately; store redundantly |
| **Webhook endpoint fails** | Call data lost | Implement retry logic in Retell (built-in, 3 attempts) |
| **Sensitive data in transcript** | Privacy breach | PII removal enabled; opt-out storage; audit access |
| **Emergency call routed to AI** | Life-safety risk | Keywords detection (stranded, breakdown) → warm transfer |
| **Manager doesn't receive alert** | Escalation fails | SMS + email + in-app notification + fallback SMS |

---

## Monitoring & Observability

```
Metrics to Track:
├─ Call Volume
│  ├─ Total calls/day
│  ├─ Calls answered by AI
│  ├─ Calls transferred to human
│  └─ Callbacks scheduled
├─ Call Quality
│  ├─ Average duration
│  ├─ Customer satisfaction (survey)
│  ├─ Issue resolution rate (AI vs. human)
│  └─ Callback completion rate
├─ System Health
│  ├─ Retell uptime
│  ├─ UC Connect uptime
│  ├─ Webhook delivery success rate
│  ├─ API latency (Retell)
│  └─ Database latency
├─ Financial
│  ├─ Retell cost/month (per-minute tracking)
│  ├─ Cost per call
│  └─ ROI (cost vs. manual after-hours coverage)
└─ Operational
    ├─ Manager response time (to alerts)
    ├─ Escalation rate (% urgent calls)
    ├─ Callback scheduling accuracy
    └─ Team satisfaction with system

Logging:
├─ UC Connect logs (SIP routing decisions)
├─ Retell logs (via dashboard + API)
├─ Fife RV webhook handler logs:
│  ├─ Webhook received
│  ├─ Signature verified
│  ├─ Data parsed + stored
│  ├─ Notifications sent
│  └─ Callback scheduled
├─ Database logs (SQL queries)
└─ Email/SMS logs (delivery confirmation)

Alerting:
├─ Retell service degradation
├─ Webhook delivery failures (>3 in 1 hour)
├─ Database errors
├─ High callback reschedule rate
└─ Cost exceeding budget
```

---

## Success Criteria

| Goal | Metric | Target |
|------|--------|--------|
| **Call Answering** | % of after-hours calls answered | >95% |
| **Response Time** | Avg time to AI greeting | <3 seconds |
| **Callback Rate** | % of scheduled callbacks completed | >80% |
| **Resolution** | % of issues resolved (AI or callback) | >75% |
| **Customer Satisfaction** | NPS or 1–5 star rating | >4.0 |
| **System Uptime** | % of time system available | >99.5% |
| **Cost Efficiency** | Cost per call (Retell + labor) | <$2.00 |
| **Escalation Time** | Time from call to human contact (urgent) | <5 minutes |
| **Data Accuracy** | % of collected info correct (name, phone) | >95% |

---

## Summary

The Fife RV After-Hours AI Receptionist architecture combines UC Connect's time-based routing with Retell AI's intelligent conversation capabilities. Calls arriving after business hours are intelligently handled: routine requests are queued for callback, while emergencies are immediately escalated to an on-call manager. All interactions are recorded, transcribed, and synchronized with Fife RV's backend via webhooks for CRM integration and operational analytics. This design balances automation (cost savings) with human expertise (complex issues), ensuring customers receive prompt attention 24/7 while freeing the team from manual after-hours call handling.
