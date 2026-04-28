# Implementation Plan: Retell AI for Fife RV After-Hours Receptionist

**TL;DR:** Launch in 4–6 weeks. Phase 1 validates the approach, Phase 2–4 build & configure, Phase 5 tests & goes live. Key dependencies: UC Connect Telco API verification, SIP trunk setup, Retell account.

---

## Phase 1: Research & Discovery (Weeks 1–2)

### Goal
Confirm technical feasibility and finalize requirements before development.

### Activities

#### 1.1 UC Connect Telco API Verification
**Owner:** IT Team (with ConnectUC support)
**Duration:** 3–5 days

```
Tasks:
  ☐ Contact ConnectUC support
    - Request full API documentation for CUC Web 1.26.14
    - Ask about: SIP trunk config, time-based routing, webhooks
    - Request: Sample code or API specification (OpenAPI/Swagger)
  
  ☐ Review API docs when received
    - Identify exact endpoints for routing rules
    - Determine authentication method (API key? OAuth? Token?)
    - Check rate limits & SLA
    - Verify webhook support (if needed)
  
  ☐ Test in staging environment
    - Create test after-hours routing rule in CUC Web UI
    - Verify rule activates/deactivates on time
    - Check SIP trunk configuration options
    - Test failover/fallback behavior

Deliverable:
  - API specification document (for developers)
  - Sample cURL/Python code to create routing rules
  - Confirmed: Can route inbound calls to external SIP trunk? YES/NO
```

#### 1.2 Retell AI Account Setup & POC
**Owner:** Product Owner / CTO
**Duration:** 2–3 days

```
Tasks:
  ☐ Sign up for Retell AI dashboard
    - Visit https://dashboard.retellai.com
    - Create account (business email)
    - Add payment method
  
  ☐ Build test agent
    - Create "Fife RV After-Hours Test Agent"
    - Configure conversation flow:
      ├─ Greeting: "Thanks for calling Fife RV..."
      ├─ Collect: name, phone, issue, urgency
      ├─ Routing: If urgent → transfer; else → collect callback time
      └─ Webhook: Send call data to webhook.site (temp)
  
  ☐ Test agent via web call
    - Use Retell dashboard "Test" button
    - Simulate caller interactions
    - Verify transcript quality
    - Test webhook delivery
  
  ☐ Estimate costs
    - Test with different LLMs (GPT-4.1, Claude, etc.)
    - Note latency/quality tradeoffs
    - Estimate monthly cost (30 calls @ 3 min avg)

Deliverable:
  - Retell account (production-ready)
  - Test agent (ready for refinement)
  - Cost estimate document
```

#### 1.3 Network & Security Review
**Owner:** Network/Security Team
**Duration:** 2–3 days

```
Tasks:
  ☐ Firewall rules planning
    - Identify Retell IP blocks to whitelist
      (18.98.16.120/30 + others from Retell docs)
    - Plan SIP traffic rules (UC Connect → Retell)
    - Plan HTTPS rules (backend → Retell API)
  
  ☐ Webhook security design
    - Verify x-retell-signature verification capability
    - Plan IP allowlist (if needed)
    - Determine webhook endpoint URL (https://...)
  
  ☐ Data privacy review
    - Audit Retell's privacy policy
    - Check: HIPAA, SOC 2, PII handling
    - Determine: Recording retention policy
    - Draft: Privacy disclosure for website/IVR

Deliverable:
  - Firewall rule set (ready to deploy)
  - Webhook security checklist
  - Privacy compliance document
```

#### 1.4 Project Kickoff & Alignment
**Owner:** Project Manager
**Duration:** 1 day

```
Tasks:
  ☐ Stakeholder meeting
    - Present: Architecture diagram
    - Present: Cost estimate ($15–25/month)
    - Present: Timeline (4–6 weeks to launch)
    - Get sign-off: Budget, timeline, scope
  
  ☐ Finalize requirements
    - Business hours definition (8 AM–6 PM, Mon–Fri?)
    - On-call manager contact method (phone? SMS?)
    - Callback window preference (same day? next day?)
    - Issue categories (sales, service, dispatch?)
  
  ☐ Assign team roles
    - Project Lead
    - UC Connect API Developer
    - Retell Agent Builder
    - Backend Engineer (webhook handler)
    - QA/Tester

Deliverable:
  - Project charter document
  - Requirements finalized (sign-off)
  - Team assignments confirmed
```

### Phase 1 Exit Criteria

- ✅ UC Connect Telco API documented & SIP trunk routing confirmed possible
- ✅ Retell AI account created & test agent working
- ✅ Cost estimate approved by management
- ✅ Network/security plan defined
- ✅ Team roles assigned & kickoff complete

