# Fife RV AI Receptionist — Executive Summary

**Project:** AI After-Hours Sales Receptionist for Fife RV Center  
**Location:** Fife, WA (near Tacoma)  
**Launch Target:** Week of May 5, 2026  
**Status:** Phase 1 Spec Complete — Ready to Build

---

## 🎯 WHAT THIS SOLVES

**Problem:** Fife RV loses sales leads after hours because nobody answers calls to (253) 284-6600.

**Solution:** AI receptionist answers 24/7 after-hours calls, captures sales information, books appointments, and alerts the team instantly.

**Expected Impact:**
- ✅ Zero missed calls after hours
- ✅ Qualified leads before business day starts
- ✅ Faster lead response (team alerted immediately)
- ✅ Better customer experience (no voicemail maze)

---

## 📋 WHAT THE AI DOES

The receptionist can:
1. **Answer calls** with professional greeting
2. **Qualify leads** using a proven sales flow (8 questions)
3. **Answer inventory questions** from fifervcenter.com
4. **Capture appointment requests** (day/time preference)
5. **Route service/parts** calls to the right team
6. **Route Port Orchard** calls to Port Orchard location
7. **Take messages** for specific employees
8. **Handle upset callers** professionally
9. **Always know when to ask for help** (safe fallbacks)

---

## 🛠️ WHAT I'M BUILDING

**Three Core Components:**

### 1. **Retell AI Voice Agent**
- Handles phone calls on (253) 284-6600
- Uses fifervcenter.com knowledge base
- Follows sales script + safety rules
- Outputs structured lead data

### 2. **Vultr Seattle Infrastructure**
- OpenClaw gateway (call routing + processing)
- Supabase database (lead storage)
- Webhook handler (receives call events)
- Email alerts (instant team notification)

### 3. **Automation Workflow (n8n)**
- Receives lead JSON from Retell
- Sends email alert to sales team
- Logs lead to Google Sheet
- (Optional) Sends SMS alert
- (Optional) Creates calendar event

---

## 💰 COSTS (Monthly)

| Item | Cost |
|------|------|
| Vultr Server (2vCPU, Seattle) | $24-43 |
| Retell AI (pay-per-minute) | ~$20-50* |
| Supabase (free tier covers Phase 1) | $0 |
| SendGrid (emails) | $0-30 |
| **Total** | **~$50-120/mo** |

*Retell pricing: ~$0.20-0.50 per call minute (varies by model)

---

## 📅 BUILD TIMELINE

### Week 1 (May 1-5): Infrastructure
- [ ] Vultr account + Seattle instance
- [ ] OpenClaw gateway deployed
- [ ] Supabase project created
- [ ] Webhook handler built & tested

### Week 2 (May 6-12): Retell Agent
- [ ] Retell account + agent created
- [ ] System prompt configured
- [ ] Website knowledge integrated
- [ ] Agent tested in test mode
- [ ] Automation workflow set up

### Week 3 (May 13-19): Testing & Launch
- [ ] End-to-end testing
- [ ] Phone routing configured
- [ ] Go live: Route (253) 284-6600 to Retell
- [ ] Monitor first week of calls
- [ ] Team training

**Go-Live Date:** ~May 13-17 (3 weeks from today)

---

## ✅ WHAT YOU NEED TO PROVIDE

**Now:**
1. ✅ After-hours hours (flexible, will toggle as needed)
2. ✅ Lead notification **email list** (single email or multiple)
   - Examples: sales@fifervcenter.com, chris@fifervcenter.com, manager@fifervcenter.com
   - Can be updated anytime without rebuilding
3. ✅ Lead notification format: **Real-time alerts** (instant email per lead)
4. ✅ Tone preference (formal? casual? friendly?)
5. ✅ Any special messaging or promotions

**During Build:**
- Feedback on agent test calls
- Any prompt adjustments
- Final approval before going live

**After Launch:**
- Daily monitoring (first 2 weeks)
- Feedback on lead quality
- Prompt optimization (ongoing)

---

## 🔐 SAFETY & RESTRICTIONS BUILT IN

The AI will **never**:
- Promise specific pricing
- Guarantee inventory availability
- Make financing commitments
- Diagnose service issues
- Commit to delivery timelines
- Share employee personal info
- Make any legal/warranty promises

When unsure, it uses safe fallback:
> "I can help get that started and have the right person confirm the details when we open."

---

## 📊 TRACKING & METRICS

After launch, you'll see:
- **Total calls answered** per day/week
- **Sales leads captured** (with all details)
- **Appointment requests** received
- **Lead follow-up rate** (% contacted by team)
- **Conversion rate** (% that book/visit)
- **Customer satisfaction** (if feedback collected)

Dashboard will show:
- Leads in real-time queue
- Call transcripts
- Lead status (new, contacted, converted)
- Team performance metrics

---

## 🚀 NEXT STEPS

1. **You:** Answer those 5 questions above
2. **Me:** Start infrastructure build
3. **Week 2:** Retell agent creation + testing
4. **Week 3:** Go live + monitor
5. **Week 4+:** Optimize based on real-world feedback

---

## 📞 CONTACTS & RESOURCES

**Implementation:** Crawford (this agent)  
**Client:** Chris LaVerdiere  
**Fife RV:** Point of contact TBD  

**Resources:**
- Full Specification: memory/project-ai-receptionist.md
- Implementation Guide: memory/fife-rv-implementation-guide.md
- Retell System Prompt: See implementation guide (section "Retell Agent System Prompt")
- Vultr Seattle Setup: See implementation guide

---

**Ready to build?** Let me know the 5 clarifications above, and I'll kick off the infrastructure today.
