# Fife RV AI Receptionist — PROJECT CHECKPOINT

**Status:** BUILD APPROVED - READY TO START  
**Date:** 2026-04-30 22:29 PDT  
**Next Action:** Build phase begins (infrastructure provisioning)  
**Paused:** To address LaVerdi OpenClaw Portal issues

---

## ✅ 100% LOCKED SPECIFICATIONS

### Client: Fife RV Center (Fife, WA)
- **Project:** AI after-hours sales receptionist
- **Primary Phone:** (253) 284-6600
- **Service Phone:** (253) 284-6650
- **Port Orchard:** (360) 813-7430

### Schedule (LOCKED)
- **Mon-Fri:** After-hours only (exact times TBD - e.g., 6 PM - 8 AM)
- **Sat-Sun:** OFF (store open, humans answer)
- **Holidays/Disasters:** OFF (closed entirely)
- **Flexibility:** Dashboard toggle + *99 code override (anytime)

### Routing Control (LOCKED)
- **Option 3: Full Hybrid System**
  - Tier 1: Auto time-based scheduling (default)
  - Tier 2: Manual dashboard toggle (emergency)
  - Tier 3: Transfer line *99 code (field control)

### Email Recipients (LOCKED)
```
kevinc@fifervcenter.com
cmichaelson@fifervcenter.com
vzurbano@fifervcenter.com
```
- Real-time alerts (instant per lead)
- Can update anytime via dashboard

### CRM Integration (LOCKED)
- **System:** Focus by Reynolds and Reynolds
- **Timeline:** Phase 1.5 (Week 4)
- **Result:** Auto-sync, zero manual entry

### Tone & Messaging (LOCKED)
- **Style:** Formal with friendly charisma
- **Vibe:** Professional, warm, personable
- **Approach:** Confident, helpful, clear

---

## 🎯 AGENT CAPABILITIES (LOCKED)

### Primary Sales Flow
1. "Are you looking for a new or used RV?"
2. "What type—travel trailer, fifth wheel, motorhome, toy hauler, etc.?"
3. "Are you looking to buy soon, or just starting your search?"
4. "Is there a specific RV from our website you're calling about?"
5. "Do you have a trade-in?"
6. "What's your name and best phone number in case we get disconnected?"
7. "Would you like someone to call you back, or request a time to come in?"

### Core Capabilities
- ✅ Answer after-hours calls
- ✅ Capture sales leads (8-question flow)
- ✅ Answer inventory questions (from fifervcenter.com)
- ✅ Provide directions & location info
- ✅ Route service/parts calls to (253) 284-6650
- ✅ Route Port Orchard to (360) 813-7430
- ✅ Take messages for specific employees
- ✅ Handle concurrent calls
- ✅ Escalate appropriately

### Hard Restrictions (Safety)
- ❌ Never promise pricing
- ❌ Never guarantee inventory
- ❌ Never promise financing
- ❌ Never diagnose service
- ❌ Never give repair estimates
- ❌ Never guarantee parts fitment
- ❌ Never make warranty promises
- ❌ Never share employee personal info
- ❌ Never commit to delivery/discounts/holds

Safe fallback: "I can help get that started and have the right person confirm the details when we open."

---

## 📋 LEAD CAPTURE FORMAT (LOCKED)

```json
{
  "call_type": "sales_lead | service_message | parts_message | port_orchard_message | employee_message | general_question",
  "caller_name": "string",
  "phone": "string",
  "email": "string (optional)",
  "intent": "string",
  "department": "sales | service | parts | port_orchard | general",
  "location": "Fife | Port Orchard",
  "rv_interest": {
    "new_or_used": "new | used | unknown",
    "category": "travel_trailer | fifth_wheel | motorhome | toy_hauler | unknown",
    "stock_number_or_unit": "string",
    "budget": "string",
    "timeline": "looking_soon | exploring | unknown",
    "trade_in": "yes | no | unknown"
  },
  "appointment_request": {
    "requested": boolean,
    "preferred_day": "string",
    "preferred_time": "string",
    "appointment_type": "sales_visit | callback | service | parts"
  },
  "employee_message": {
    "employee_requested": "string",
    "reason": "string",
    "urgency": "high | normal",
    "best_callback_time": "string"
  },
  "notes": "string",
  "needs_human_followup": boolean,
  "priority": "normal | high",
  "source": "after_hours_ai",
  "created_at": "ISO-8601 timestamp"
}
```

