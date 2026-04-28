# UC Connect Telco API Technical Documentation

**TL;DR:** UC Connect (CUC Web 1.26.14) provides a Telco API for call routing and forwarding. Documentation is limited in public domain. You likely need to contact ConnectUC support for full API specs. However, based on typical VoIP PBX systems, the Telco API should support time-based routing, SIP trunk configuration, and call forwarding—all critical for integrating Retell AI.

---

## What is the Telco API?

The **Telco API** (also called **Connectivity API** in some ConnectUC versions) is ConnectUC's programmatic interface for managing:

- **Call routing** (inbound call flow)
- **Call forwarding** (to extensions, external numbers, voicemail)
- **Time-based routing** (business hours vs. after-hours)
- **IVR rules** (Interactive Voice Response; menu systems)
- **SIP trunk configuration** (connecting external providers)
- **Device management** (phones, intercoms)
- **Webhooks/callbacks** (event notifications)

### API Scope (Typical for ConnectUC-like Systems)

| Function | Likely Support |
|----------|----------------|
| **Get active calls** | ✓ Yes |
| **Initiate/end calls** | ✓ Yes |
| **Forward call to number** | ✓ Yes |
| **Route by time/day** | ✓ Yes (conditional routing) |
| **Get call history** | ✓ Yes |
| **Get user/extension info** | ✓ Yes |
| **Manage device settings** | ✓ Yes |
| **SIP trunk config** | ✓ Likely yes |
| **Webhooks** | ? Unknown (check CUC Web 1.26.14 docs) |

---

## CUC Web 1.26.14 Specifics

### Known Facts (From Earlier Context)

- **Product:** ConnectUC (branded as "UC Connect" for Fife RV)
- **Version:** CUC Web 1.26.14
- **Access:** Web-based admin interface
- **Network:** Internal 10.3.x.x, public IPs 24.113.50.188 / 216.177.230.94
- **Phone Hardware:** Yealink SIP-T46U, Algo 8196 (SIP-based)
- **API Access:** Telco API (found in CUC Web)

### Architecture

```
┌─────────────────────────────────────────┐
│         CUC Web 1.26.14                 │
│  (ConnectUC Admin Interface)            │
├─────────────────────────────────────────┤
│  Telco API (REST or SOAP?)              │
│  ├─ Call Routing                        │
│  ├─ Forwarding                          │
│  ├─ Time-based Rules                    │
│  └─ Device Management                   │
├─────────────────────────────────────────┤
│  SIP Core                               │
├─────────────────────────────────────────┤
│  Devices                                │
│  ├─ Yealink SIP-T46U (6701, 6702, 6604)│
│  └─ Algo 8196 (6750, 9510)              │
└─────────────────────────────────────────┘
```

---

## Expected API Capabilities (Inferred from VoIP Standards)

### Time-Based Call Routing

**Feature:** Route calls differently based on time of day

```
Example Rule (pseudocode):
IF inbound_call AND time >= 18:00 AND time < 08:00 THEN
  route_to_queue("after_hours_ai")
ELSE IF time is weekday 08:00-18:00 THEN
  ring_all_extensions([6701, 6702, 6604])
ELSE
  route_to_voicemail()
```

**API Endpoint (estimated):**
```
POST /api/v1/routing-rules
{
  "name": "after-hours-routing",
  "enabled": true,
  "condition": {
    "day_of_week": [1,2,3,4,5],        // Mon-Fri
    "time_range_start": "18:00",
    "time_range_end": "08:00"
  },
  "action": {
    "type": "forward_to_sip_trunk",
    "destination": "sip:sip.retellai.com"
  }
}
```

### SIP Trunk Configuration

**Feature:** Connect external SIP providers (like Retell)

```
Expected Capabilities:
✓ Define origination SIP URI (inbound)
✓ Define termination SIP URI (outbound)
✓ Set authentication (username/password or IP whitelist)
✓ Configure transport (TCP, UDP, TLS)
✓ Set priority/failover
✓ Configure caller ID rules
```