---

## Phase 2: Setup Retell AI Account & Agent Development (Weeks 2–3)

### Goal
Build and test the Retell AI agent that will handle after-hours calls.

### Activities

#### 2.1 Refine Agent Configuration
**Owner:** Product/AI Specialist
**Duration:** 5–7 days

```
Tasks:
  ☐ Define agent personality & prompt
    - Write detailed system prompt (see below)
    - Specify voice (Retell, ElevenLabs, or other)
    - Set response speed/tone
  
  ☐ Build conversation flow
    Type: Structured Conversation Flow (not prompt-based)
    Nodes:
      1. [Greeting] → Welcome caller, explain after-hours
      2. [Collect Name] → Ask name, confirm
      3. [Classify Issue] → "Is this sales, service, or dispatch?"
      4. [Gather Details] → Issue description, RV info, etc.
      5. [Assess Urgency] → "How urgent is this?"
      6. [Routing Decision]
         ├─ If urgent & human available → [Warm Transfer]
         ├─ If emergency → [Escalate + Alert]
         └─ Else → [Schedule Callback]
      7. [Confirm Callback] → Repeat details, confirm time
      8. [Goodbye] → Thank, hang up
    
  ☐ Configure tools/functions
    - Transfer call function (warm transfer to external #)
    - Webhook trigger (on call end)
    - Voice mail recording (fallback)
  
  ☐ Set up post-call analysis
    - Define custom fields to extract:
      - customer_name: Text
      - customer_phone: Text
      - rv_model: Text
      - issue_type: Selector (sales, service, dispatch, other)
      - issue_description: Text
      - urgency_level: Selector (routine, urgent, emergency)
      - callback_time_preference: Text
      - transfer_needed: Boolean
  
  ☐ Test in Retell dashboard
    - Web call simulation (multiple scenarios)
    - Verify extraction (names, phones, etc.)
    - Check latency (< 2 sec response time)
    - Validate voice quality

Sample System Prompt:
```
You are a professional after-hours receptionist for Fife RV, 
a motor home rental and service company based in Seattle, WA.

Your goals:
1. Greet customers warmly and explain this is the after-hours line
2. Collect their information: name, phone number, RV details (if applicable)
3. Understand their issue (sales inquiry, service request, dispatch emergency)
4. Assess urgency (routine, urgent, life-safety emergency)
5. Route them appropriately:
   - Emergencies → Warm transfer to on-call manager immediately
   - Urgent issues → Schedule callback within 2 hours of next business day
   - Routine → Schedule callback within 24 hours
6. If transfer fails → Offer to record a detailed message

Tone: Friendly, professional, efficient. You represent Fife RV.

Important:
- If customer mentions: "stranded," "breakdown," "engine," "emergency" → FLAG AS URGENT
- If customer is on the road → Escalate immediately
- If you don't understand → Ask clarifying questions
- Always confirm their phone number before ending call
```

Deliverable:
  - Configured agent (ready for integration)
  - Tested conversation flows (5+ scenarios)
  - Post-call analysis template
  - Voice quality verification
```

#### 2.2 Import Phone Number & Configure Webhooks
**Owner:** DevOps / Integration Engineer
**Duration:** 3–5 days

```
Tasks:
  ☐ Purchase or import phone number
    Option A (Simpler): Buy number from Retell
      - $2/month
      - In Retell dashboard: Phone Numbers → Buy New Number
      - Choose area code matching Fife RV (206 area code?)
      - Get: +1-206-555-XXXX
    
    Option B (Better for integration): Import existing number via SIP
      - If Fife RV already has SIP provider (Twilio, etc.)
      - Import into Retell
      - Configure SIP termination URI
      - Set authentication (if needed)
  
  ☐ Bind agent to phone number
    - In Retell dashboard: Phone Numbers → [number] → Configure
    - Set inbound_agent_id → "after-hours-receptionist"
    - Set inbound_agent_version → latest
    - Save & test (call the number from a cell phone)
  
  ☐ Configure webhook endpoint
    Retell settings:
      - Webhook URL: https://api.fiferv.com/webhooks/retell
      - Events to subscribe: call_ended, call_analyzed, transfer_started
      - Verify signature enabled
  
  ☐ Test webhook delivery
    - Make test call via Retell number
    - Verify webhook received (check server logs)
    - Verify signature valid
    - Check: Extracted fields populated

Deliverable:
  - Retell phone number active (testable)
  - Webhook endpoint configured & tested
  - Signature verification working
```

#### 2.3 Set Up Retell Outbound Calling
**Owner:** Backend Engineer
**Duration:** 2–3 days

