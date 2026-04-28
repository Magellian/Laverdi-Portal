# LaVerdi OpenClaw - Complete Onboarding Checklist

## 📋 Pre-Setup (Before Installation)

- [ ] Read this entire checklist
- [ ] Check system requirements (macOS 10.14+, Windows 10+, Linux Ubuntu 18.04+)
- [ ] Ensure you have 2GB free disk space
- [ ] Have your LaVerdi API key ready (from welcome email)
- [ ] Choose your preferred messaging channel (Telegram recommended)
- [ ] Set aside 30 minutes for initial setup

## 🎯 Week 1: Foundation (Days 1-3)

### Day 1: Installation & Connection (30 minutes)

- [ ] **Download Companion App**
  - Go to: https://github.com/openclaw/openclaw/releases
  - Download for your OS (macOS/Windows/Linux)
  - Install like any application

- [ ] **Login to Dashboard**
  - Go to: https://laverdi.tech/dashboard
  - Log in with your LaVerdi account
  - Verify your API key is displayed
  - Note your instance IP address

- [ ] **Connect First Messaging Channel**
  - [ ] Option A: Telegram (recommended)
    - Create bot via @BotFather
    - Copy API token
    - Paste into OpenClaw settings
    - Send first message and approve pairing code
  - [ ] Option B: WhatsApp
    - Scan QR code from dashboard
    - Approve connection on your phone
  - [ ] Option C: Discord
    - Create bot in Developer Portal
    - Copy token and add to config
    - Invite to your server

- [ ] **Verify Connection**
  - Send "Hello" to your bot
  - Confirm it responds
  - Test basic commands

### Day 2: Brain Setup (30 minutes)

- [ ] **Create Identity Message**
  - Send to your bot: Full brain dump about yourself
  - Include: name, role, current projects, goals, preferences, boundaries
  - Example: "I'm Chris, a startup founder building [X]. I work 9-6 EST..."
  - Let assistant acknowledge and confirm understanding

- [ ] **Create SOUL.md File**
  - Open OpenClaw workspace
  - Create file: `SOUL.md`
  - Add sections:
    - Identity (who you are, what you do)
    - Boundaries (rules the assistant must follow)
    - Personality (how to communicate)
    - Preferences (your style, hours, priorities)
  - Save and let assistant read it

- [ ] **Test Memory System**
  - Ask your bot a personal question (e.g., "What time do I work?")
  - Verify it remembers your SOUL.md info
  - Confirm boundaries are respected

### Day 3: Automation Setup (30 minutes)

- [ ] **Create HEARTBEAT.md**
  - Create file: `HEARTBEAT.md`
  - Add monitoring tasks:
    - "Check email for urgent messages"
    - "Monitor [specific metric]"
    - "Check [important system]"
  - Set trigger: "Report only if something important"
  - Verify heartbeat runs periodically

- [ ] **Set Up First Cron Job**
  - Message your bot: "Every morning at 8 AM, send me [specific task]"
  - OpenClaw creates the schedule
  - Wait and verify first scheduled message arrives
  - Adjust time if needed

- [ ] **Test Web Search Skill**
  - Ask bot: "What's the latest news about [topic]?"
  - Verify it searches the web and returns results
  - Confirm accuracy of information

## 📚 Week 2: Skills & Integration (Days 4-7)

### Day 4: First Real Automation (30 minutes)

- [ ] **Identify Priority Task**
  - Think of 1 task that wastes 30+ minutes per week
  - Examples: email sorting, report generation, data entry, research
  - Write down the exact steps currently needed

- [ ] **Search for Skill**
  - Visit: https://clawhub.com
  - Search for relevant skill
  - Read documentation and reviews
  - Check compatibility with your tier

- [ ] **Install Skill**
  - In OpenClaw: Settings → Skills → Search
  - Install selected skill
  - Configure with your credentials (if needed)
  - Test in sandbox mode first

- [ ] **Run Automation**
  - Test skill with sample data
  - Verify output is correct
  - Adjust parameters if needed
  - Schedule for regular execution

### Day 5: Second Channel (Optional - 20 minutes)