**API Endpoint (estimated):**
```
POST /api/v1/sip-trunks
{
  "name": "Retell-AI",
  "origination": {
    "uri": "sip:sip.retellai.com",
    "transport": "tcp",
    "enabled": true
  },
  "termination": {
    "uri": "sip:termination.provider.com",
    "auth": {
      "username": "uc-connect-user",
      "password": "***"
    },
    "transport": "tcp"
  },
  "fallback_uri": "sip:voicemail@internal.uc-connect",
  "priority": 1
}
```

### Call Forwarding Rules

**Feature:** Forward calls to external numbers or extensions

```
Expected Capabilities:
✓ Forward call to external number
✓ Forward to voicemail
✓ Forward to extension
✓ Forward to queue/group
✓ Conditional forwarding (if busy, if no answer, etc.)
```

**API Endpoint (estimated):**
```
POST /api/v1/forwarding-rules
{
  "source_extension": "6701",
  "destination": "+1-206-555-0123",  // external number
  "condition": "if_no_answer",
  "timeout_seconds": 20,
  "priority": 1,
  "enabled": true
}
```

### Call History & Logging

**Feature:** Retrieve call records for compliance/analytics

```
Expected Capabilities:
✓ Get call history (date range, extension, direction)
✓ Get call details (duration, outcome, recorded)
✓ Stream call recordings
✓ Export logs
```

**API Endpoint (estimated):**
```
GET /api/v1/calls?
  from=2026-04-01&to=2026-04-30&
  extension=6701&
  limit=100&
  offset=0

Response:
{
  "calls": [
    {
      "call_id": "call_1234",
      "from": "6701",
      "to": "+1-206-555-0199",
      "start_time": "2026-04-17T18:45:00Z",
      "duration_seconds": 180,
      "status": "completed",
      "recording_url": "https://cuc.internal/recordings/call_1234.mp3"
    }
  ],
  "total": 250,
  "limit": 100,
  "offset": 0
}
```

### Device Management

**Feature:** Query/control phones and intercoms

```
Expected Capabilities:
✓ List devices (phones, intercoms)
✓ Get device status (online, busy, idle)
✓ Trigger call on device
✓ Set device configuration
✓ Manage do-not-disturb
```

**API Endpoint (estimated):**
```
GET /api/v1/devices
Response:
{
  "devices": [
    {
      "device_id": "6701",
      "type": "ip_phone",
      "model": "Yealink SIP-T46U",
      "status": "registered",
      "user": "john.doe@fiferv.com",
      "current_call": null,
      "do_not_disturb": false
    }
  ]
}
```

---

## Critical Integration Questions

### 1. **Can Telco API Forward Calls to Retell's SIP Trunk?**

**Status:** Very likely YES, but needs verification.

**Required:**
- Telco API supports `action: forward_to_sip_trunk`
- Can configure Retell as SIP origination endpoint
- Time-based rule supports external SIP routing

**Action:** Contact ConnectUC support to confirm SIP trunk routing syntax.

---

### 2. **Does Telco API Support Time-Based Routing?**

**Status:** Expected YES (standard in modern VoIP).

**Required:**
- Time/day-of-week conditions in routing rules
- Ability to activate rules based on schedule
- Support for defining business hours vs. after-hours

**Challenge:** Might be limited to simple time ranges (no holidays/exceptions).

**Action:** Test in CUC Web 1.26.14 UI first; confirm via API.

---

### 3. **Does Telco API Support Webhooks?**

**Status:** Unknown; needs verification.

**If YES:**
- Retell can webhook back to Fife RV when call ends
- Fife RV can webhook to Telco API to change routing dynamically

**If NO:**
- Retell must store callback info (name, phone, issue)
- Fife RV polls Retell API or uses batch processing
- Less real-time, but workable

**Action:** Check CUC Web 1.26.14 release notes and support documentation.

---

### 4. **What's the Authentication Model?**

**Likely Options:**