```
Tasks:
  ☐ Generate Retell API key
    - Retell dashboard → Settings → API Keys
    - Create new key: "fife-rv-backend"
    - Store securely (environment variable, secrets manager)
  
  ☐ Test outbound call API
    Code example (Python):
    
    import os
    from retell import Retell
    
    client = Retell(api_key=os.environ.get("RETELL_API_KEY"))
    
    # Make test outbound call
    call = client.call.create_phone_call(
        from_number="+1206555XXXX",      # Retell number
        to_number="+1206555YYYY",        # Test recipient
        override_agent_id="after-hours-receptionist",
        retell_llm_dynamic_variables={
            "customer_name": "John Test",
            "issue": "test callback"
        }
    )
    
    print(f"Call initiated: {call.call_id}")
    
  ☐ Verify outbound call works
    - Make test call to internal number
    - Verify agent greets & handles
    - Check: Webhook delivered on call end

Deliverable:
  - API key securely stored
  - Outbound call working (tested)
  - Sample code for backend integration
```

### Phase 2 Exit Criteria

- ✅ Retell agent fully configured & tested
- ✅ Phone number imported/bought & agent bound
- ✅ Webhooks configured & delivering
- ✅ Outbound calling API working
- ✅ All 5 conversation scenarios tested successfully

---

## Phase 3: UC Connect Integration (Weeks 3–4)

### Goal
Configure UC Connect to route after-hours calls to Retell AI.

### Activities

#### 3.1 Configure SIP Trunk in UC Connect
**Owner:** UC Connect Administrator
**Duration:** 2–3 days

```
Tasks:
  ☐ Create SIP trunk in CUC Web
    Settings → Trunks → Create New Trunk
    
    Config:
      Trunk Name: "Retell-AI-After-Hours"
      Type: "SIP Trunk"
      Origination URI: sip:sip.retellai.com;transport=tcp
      Termination URI: [depends on provider; Retell will provide]
      Auth: [if required by Retell]
        - Username: [provided by Retell]
        - Password: [provided by Retell]
      Transport: TCP (recommended)
      Active: Yes
  
  ☐ Test trunk connectivity
    - Make test call from phone → UC Connect
    - Verify SIP INVITE reaches Retell
    - Check: UC Connect logs show successful SIP routing
  
  ☐ Whitelist Retell IPs
    Firewall → Allow inbound from:
      - 18.98.16.120/30 (Retell SBC)
      - Any other IPs per Retell docs

Deliverable:
  - SIP trunk active & tested
  - Firewall rules deployed
```

#### 3.2 Create After-Hours Routing Rule
**Owner:** UC Connect Administrator
**Duration:** 2–3 days

```
Tasks:
  ☐ Create time-based routing rule
    Settings → Call Routing → Create Rule
    
    Rule Name: "After-Hours-to-Retell"
    Type: Time-based routing
    
    Condition:
      Days: Monday–Friday
      Time Start: 18:00 (6 PM)
      Time End: 08:00 (8 AM)
      Also include: Weekends & Holidays
    
    Action:
      When rule matches:
        Primary: Route to SIP trunk "Retell-AI-After-Hours"
        Fallback: Route to voicemail
    
    Priority: 1 (execute first)
    Active: Yes (enable on launch date)
  
  ☐ Test rule during off-hours
    - Call Fife RV main line after 6 PM
    - Verify: Retell AI answers (not voicemail)
    - Verify: Agent greets & handles call
    - Verify: Call routed correctly
  
  ☐ Test rule during business hours
    - Call Fife RV main line before 6 PM
    - Verify: Phones ring normally (not Retell)
    - Verify: Rule NOT active during business hours

Deliverable:
  - Routing rule created & tested
  - Failover/fallback verified
```

#### 3.3 Configure Warm Transfer to On-Call Manager
**Owner:** UC Connect Administrator + Retell Specialist
**Duration:** 2–3 days

```
Tasks:
  ☐ Define on-call manager extension/number
    - Primary: Manager's direct number (e.g., 206-555-0199)
    - Or: On-call queue (if multiple managers rotate)
    - Fallback: On-call cell phone (if office phones unavailable)
  
  ☐ Configure transfer in Retell agent
    In agent config:
      Transfer Function:
        - When triggered: Transfer to external number
        - Number: [on-call manager phone]
        - Transfer type: Warm transfer (agent stays on briefly)
        - Greeting: "One moment while I connect you..."
  
  ☐ Test warm transfer
    - Retell agent initiates transfer to manager
    - Manager's phone rings
    - Manager picks up → connected to caller
    - Verify: Audio quality, no drops
    - Verify: Caller can hear manager immediately

Deliverable:
  - Transfer configured in Retell
  - On-call number verified & tested
  - Transfer works end-to-end
```

