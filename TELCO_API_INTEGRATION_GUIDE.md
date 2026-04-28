# Telco API Integration Guide: UC Connect to Retell AI

**TL;DR:** Route after-hours calls from UC Connect to Retell AI via SIP trunk. Configure time-based routing rule in CUC Web UI, then webhook calls back to your backend. Code examples provided for Python, JavaScript, and cURL.

---

## Step-by-Step Integration

### Step 1: Get UC Connect Telco API Documentation

**Who:** IT Team (with ConnectUC support)
**Timeline:** 3–5 days
**Action:**

1. Contact ConnectUC support
   ```
   "Hi, we need the Telco API documentation for CUC Web 1.26.14.
    Specifically, we need to:
    - Create time-based routing rules
    - Configure SIP trunk for elastic SIP trunking
    - Route calls based on time of day
    
    Can you provide:
    1. Full API reference (OpenAPI/Swagger)
    2. Sample code for routing rules
    3. Authentication method (API key? OAuth?)
    4. Rate limits & SLA
    5. Webhook support (if available)"
   ```

2. Review documentation when received
   - Identify API base URL
   - Get authentication credentials
   - Find endpoints for routing rules
   - Check SIP trunk endpoints

3. Request Retell's SIP trunk configuration details
   ```
   Email: Retell support or your account manager
   
   "Hi, we're integrating Fife RV's UC Connect system with Retell AI.
    Can you provide:
    1. SIP server URI for origination (inbound)
    2. Termination URI (if needed for outbound)
    3. Required authentication (username/password)
    4. IP block for whitelisting (firewall)
    5. Recommended transport protocol (TCP/UDP/TLS)"
   ```

---

### Step 2: Configure SIP Trunk in UC Connect

**Who:** UC Connect Administrator
**Duration:** 2–3 days

#### 2A: Create SIP Trunk via UI (CUC Web)

Navigate to: **Settings → Trunks → Create New Trunk**

**Configuration:**

```
Field                    Value
─────────────────────────────────────────────
Trunk Name              "Retell-AI-After-Hours"
Type                    "SIP Trunk"
Enabled                 Yes
────────────────────────────────────────────
ORIGINATION (Inbound):
  SIP URI               sip:sip.retellai.com
  Transport             TCP (recommended)
  Port                  5060 (default)
────────────────────────────────────────────
TERMINATION (Outbound):
  SIP URI               [provided by Retell provider, if needed]
  Transport             TCP
  Port                  5060
────────────────────────────────────────────
AUTHENTICATION:
  Type                  [depends on Retell config]
  Username              [provided by Retell]
  Password              [provided by Retell]
  ────────────────────────────────────────
  OR: IP Whitelist      [Retell's IP block]
────────────────────────────────────────────
ADVANCED:
  Keep-Alive            Enabled
  Failover              [backup trunk, if available]
```

#### 2B: Test Trunk Configuration

1. From a desk phone, make a test call to a known number
2. Check UC Connect logs to verify SIP INVITE sent to Retell
3. Verify Retell receives the call (check Retell dashboard)
4. Test incoming call from external line
5. Verify UC Connect routes to Retell (not internal extension)

#### 2C: Firewall Configuration

**Required:** Allow traffic from Retell IP block

```bash
# Whitelist Retell SBC IP block
firewall_rule="""
Allow inbound SIP/RTP from:
  - 18.98.16.120/30 (Retell SBC - all regions)
  - 143.223.88.0/21 (US traffic - optional)
  - 161.115.160.0/19 (US traffic - optional)

Allow outbound SIP to:
  - sip.retellai.com:5060 (TCP)
  - sip.retellai.com:5061 (TLS, if applicable)
"""

# Example iptables (Linux):
iptables -A INPUT -s 18.98.16.120/30 -p udp --dport 5060 -j ACCEPT
iptables -A INPUT -s 18.98.16.120/30 -p tcp --dport 5060 -j ACCEPT
iptables -A OUTPUT -d 18.98.16.120/30 -j ACCEPT
```

---

### Step 3: Create Time-Based Routing Rule

**Who:** UC Connect Administrator
**Duration:** 2–3 days

