# Retell AI Overview

**TL;DR:** Retell AI is a cloud-based platform for building, testing, and deploying AI phone agents. It provides both inbound and outbound call handling, integrates with major telephony providers via SIP trunking, supports custom telephony, and charges $0.07-$0.31/minute for voice agent services. Perfect for building an after-hours receptionist system.

---

## What is Retell AI?

Retell is a comprehensive platform for creating conversational AI agents that handle phone calls naturally and reliably. It's designed for businesses that need:

- **24/7 inbound call answering** (AI receptionist)
- **Outbound call campaigns** (callbacks, notifications, surveys)
- **Intelligent call routing** (to humans, voicemail, or other systems)
- **Call recording & transcription** (with compliance options)
- **Real-time call monitoring & analytics**

### Core Capabilities

| Feature | Details |
|---------|---------|
| **Call Handling** | Inbound + outbound, warm/cold transfers to humans |
| **Voice Intelligence** | Natural speech recognition, conversational AI responses |
| **Integration** | SIP trunking, custom telephony, Twilio, Telnyx, Vonage |
| **Agent Types** | Conversation Flow (structured), Single/Multi-Prompt (flexible) |
| **Call Recording** | Built-in, with compliance & privacy controls |
| **Webhooks** | Real-time events (call started, ended, analyzed, transferred) |
| **Transcription** | Automatic with post-call analysis |
| **Transfer** | Warm/cold transfer to external numbers, SIP REFER support |

---

## Pricing Model

### Voice Agent Pricing (Most Relevant)

**Base Rate:** $0.07–$0.31/minute (depending on LLM and features)

#### Voice Infrastructure Breakdown

| Component | Cost |
|-----------|------|
| **Retell Voice Infrastructure** | $0.055/minute |
| **Text-to-Speech (TTS)** | $0.015–$0.040/minute (depends on provider) |
| **Large Language Model (LLM)** | $0.003–$0.160/minute (depends on model tier) |
| **Optional Add-ons** | +$0.005–$0.010/minute |

#### LLM Cost Examples (Standard Tier)

- **GPT-4.1** (recommended): $0.045/minute
- **GPT-4.1 mini**: $0.016/minute
- **Claude 4.5 Sonnet**: $0.08/minute
- **Gemini 3.0 Flash**: $0.027/minute
- **GPT-5** (latest): $0.04/minute

#### Telephony Costs

| Item | Cost |
|------|------|
| **SIP Trunking/Custom Telephony** | **FREE** ✓ |
| **Retell Phone Numbers** | $2/month each |
| **Concurrency (Active Calls)** | Free: 20 calls included, then $8/call/month |
| **Verified Phone Number (for caller ID)** | $10/month |

### Billing Model