### Phase 3 Exit Criteria

- ✅ SIP trunk created in UC Connect & tested
- ✅ Firewall rules deployed
- ✅ After-hours routing rule active & tested (off-hours calls → Retell)
- ✅ Business hours routing verified (on-hours calls → extensions)
- ✅ Warm transfer to on-call manager working
- ✅ Fallback to voicemail confirmed (if Retell down)

---

## Phase 4: Backend Integration (Weeks 4–5)

### Goal
Build the backend systems to receive call data from Retell and schedule callbacks.

### Activities

#### 4.1 Build Webhook Handler
**Owner:** Backend Engineer
**Duration:** 3–5 days

```
Tasks:
  ☐ Create HTTP endpoint
    Framework: [Your choice: Node.js/Express, Python/Flask, etc.]
    
    Endpoint: POST /webhooks/retell
    
    Responsibilities:
      1. Receive Retell webhook JSON
      2. Verify x-retell-signature header
      3. Parse call data & extracted fields
      4. Store in database (after_hours_calls table)
      5. Create notification task (email/SMS to team)
      6. Return HTTP 204 (success)
    
    Error handling:
      - Invalid signature → Reject (401)
      - Parse error → Reject (400)
      - Database error → Retry (Retell will retry up to 3x)
  
  ☐ Implement signature verification
    Language: [Use Retell SDK if available, else HMAC-SHA256]
    
    Python example:
    
    from retell import Retell
    
    @app.route('/webhooks/retell', methods=['POST'])
    def handle_webhook():
        raw_body = request.get_data(as_text=True)
        signature = request.headers.get('x-retell-signature')
        
        if not Retell.verify(raw_body, API_KEY, signature):
            return {"error": "Invalid signature"}, 401
        
        # Process webhook...
        return "", 204
  
  ☐ Schema design
    Table: after_hours_calls
    Columns:
      - id (primary key)
      - call_id (Retell call_id, unique)
      - customer_name (string)
      - customer_phone (string)
      - rv_model (string, nullable)
      - issue_type (enum: sales, service, dispatch, other)
      - issue_description (text)
      - urgency_level (enum: routine, urgent, emergency)
      - callback_time (timestamp, nullable)
      - status (enum: pending, completed, cancelled)
      - transcript_url (string, nullable)
      - recording_url (string, nullable)
      - notes (text, nullable)
      - created_at (timestamp)
      - updated_at (timestamp)
  
  ☐ Test webhook locally
    - Use ngrok or webhook.site to capture webhooks
    - Trigger test calls in Retell
    - Verify data stored correctly in database

Deliverable:
  - Webhook endpoint live (production)
  - Signature verification working
  - Data stored in database
  - Error logging configured
```

#### 4.2 Build Callback Scheduler
**Owner:** Backend Engineer
**Duration:** 3–5 days

```
Tasks:
  ☐ Design callback logic
    Workflow:
      1. Background job runs every 15 minutes
      2. Query: after_hours_calls WHERE status = 'pending' AND callback_time <= NOW()
      3. For each callback:
         a. Check: Is manager available? (via calendar/status API?)
         b. If YES → Human callback
            i.   Manager calls customer (manual dialing)
            ii.  Log in CRM: "Manager called, spoke to customer"
         c. If NO → AI callback
            i.   Call Retell API: create_phone_call()
            ii.  Retell calls customer
            iii. Log in CRM: "AI callback completed"
         d. Mark record: status = 'completed'
         e. Send confirmation email to customer
  
  ☐ Implement background job
    Tech:
      - Node.js: node-cron or bull (queue library)
      - Python: APScheduler or Celery
      - Ruby: Sidekiq
    
    Example (Python + APScheduler):
    
    from apscheduler.schedulers.background import BackgroundScheduler
    
    def process_callbacks():
        # Query due callbacks
        callbacks = db.query(AfterHoursCall).filter(
            AfterHoursCall.status == 'pending',
            AfterHoursCall.callback_time <= datetime.now()
        ).all()
        
        for cb in callbacks:
            try:
                # Check manager availability
                manager = get_available_manager()
                
                if manager:
                    # Human callback
                    notify_manager_to_call(cb.customer_phone)
                else:
                    # AI callback
                    retell_client.call.create_phone_call(
                        from_number="+1206555XXXX",
                        to_number=cb.customer_phone,
                        override_agent_id="after-hours-receptionist",
                        retell_llm_dynamic_variables={
                            "customer_name": cb.customer_name,
                            "issue": cb.issue_description
                        }
                    )
                
                cb.status = 'completed'
                db.commit()
            except Exception as e:
                log_error(f"Callback failed for {cb.id}: {e}")
    
    # Schedule job to run every 15 minutes
    scheduler = BackgroundScheduler()
    scheduler.add_job(process_callbacks, 'interval', minutes=15)
    scheduler.start()
  
  ☐ Test callback scheduling
    - Create test callback record (callback_time = now)
    - Run scheduler manually
    - Verify: Callback initiated (check Retell dashboard)
    - Verify: Database record updated to 'completed'

Deliverable:
  - Callback scheduling working
  - Human callbacks (manual)
  - AI callbacks (via Retell API)
  - Database status tracking
  - Error handling & retry logic
```