---

## 🏗️ INFRASTRUCTURE (LOCKED)

### Phase 1: Infrastructure & Launch (Weeks 1-3)

**Week 1 (May 1-5): Infrastructure**
- Vultr Seattle instance (2 vCPU, ~$35/mo)
- OpenClaw gateway deployment
- Supabase database (calls, leads, messages, appointments tables)
- Webhook handler (Retell → processing → email/CRM)
- SendGrid email system (→ Kevin C., C. Michaelson, V. Zurbano)
- Routing control system:
  - Time-based scheduling engine
  - Dashboard toggle
  - *99 code listener
  - Audit log

**Week 2 (May 6-12): Retell Agent**
- Retell account + agent creation
- System prompt (formal + friendly charisma)
- 8-question sales flow
- Safety rules
- Website knowledge (fifervcenter.com)
- Message routing (service, parts, employees)
- Testing

**Week 3 (May 13-19): Go-Live**
- End-to-end testing
- Phone routing live: (253) 284-6600 → Retell
- 48-hour monitoring
- Team training
- Prompt optimization

### Phase 1.5: CRM Integration (Week 4+)
- Focus API research
- Webhook integration
- Field mapping
- Testing
- Live deployment

---

## 💰 COSTS (MONTHLY)

| Item | Cost |
|------|------|
| Vultr (2 vCPU, Seattle) | $35 |
| Retell AI | $25-40 |
| SendGrid (email) | $10-20 |
| Supabase | Free |
| **Total** | **$70-95/mo** |

---

## 📚 DOCUMENTATION (COMPLETED)

✅ memory/project-ai-receptionist.md (full spec)  
✅ memory/fife-rv-implementation-guide.md (build guide + code)  
✅ memory/fife-rv-routing-control.md (routing design)  
✅ memory/fife-rv-crm-integration.md (CRM roadmap)  
✅ memory/fife-rv-pre-launch-checklist.md (testing)  
✅ memory/fife-rv-exec-summary.md (stakeholder summary)  
✅ memory/fife-rv-build-confirmation.md (final approval)  
✅ memory/fife-rv-final-locked.md (all decisions)  
✅ memory/fife-rv-all-decisions.md (quick reference)  
✅ memory/fife-rv-schedule-locked.md (schedule details)  
✅ memory/fife-rv-decisions-locked.md (decision tracker)

**Total:** 100+ pages, fully documented, ready to build

---

## ✅ BUILD STATUS

**Current Phase:** Ready to start infrastructure build  
**All Decisions:** 100% locked  
**Blockers:** None  
**Pending:** Crawford provisioning Vultr + starting build

**Timeline:**
- Week 1: Infrastructure
- Week 2: Agent development
- Week 3: Go-live (mid-May)
- Week 4+: CRM integration

---

## 🔄 RESUMING BUILD

To resume this project:
1. Read this checkpoint file
2. Check memory/fife-rv-final-locked.md for all decisions
3. Follow memory/fife-rv-implementation-guide.md for build steps
4. Start with Vultr provisioning (Week 1)

Everything is documented. Nothing needs re-confirmation.

---

**Status:** ✅ CHECKPOINT SAVED - PAUSED FOR LAVERDI WORK  
**Prepared by:** Crawford  
**For:** Fife RV Center AI Receptionist  
**Resume:** When ready to continue build