#### 3A: Create Rule via CUC Web UI

Navigate to: **Settings → Call Routing → Create New Rule**

**Configuration:**

```
Field                    Value
─────────────────────────────────────────────
Rule Name              "After-Hours-to-Retell"
Type                   "Time-Based Routing"
Enabled                Yes (but activate on launch date)
Priority               1 (execute first)
────────────────────────────────────────────
CONDITION:
  Days of Week:        Monday, Tuesday, Wednesday, Thursday, Friday
  Time Start:          18:00 (6 PM)
  Time End:            08:00 (8 AM next day)
  Also Apply To:       Weekends & Holidays
────────────────────────────────────────────
ACTION (when rule matches):
  Type:                "Forward to SIP Trunk"
  Trunk Name:          "Retell-AI-After-Hours"
────────────────────────────────────────────
FALLBACK (if SIP trunk fails):
  Type:                "Forward to Voicemail"
  Voicemail Box:       "Default After-Hours Voicemail"
```

#### 3B: Alternative: API-Based Rule Creation

If UC Connect supports API-based rule creation (Phase 1 discovery):

**Python Example:**

```python
import requests
from datetime import time

API_BASE = "https://cuc-web.fiferv.local/api/v1"
API_KEY = "your_api_key_here"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create after-hours routing rule
rule_payload = {
    "name": "After-Hours-to-Retell",
    "enabled": True,
    "priority": 1,
    "type": "time_based",
    
    "condition": {
        "day_of_week": [1, 2, 3, 4, 5],  # Mon-Fri (0=Sun, 6=Sat)
        "time_range_start": "18:00",      # 6 PM
        "time_range_end": "08:00"         # 8 AM next day
    },
    
    "action": {
        "type": "forward_to_sip_trunk",
        "sip_trunk_id": "retell-ai-after-hours",
        "destination": "sip:sip.retellai.com;transport=tcp"
    },
    
    "fallback": {
        "type": "forward_to_voicemail",
        "voicemail_box_id": "default_after_hours"
    }
}

# POST to create rule
response = requests.post(
    f"{API_BASE}/routing-rules",
    json=rule_payload,
    headers=headers
)

if response.status_code == 201:
    rule = response.json()
    print(f"✓ Rule created: {rule['id']}")
    print(f"  Name: {rule['name']}")
    print(f"  Enabled: {rule['enabled']}")
else:
    print(f"✗ Error: {response.status_code}")
    print(response.text)
```

**JavaScript Example (Node.js):**

```javascript
const axios = require('axios');

const API_BASE = "https://cuc-web.fiferv.local/api/v1";
const API_KEY = "your_api_key_here";

const config = {
    headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    }
};

const rulePayload = {
    name: "After-Hours-to-Retell",
    enabled: true,
    priority: 1,
    type: "time_based",
    condition: {
        day_of_week: [1, 2, 3, 4, 5],
        time_range_start: "18:00",
        time_range_end: "08:00"
    },
    action: {
        type: "forward_to_sip_trunk",
        sip_trunk_id: "retell-ai-after-hours",
        destination: "sip:sip.retellai.com;transport=tcp"
    },
    fallback: {
        type: "forward_to_voicemail",
        voicemail_box_id: "default_after_hours"
    }
};

axios.post(`${API_BASE}/routing-rules`, rulePayload, config)
    .then(response => {
        const rule = response.data;
        console.log(`✓ Rule created: ${rule.id}`);
    })
    .catch(error => {
        console.error(`✗ Error: ${error.response.status}`);
        console.error(error.response.data);
    });
```

**cURL Example:**

```bash
#!/bin/bash

API_BASE="https://cuc-web.fiferv.local/api/v1"
API_KEY="your_api_key_here"

curl -X POST "$API_BASE/routing-rules" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "After-Hours-to-Retell",
    "enabled": true,
    "priority": 1,
    "type": "time_based",
    "condition": {
      "day_of_week": [1, 2, 3, 4, 5],
      "time_range_start": "18:00",
      "time_range_end": "08:00"
    },
    "action": {
      "type": "forward_to_sip_trunk",
      "sip_trunk_id": "retell-ai-after-hours",
      "destination": "sip:sip.retellai.com;transport=tcp"
    },
    "fallback": {
      "type": "forward_to_voicemail",
      "voicemail_box_id": "default_after_hours"
    }
  }' \
  | jq .
```