#### 4.3 Build Notifications (Email/SMS)
**Owner:** Backend Engineer
**Duration:** 2–3 days

```
Tasks:
  ☐ Email notifications
    Template: After-hours callback received
    
    From: noreply@fiferv.com
    To: [manager email]
    Subject: "After-Hours Callback Scheduled: [Name]"
    Body: "
      New after-hours inquiry received:
      
      Customer: [Name]
      Phone: [Phone]
      Issue: [Description]
      RV: [Model]
      Urgency: [Level]
      Callback Scheduled: [Time]
      
      View details: https://api.fiferv.com/admin/callbacks/[id]
    "
  
  ☐ SMS notifications (for emergencies only)
    Template: Emergency alert
    
    Phone: [Manager SMS number]
    Message: "
      🚨 EMERGENCY CALLBACK 🚨
      Customer: [Name]
      Phone: [Phone]
      Issue: [Issue - first 100 chars]
      Action: Manager called; transferred to [Time]
    "
    
    Implement:
      - Use Twilio, AWS SNS, or similar
      - Only for urgency = 'emergency'
      - Retry if failed (up to 3x)
  
  ☐ Test notifications
    - Webhook triggers email
    - Verify: Email received correctly
    - SMS: Test emergency alert
    - Verify: Content accurate, no errors

Deliverable:
  - Email notifications working
  - SMS alerts (for emergencies)
  - Template system configured
```

#### 4.4 CRM Integration (Optional but Recommended)
**Owner:** Backend Engineer
**Duration:** 2–5 days (depends on CRM)

```
Tasks:
  ☐ Identify CRM system
    - What does Fife RV use? Salesforce? HubSpot? Pipedrive? Custom?
    - Access: API key/credentials ready?
  
  ☐ Design CRM sync
    Example (Salesforce):
      When webhook received:
        1. Query: Does contact exist (by phone)?
        2. If NO → Create new contact
        3. If YES → Update existing contact
        4. Create/update Activity/Case:
           - Type: "After-hours callback"
           - Subject: [Issue]
           - Notes: [Transcript summary]
           - Callback scheduled: [Time]
           - Status: "Open" → "Closed" when callback done
  
  ☐ Implement CRM sync
    Code structure:
      
      def sync_to_crm(call_data):
          crm = SalesforceAPI(api_key=...)
          
          # Find or create contact
          contact = crm.find_contact(phone=call_data['phone'])
          if not contact:
              contact = crm.create_contact({
                  'name': call_data['name'],
                  'phone': call_data['phone'],
                  'company': 'Fife RV Customer'
              })
          
          # Create activity
          crm.create_activity({
              'contact_id': contact['id'],
              'type': 'Call',
              'subject': f"After-hours: {call_data['issue']}",
              'description': call_data['transcript'],
              'scheduled_time': call_data['callback_time']
          })
  
  ☐ Test CRM integration
    - Send test call webhook
    - Verify: Contact created/updated in CRM
    - Verify: Activity/case created with correct data

Deliverable:
  - CRM integration complete (optional)
  - Data syncing working
  - Testing completed
```

### Phase 4 Exit Criteria

- ✅ Webhook endpoint live & receiving calls
- ✅ Call data stored in database
- ✅ Callback scheduler working (AI calls customer on schedule)
- ✅ Manager notifications (email/SMS) working
- ✅ CRM integration complete (if applicable)
- ✅ All systems tested end-to-end

---

## Phase 5: Testing & Launch (Week 5–6)

### Goal
Validate system reliability and go live with minimal risk.

### Activities

#### 5.1 QA Testing
**Owner:** QA Engineer + Product Owner
**Duration:** 5–7 days

