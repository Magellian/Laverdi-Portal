# Fife RV AI Receptionist — Pre-Launch Checklist

**Status:** Phase 1 Build Complete  
**Last Updated:** 2026-04-30  
**Go-Live Target:** Week of May 13

---

## ✅ QUESTIONS TO ANSWER (BEFORE BUILDING)

### Business Context
- [ ] **After-hours schedule:** When should AI answer calls?
  - Weekday evenings: ____ to ____
  - Weekends: All day? Specific hours?
  - Holidays: Should AI be active?

- [ ] **Lead notification:** Where should alerts go?
  - Primary email: ____________________
  - Secondary email: ____________________
  - CRM system: (HubSpot / Pipedrive / Airtable / None)

- [ ] **Notification format preference:**
  - [ ] Real-time email alerts (immediate)
  - [ ] Daily digest email (once per morning)
  - [ ] Direct CRM integration
  - [ ] Slack notification

- [ ] **Tone & style:**
  - [ ] Formal & professional
  - [ ] Friendly & warm
  - [ ] Casual
  - [ ] Custom: ____________________

- [ ] **Special messaging:**
  - Any promotions or special offers to mention?
  - Seasonal messaging?
  - Key brand phrases we should use?

---

## ✅ INFRASTRUCTURE SETUP (CRAWFORD)

### Vultr Seattle Account
- [ ] Account created at vultr.com
- [ ] Billing method verified
- [ ] Seattle region selected
- [ ] Instance provisioned (2 vCPU, 8GB RAM)
- [ ] Public IP assigned: ____________________
- [ ] SSH access confirmed

### Docker & Dependencies
- [ ] Docker installed on Vultr instance
- [ ] Node.js installed
- [ ] Docker containers running
- [ ] UFW firewall configured (ports 18789, 3000 open)

### Supabase Database
- [ ] Project created at supabase.com
- [ ] Project URL: ____________________
- [ ] API key generated: ____________________
- [ ] Database tables created:
  - [ ] `calls` table
  - [ ] `leads` table
  - [ ] `messages` table
  - [ ] `appointment_requests` table
  - [ ] `call_analytics` table
- [ ] Row-level security configured
- [ ] Backups enabled

### OpenClaw Gateway
- [ ] Gateway deployed to Vultr
- [ ] Port 18789 accessible: `ws://YOUR_IP:18789`
- [ ] Health check passes: `curl http://YOUR_IP:18789/health`
- [ ] Docker container auto-restart enabled

### Webhook Handler
- [ ] Node.js server created
- [ ] Endpoints configured:
  - [ ] `POST /webhook/retell-call` (receive call data)
  - [ ] `GET /health` (status check)
- [ ] Environment variables set (.env):
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_API_KEY
  - [ ] SENDGRID_API_KEY
  - [ ] SENDGRID_FROM_EMAIL
  - [ ] TEAM_EMAIL
- [ ] Server running on port 3000
- [ ] Docker container auto-restart enabled

### SendGrid Email Service
- [ ] Account created at sendgrid.com
- [ ] API key generated: ____________________
- [ ] Sender domain verified
- [ ] Email templates created:
  - [ ] New lead alert template
  - [ ] Appointment request template
  - [ ] Service message template

---

## ✅ RETELL AI CONFIGURATION

### Retell Account & Agent
- [ ] Retell account created at retell.ai
- [ ] API key obtained: ____________________
- [ ] Agent created: "Fife RV Center After-Hours Receptionist"
- [ ] Agent system prompt configured (from guide)
- [ ] Voice selected: ____________________
- [ ] Test mode calls completed & passed:
  - [ ] Sales inquiry flow
  - [ ] Service routing
  - [ ] Message taking
  - [ ] Escalation handling

### Website Knowledge Integration
- [ ] fifervcenter.com content indexed/scraped
- [ ] RV inventory data accessible to agent
- [ ] Location/directions info added
- [ ] Store information configured
- [ ] Knowledge base test: Agent can answer sample questions

### Phone Number Integration
- [ ] Main line (253) 284-6600 identified
- [ ] Phone provider identified: ____________________
- [ ] Call routing to Retell configured
- [ ] Fallback number configured (in case Retell down): ____________________
- [ ] Test calls made to (253) 284-6600
- [ ] Retell agent answers successfully

### Webhook Configuration
- [ ] Webhook URL in Retell: https://YOUR_VULTR_IP:3000/webhook/retell-call
- [ ] Webhook authentication configured (if applicable)
- [ ] Test webhook firing successfully
- [ ] Call data appearing in Supabase

---

## ✅ AUTOMATION WORKFLOW (n8n)

### n8n Setup
- [ ] n8n account created (self-hosted or cloud)
- [ ] Workflow created: "Fife RV Lead Capture"
- [ ] Workflow steps:
  - [ ] Webhook trigger (receives Retell data)
  - [ ] Parse JSON
  - [ ] Send email alert (to sales team)
  - [ ] Post to Google Sheet (lead logging)
  - [ ] (Optional) Send SMS alert
  - [ ] (Optional) Create calendar event

### Email Configuration
- [ ] Email template created
- [ ] Test email sent successfully
- [ ] Team email list verified: ____________________