#### 3C: Test Routing Rule

**Test 1: After-hours (6 PM–8 AM, Mon–Fri)**

```
1. Manually set system time to 6:30 PM (or test on-the-fly)
2. Call Fife RV main line (206) 555-0123
3. Verify: Retell AI answers (not extension phones)
4. Hang up
5. Check UC Connect logs for SIP INVITE to Retell
6. Check Retell dashboard for incoming call
```

**Test 2: Business hours (8 AM–6 PM, Mon–Fri)**

```
1. Set system time to 10:00 AM
2. Call Fife RV main line
3. Verify: Phones ring (NOT Retell)
4. Manager answers (from extension 6701, 6702, or 6604)
5. Verify: Routing rule NOT active
```

**Test 3: Weekend (any time)**

```
1. Set system time to Saturday 2:00 PM
2. Call Fife RV main line
3. Verify: Retell AI answers (rule includes weekends)
4. Hang up
```

**Test 4: Failover (SIP trunk fails)**

```
1. Temporarily disable SIP trunk in CUC Web
2. Call Fife RV main line (during after-hours)
3. Verify: Voicemail answers (fallback works)
4. Re-enable SIP trunk
```

---

### Step 4: Configure Retell AI Phone Number & Webhooks

**Who:** Retell Account Manager (or you via dashboard)
**Duration:** 1–2 days

#### 4A: Import SIP Number to Retell (Optional)

If you have an existing Fife RV SIP provider (Twilio, Telnyx, etc.):

**Retell Dashboard → Phone Numbers → Import Custom Number**

```
Field                   Value
─────────────────────────────────────────────
Phone Number (E.164)   +1206555XXXX
Phone Number Type      "Custom SIP Trunk"
────────────────────────────────────────────
SIP Configuration:
  Termination URI      [your provider's URI]
  Auth Username        [if required]
  Auth Password        [if required]
  Transport            TCP
────────────────────────────────────────────
Bind Inbound Agent     "After-Hours-Receptionist"
```

#### 4B: Configure Webhook Endpoint

**Retell Dashboard → Settings → Webhooks**

```
Webhook URL:           https://api.fiferv.com/webhooks/retell
Events to Deliver:
  ✓ call_started
  ✓ call_ended
  ✓ call_analyzed
  ✓ transfer_started (optional)
  ✓ transfer_ended (optional)

Signature Verification: Enabled
```

---

### Step 5: Build Webhook Handler

**Who:** Backend Engineer
**Duration:** 3–5 days

#### 5A: Create HTTP Endpoint (Python/Flask)