```
Test Scenarios:

1. INBOUND CALL (ROUTINE)
   ☐ Call after-hours → Retell answers
   ☐ Agent collects info (name, phone, issue)
   ☐ Agent schedules callback
   ☐ Call ends → Webhook received
   ☐ Callback task created in database
   ☐ Manager receives email notification
   
2. INBOUND CALL (URGENT)
   ☐ Call with "urgent" keyword
   ☐ Agent detects urgency
   ☐ Agent initiates warm transfer to manager
   ☐ Manager's phone rings
   ☐ Manager picks up → connected to caller
   ☐ Call ends → Manager confirms resolution
   
3. INBOUND CALL (EMERGENCY)
   ☐ Call with "stranded," "breakdown," "emergency"
   ☐ Agent detects emergency
   ☐ Agent transfers immediately (no confirmation)
   ☐ SMS alert sent to manager
   ☐ Manager receives alert + incoming call simultaneously
   
4. CALLBACK EXECUTION
   ☐ Callback time arrives
   ☐ Background job triggers
   ☐ Retell calls customer
   ☐ AI agent handles (or routes to human)
   ☐ Call ends → Database marked 'completed'
   ☐ Follow-up email sent to customer
   
5. WEBHOOK FAILURE RECOVERY
   ☐ Simulate webhook endpoint down
   ☐ Verify: Retell retries (up to 3x)
   ☐ Verify: We see all retry attempts
   ☐ Endpoint comes back → Webhook eventually succeeds
   
6. SYSTEM FAILOVER
   ☐ Retell service fails
   ☐ Verify: UC Connect falls back to voicemail
   ☐ Verify: Caller can leave message
   ☐ Verify: Fallback works reliably
   
7. BUSINESS HOURS BEHAVIOR
   ☐ Call during 8 AM–6 PM, Mon–Fri
   ☐ Verify: Phones ring (NOT Retell)
   ☐ Verify: Routing rule NOT active
   
8. AFTER-HOURS BEHAVIOR
   ☐ Call at 6:01 PM on Friday
   ☐ Verify: Retell answers (not phones)
   ☐ Call at 8:00 AM Monday
   ☐ Verify: Phones ring (not Retell)
   
9. WEEKEND BEHAVIOR
   ☐ Call at 10 AM Saturday
   ☐ Verify: Retell answers (not phones)
   ☐ Call at 2 PM Sunday
   ☐ Verify: Retell answers

10. DATA ACCURACY
    ☐ Verify: Names, phones, RV info collected correctly
    ☐ Verify: Transcript quality acceptable
    ☐ Verify: Post-call analysis extracted correctly
    ☐ Verify: Database records match Retell data

11. PERFORMANCE
    ☐ Time to agent greeting: < 3 seconds
    ☐ Agent response time: < 1 second
    ☐ Transfer connection time: < 5 seconds
    ☐ Webhook delivery: < 1 minute after call ends

12. SECURITY
    ☐ Webhook signature verification working
    ☐ API keys not exposed in logs
    ☐ Transcripts not visible in UI (unless authorized)
    ☐ PII handling (phone numbers, RV serial) protected

Test Environment Setup:
  - Staging UC Connect (if possible) or prod with test after-hours hours
  - Staging Retell account (test agent) OR prod with test mode
  - Test database (separate from production)
  - SMS/Email sent to test recipients (not real team)

Test Coverage:
  - Positive scenarios: 80% of tests
  - Edge cases: 15% of tests
  - Error scenarios: 5% of tests

Deliverable:
  - Test plan (detailed test cases)
  - Test results (pass/fail for each scenario)
  - Bug log (if any issues found)
  - Sign-off: Ready for production? YES/NO
```

#### 5.2 Load Testing (Optional, but recommended)
**Owner:** DevOps Engineer
**Duration:** 2–3 days

```
Scenarios:
  ☐ Simulate 10 concurrent calls
    - UC Connect routes all to Retell
    - Verify: Retell handles load
    - Verify: Webhook delivery completes for all
    - Verify: Database performance acceptable
  
  ☐ Simulate callback surge
    - 20+ callbacks due at same time
    - Verify: Scheduler doesn't crash
    - Verify: Retell API doesn't throttle
    - Verify: All callbacks initiated within 5 minutes
  
  ☐ Stress test database
    - Insert 1000 call records
    - Query performance: < 100ms
    - Backup speed: acceptable
  
  Metrics to monitor:
    - CPU usage
    - Memory usage
    - Database query time
    - API response time
    - Webhook delivery latency

Deliverable:
  - Load test results
  - Performance baseline (for monitoring)
  - Scaling recommendations (if needed)
```

#### 5.3 User Acceptance Testing (UAT)
**Owner:** Product Owner + Stakeholders
**Duration:** 2–3 days

