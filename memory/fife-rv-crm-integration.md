# Fife RV AI Receptionist — CRM Integration Roadmap

**Status:** Phase 1 uses email. Phase 1.5 adds CRM sync.  
**Created:** 2026-04-30

---

## 🎯 INTEGRATION STRATEGY

### Phase 1: Email Foundation (Starting)
```
Retell AI Call
    ↓
Webhook: /webhook/retell-call
    ↓
Parse JSON lead data
    ↓
Send email alert (team)
    ↓
Store in Supabase
    ↓
(Optional) Log to Google Sheet
```

**Timeline:** Week 1-3 (go-live)  
**Lead handling:** Manual or team pastes into CRM

---

### Phase 1.5: CRM Auto-Sync (Planned)
```
Retell AI Call
    ↓
Webhook: /webhook/retell-call
    ↓
Parse JSON lead data
    ↓
Fork workflow:
├─ Path A: Send email alert (team)
└─ Path B: Push to CRM system
    ↓
CRM auto-creates lead record
    ↓
Sales team sees lead in CRM UI
```

**Timeline:** Week 3-4 (after email is stable)  
**Lead handling:** Fully automated, zero manual entry

---

## 🔗 CRM INTEGRATION OPTIONS

### Option 1: HubSpot

**Best for:** Enterprise, lots of CRM features, lead scoring

**Integration:**
- HubSpot public API (REST)
- Webhook: Create contact + deal
- Mapping: Lead fields → HubSpot contact fields
- Auth: API key

**Lead creation flow:**
```
Lead data from Retell
    ↓
/api/crm/hubspot/create-contact
    ↓
POST to HubSpot API
    {
      "email": "john@example.com",
      "firstname": "John",
      "lastname": "Smith",
      "phone": "(206) 555-1234",
      "rv_interest": "Travel Trailer",
      "timeline": "Looking soon"
    }
    ↓
HubSpot creates contact + deal
    ↓
Sales team alerted in HubSpot inbox
```

**Setup time:** 30-45 min  
**Cost:** HubSpot subscription (already paying?)  
**Complexity:** Medium

---

### Option 2: Pipedrive

**Best for:** Sales-focused, intuitive UI, RV industry adoption

**Integration:**
- Pipedrive public API (REST)
- Webhook: Create lead + person
- Mapping: Lead fields → Pipedrive person/deal
- Auth: API token

**Lead creation flow:**
```
Lead data from Retell
    ↓
/api/crm/pipedrive/create-lead
    ↓
POST to Pipedrive API
    {
      "person_email": "john@example.com",
      "person_name": "John Smith",
      "person_phone": "(206) 555-1234",
      "title": "Travel Trailer Interest",
      "visible_to": "1"
    }
    ↓
Pipedrive creates person + lead
    ↓
Sales team sees in pipeline
```

**Setup time:** 20-30 min  
**Cost:** Pipedrive subscription  
**Complexity:** Low-Medium

---

### Option 3: Airtable

**Best for:** Simple, lightweight, no CRM subscription needed

**Integration:**
- Airtable public API (REST)
- Webhook: Create row in table
- Mapping: Lead fields → Airtable columns
- Auth: API key

**Lead creation flow:**
```
Lead data from Retell
    ↓
/api/crm/airtable/create-record
    ↓
POST to Airtable API
    {
      "records": [{
        "fields": {
          "Name": "John Smith",
          "Phone": "(206) 555-1234",
          "Email": "john@example.com",
          "RV Interest": "Travel Trailer",
          "Timeline": "Looking soon",
          "Source": "After-Hours AI"
        }
      }]
    }
    ↓
Airtable creates new row
    ↓
Team sees in Airtable base
```

**Setup time:** 10-20 min  
**Cost:** Free (Airtable free tier covers this)  
**Complexity:** Low

---

### Option 4: Google Sheet (Simple Alternative)

**Best for:** Temp solution, no CRM yet, simple logging

**Integration:**
- Google Sheets API
- Webhook: Append row to sheet
- Mapping: Lead fields → sheet columns
- Auth: Service account

**Lead creation flow:**
```
Lead data from Retell
    ↓
/api/crm/google-sheet/append
    ↓
Append to Google Sheet
    Date | Name | Phone | Email | Intent | Timeline | Status
    ────────────────────────────────────────────────
    ... | John | 206... | john@ | Travel Trailer | Soon | New
    ↓
Team checks sheet for leads
```