```python
from flask import Flask, request, jsonify
import json
import hmac
import hashlib
import os
from retell import Retell

app = Flask(__name__)

# Initialize Retell client for signature verification
RETELL_API_KEY = os.environ.get("RETELL_API_KEY")
retell = Retell(api_key=RETELL_API_KEY)

# Database (pseudo-code; use real DB)
DATABASE = {}

@app.route('/webhooks/retell', methods=['POST'])
def handle_retell_webhook():
    """
    Receive Retell webhook:
    - Verify signature
    - Parse call data
    - Store in database
    - Send notifications
    """
    
    try:
        # Get raw body for signature verification
        raw_body = request.get_data(as_text=True)
        signature = request.headers.get('x-retell-signature')
        
        # Verify signature
        if not retell.verify(raw_body, RETELL_API_KEY, signature):
            print("❌ Invalid signature")
            return {"error": "Unauthorized"}, 401
        
        # Parse JSON payload
        payload = json.loads(raw_body)
        event = payload.get('event')
        call = payload.get('call')
        
        print(f"✓ Webhook received: {event} (call_id: {call['call_id']})")
        
        # Handle different events
        if event == 'call_ended':
            handle_call_ended(call, payload.get('call_analysis', {}))
        
        elif event == 'call_analyzed':
            handle_call_analyzed(call, payload.get('call_analysis', {}))
        
        elif event == 'transfer_started':
            handle_transfer_started(call, payload.get('transfer_destination', {}))
        
        # Return 204 No Content (success)
        return "", 204
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse error: {e}")
        return {"error": "Invalid JSON"}, 400
    
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"error": "Internal error"}, 500


def handle_call_ended(call, call_analysis):
    """Process call_ended event"""
    
    # Extract data from call & analysis
    call_id = call.get('call_id')
    from_number = call.get('from_number')
    to_number = call.get('to_number')
    duration_seconds = call.get('end_timestamp', 0) - call.get('start_timestamp', 0)
    duration_seconds = duration_seconds // 1000 if duration_seconds else 0
    
    transcript = call.get('transcript', '')
    recording_url = call.get('recording_url', '')
    
    # Extract analysis fields
    customer_name = call_analysis.get('customer_name', '')
    customer_phone = call_analysis.get('customer_phone', '')
    issue = call_analysis.get('issue_description', '')
    urgency = call_analysis.get('urgency_level', 'routine')
    callback_time = call_analysis.get('callback_time_preference', '')
    
    print(f"  From: {from_number}")
    print(f"  Duration: {duration_seconds}s")
    print(f"  Customer: {customer_name} ({customer_phone})")
    print(f"  Issue: {issue}")
    print(f"  Urgency: {urgency}")
    
    # Store in database
    db_record = {
        'call_id': call_id,
        'from_number': from_number,
        'to_number': to_number,
        'duration_seconds': duration_seconds,
        'customer_name': customer_name,
        'customer_phone': customer_phone,
        'issue': issue,
        'urgency': urgency,
        'callback_time': callback_time,
        'transcript': transcript,
        'recording_url': recording_url,
        'status': 'pending_callback' if urgency == 'routine' else 'pending_escalation',
        'created_at': datetime.now().isoformat()
    }
    
    DATABASE[call_id] = db_record
    print(f"  ✓ Stored in database")
    
    # Send notifications
    if urgency == 'emergency':
        send_sms_alert(
            phone=MANAGER_PHONE,
            message=f"🚨 EMERGENCY: {customer_name} called about {issue}. Callback: {customer_phone}"
        )
        print(f"  ✓ SMS alert sent")
    
    send_email_notification(
        to=MANAGER_EMAIL,
        subject=f"After-Hours Callback: {customer_name}",
        body=f"Customer: {customer_name}\nPhone: {customer_phone}\nIssue: {issue}\nCallback: {callback_time}"
    )
    print(f"  ✓ Email sent")


def handle_call_analyzed(call, call_analysis):
    """Process call_analyzed event (triggered after analysis complete)"""
    
    call_id = call.get('call_id')
    
    # Update database with analysis results
    if call_id in DATABASE:
        DATABASE[call_id].update({
            'call_analysis': call_analysis,
            'analyzed_at': datetime.now().isoformat()
        })
        print(f"✓ Call {call_id} analyzed and stored")


def handle_transfer_started(call, transfer_destination):
    """Process transfer_started event (urgent escalation)"""
    
    call_id = call.get('call_id')
    destination_number = transfer_destination.get('number')
    
    print(f"✓ Transfer started: {call_id} → {destination_number}")
    
    # Log transfer (for audit trail)
    if call_id in DATABASE:
        DATABASE[call_id]['transfer_destination'] = destination_number
        DATABASE[call_id]['status'] = 'transferred'


def send_sms_alert(phone, message):
    """Send SMS via Twilio (or similar)"""
    from twilio.rest import Client
    
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    client = Client(account_sid, auth_token)
    
    sms = client.messages.create(
        body=message,
        from_=os.environ.get("TWILIO_PHONE_NUMBER"),
        to=phone
    )
    
    print(f"  SMS sent: {sms.sid}")


def send_email_notification(to, subject, body):
    """Send email via SendGrid (or similar)"""
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
    
    sg = SendGridAPIClient(os.environ.get("SENDGRID_API_KEY"))
    
    message = Mail(
        from_email=os.environ.get("SENDER_EMAIL"),
        to_emails=to,
        subject=subject,
        plain_text_content=body
    )
    
    response = sg.send(message)
    print(f"  Email sent: {response.status_code}")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

#### 5B: Environment Variables

```bash
# .env file (keep secure!)