```
Option A: API Key
POST /api/v1/calls
Authorization: Bearer {api_key}

Option B: OAuth 2.0
POST /oauth/token
{
  "client_id": "...",
  "client_secret": "...",
  "grant_type": "client_credentials"
}

Option C: Basic Auth
Authorization: Basic {base64(username:password)}

Option D: Session Token
POST /api/v1/login
{"username": "...", "password": "..."}
→ returns {session_token: "..."}
```

**Action:** Check CUC Web login flow and API documentation.

---

### 5. **Rate Limits & SLA?**

**Unknown.** Likely varies by ConnectUC plan tier.

**Typical expectations:**
- **API calls:** 1–10 req/sec
- **Webhook retries:** 2–3 attempts
- **Response time:** <500ms
- **Uptime SLA:** 99.9% (enterprise)

**Action:** Check SLA docs or contact support.

---

## Expected API Endpoints (Inferred)

Based on standard VoIP APIs and ConnectUC pattern:

```
[Base URL: https://cuc-web.fiferv.local/api/v1]

ROUTING & FORWARDING
  POST   /routing-rules                  (create time-based rule)
  GET    /routing-rules                  (list rules)
  PUT    /routing-rules/{id}             (update rule)
  DELETE /routing-rules/{id}             (delete rule)

  POST   /forwarding-rules               (create forwarding)
  GET    /forwarding-rules/{extension}   (get forwarding for extension)
  PUT    /forwarding-rules/{id}          (update)
  DELETE /forwarding-rules/{id}          (delete)

CALLS
  GET    /calls                          (call history)
  GET    /calls/{call_id}                (call details)
  GET    /calls/{call_id}/recording      (download recording)
  POST   /calls/{call_id}/transfer       (transfer call)
  POST   /calls/{call_id}/hangup         (end call)

DEVICES
  GET    /devices                        (list devices)
  GET    /devices/{device_id}            (get device status)
  PUT    /devices/{device_id}            (configure device)
  POST   /devices/{device_id}/do-not-disturb (set DND)

SIP TRUNKS
  POST   /sip-trunks                     (create trunk)
  GET    /sip-trunks                     (list trunks)
  PUT    /sip-trunks/{id}                (update trunk)
  DELETE /sip-trunks/{id}                (delete trunk)

USERS
  GET    /users                          (list users)
  GET    /users/{user_id}                (get user details)
  PUT    /users/{user_id}                (update user)
```

---

## Sample Code (Pseudocode)

### Python: Set Up After-Hours Routing to Retell

```python
import requests
from datetime import datetime

API_BASE = "https://cuc-web.fiferv.local/api/v1"
API_KEY = "your_api_key_here"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Define after-hours routing rule
after_hours_rule = {
    "name": "After-Hours-to-Retell-AI",
    "enabled": True,
    "priority": 1,
    "condition": {
        "day_of_week": [1, 2, 3, 4, 5],  # Mon-Fri
        "time_range_start": "18:00",      # 6 PM
        "time_range_end": "08:00"         # 8 AM next day
    },
    "action": {
        "type": "forward_to_sip_trunk",
        "sip_trunk_id": "retell-ai",
        "destination": "sip:sip.retellai.com;transport=tcp"
    }
}

# Create rule via API
response = requests.post(
    f"{API_BASE}/routing-rules",
    json=after_hours_rule,
    headers=headers
)

if response.status_code == 201:
    print(f"Rule created: {response.json()['id']}")
else:
    print(f"Error: {response.status_code} - {response.text}")

# List all routing rules
response = requests.get(f"{API_BASE}/routing-rules", headers=headers)
print("Active routing rules:")
for rule in response.json().get("rules", []):
    print(f"  - {rule['name']}: {rule['condition']}")
```

### cURL: Check Device Status