- **Pay-as-you-go** (no minimum, no contracts)
- Charged per second (not per minute)
- Only for connected calls (failed connections don't incur charges)
- Call transfers: AI charges stop when call bridges to human; telephony charges continue

### Cost Example for Fife RV

**Scenario:** 30 after-hours calls/month, 3 min avg duration, GPT-4.1 + Retell TTS

```
Voice Infrastructure: $0.055/min
Text-to-Speech: $0.015/min
LLM (GPT-4.1): $0.045/min
Subtotal: $0.115/minute

30 calls × 3 min × $0.115 = $10.35/month

+ Retell phone number: $2/month
+ Optional features (PII removal, etc.): $0–10/month

Estimated monthly cost: $15–25/month
```

**Enterprise Plan:** Custom pricing for higher volumes or dedicated infrastructure.

---

## API Capabilities

### Core APIs

#### 1. **Phone Call Management**
- `createPhoneCall()` — Initiate outbound calls
- `registerPhoneCall()` — Register inbound call for custom SIP routing
- `getCall()` — Retrieve call details, transcript, recording
- `updatePhoneCall()` — Modify call in progress
- `transferCall()` — Transfer to human or number

#### 2. **Agent Management**
- `createAgent()` — Build new AI agent with prompt/workflow
- `updateAgent()` — Modify agent logic, voice, behavior
- `getAgent()` — Fetch agent config

#### 3. **Phone Number Management**
- `createPhoneNumber()` — Purchase new number from Retell
- `importPhoneNumber()` — Add custom/existing number via SIP trunk
- `deletePhoneNumber()` — Remove number
- `getPhoneNumber()` — Fetch number config & bound agents

#### 4. **Webhooks**
- Account-level or per-agent webhooks
- Events: `call_started`, `call_ended`, `call_analyzed`, `transcript_updated`, `transfer_*`
- Signature verification via `x-retell-signature` header

#### 5. **Call Analysis**
- Post-call analysis extraction (custom fields)
- Transcript & recording URLs
- Call metadata (duration, status, disconnection reason)

### Authentication

- **API Key:** Bearer token (get from dashboard)
- **Webhook Verification:** HMAC-SHA256 signature in `x-retell-signature` header
- **Rate Limits:** Not explicitly documented; enterprise users should request limits

---

## Integration Patterns

### Method 1: Elastic SIP Trunking (Recommended)

**Setup Flow:**
```
Your PBX/Phone System (UC Connect)
    ↓
SIP Trunk Configuration (at Twilio/Telnyx/Vonage)
    ↓
Retell AI
    ↓
    ├─ Handles incoming calls
    ├─ Routes to agent
    └─ Bridges to human if needed
```

**Retell SIP Details:**
- **Server:** `sip:sip.retellai.com`
- **Transport:** TCP (default), UDP, or TLS
- **IP Block:** Whitelist `18.98.16.120/30` (Retell SBC)
- **SRTP Support:** Yes (media encryption with TLS)

**Your Responsibility:**
1. Setup SIP trunk at provider (Twilio, Telnyx, etc.)
2. Configure origination (inbound) → `sip:sip.retellai.com`
3. Configure termination (outbound) → provider's URI
4. Import numbers to Retell dashboard
5. Bind agents to imported numbers

**Pros:**
- Full telephony feature support (transfers, DTMF, etc.)
- Supports call recording via provider
- Can integrate with existing PBX

**Cons:**
- Requires SIP trunk setup (may need provider support)
- More moving parts to configure

---

### Method 2: Dial to SIP URI (Custom)

For systems that can't use elastic SIP trunking.

**Setup Flow:**
```
1. Call Retell API: registerPhoneCall() → get call_id
2. Dial to: sip:{call_id}@sip.retellai.com (from your system)
3. Retell AI answers & handles call
4. Custom function in Retell triggers transfer/callback
```

**Pros:**
- Simple, no SIP trunk needed
- Direct control over call flow

**Cons:**
- **No call transfer capability** (must implement custom transfer logic)
- Must implement callback/routing in your system
- 5-minute registration timeout

---

### Method 3: Retell Phone Numbers (Simplest)

Purchase numbers directly from Retell (via Twilio/Telnyx).

**Setup Flow:**
```
1. Buy phone number from Retell dashboard ($2/mo)
2. Bind AI agent to number
3. Done! Receive inbound calls immediately
4. Make outbound calls via API
```

**Pros:**
- Instant setup, no SIP config
- Full feature support
- Best for new deployments

**Cons:**
- Can't use existing corporate phone number
- Separate from UC Connect system (separate billing, management)
- Less suitable for integration with existing phone system

---

## Call Flow Examples

### Inbound Call (After-Hours Receptionist)

```
Customer calls Fife RV main line (after 6 PM)
    ↓
UC Connect detects after-hours (time-based routing)
    ↓
Routes to Retell AI via SIP trunk
    ↓
Retell AI: "Hi, this is Fife RV's after-hours line..."
    ↓
AI listens to customer request
    ↓
AI decision:
├─ Schedule callback? → Collect details → Webhook to Fife RV CRM
├─ Urgent issue? → Transfer to on-call manager → Warm transfer
├─ Leave message? → Record voicemail → Email transcript
└─ Wrong department? → "Our service team opens at 8am..."
```

### Outbound Call (Callback from AI)

```
AI collected: Name, Phone, Issue
    ↓
Webhook sent to Fife RV backend
    ↓
Fife RV system schedules callback time
    ↓
At scheduled time, Retell calls customer
    ↓
Retell AI: "Hi [Name], this is Fife RV following up..."
    ↓
AI fetches customer context from Fife RV API
    ↓
AI provides solution or routes to human
    ↓
Call ends, transcript sent via webhook
```

---

## Recording & Transcription

### What's Included

- ✅ **Automatic recording** (audio file)
- ✅ **Real-time transcription** (via speech-to-text)
- ✅ **Call analysis** (custom fields extracted)
- ✅ **Webhook delivery** (`recording_url` + `transcript`)

### Privacy/Compliance Options

- **Opt-out of storage:** Transcripts/recordings not stored in Retell (still available 10 min via webhook)
- **PII removal:** Automatic redaction of credit cards, SSNs, etc. (+$0.01/min)
- **HIPAA-ready:** Can use BAA (Business Associate Agreement)
- **SOC 2 certified**

### Recording URL Availability

- Available in webhook for 10 minutes
- Permanent storage: Save to your own system if needed
- Format: MP3 or WAV

---

## Pros & Cons

### Pros ✅

1. **True AI conversation** — Not IVR scripts; uses LLM to understand intent
2. **Easy integration** — SIP trunking works with most PBX systems
3. **Comprehensive API** — Create agents, manage calls, handle webhooks
4. **Call transfer to humans** — Warm/cold transfer; can route to on-call staff
5. **Compliance-ready** — HIPAA, SOC 2, PII removal, opt-out storage
6. **Competitive pricing** — $0.07-$0.31/min; no setup fees
7. **Fast deployment** — Go live in days, not weeks
8. **Good documentation** — Clear API docs, video tutorials, community templates
9. **No lock-in** — Portable phone numbers via SIP trunking
10. **Built-in analytics** — Post-call analysis, call quality metrics

### Cons ❌

1. **No direct UC Connect integration** — Must route via SIP trunk (adds complexity)
2. **Latency** — Typical 1-2 second delay (speech recognition + LLM response)
3. **Yealink phone limitations** — Can't directly forward calls from Yealink to Retell (must be system-level routing)
4. **Fallback required** — If Retell is down, need voicemail backup
5. **LLM context limits** — Can't access real-time Fife RV systems without custom integration
6. **Speech quality dependency** — Background noise or poor audio = worse recognition
7. **Callback scheduling** — Requires backend integration (not built-in)
8. **Custom routing logic** — Time-of-day routing must be handled by UC Connect, not Retell

---

## Supported Integrations

### Telephony Providers

- **SIP Trunking:** Twilio, Telnyx, Vonage, 3CX, BroadSoft, Metaswitch, etc.
- **Direct SIP:** Custom SIP servers (Asterisk, FreeSWITCH, etc.)
- **SIP Partners:** Jambonz, Cloudonix (for advanced SIP manipulation)

### Backend Integrations

- **Webhooks** → Your backend (REST API)
- **No native CRM integration** — Must build custom webhook handlers
- **LLM Support:** OpenAI, Google Gemini, Anthropic Claude, others

### Chat/Messaging

- SMS (via Retell number)
- Web chat (browser-based)

---

## Data Sheet Summary

| Aspect | Details |
|--------|---------|
| **What** | AI phone agent platform (inbound & outbound) |
| **Cost** | $0.07–$0.31/min (pay-as-you-go) |
| **Integration** | SIP trunking or custom SIP |
| **Call Features** | Recording, transfer, transcription, analysis |
| **API** | REST + Webhooks |
| **Latency** | 1–2 seconds (typical) |
| **Compliance** | HIPAA-ready, SOC 2, PII removal |
| **Setup Time** | Days (if SIP trunk already exists) |
| **Best For** | After-hours answering, outbound callbacks, 24/7 support |

---

## Documentation Links

- **Main Docs:** https://docs.retellai.com/
- **Quick Start:** https://docs.retellai.com/get-started/quick-start
- **Custom Telephony:** https://docs.retellai.com/deploy/custom-telephony
- **Twilio Integration:** https://docs.retellai.com/deploy/twilio
- **Webhooks:** https://docs.retellai.com/features/webhook-overview
- **Call API Reference:** https://docs.retellai.com/api-references/create-phone-call
- **Dashboard:** https://dashboard.retellai.com/