# Retell
RETELL_API_KEY=sk_... # Get from Retell dashboard

# Twilio (for SMS alerts)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# SendGrid (for email)
SENDGRID_API_KEY=SG...
SENDER_EMAIL=noreply@fiferv.com

# Manager contact
MANAGER_EMAIL=manager@fiferv.com
MANAGER_PHONE=+1206555XXXX

# App settings
DEBUG=False
LOG_LEVEL=INFO
```

#### 5C: Test Webhook Locally (with ngrok)

```bash
# Terminal 1: Start your Flask app
python app.py
# Output: Running on http://127.0.0.1:5000

# Terminal 2: Expose to internet via ngrok
ngrok http 5000
# Output: https://abcd1234.ngrok.io → http://127.0.0.1:5000

# Now configure Retell webhook:
#   Webhook URL: https://abcd1234.ngrok.io/webhooks/retell

# Terminal 3: Make test call in Retell
# - Go to Retell dashboard
# - Test button on phone number
# - Make a test call
# - Watch Terminal 1 for webhook logs
```

---

### Step 6: Test End-to-End Integration

**Who:** QA Engineer
**Duration:** 2–3 days

#### Test Case 1: Basic Inbound Call

```
Preconditions:
  - UC Connect routing rule enabled
  - Retell agent configured
  - Webhook endpoint ready
  - Time: After 6 PM (Mon-Fri)

Test Steps:
  1. Call Fife RV main line from cell phone
  2. Retell AI answers within 2-3 seconds
  3. Agent: "Thanks for calling Fife RV..."
  4. Provide name, phone, issue
  5. Agent: "We'll call you back tomorrow morning"
  6. Hang up
  
Expected Results:
  ✓ Call routed to Retell (not phones)
  ✓ Agent responds naturally
  ✓ Webhook received (check logs)
  ✓ Database record created
  ✓ Email sent to manager
  
Retell Dashboard:
  ✓ Call visible in dashboard
  ✓ Transcript available
  ✓ Recording URL available (10-min access)
  ✓ Call analysis fields extracted (name, phone, etc.)
```

#### Test Case 2: Urgent/Emergency Transfer

```
Preconditions:
  - Manager available to take transfer

Test Steps:
  1. Call Fife RV after-hours
  2. Mention: "stranded on highway" or "emergency"
  3. Agent detects urgency
  4. Agent: "Let me connect you to our manager..."
  5. Warm transfer initiated
  6. Manager's phone rings
  7. Manager picks up → connected to caller
  8. Manager & caller converse
  9. Call ends

Expected Results:
  ✓ Transfer initiated within 5 seconds
  ✓ Manager's phone rings
  ✓ Audio quality good (no drops)
  ✓ Caller hears manager's greeting
  ✓ SMS alert sent to manager
  ✓ Webhook sent (transfer_started event)
```

#### Test Case 3: Webhook Failure & Retry

```
Preconditions:
  - Webhook endpoint temporarily disabled

Test Steps:
  1. Call Retell (webhook endpoint down)
  2. Call completes normally
  3. Webhook delivery fails (endpoint unreachable)
  4. Retell retries (built-in, up to 3 attempts)
  5. Re-enable webhook endpoint
  6. Webhook succeeds on retry

