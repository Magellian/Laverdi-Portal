# Fife RV AI Receptionist — FINAL DECISIONS LOCKED ✅

**Status:** ALL DECISIONS CONFIRMED - READY TO BUILD  
**Date:** 2026-04-30 14:03 PDT  
**Build Start:** IMMEDIATE

---

## ✅ 100% LOCKED DECISIONS

### 1. Schedule ✅
- **Monday-Friday:** After-hours (evenings + nights)
- **Saturday-Sunday:** AI OFF (store open, humans answer)
- **Holidays & Disasters:** AI OFF (closed)
- **Flexibility:** Dashboard toggle + *99 code override (anytime)

### 2. Routing Control ✅
- **Option 3: Full Hybrid System**
  - Tier 1: Auto time-based scheduling (default)
  - Tier 2: Manual dashboard toggle (override)
  - Tier 3: Transfer line *99 code (field control)

### 3. Email Recipients ✅
```
kevinc@fifervcenter.com
cmichaelson@fifervcenter.com
vzurbano@fifervcenter.com
```
- Real-time alerts (instant email per lead)
- Can update anytime via admin dashboard

### 4. CRM Integration ✅
- **System:** Focus by Reynolds and Reynolds
- **Timeline:** Phase 1.5 (Week 4)
- **API Integration:** Will research Focus API + build webhook
- **Result:** Leads auto-sync to Focus (zero manual entry)

### 5. Tone & Messaging ✅
- **Style:** Formal with friendly charisma
- **Vibe:** Professional but personable
- **Approach:** Clear, confident, approachable
- **Personality:** Helpful, knowledgeable, warm

**Agent Tone Examples:**
- ✅ "Thanks for calling Fife RV Center—this is our automated assistant. We're currently closed, but I can still help you check RV availability, answer questions, take a message, or get you set up with a visit. What can I help you with tonight?"
- ✅ "We've had a lot of demand lately. Would you like me to request a time for you to come in and take a look?"
- ✅ "I can help get that started and have the right person confirm the details when we open."

---

## 🚀 BUILD STARTS IMMEDIATELY

### What I'm Building

**Week 1 (May 1-5): Infrastructure**
- [ ] Vultr Seattle account + instance (2 vCPU, ~$35/mo)
- [ ] OpenClaw gateway deployment
- [ ] Supabase database setup
- [ ] Webhook handler (receives Retell → processes leads → sends email)
- [ ] Email system configured (SendGrid → kevinc, cmichaelson, vzurbano)
- [ ] Routing control system:
  - [ ] Time-based scheduling engine
  - [ ] Manual toggle dashboard
  - [ ] *99 code transfer line listener
  - [ ] Audit log

**Week 2 (May 6-12): Retell Agent**
- [ ] Retell account creation
- [ ] Agent system prompt (formal + friendly charisma)
- [ ] Sales script (8-question flow)
- [ ] Safety rules (hard-coded restrictions)
- [ ] Website knowledge integration (fifervcenter.com)
- [ ] Message taking workflows (service, parts, employees)
- [ ] Escalation handling
- [ ] Full testing in test mode

**Week 3 (May 13-19): Launch**
- [ ] End-to-end testing
- [ ] Phone routing live: (253) 284-6600 → Retell AI
- [ ] 48-hour monitoring
- [ ] Team training (Kevin, C. Michaelson, V. Zurbano)
- [ ] Prompt optimization

**Week 4+ (Phase 1.5): CRM Integration**
- [ ] Research Focus API (Reynolds and Reynolds)
- [ ] Build Focus webhook integration
- [ ] Map lead fields → Focus fields
- [ ] Test lead syncing
- [ ] Live deployment
- [ ] Full automation (zero manual entry)

---

## 📋 IMPLEMENTATION DETAILS

### Retell AI System Prompt (Tone: Formal + Friendly Charisma)

```
You are an AI receptionist for Fife RV Center in Fife, Washington.

PERSONALITY & TONE
- Professional and knowledgeable
- Warm and approachable
- Helpful and confident
- Personable with genuine charisma
- Clear and efficient

OPENING
"Thanks for calling Fife RV Center—this is our automated assistant. 
We're currently closed, but I can still help you check RV availability, 
answer questions, take a message, or get you set up with a visit. 
What can I help you with tonight?"

[Full system prompt from spec, adapted for tone]
```

### Email Alert Recipients

**Primary Recipients:**
- kevinc@fifervcenter.com (Kevin C.)
- cmichaelson@fifervcenter.com (C. Michaelson)
- vzurbano@fifervcenter.com (V. Zurbano)

**Email Template (Tone: Professional + Friendly):**
```
Subject: New After-Hours Lead from Fife RV AI

Hi Kevin, C., and V.,

You have a new lead from the after-hours AI receptionist:

Caller: John Smith
Phone: (206) 555-1234
Interest: Travel Trailer (Used, Looking Soon)
Appointment: Requested (Saturday preferred)
Timeline: Buying within 30 days
Trade-in: No

Next Steps:
→ Call/text John at (206) 555-1234
→ Confirm appointment or follow up
→ Mark as contacted in Focus

View all leads: [dashboard link]

---
Fife RV After-Hours AI
```