```bash
API_BASE="https://cuc-web.fiferv.local/api/v1"
API_KEY="your_api_key_here"

# Get all devices
curl -X GET "$API_BASE/devices" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json"

# Get specific device (6701)
curl -X GET "$API_BASE/devices/6701" \
  -H "Authorization: Bearer $API_KEY"

# Expected response:
# {
#   "device_id": "6701",
#   "type": "ip_phone",
#   "model": "Yealink SIP-T46U",
#   "status": "registered",
#   "user": "john@fiferv.com",
#   "current_call": null,
#   "do_not_disturb": false
# }
```

### JavaScript/Node.js: Query Call History

```javascript
const API_BASE = "https://cuc-web.fiferv.local/api/v1";
const API_KEY = "your_api_key_here";

async function getCallHistory(fromDate, toDate, extension) {
  const params = new URLSearchParams({
    from: fromDate,
    to: toDate,
    extension: extension,
    limit: 100,
    offset: 0
  });

  const response = await fetch(`${API_BASE}/calls?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.calls;
}

// Usage
getCallHistory('2026-04-01', '2026-04-30', '6701')
  .then(calls => {
    console.log(`Found ${calls.length} calls`);
    calls.forEach(call => {
      console.log(`${call.from} → ${call.to} (${call.duration_seconds}s)`);
    });
  })
  .catch(err => console.error(err));
```

---

## Known Limitations & Unknowns

| Aspect | Status | Note |
|--------|--------|------|
| **API Reference Docs** | ❌ Not public | Need to contact ConnectUC |
| **Webhook Support** | ❓ Unknown | Likely, but unconfirmed |
| **Rate Limits** | ❓ Unknown | Enterprise SLA required |
| **SIP Trunk Config** | ✓ Likely yes | Standard VoIP feature |
| **Time-based Routing** | ✓ Likely yes | Standard VoIP feature |
| **Call Forwarding** | ✓ Likely yes | Standard VoIP feature |
| **Call Recording** | ✓ Likely yes | Standard VoIP feature |
| **API Key Rotation** | ❓ Unknown | Security best practice |
| **Multi-tenancy** | ✓ Likely yes | Typical for cloud PBX |
| **Disaster Recovery** | ✓ Likely yes | Enterprise feature |

---

## How to Get Full Documentation

1. **Contact ConnectUC Support**
   - Email: support@connectuc.com (or Fife RV's designated contact)
   - Request: "Telco API v1.26.14 specification & SDK"
   - Ask: Time-based routing, SIP trunk config, webhook support

2. **Check Internal CUC Web UI**
   - Login to CUC Web 1.26.14 dashboard
   - Settings → API / Developer Tools
   - May have API documentation, sample code, or token generation

3. **Review Server Logs**
   - If you have admin access, logs might reveal API endpoints
   - Look for HTTP requests during manual configuration

4. **GitHub/Forum Search**
   - Search "ConnectUC API" + version number
   - Community users may have shared code samples

5. **Reverse Engineering**
   - Monitor browser Network tab in CUC Web UI
   - See what API calls are made when configuring routing
   - Replicate those calls in your own code

---

## Summary: Integration Readiness

**Can UC Connect's Telco API integrate with Retell AI?**

**Answer: Very likely YES, but confirmation needed.**

✅ **What's certain:**
- UC Connect is a SIP-based system (compatible with Retell)
- It has a Telco API for call routing
- Time-based routing should be possible
- SIP trunk configuration is standard

❓ **What needs verification:**
- Exact API endpoint syntax
- Webhook support (needed for two-way integration)
- Authentication method (API key vs. OAuth vs. other)
- Rate limits & SLA

⚡ **Next steps:**
1. Contact ConnectUC support for full API docs
2. Verify SIP trunk routing capability
3. Test in CUC Web 1.26.14 UI before coding
4. Prototype with test after-hours routing rule
5. Measure latency & call quality

---

## Resources

- **ConnectUC Support:** (provided by Fife RV IT/provider)
- **Retell AI SIP Integration Guide:** https://docs.retellai.com/deploy/custom-telephony
- **Twilio SIP Trunking (similar pattern):** https://docs.retellai.com/deploy/twilio
- **SIP RFC 3261:** https://tools.ietf.org/html/rfc3261 (technical reference)
