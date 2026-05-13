# Fife RV AI Receptionist — Ready to Build

**Status:** Decisions locked, ready for implementation  
**Date:** 2026-04-30  
**Go-Live Target:** Mid-May (May 13-17)

---

## ✅ CONFIRMED DECISIONS

### Schedule ✅
- **Weekdays (Mon-Fri):** AI active after-hours
  - Close time: _________________ (e.g., 6 PM)
  - Open time: _________________ (e.g., 8 AM)
- **Weekends (Sat-Sun):** AI OFF (store open, humans answer)
- **Flexibility:** Manual toggle + *99 code override (anytime)

### Routing Control ✅
- **Option 3: Full Hybrid**
  1. Auto time-based scheduling (default)
  2. Manual dashboard toggle (emergency override)
  3. Transfer line *99 code (field control)

### Lead Management ✅
- **Phase 1:** Real-time email alerts (multi-recipient)
- **Phase 1.5:** CRM auto-sync

---

## ⏳ REMAINING CONFIRMATIONS NEEDED

**Before build starts, confirm:**

1. **Email Recipients** (who gets alerts)
   - Primary: _______________________________
   - Additional: _______________________________

2. **CRM Choice** (Phase 1.5)
   - [ ] HubSpot
   - [ ] Pipedrive
   - [ ] Airtable
   - [ ] Google Sheet
   - [ ] Don't have CRM yet

3. **Tone & Messaging**
   - Tone: Formal / Friendly / Casual / Custom?
   - Promotions or key phrases to include?

---

## 📅 BUILD PHASES

### Phase 1: Infrastructure & Launch (Weeks 1-3)
**Week 1 (May 1-5):** Infrastructure
- [ ] Vultr Seattle instance
- [ ] OpenClaw gateway deployment
- [ ] Supabase database setup
- [ ] Webhook handler development
- [ ] Email alert system
- [ ] Routing control system (toggle + *99 code + auto-schedule)

**Week 2 (May 6-12):** Retell Agent
- [ ] Retell account creation
- [ ] Agent configuration (sales script + safety rules)
- [ ] Website knowledge integration
- [ ] Agent testing (test mode)
- [ ] Phone routing setup

**Week 3 (May 13-19):** Launch
- [ ] Full end-to-end testing
- [ ] Go live: (253) 284-6600 → Retell
- [ ] Monitor first 48 hours
- [ ] Team training
- [ ] Prompt optimization

### Phase 1.5: CRM Integration (Week 4)
- [ ] CRM credentials provided
- [ ] Integration endpoint built
- [ ] Lead syncing tested
- [ ] Live deployment

---

## 🎯 WHAT GETS BUILT

### System Components
1. **Retell AI Voice Agent**
   - Answers (253) 284-6600
   - 8-question sales flow
   - Website knowledge base (fifervcenter.com)
   - Message taking & routing
   - Safety rules enforced

2. **Infrastructure (Vultr Seattle)**
   - OpenClaw gateway (call routing)
   - Supabase (lead database)
   - Webhook handler (call event processing)
   - Email service (SendGrid)
   - Routing control system

3. **Routing Control**
   - Time-based scheduling (auto)
   - Dashboard toggle (manual override)
   - *99 code transfer line (field control)
   - Audit log (all changes tracked)

4. **Lead Capture & Alerts**
   - Real-time email (multi-recipient)
   - Supabase storage
   - Optional Google Sheet
   - CRM integration (Phase 1.5)

---

## 💼 DELIVERABLES

**After Go-Live:**
- Admin dashboard (routing control, lead management)
- Email alerts (real-time)
- Lead database (searchable, filterable)
- Call transcripts (optional storage)
- Analytics (calls answered, leads captured, etc.)
- Team training documentation
- Support/monitoring runbook

---

## 🚀 NEXT IMMEDIATE ACTION

**Confirm 3 remaining items:**

1. **Email recipients list** (who gets alerts?)
2. **CRM choice** (which platform?)
3. **Tone & messaging** (formal? friendly?)

**Once confirmed:** I provision Vultr and start build immediately.

---

**Status:** ✅ Ready to build  
**Prepared by:** Crawford  
**For:** Fife RV Center AI Receptionist