### Google Sheet Integration
- [ ] Google Sheet created: "Fife RV After-Hours Leads"
- [ ] Sheet columns:
  - [ ] Date/Time
  - [ ] Caller Name
  - [ ] Phone
  - [ ] Email
  - [ ] Intent
  - [ ] RV Type
  - [ ] Timeline
  - [ ] Appointment Requested
  - [ ] Notes
  - [ ] Status
- [ ] n8n has edit access to sheet
- [ ] Test row added successfully

### SMS Alert (Optional)
- [ ] Twilio or SMS service configured
- [ ] Team phone numbers added
- [ ] Test SMS sent successfully

### Calendar Integration (Optional)
- [ ] Google Calendar API configured
- [ ] Calendar selected for appointments: ____________________
- [ ] Test calendar event created

---

## ✅ TESTING & QUALITY ASSURANCE

### End-to-End Testing
- [ ] **Test 1: Sales Inquiry**
  - Call (253) 284-6600 during after-hours
  - Follow sales flow
  - Request appointment
  - Verify: Lead appears in Supabase within 10s
  - Verify: Email alert received within 30s
  - Verify: Row appears in Google Sheet

- [ ] **Test 2: Service Routing**
  - Call (253) 284-6600
  - Ask for Service & Parts
  - Verify: Message captured
  - Verify: Lead marked as service_message
  - Verify: Team notified

- [ ] **Test 3: Upset Caller Escalation**
  - Call (253) 284-6600
  - Express frustration
  - Verify: Agent apologizes appropriately
  - Verify: Message marked high priority
  - Verify: Team alerted immediately

- [ ] **Test 4: Inventory Question**
  - Call (253) 284-6600
  - Ask about specific RV from website
  - Verify: Agent answers correctly
  - Verify: Inventory info is current

- [ ] **Test 5: Concurrent Calls**
  - (If Retell platform supports it)
  - Make 2-3 calls simultaneously
  - Verify: All handled without errors

### Performance Testing
- [ ] Webhook response time: < 500ms
- [ ] Email delivery time: < 2 minutes
- [ ] Sheet update time: < 1 minute
- [ ] Gateway uptime: > 99%
- [ ] Agent response time: < 3 seconds

### Stress Testing
- [ ] Simulate 10+ calls in 1 hour
- [ ] Verify: No data loss
- [ ] Verify: No duplicate entries
- [ ] Verify: System remains responsive

---

## ✅ TEAM TRAINING & DOCUMENTATION

### Fife RV Team Preparation
- [ ] Team briefing scheduled: Date: ______ Time: ______
- [ ] Team training topics:
  - [ ] How to access leads
  - [ ] Lead prioritization
  - [ ] Follow-up process
  - [ ] Feedback on agent performance
  - [ ] Troubleshooting common issues

### Documentation
- [ ] Runbook created: "Monitoring After-Hours AI"
- [ ] Dashboard created for leads
- [ ] Team email list updated
- [ ] Escalation procedures documented
- [ ] Agent prompt optimization process documented

### Monitoring Setup
- [ ] Daily lead report configured
- [ ] Weekly analytics report configured
- [ ] Alert configured for system errors
- [ ] Alert configured for no calls in 24h (potential issue)

---

## ✅ GO-LIVE PREPARATION

### Final Checks (48 hours before launch)
- [ ] All tests passing
- [ ] Team trained and ready
- [ ] Documentation complete
- [ ] Monitoring dashboards live
- [ ] Backup systems configured
- [ ] On-call support plan in place

### Go-Live Day
- [ ] Crawford monitoring in real-time
- [ ] Fife RV team standing by
- [ ] (253) 284-6600 routed to Retell at ______ (specific time)
- [ ] First 10 calls monitored closely
- [ ] Feedback collected
- [ ] Any issues resolved immediately

### Post-Launch Week 1
- [ ] Daily monitoring
- [ ] Prompt optimization based on feedback
- [ ] Lead quality assessment
- [ ] Team feedback collection
- [ ] Performance metrics review

---

## ✅ SUCCESS CRITERIA (AFTER 1 WEEK)

By the end of week 1, we should have:
- [ ] **0 missed calls** during active hours
- [ ] **10+ sales leads captured** with quality data
- [ ] **2+ appointment requests** confirmed
- [ ] **Team reporting positive feedback** on lead quality
- [ ] **Email/SMS alerts working flawlessly**
- [ ] **Database integrity: 100% data accuracy**
- [ ] **System uptime: > 99%**

---

## 📞 ESCALATION CONTACTS

**During Build:**
- Primary: Crawford (this agent)

**During Launch & Week 1:**
- Primary: Crawford
- Backup: Chris LaVerdiere
- Fife RV Point of Contact: ____________________
- Retell Support: support@retell.ai
- Vultr Support: support@vultr.com

---

## 📝 SIGN-OFF

**Infrastructure Ready:** ☐ Approved by Crawford  
**Retell Agent Tested:** ☐ Approved by Crawford  
**Automation Workflow Tested:** ☐ Approved by Crawford  
**Team Training Complete:** ☐ Approved by Fife RV  
**Ready for Go-Live:** ☐ Approved by Chris LaVerdiere  

---

**Date Created:** 2026-04-30  
**Last Updated:** 2026-04-30  
**Prepared by:** Crawford