```
Participants:
  - Fife RV management (1–2 people)
  - Sales team (1 person)
  - Service team (1 person)
  - IT/Operations (1 person)

Test Activities:
  ☐ Make test call after hours
    - Verify: Agent sounds professional
    - Verify: Agent understands issue
    - Verify: Process is clear & easy
  
  ☐ Receive callback
    - Verify: Callback happens at scheduled time
    - Verify: Connection quality is good
    - Verify: Agent (human or AI) handles issue
  
  ☐ Check admin dashboard
    - Verify: Can see call history
    - Verify: Can see pending callbacks
    - Verify: Can mark callbacks complete
  
  ☐ Verify notifications
    - Verify: Email received after call
    - Verify: SMS alert for emergencies
    - Verify: CRM updated correctly
  
  ☐ Gather feedback
    - Is agent script appropriate?
    - Would you change anything?
    - Do callbacks happen as expected?
    - Is the system easy to manage?

Sign-off:
  "We approve this system for production deployment."
  [Stakeholder signature]

Deliverable:
  - UAT test results
  - Feedback document
  - Stakeholder sign-off
```

#### 5.4 Documentation & Runbook
**Owner:** Product Manager + Operations
**Duration:** 2–3 days

```
Documents to create:

1. USER GUIDE (for staff)
   - How to respond to after-hours alerts
   - How to handle emergency transfers
   - How to log callback outcomes in CRM
   - How to view call history/recordings

2. ADMIN GUIDE (for IT/DevOps)
   - How to add new on-call manager number
   - How to disable after-hours routing (if needed)
   - How to check system status & logs
   - How to backup/restore call data

3. TROUBLESHOOTING GUIDE
   - What if calls don't reach Retell?
     → Check SIP trunk, firewall rules
   - What if callbacks don't happen?
     → Check background job, database
   - What if webhooks fail?
     → Check endpoint, signature, logs
   - What if customer can't transfer to manager?
     → Check phone number, manager's availability

4. INCIDENT RESPONSE PLAN
   - How to detect system issues
   - Who to contact (escalation path)
   - How to revert to manual after-hours (voicemail)
   - How to notify customers of service disruption

5. MONITORING & ALERTING SETUP
   - CPU/Memory alerts
   - Database connection alerts
   - Webhook delivery failure alerts
   - Cost overrun alerts (Retell billing)

Deliverable:
  - Complete documentation
  - Runbook for common tasks
  - Incident response plan
```

#### 5.5 Soft Launch (Optional)
**Owner:** Product Manager + Operations
**Duration:** 3–7 days (run alongside voicemail)

```
Approach:
  1. Deploy system to production
  2. Enable for 50% of after-hours calls (A/B test)
     - 50% → Retell AI
     - 50% → Voicemail (old way)
  3. Monitor metrics:
     - System stability (crashes? errors?)
     - Call quality (transcription accuracy)
     - Customer satisfaction (manual feedback)
     - Cost (actual vs. estimated)
  4. Resolve any issues found
  5. Gradually increase Retell % to 100%
  
  Metrics to track:
    - Call success rate (answered/failed)
    - Webhook delivery rate
    - Callback completion rate
    - Customer complaints (if any)
    - System uptime

Deliverable:
  - A/B test results
  - Issues resolved
  - Ready for full launch
```

#### 5.6 Full Production Launch
**Owner:** Project Manager + Operations
**Duration:** 1 day

```
Pre-launch Checklist:
  ☐ All QA tests passed
  ☐ UAT approved by stakeholders
  ☐ Documentation complete & reviewed
  ☐ On-call support plan in place
  ☐ Monitoring & alerting active
  ☐ Backup/disaster recovery tested
  ☐ Cost tracking enabled
  ☐ Staff trained on new system
  
Launch Activities:
  ☐ Enable after-hours routing rule (activate at specific time)
  ☐ Monitor system for first 24 hours (have team on standby)
  ☐ Log all issues/alerts
  ☐ Publish launch announcement (internal)
  ☐ Monitor customer feedback
  
Post-launch:
  ☐ Week 1: Daily check-in (team + stakeholders)
  ☐ Week 2–4: Weekly review (metrics, feedback, issues)
  ☐ Month 2+: Monthly review (ROI, improvements)

Deliverable:
  - System live in production
  - Launch notification sent
  - Initial monitoring period complete
  - Success metrics documented
```

### Phase 5 Exit Criteria

- ✅ QA testing 100% complete (all scenarios passed)
- ✅ UAT approved by stakeholders
- ✅ Load testing passed
- ✅ Documentation complete
- ✅ Staff trained
- ✅ System live in production
- ✅ Initial 24-hour monitoring successful
- ✅ No critical issues found