- [ ] **Connect Additional Messaging Channel**
  - Choose: WhatsApp or Discord (if not already connected)
  - Follow connection steps
  - Send test message to verify both channels work
  - Test that both receive the same updates

### Day 6: Integration Project (30 minutes)

- [ ] **Connect External Service**
  - Choose one: Gmail, Slack, GitHub, Stripe, Airtable, etc.
  - Go to skill/integration in OpenClaw
  - Authenticate with your account
  - Test basic operation
  - Verify data flows correctly

### Day 7: Review & Plan (30 minutes)

- [ ] **Review This Week**
  - What worked well?
  - What was confusing?
  - What saved the most time?

- [ ] **Identify Next Automations**
  - List top 5 tasks you'd like to automate
  - Rank by time saved vs. complexity
  - Plan which to tackle next

- [ ] **Update Documentation**
  - Add notes to SOUL.md
  - Document your workflows
  - Create personal runbook

## 🔧 Essential Configurations

### API Key Management

- [ ] **Secure Your API Key**
  - Never share your API key
  - Never commit it to GitHub
  - Treat it like a password
  - Use different keys for dev vs. production (optional)

- [ ] **Generate Additional Keys** (Optional)
  - Go to: https://laverdi.tech/dashboard
  - Click: Generate New Key
  - Label it: "Development" or "Production"
  - Use different keys for different projects

- [ ] **Revoke Old Keys**
  - Remove unused or leaked keys
  - Check: Settings → API Keys
  - Click revoke next to old keys

### Instance Management

- [ ] **Verify Instance Status**
  - Go to: https://laverdi.tech/dashboard
  - Check: Instance Status (should be "Running" ✅)
  - Note: IP address (for remote connections)
  - Note: Port (default 8700, 8701)

- [ ] **Configure Instance**
  - Instance name: Give it a meaningful name
  - Tier: View your current plan
  - Auto-restart: Enable (recommended)
  - Backup: Enable if available

- [ ] **Monitor Performance**
  - Check CPU/Memory usage in dashboard
  - Monitor API usage vs. limits
  - Set up alerts for high usage

### Workspace Organization

- [ ] **Create Folder Structure**
  - `automations/` — Store automation scripts
  - `memories/` — Daily notes and learnings
  - `projects/` — Project-specific files
  - `skills/` — Custom skill implementations
  - `configs/` — Configuration files

- [ ] **Setup Version Control** (Optional)
  - Initialize git in workspace: `git init`
  - Create `.gitignore` for secrets
  - Commit SOUL.md and important files
  - Push to private GitHub repo

## 📧 Email Management

### Incoming LaVerdi Emails

- [ ] **Review Welcome Email**
  - Check: Your API key (copy to safe location)
  - Check: Dashboard link
  - Check: Support contact
  - Download: Quick Start Guide PDF

- [ ] **Setup Email Filters** (Optional)
  - Create filter: From: noreply@laverdi.tech → Label "LaVerdi/System"
  - Create filter: From: support@laverdi.tech → Label "LaVerdi/Support"
  - Create filter: From: billing@laverdi.tech → Label "LaVerdi/Billing"
  - Create filter: From: notifications@laverdi.tech → Label "LaVerdi/Alerts"

- [ ] **Verify Contact Emails**
  - Confirm you received welcome email from: noreply@laverdi.tech
  - Add to contacts: support@laverdi.tech
  - Add to contacts: billing@laverdi.tech
  - Add to contacts: notifications@laverdi.tech

### Outgoing Configuration

- [ ] **Configure Email Sending** (If needed)
  - In OpenClaw settings: Email → Configure
  - Test sending email to yourself
  - Verify it arrives and isn't marked as spam
  - Add senders to trusted list

## 🚀 Advanced Setup (Optional - Week 2+)

### Custom Skills

- [ ] **Explore Skill Creation**
  - Visit: https://docs.openclaw.ai/skills
  - Review skill examples
  - Identify custom skill needs
  - Plan first custom skill

### API Integration

- [ ] **Setup API Client**
  - Install OpenClaw SDK (if available)
  - Authenticate with API key
  - Test basic API call
  - Build integration script

### Backup & Recovery