Expected Results:
  ✓ Call completes (webhook failure doesn't block call)
  ✓ Retell retries automatically
  ✓ Webhook eventually succeeds
  ✓ Database record created
  ✓ Manager receives notification (slightly delayed, but OK)
```

#### Test Case 4: Fallback to Voicemail

```
Preconditions:
  - Disable SIP trunk (simulate Retell outage)

Test Steps:
  1. Call Fife RV after-hours
  2. UC Connect tries to route to Retell
  3. SIP trunk unavailable
  4. Falls back to voicemail
  5. Voicemail greeting plays
  6. Caller can leave message

Expected Results:
  ✓ Voicemail answers (not dead air)
  ✓ Caller can record message
  ✓ Voicemail notification sent to manager
  ✓ System recovers gracefully
```

---

### Step 7: Deploy to Production

**Who:** DevOps Engineer
**Duration:** 1 day

#### 7A: Deploy Backend

```bash
# Clone repo
git clone https://github.com/fiferv/after-hours-system.git
cd after-hours-system

# Install dependencies
pip install -r requirements.txt

# Set environment variables (from .env or secrets manager)
export RETELL_API_KEY=...
export TWILIO_ACCOUNT_SID=...
# ... other env vars

# Run migrations (if using database)
python manage.py migrate

# Start application (using gunicorn for production)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Or: Deploy to Heroku/AWS Lambda/etc.
heroku create fiferv-webhooks
git push heroku main
```

#### 7B: Enable Routing Rule in UC Connect

```
1. Login to CUC Web
2. Settings → Call Routing → "After-Hours-to-Retell"
3. Set: enabled = true
4. Save
5. Verify: Time-based rule is active
```

#### 7C: Monitor & Alert Setup

```python
# Pseudocode: Monitor critical metrics

from datetime import datetime, timedelta

def monitor_system():
    """Run every 15 minutes (via cron or similar)"""
    
    # Check: Webhook delivery rate
    last_hour = datetime.now() - timedelta(hours=1)
    delivered = DATABASE.filter(
        created_at > last_hour,
        webhook_status = 'delivered'
    ).count()
    failed = DATABASE.filter(
        created_at > last_hour,
        webhook_status = 'failed'
    ).count()
    
    delivery_rate = delivered / (delivered + failed) if (delivered + failed) > 0 else 100
    
    if delivery_rate < 95:
        alert(f"⚠️ Webhook delivery rate low: {delivery_rate}%")
    
    # Check: Retell API latency
    for call in DATABASE.filter(created_at > last_hour):
        latency = call.retell_response_time
        if latency > 3000:  # 3 seconds
            alert(f"⚠️ High latency: {latency}ms")
    
    # Check: Cost tracking
    monthly_cost = estimate_retell_cost()
    budget = 30  # $30/month
    if monthly_cost > budget:
        alert(f"⚠️ Retell cost exceeds budget: ${monthly_cost}")
```

---

## Troubleshooting

### Calls Not Routing to Retell

**Symptom:** Calls go to voicemail instead of Retell AI

**Diagnosis:**
```
1. Check: Is time-based rule enabled?
   → CUC Web → Settings → Call Routing → "After-Hours-to-Retell" → enabled?

2. Check: Is SIP trunk active?
   → CUC Web → Settings → Trunks → "Retell-AI-After-Hours" → enabled?

3. Check: Is rule active NOW? (time-based)
   → Verify: System clock is correct
   → Verify: Rule matches current time (6 PM - 8 AM)

4. Check: Firewall allowing SIP traffic?
   → Can you ping sip.retellai.com?
   → Are ports 5060/5061 open outbound?

5. Check: UC Connect logs
   → Look for SIP INVITE to sip.retellai.com
   → Any auth failures? Route errors?

6. Check: Retell dashboard
   → Are calls showing up in dashboard?
   → If no calls, SIP trunk not connecting
```

**Fix:**
```bash
# Restart UC Connect SIP service
systemctl restart uc-connect-sip

# Or: Recreate SIP trunk from scratch
# 1. Delete existing trunk
# 2. Create new trunk with corrected config
# 3. Test routing again
```

---

### Webhook Not Being Received

**Symptom:** Calls complete, but webhook never arrives

**Diagnosis:**
```
1. Check: Webhook URL is correct & reachable
   curl -v https://api.fiferv.com/webhooks/retell
   → Should return 404 or 405 (not connection refused)

2. Check: Retell has webhook configured
   → Retell dashboard → Settings → Webhooks
   → URL correct?
   → Events enabled?

3. Check: Firewall allowing HTTPS from Retell
   → Is HTTPS port 443 open inbound?
   → Can you telnet to your webhook endpoint?

4. Check: Application logs
   → Is Flask/Node app running?
   → Any errors in app logs?

5. Test webhook manually
   curl -X POST https://api.fiferv.com/webhooks/retell \
     -H "Content-Type: application/json" \
     -H "x-retell-signature: test" \
     -d '{"event":"call_ended","call":{"call_id":"test"}}'
   → Should return 204 or 401 (not 500)
```

**Fix:**
```bash
# Check application status
ps aux | grep gunicorn
# If not running: systemctl start webhook-handler

# Check logs
tail -f /var/log/webhook-handler.log

# Restart application
systemctl restart webhook-handler

# If firewall issue: whitelist Retell IPs
iptables -A INPUT -s 100.20.5.228 -p tcp --dport 443 -j ACCEPT
```

---

### High Latency (>2 seconds before agent responds)

**Symptom:** Long delay before Retell agent greets caller

**Diagnosis:**
```
1. Check: Network latency to Retell
   ping sip.retellai.com
   → Should be < 100ms

2. Check: LLM selected
   → Is agent using GPT-4.1 (slower) or faster model?
   → Try GPT-4.1 mini or Gemini for faster response

3. Check: Retell server load
   → During busy times, latency may increase
   → Check Retell status page

4. Check: Call quality
   → Is audio clear?
   → Poor audio = slower transcription
```

**Fix:**
```python
# In Retell agent config, optimize for speed:
agent_config = {
    "llm": {
        "model": "gpt-4-1-mini",  # Faster than full GPT-4.1
        "temperature": 0.7
    },
    "voice_speed": 1.0,  # Slightly faster speech
    "language": "en-US"
}
```

---

### Webhook Signature Verification Failing

**Symptom:** "Invalid signature" errors in logs

**Diagnosis:**
```
1. Check: API key matches
   → RETELL_API_KEY in env matches key in Retell dashboard?

2. Check: Raw body used (not parsed JSON)
   → Must verify signature against raw HTTP body
   → NOT against JSON-parsed object

3. Check: Signature header spelling
   → Header: x-retell-signature (lowercase)
   → Not X-Retell-Signature or other variants
```

**Fix:**
```python
# Python: Use Retell SDK (handles verification correctly)
from retell import Retell

retell = Retell(api_key=API_KEY)

@app.route('/webhooks/retell', methods=['POST'])
def webhook():
    raw_body = request.get_data(as_text=True)  # Raw body
    signature = request.headers.get('x-retell-signature')
    
    # Use SDK's verify method
    if not retell.verify(raw_body, API_KEY, signature):
        return {"error": "Invalid"}, 401
    
    # Process webhook...
```

---

## Testing Checklist

Before going live, verify:

```
✓ Time-based routing rule active in UC Connect
✓ After-hours calls route to Retell (not voicemail)
✓ Business hours calls still ring phones (not Retell)
✓ Retell agent responds within 2-3 seconds
✓ Agent collects name, phone, issue correctly
✓ Webhook received after call ends
✓ Data stored in database correctly
✓ Manager receives email notification
✓ Emergency calls trigger SMS alert
✓ Warm transfer works (manager receives call)
✓ Fallback to voicemail if Retell unavailable
✓ Recorded conversation available in Retell dashboard
✓ Transcription accurate (>90%)
✓ Post-call analysis fields extracted correctly
✓ Cost tracking working (Retell usage visible)
```

---

## Summary

You now have:

1. ✅ SIP trunk configured in UC Connect
2. ✅ Time-based routing rule activated
3. ✅ Retell AI agent deployed
4. ✅ Webhook endpoint handling call data
5. ✅ Notifications sent to manager
6. ✅ Callback scheduling system ready

**Next steps:**
- Launch soft beta (50% of calls to Retell, 50% to voicemail)
- Monitor metrics for 3–7 days
- Gradually increase to 100% traffic
- Celebrate! 🎉

---

**Document prepared by:** Research Agent
**Reference Docs:** RETELL_AI_OVERVIEW.md, UC_CONNECT_TELCO_API_TECHNICAL.md, FIFE_RV_AFTER_HOURS_ARCHITECTURE.md
