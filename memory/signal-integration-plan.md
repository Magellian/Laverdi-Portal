# LaVerdi Signal Integration — Build Plan

**Status:** Placeholder only (shows on dashboard but not wired)  
**Date:** 2026-04-30  
**Priority:** HIGH (customer-facing feature)

---

## 🎯 THE PROBLEM

**Current State:**
- Dashboard shows "Signal" as available for Starter tier
- User clicks "Signal" button
- Gets message: "Not available" or similar
- No actual integration exists

**Why This Matters:**
- Breaks customer trust (shows features that don't work)
- Dashboard promises Signal, but no backend support
- Starter tier customers expect it to work

---

## 🛠️ WHAT NEEDS TO BE BUILT

### 1. Signal Bot Setup (Infrastructure)

**Signal Messenger Protocol:**
- Signal uses a proprietary protocol (not XMPP, not standard)
- Official Signal Bot API is limited/restricted
- Open-source alternatives: `signal-cli` (third-party, reverse-engineered)

**Options:**

**Option A: signal-cli (Recommended)**
- Open-source Signal client in Java
- Can receive/send messages programmatically
- Runs on Linux (on VPS)
- Registers as a regular Signal number (need phone number or virtual number)
- Webhook support via REST API

**Option B: Twilio Signal Integration**
- Twilio has Signal channel support (newer)
- Costs money
- Requires Twilio account + API setup
- More reliable, official support

**Option C: Community Bot Libraries**
- signal-api-web, signal-bot-sdk (experimental)
- May not be reliable long-term

**Recommendation:** Start with **Option A (signal-cli)** — free, proven, works

---

### 2. signal-cli Setup (How It Works)

**Installation:**
```bash
# On VPS (64.23.253.97)
apt install signal-cli

# Register signal-cli with a phone number or virtual number
signal-cli +1234567890 register
signal-cli +1234567890 verify <6-digit-code>
```

**Message Reception:**
```bash
# Run daemon mode (listens for messages)
signal-cli --username +1234567890 daemon --socket /tmp/signal.sock
```

**Message Sending:**
```bash
# Send via socket/REST API
curl -X POST http://localhost:7583/v1/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "number": "+1234567890",
    "recipients": ["+987654321"]
  }'
```

---

### 3. OpenClaw Signal Plugin (Backend Integration)

**What Needs To Be Built:**

**File: `/src/plugins/signal.ts` (or similar)**
```typescript
// Signal plugin for OpenClaw
export class SignalPlugin {
  // Connect to signal-cli daemon
  async connect(phoneNumber: string): Promise<void>
  
  // Send message
  async sendMessage(to: string, message: string): Promise<void>
  
  // Receive message webhook
  async onMessageReceived(data: any): Promise<void>
  
  // Get chat history
  async getHistory(with: string): Promise<Message[]>
}
```

**Integration Points:**
1. OpenClaw loads Signal plugin on startup
2. Plugin connects to signal-cli daemon (port 7583)
3. Incoming message webhook → Signal plugin → OpenClaw message queue
4. OpenClaw processes message → sends reply → Signal plugin sends back

---

### 4. LaVerdi Portal Integration

**What Needs To Be Built:**

**API Endpoint: `/api/channels/signal/connect`**
```typescript
POST /api/channels/signal/connect
{
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "status": "connected",
  "number": "+1234567890",
  "verified": true
}
```

**Dashboard Component: `SignalConnectCard.tsx`**
```typescript
// Show on ConnectDevices page
// Input: Enter Signal phone number
// Action: Register phone number → verify code → done
```

**Database Table: `channel_signal`**
```sql
CREATE TABLE channel_signal (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  phone_number TEXT UNIQUE,
  verified BOOLEAN,
  connected_at TIMESTAMP,
  last_message TIMESTAMP
);
```

---

## 📋 IMPLEMENTATION STEPS

### Phase 1: Infrastructure (Day 1)

**Step 1: Set up signal-cli on VPS**
```bash
ssh root@64.23.253.97

# Install signal-cli
apt update && apt install -y openjdk-11-jre signal-cli

# Create signal user directory
mkdir -p /var/lib/signal
chown signal:signal /var/lib/signal

# Register number (need virtual phone number or spare phone)
signal-cli +1234567890 register
# (get SMS verification code)
signal-cli +1234567890 verify <code>
```

**Step 2: Create systemd service for signal-cli daemon**
```ini
# /etc/systemd/system/signal-cli.service
[Unit]
Description=Signal CLI Daemon
After=network.target

[Service]
Type=simple
User=signal
ExecStart=/usr/bin/signal-cli --username +1234567890 daemon --socket /tmp/signal.sock
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable signal-cli
systemctl start signal-cli
```

**Step 3: Create signal-cli REST API wrapper**
```python
# /opt/signal-api-wrapper/app.py (Flask)
from flask import Flask, request, jsonify
import socket
import json

app = Flask(__name__)

@app.route('/api/signal/send', methods=['POST'])
def send_message():
    data = request.json
    # Connect to signal-cli socket
    # Send message to recipient
    # Return success/error
    pass

@app.route('/api/signal/webhook', methods=['POST'])
def receive_message():
    # signal-cli posts incoming messages here
    # Extract message, recipient, content
    # Post to OpenClaw message queue
    pass
```

---

### Phase 2: OpenClaw Plugin (Day 2)

**Step 1: Create Signal plugin**
```typescript
// openclaw/src/plugins/signal.ts
import axios from 'axios'

export class SignalPlugin {
  private apiUrl = 'http://localhost:5000'
  
  async send(to: string, message: string) {
    return axios.post(`${this.apiUrl}/api/signal/send`, {
      recipient: to,
      message: message
    })
  }
  
  async registerNumber(phone: string) {
    return axios.post(`${this.apiUrl}/api/signal/register`, {
      number: phone
    })
  }
}
```

**Step 2: Register plugin in OpenClaw config**
```json
{
  "plugins": [
    "signal",
    "phone-control",
    "browser"
  ]
}
```

**Step 3: Add message routing**
```typescript
// When message arrives via Signal webhook
// Route to OpenClaw message queue
// Process like any other channel
```

---

### Phase 3: Portal Frontend (Day 2-3)

**Step 1: Create SignalConnect card**
```typescript
// components/SignalConnectCard.tsx
export function SignalConnectCard() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  
  async function handleConnect() {
    // POST /api/channels/signal/connect
    // Show verification code input
    // Verify → save to database
  }
}
```

**Step 2: Add to ConnectDevices page**
```typescript
// dashboard/connect-devices.tsx
<SignalConnectCard />  // Add alongside other channels
```

**Step 3: Add API endpoints**
```typescript
// api/channels/signal/connect.ts
// api/channels/signal/verify.ts
// api/channels/signal/disconnect.ts
```

---

## 🔗 SYSTEM ARCHITECTURE

```
User's Signal Phone
    ↓ (sends message)
Signal Server (encrypted)
    ↓ (relays)
signal-cli Daemon (on VPS)
    ↓ (posts to webhook)
Signal API Wrapper (Flask, port 5000)
    ↓ (REST API)
OpenClaw Plugin (Signal)
    ↓ (queues message)
OpenClaw Message Queue
    ↓ (processes)
OpenClaw Agent Logic
    ↓ (generates reply)
OpenClaw Plugin (Signal)
    ↓ (sends via wrapper)
Signal API Wrapper (Flask)
    ↓ (posts to daemon)
signal-cli Daemon
    ↓ (sends via Signal network)
User's Signal Phone
```

---

## 📊 TIMELINE & EFFORT

| Phase | Task | Time | Effort |
|-------|------|------|--------|
| 1 | signal-cli setup + REST wrapper | 2-3 hours | Medium |
| 2 | OpenClaw plugin + routing | 3-4 hours | Medium |
| 3 | Portal UI + API endpoints | 2-3 hours | Low |
| 4 | Testing + refinement | 2-3 hours | Low |
| **Total** | **Full Signal Integration** | **9-13 hours** | **Medium** |

---

## ⚠️ KNOWN CHALLENGES

1. **Phone Number Registration:**
   - Signal requires a real phone number or virtual number
   - May need to use Twilio or similar for virtual number
   - Cost: $5-10/month for virtual number

2. **Signal-CLI Stability:**
   - Third-party, reverse-engineered
   - May break if Signal updates protocol
   - But widely used, community support good

3. **Message Encryption:**
   - All messages end-to-end encrypted (good for privacy)
   - Can't inspect/log messages easily (good security, but harder to debug)

4. **Rate Limiting:**
   - Signal has rate limits to prevent abuse
   - Implement local queuing + backoff

---

## 🎯 ALTERNATIVE: USE TWILIO (EASIER BUT COSTS $)

**Twilio Option:**
- Twilio handles Signal integration (official partnership)
- API-based, no self-hosted daemon needed
- Costs: ~$0.01-0.05 per message
- Setup time: 1-2 hours (just API calls)

**Cost vs. Time:**
- signal-cli: Free, but 9-13 hours work
- Twilio: ~$20-50/month, but 1-2 hours work

**Recommendation:** Start with signal-cli (free), migrate to Twilio later if stability issues

---

## 📋 BUILD CHECKLIST

- [ ] **Phase 1:** signal-cli setup + REST wrapper
  - [ ] Install signal-cli on VPS
  - [ ] Register phone number
  - [ ] Create Flask wrapper API
  - [ ] Test send/receive via curl
  - [ ] Set up systemd service

- [ ] **Phase 2:** OpenClaw plugin
  - [ ] Create Signal plugin TypeScript file
  - [ ] Register plugin in config
  - [ ] Implement send() method
  - [ ] Implement webhook receiver
  - [ ] Add message routing

- [ ] **Phase 3:** Portal integration
  - [ ] Create SignalConnectCard component
  - [ ] Add API endpoints
  - [ ] Implement database table
  - [ ] Add to ConnectDevices page
  - [ ] Test full flow

- [ ] **Phase 4:** Testing
  - [ ] Send test message via Signal
  - [ ] Verify message arrives
  - [ ] Agent replies
  - [ ] Reply sent back to Signal
  - [ ] Dashboard shows connected status

---

## 🚀 READY TO BUILD?

**To start:**
1. Confirm we're using signal-cli (not Twilio)
2. Decide if we need virtual phone number
3. SSH into VPS and begin Phase 1

**Estimate:** 2-3 days of work (parallel with usage tracking)

---

**Status:** Plan ready for build  
**Decision needed:** Proceed with signal-cli integration?