- [ ] **Backup Workspace**
  - Backup SOUL.md and important files
  - Version control with git
  - Optional: Cloud backup (Dropbox, Google Drive)

- [ ] **Create Recovery Plan**
  - Document instance IP address
  - Save API keys securely (password manager)
  - Store recovery codes (if MFA enabled)

## 🎓 Learning Resources

- [ ] **Read Documentation**
  - OpenClaw docs: https://docs.openclaw.ai
  - LaVerdi docs: https://laverdi.tech/docs
  - Quick Start Guide (PDF): See welcome email

- [ ] **Join Community**
  - Discord: https://discord.gg/clawd
  - Check pinned messages and FAQs
  - Introduce yourself
  - Join relevant channels

- [ ] **Watch Videos** (When available)
  - Visit: https://laverdi.tech/learn
  - Watch: Setup tutorial
  - Watch: First automation walkthrough
  - Watch: Advanced workflows (later)

## 🆘 Support Checklist

### Before Asking for Help

- [ ] Check FAQ: https://laverdi.tech/faq
- [ ] Search documentation: https://docs.openclaw.ai
- [ ] Search community Discord for similar issues
- [ ] Review error logs in OpenClaw

### Getting Help

- [ ] **Community:** Discord → #help channel
- [ ] **Email:** support@laverdi.tech
- [ ] **Status:** Check https://status.laverdi.tech for outages
- [ ] **Phone:** Available for paid tier users

### Information to Include When Asking for Help

- [ ] Your plan tier (Free/Starter/Professional)
- [ ] Error message (exact text)
- [ ] Steps you took to trigger the issue
- [ ] What you expected to happen
- [ ] Your OpenClaw version (Settings → About)
- [ ] Your OS and version

## 📊 Progress Tracking

### Week 1 Goals
- [ ] Installation complete
- [ ] Connected messaging channel
- [ ] SOUL.md created
- [ ] First heartbeat running
- [ ] First cron job scheduled

**Target completion:** Sunday evening
**Estimated time:** 1.5 hours total

### Week 2 Goals
- [ ] 1+ automation running
- [ ] Skill installed and tested
- [ ] 1+ external service integrated
- [ ] Custom workflow documented

**Target completion:** Next Sunday
**Estimated time:** 2 hours total

### Month 1 Goals
- [ ] 3+ automations running
- [ ] 5+ skills explored
- [ ] Routine tasks 80% automated
- [ ] Time savings documented

**Target completion:** End of month
**Estimated time:** 5-10 hours investment for 5+ hours/week savings

## 🎯 Success Metrics

Track these to see your progress:

- [ ] **Time saved per week:** (hours)
- [ ] **Tasks automated:** (count)
- [ ] **Skills installed:** (count)
- [ ] **Integrations connected:** (count)
- [ ] **Errors/issues:** (count — should decrease)
- [ ] **Confidence level:** (1-10 — should increase)

## 📝 Quick Reference

**Important Links:**
- Dashboard: https://laverdi.tech/dashboard
- Community: https://discord.gg/clawd
- Docs: https://docs.openclaw.ai
- Skills: https://clawhub.com
- Support: support@laverdi.tech

**Key Files to Create:**
- `SOUL.md` — Your personality and boundaries
- `HEARTBEAT.md` — Background monitoring tasks
- `README.md` — Project documentation
- `.gitignore` — Exclude secrets from git

**Messaging Channels:**
- **noreply@laverdi.tech** — System notifications
- **support@laverdi.tech** — Ask questions here
- **billing@laverdi.tech** — Payment/invoice questions
- **notifications@laverdi.tech** — Alerts and updates

## ✅ Onboarding Complete!

Once you've completed this checklist, you're ready to:
- ✅ Use your OpenClaw assistant daily
- ✅ Build custom automations
- ✅ Integrate with external services
- ✅ Explore advanced features
- ✅ Help others get started

**Congratulations! You're now part of the LaVerdi community. Welcome aboard! 🚀**

---

## 📞 Still Have Questions?

- **Chat:** Discord #help channel
- **Email:** support@laverdi.tech
- **Docs:** https://docs.openclaw.ai
- **Community:** https://discord.gg/clawd

We're here to help you succeed!
