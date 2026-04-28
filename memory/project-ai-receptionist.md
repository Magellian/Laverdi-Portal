# Project: AI Receptionist for Fife RV

## Status: Infrastructure Ready, Agent Config Pending

### Context
- **Client:** Fife RV Center
- **Use Case:** After-hours call handling + lead capture
- **Timezone:** America/Los_Angeles
- **Priority:** High (revenue-generating)

### Infrastructure (✅ Complete)

#### VPS Gateway
- **Provider:** DigitalOcean Droplet
- **IP:** 64.23.142.154 (public), 10.124.0.2 (private)
- **OpenClaw Version:** 2026.3.28
- **Gateway Endpoint:** ws://64.23.142.154:18789
- **Gateway Token:** `49432e4ffe9991efdacafa3aded1fdc6c7be96afea97391d`
- **Auth Mode:** token
- **Firewall:** UFW configured, port 18789 open
- **Status:** ✅ Running and reachable

#### Deployment Command (VPS)
```bash
openclaw gateway
# Gateway starts on ws://0.0.0.0:18789
```

### Retell AI Agent Config (❌ To Do)

#### Prerequisites Needed
1. **Retell Account & Credentials**
   - [ ] Retell API key (get from dashboard)
   - [ ] Retell agent ID (create agent in Retell)
   - Status: Not yet set up

2. **Agent Behavior & Prompts**
   - [ ] System prompt / instructions (what should receptionist say?)
   - [ ] Greeting message
   - [ ] Hours of operation
   - [ ] Call handling workflow (take message? book appointment? transfer?)
   - Status: Undefined

3. **Lead Capture & Logging**
   - [ ] Where should call logs go? (database, email, CRM, webhook?)
   - [ ] What data to capture? (caller name, phone, reason, best time to call, etc.)
   - [ ] CRM integration? (Pipedrive, HubSpot, Airtable, custom?)
   - Status: Not defined

4. **Call Routing & Integration**
   - [ ] Webhook URL for call events (where Retell sends data)
   - [ ] Should calls be recorded?
   - [ ] Should caller be offered callback scheduling?
   - [ ] Emergency/escalation path?
   - Status: Not defined

5. **Fife RV Specifics**
   - [ ] Business hours (when should receptionist be active?)
   - [ ] Holiday closures
   - [ ] Department routing (sales, service, parts, general?)
   - [ ] Tone/style preferences (formal, friendly, technical?)
   - Status: Unknown

### Architecture (Planned)

```
Phone Call
    ↓
Retell AI Agent (receptionist behavior)
    ↓
Webhook Event
    ↓
OpenClaw Gateway (VPS 64.23.142.154:18789)
    ↓
Lead Capture & Logging
    ↓
CRM / Database / Email
```

### Blockers
- Need Retell API credentials
- Need to define agent behavior/prompts
- Need to decide on lead capture destination
- Need Fife RV business context (hours, departments, style)

### Next Steps (When Ready)
1. Get Retell API key from account
2. Define agent prompt and behavior
3. Set up lead capture webhook
4. Deploy Retell config to gateway
5. Test with call to Fife RV's phone number
6. Monitor call logs and iterate

### Related Files
- Memory: `memory/2026-03-31.md` (VPS setup notes)
- Gateway Config: `/root/.openclaw/openclaw.json` (on VPS)
- Workspace: `src/retell/` (to be created)

### Contact
- Chris LaVerdiere (lead)
- Crawford (implementation)