**Setup time:** 15-25 min  
**Cost:** Free  
**Complexity:** Low

---

## 📋 FIELD MAPPING (For Any CRM)

**Retell AI Output → CRM Fields:**

| Retell Field | CRM Field | Type | Example |
|--------------|-----------|------|---------|
| caller_name | Name / First Name + Last Name | string | John Smith |
| phone | Phone | string | (206) 555-1234 |
| email | Email | string | john@example.com |
| intent | Description / Notes | string | Interested in travel trailer |
| rv_interest.category | Property / RV Type | select | Travel Trailer |
| rv_interest.new_or_used | Property Type | select | Used |
| rv_interest.timeline | Lead Quality / Stage | select | Looking Soon |
| appointment_request.requested | Follow-up Needed | boolean | true |
| appointment_request.preferred_day | Callback Date | date | Saturday |
| priority | Priority / Urgency | select | Normal / High |
| notes | Notes | text | Customer asked about financing |

---

## 🛠️ IMPLEMENTATION STEPS (Phase 1.5)

### Step 1: Fife RV Decides CRM
- [ ] Choose: HubSpot / Pipedrive / Airtable / Other / Sheet
- [ ] If existing CRM: Get API credentials
- [ ] If new: Set up account + get API key

### Step 2: Crawford Builds Integration
- [ ] Create `/api/crm/{crm-name}/create-lead` endpoint
- [ ] Map Retell JSON fields to CRM fields
- [ ] Set up authentication (API key / token)
- [ ] Build error handling + retry logic

### Step 3: Testing
- [ ] Send test lead to Retell
- [ ] Verify webhook fires
- [ ] Check CRM for new lead record
- [ ] Verify all fields mapped correctly

### Step 4: Deploy
- [ ] Update webhook handler
- [ ] Enable CRM routing in production
- [ ] Monitor first leads

### Step 5: Cleanup
- [ ] Disable manual data entry (no more copying)
- [ ] Update team workflow
- [ ] Set up CRM automation rules (auto-assign, follow-ups, etc.)

---

## 💬 CRM SETUP GUIDE BY PLATFORM

### HubSpot Setup
```
1. Go to app.hubspot.com
2. Settings → Integrations → Private apps
3. Create "Fife RV AI Receptionist" app
4. Scopes needed:
   - crm.objects.contacts.write
   - crm.objects.deals.write
5. Copy API token → use in webhook handler
```

### Pipedrive Setup
```
1. Go to app.pipedrive.com
2. Settings → API tokens
3. Create new token for "Fife RV AI"
4. Copy token → use in webhook handler
5. Note: Base URL is account-specific
   (e.g., https://company-name.pipedrive.com)
```

### Airtable Setup
```
1. Go to airtable.com
2. Create new base: "Fife RV Leads"
3. Create table with columns:
   - Name, Phone, Email, Intent, RV Interest, Timeline, Status, Notes
4. Get API key from account page
5. Get base ID + table ID from API docs
6. Use in webhook handler
```

### Google Sheet Setup
```
1. Create Google Sheet: "Fife RV After-Hours Leads"
2. Share with service account email
3. Get service account JSON credentials
4. Create table with headers:
   - Date, Name, Phone, Email, Intent, RV Type, Timeline, Appointment Needed, Status
5. Use credentials in webhook handler
```

---

## 📊 RECOMMENDED APPROACH

**For Fife RV:**
1. **Phase 1 (Now):** Email alerts + Supabase storage
2. **Phase 1.5 (Week 3-4):** Add CRM integration (choose platform)
3. **Phase 2 (Later):** Advanced automation (lead scoring, auto-assign, SMS)

**Why this order:**
- Email works immediately, no CRM needed
- Can launch and validate system
- Then integrate CRM once stable
- Zero time to first lead

**Best CRM choice depends on:**
- If you already have CRM → integrate with that
- If no CRM yet → try Airtable (free) or Google Sheet
- If sales-focused → Pipedrive
- If enterprise → HubSpot

---

## 🚀 NEXT STEPS

1. **You:** Tell me which CRM (or "Google Sheet for now")
2. **Me:** Add CRM integration to Phase 1.5 plan
3. **Email phase:** Goes live Week 1-3
4. **CRM phase:** Integrated by end of Week 4

---

**Status:** Ready for Phase 1.5 implementation  
**Prepared by:** Crawford  
**For:** Fife RV Center AI Receptionist