### Focus CRM Integration (Phase 1.5)

**Task:** Research Focus API + build webhook
```
Retell AI Call
    ↓
Webhook: /webhook/retell-call
    ↓
Parse lead JSON
    ↓
Fork:
├─ Send email to Kevin, C., V. (real-time)
└─ POST to Focus API (auto-create lead)
    ↓
Focus shows new lead in system
    ↓
Sales team works in Focus UI
```

**Focus API Integration:**
- Endpoint: Reynolds and Reynolds Focus API
- Authentication: API key (Fife RV provides)
- Lead creation: Auto-create contact + opportunity
- Field mapping: (TBD after API research)
- Error handling: Retry logic + fallback to email

---

## 📅 DETAILED TIMELINE

### Week 1 (May 1-5)

**Monday-Tuesday (May 1-2):**
- [ ] Vultr account creation
- [ ] Instance provisioning (Seattle, 2 vCPU)
- [ ] Ubuntu setup + Docker installation
- [ ] Domain/IP configuration

**Wednesday-Thursday (May 3-4):**
- [ ] OpenClaw gateway deployment
- [ ] Supabase project creation + tables
- [ ] SendGrid account + credentials
- [ ] Webhook handler development

**Friday (May 5):**
- [ ] Email system testing
- [ ] Routing control system (basic toggle)
- [ ] Infrastructure testing
- [ ] Ready for agent development

### Week 2 (May 6-12)

**Monday-Tuesday (May 6-7):**
- [ ] Retell account creation
- [ ] Agent system prompt (formal + friendly)
- [ ] Sales script finalization
- [ ] Safety rules configuration

**Wednesday-Thursday (May 8-9):**
- [ ] Website knowledge integration
- [ ] Message routing setup
- [ ] Escalation handling
- [ ] Agent testing (test mode)

**Friday (May 10-12):**
- [ ] Full integration testing
- [ ] Phone routing configuration
- [ ] Edge case testing
- [ ] Ready for launch

### Week 3 (May 13-19)

**Monday (May 13):**
- [ ] Final QA + testing
- [ ] System monitoring setup
- [ ] Team notification
- [ ] Go-live: (253) 284-6600 → Retell

**Tuesday-Wednesday (May 14-15):**
- [ ] Monitor first calls
- [ ] Real-time adjustments
- [ ] Team feedback collection
- [ ] Email delivery validation

**Thursday-Friday (May 16-17):**
- [ ] Continue monitoring
- [ ] Prompt optimization
- [ ] Team training session
- [ ] Documentation handoff

### Week 4+ (May 20+)

- [ ] Focus API research
- [ ] Integration development
- [ ] Testing + validation
- [ ] Live CRM sync deployment

---

## 💰 COSTS BREAKDOWN

| Item | Cost | Frequency |
|------|------|-----------|
| Vultr Server | $35 | Monthly |
| Retell AI | $25-40 | Monthly (per-minute usage) |
| SendGrid | $10-20 | Monthly (email volume) |
| Supabase | Free | (Phase 1) |
| Focus CRM | Already subscribed? | (check with Reynolds) |
| **Total** | **$70-95/mo** | (Phase 1) |

---

## ✅ CONFIRMATION CHECKLIST

- [x] Schedule locked (Mon-Fri after-hours, Sat-Sun off, holidays off)
- [x] Routing control (Option 3: Full hybrid system)
- [x] Email recipients (Kevin, C. Michaelson, V. Zurbano)
- [x] CRM system (Focus by Reynolds and Reynolds)
- [x] Tone & messaging (Formal + friendly charisma)
- [x] **BUILD APPROVED**

---

## 🎯 SUCCESS METRICS (First Week)

After launch, we'll measure:
- Total calls answered: ___
- Sales leads captured: ___
- Email delivery rate: ___
- Team satisfaction: ___
- Agent response quality: ___
- System uptime: ___

**Goal:** 100% call answer rate, zero missed leads, 95%+ email delivery

---

## 📞 BUILD CONTACTS

**Implementation:** Crawford (this agent)  
**Client Lead:** Chris LaVerdiere  
**Fife RV Team:**
- Kevin C. (kevinc@fifervcenter.com)
- C. Michaelson (cmichaelson@fifervcenter.com)
- V. Zurbano (vzurbano@fifervcenter.com)

**Key Resources:**
- All documentation: /workspace/memory/fife-rv-*.md
- Implementation guide: memory/fife-rv-implementation-guide.md
- CRM roadmap: memory/fife-rv-crm-integration.md

---

## 🚀 BUILD STATUS

✅ **ALL DECISIONS LOCKED**
✅ **100% READY TO BUILD**
✅ **NO BLOCKERS**

**Build starts immediately. Go-live mid-May.**

---

**Prepared by:** Crawford  
**For:** Fife RV Center AI Receptionist  
**Status:** ✅ BUILD APPROVED - STARTING NOW
**Timeline:** 3-4 weeks to full launch