---

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **UC Connect Telco API doesn't support time-based SIP routing** | Medium | High | Verify early (Phase 1); have fallback plan (manual routing config) |
| **Retell service outage** | Low | Medium | Automatic fallback to voicemail; monitor uptime; redundant provider? |
| **Network latency too high (>2 sec)** | Low | Low | Test in real network; use TCP (not UDP) for SIP; acceptable for after-hours |
| **Agent misunderstands customer** | Medium | Low | Train agent with detailed prompts; escalate to human for complex issues |
| **Callback not made on time** | Medium | Medium | Implement retry logic; SMS reminder if > 2 misses; manual follow-up |
| **Customer phone number incorrect** | Low | Low | Verify phone during call; confirmation email with number |
| **Cost higher than estimate** | Medium | Low | Monitor usage weekly; optimize LLM selection; set cost alerts |
| **Staff resistance to new system** | Low | Low | Early training; emphasize time-saving benefits; get feedback |
| **PII breach / privacy lawsuit** | Very Low | Critical | PII removal enabled; audit logs; only store necessary data |
| **SIP trunk misconfiguration** | Medium | High | Detailed testing (Phase 3); UC Connect expert review |

---

## Timeline Summary

```
Week 1:    Phase 1a: UC Connect API discovery
Week 2:    Phase 1b: Retell POC + Phase 2a: Agent development
Week 3:    Phase 2b: Webhooks + Phase 3: UC Connect integration
Week 4:    Phase 4a: Webhook handler + Phase 4b: Callback scheduler
Week 5:    Phase 4c: Notifications + Phase 5a: QA testing
Week 6:    Phase 5b: UAT + Phase 5c: Documentation
Week 7:    Phase 5d: Soft launch (optional)
Week 8:    Phase 5e: Full production launch

Parallel workstreams:
  - Network & firewall (during Phases 1–3)
  - Training (during Phase 4–5)
  - CRM integration (during Phase 4, optional)
```

---

## Success Metrics (Post-Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Availability** | >99.5% | Uptime monitoring dashboard |
| **Call Answer Rate** | >95% | Retell dashboard + logs |
| **Callback Completion** | >80% | Database (after_hours_calls table) |
| **Customer Satisfaction** | >4.0/5 | Post-callback survey |
| **Cost/Call** | <$2.00 | Retell billing + backend costs |
| **Manager Response Time** | <10 min | Alert timestamp → action timestamp |
| **System Latency** | <3 sec | Time to agent greeting |
| **Data Accuracy** | >95% | Manual audit of 50 calls/month |

---

## Rollback Plan

If critical issues emerge:

1. **Immediate (< 1 hour):**
   - Disable after-hours routing rule in UC Connect
   - Revert to voicemail (old system)
   - Notify stakeholders

2. **Short-term (1–24 hours):**
   - Investigate root cause
   - Fix issue in staging environment
   - Re-test before re-enabling

3. **Long-term:**
   - Document lessons learned
   - Adjust implementation plan
   - Schedule re-launch (with improved plan)

---

## Appendices

### A. Technology Stack (Recommended)

- **UC Connect:** CUC Web 1.26.14 (existing)
- **Retell AI:** Cloud-hosted (production account)
- **Backend Language:** Python (Flask) or Node.js (Express)
- **Database:** PostgreSQL (or existing DB)
- **Job Scheduler:** APScheduler (Python) or Sidekiq (Ruby)
- **Notifications:** Twilio (SMS) + SendGrid (Email)
- **CRM:** [Existing CRM] with REST API
- **Monitoring:** Datadog, New Relic, or Prometheus
- **Secrets Management:** AWS Secrets Manager or HashiCorp Vault

### B. Cost Estimate

```
Recurring Costs:
  Retell AI:           $15–25/month (30 calls × 3 min × $0.12/min avg)
  Phone number:        $2/month (if buying from Retell)
  Callback notifications: $5–10/month (SMS + email)
  ─────────────────────
  Monthly total:       $22–35/month

One-Time Costs:
  Retell integration:  $0 (free API)
  Backend development: 40–60 hours × $100/hr = $4,000–6,000
  Testing & QA:        20–30 hours × $100/hr = $2,000–3,000
  ─────────────────────
  Development total:   $6,000–9,000

ROI (Assuming manual after-hours costs $500/month):
  Savings/month:       $500 - $35 = $465
  Payback period:      $7,500 / $465 ≈ 16 months
```

### C. Contact Information

- **Retell AI Support:** support@retellai.com
- **ConnectUC Support:** [Fife RV's designated contact]
- **Project Lead:** [Name]
- **Technical Lead:** [Name]
- **Product Owner:** [Name]

---

**Document Status:** Ready for Review & Approval

**Next Steps:** 
1. Get stakeholder sign-off on timeline & budget
2. Begin Phase 1 (Week 1)
3. Weekly status check-ins
4. Adjust timeline/scope as needed
