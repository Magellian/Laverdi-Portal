# LaVerdi OpenClaw Quick Start Guide

## Welcome to Your Personal AI Assistant 🚀

Congratulations on joining LaVerdi! You now have a dedicated AI assistant running on your own VPS—a powerful tool that learns your workflow, respects your boundaries, and becomes smarter with every interaction.

This guide will help you get started in minutes.

---

## 🌟 What You Can Build

Your OpenClaw assistant is infinitely customizable. Here are some inspiration to get you started:

### Real-World Projects Our Community is Building:

**Trading & Finance:**
- **Automated Trading Bridge** - Monitor markets 24/7, execute trades, manage portfolios, and get daily summaries. Your bot watches crypto/stocks while you sleep and alerts you to opportunities.
- **Financial News Aggregator** - Daily briefing of market news, earnings reports, and economic data relevant to your portfolio
- **Portfolio Rebalancer** - Automatic alerts when your portfolio drifts from target allocation

**Business & Productivity:**
- **Email Intelligence** - Summarize your inbox, flag urgent messages, draft responses, schedule follow-ups
- **Meeting Assistant** - Join your video calls, take notes, generate action items, schedule follow-ups with attendees
- **Lead Nurturing** - Track prospects, send personalized outreach sequences, score leads by engagement

**Content & Creation:**
- **Social Media Manager** - Schedule posts across platforms, analyze engagement, suggest trending topics
- **Blog Research Assistant** - Gather research, outline articles, fact-check claims, suggest improvements
- **YouTube Script Generator** - Brainstorm ideas, write scripts, plan thumbnails, schedule uploads

**Data & Analysis:**
- **Web Scraper** - Monitor competitor websites, track pricing, watch for new job postings, aggregate industry data
- **Database Manager** - Query databases, generate reports, spot trends, alert on anomalies
- **Custom Integrations** - Connect your CRM, accounting software, or proprietary tools for automated workflows

**Personal AI Companion:**
- **Lifestyle Coach** - Track habits, suggest workouts, meal plans, career decisions with personalized advice
- **Learning Assistant** - Build study plans, quiz you on topics, suggest resources, track progress
- **Travel Planner** - Find flights, book hotels, create itineraries, manage reservations in one place

**The possibilities are endless.** Your assistant can:
- Execute complex workflows autonomously
- Monitor systems 24/7 and alert you to changes
- Integrate with any API (Stripe, Slack, GitHub, Airtable, etc.)
- Learn your preferences and adapt over time
- Work across messaging apps (Telegram, WhatsApp, Discord)

---

## 📱 Get Connected - Choose Your Interface

Your OpenClaw assistant can communicate through multiple channels. Pick your favorite—or use them all!

### Option 1: Telegram (Easiest & Most Popular) ⭐

**Why Telegram?** Instant notifications, mobile-friendly, most OpenClaw users start here.

**Steps:**
1. Open Telegram (or download at https://telegram.org)
2. Search for the official **@BotFather** account
3. Send the command: `/newbot`
4. Give your bot a name (e.g., "My OpenClaw Assistant")
5. Give it a username (e.g., "my_openclaw_bot" - must end with "bot")
6. BotFather will give you an **API Token** (a long string of characters)
7. Copy this token and paste it into your OpenClaw dashboard
8. Send your first message to your new bot
9. OpenClaw will respond with a **pairing code** in your terminal
10. Approve the connection, and you're live! 🎉

**Done in 2 minutes. Start automating immediately.**

### Option 2: WhatsApp (Mobile-Native)

**Why WhatsApp?** Uses your existing phone number, encrypted, works offline.

**Steps:**
1. Open your OpenClaw dashboard
2. Go to **Settings → Messaging Channels → WhatsApp**
3. OpenClaw will generate a **QR code** (displayed in your terminal)
4. On your iPhone/Android, open WhatsApp
5. Go to **Settings → Linked Devices**
6. Tap **Link a Device**
7. Scan the QR code with your phone camera
8. Approve the connection
9. You're connected! 🎉

**Messages now flow between WhatsApp and your assistant.**

### Option 3: Discord (Perfect for Teams)

**Why Discord?** Great for group collaboration, community, real-time channels.

**Steps:**
1. Go to **Discord Developer Portal**: https://discord.com/developers/applications
2. Click **New Application**
3. Name it "OpenClaw Assistant"
4. Go to **Bot** tab → **Add Bot**
5. Under **TOKEN**, click **Copy**
6. Paste this token into your OpenClaw config
7. Go to **Gateway Intents**, enable:
   - Message Content Intent
   - Server Members Intent
8. Invite the bot to your Discord server:
   - Go to **OAuth2 → URL Generator**
   - Select scopes: `bot`
   - Select permissions: `Send Messages`, `Read Messages/View Channels`
   - Copy the generated URL and open it in browser
9. Select your server and click **Authorize**
10. You're live in Discord! 🎉

**Your bot now responds to messages in your server.**

---

## 💻 Desktop App: OpenClaw Companion

The companion app is where you build, configure, and manage your assistant locally.

### Download & Install

**macOS, Windows, Linux:**
- Visit: https://github.com/openclaw/openclaw/releases
- Download the latest version for your OS
- Install like any other application

**Or via package manager:**
```bash
# macOS (Homebrew)
brew install openclaw

# Windows (Winget)
winget install openclaw

# Linux
# Check your distro's package manager
```

### First Launch

1. **Create a workspace** - This is where your assistant stores files, memories, and configurations
2. **Connect to Supabase** - Link your user account (one-click OAuth)
3. **Configure messaging channels** - Connect Telegram, WhatsApp, or Discord
4. **Customize SOUL.md** - Tell your assistant who you are and what boundaries to follow
5. **Start chatting** - Begin building automations

### What the App Enables

✅ **Local control** - Everything runs on your machine (plus your VPS)
✅ **File management** - Create and manage files, scripts, automations
✅ **Skill marketplace** - Browse and install thousands of community skills
✅ **Memory system** - Your assistant learns and remembers your preferences
✅ **Real-time monitoring** - Watch logs, monitor performance, adjust settings
✅ **Advanced automations** - Build complex workflows with visual builder (coming soon)

---

## 🌐 Browser App: Web Dashboard

Don't want to install anything? Use the web version.

### Access Your Dashboard

1. Go to: https://laverdi.tech/dashboard
2. Log in with your LaVerdi account
3. View your API usage, manage keys, check instances

### What You Can Do

✅ **View API calls** - See real-time usage and limits
✅ **Manage API keys** - Generate new keys, revoke old ones
✅ **Monitor instances** - Check your OpenClaw instance status
✅ **Manage subscription** - Upgrade, downgrade, or cancel anytime
✅ **Billing** - View invoices and payment history

---

## 🧠 Set Up Your Assistant's Brain

Before asking your assistant to do real work, invest 15 minutes in setup.

### Step 1: Establish Identity & Boundaries

Your first interaction should be a **"brain dump."** Open your assistant and tell it:

- Who you are (your name, role, background)
- What you're working on (current projects, goals)
- Your preferences (communication style, work hours, priorities)
- Your boundaries (e.g., "Never send emails without asking", "Don't make financial decisions over $1000 without approval")

**Example message to your bot:**

> "Hi! I'm Chris, a startup founder. I'm building a trading platform and need help with market analysis, investor outreach, and daily operations. I prefer direct, concise updates. Please ask before sending any external messages. I'm available 9 AM - 6 PM EST, Monday-Friday."

Your assistant will remember this for every future interaction.

### Step 2: Create a SOUL.md File

In your OpenClaw workspace, create a file called `SOUL.md` with:

```markdown
# My Assistant's Personality & Boundaries

## Identity
- I'm an AI assistant for [Your Name]
- I help with [specific tasks]
- I work during [your hours]

## Boundaries
- Never send emails without asking
- Never make decisions over $[amount] without approval
- Always double-check financial calculations
- Ask before accessing external APIs

## Personality
- Be concise and direct
- Use emoji for clarity
- Flag risks and uncertainties
- Ask clarifying questions
```

Save this file in your OpenClaw workspace folder. Your assistant will read it and follow these rules automatically.

### Step 3: Set Up a Heartbeat (Silent Monitoring)

A **Heartbeat** is a background task that runs periodically (default: every 30 minutes).

In your `HEARTBEAT.md` file, add tasks like:

```markdown
# Heartbeat Tasks

## Check These Periodically
- [ ] Check email for urgent messages from VIP clients
- [ ] Monitor crypto prices (alert if BTC drops 5%)
- [ ] Check GitHub for new issues on my repo
- [ ] Weather for tomorrow (relevant to my location)

## Report Only If
- Something urgent happened
- A threshold was crossed
- Otherwise, stay silent
```

Your assistant will check these automatically and only bother you if something important happens. Most of the time, it silently returns to sleep.

### Step 4: Schedule Automations with Cron

For recurring tasks at specific times, use **Cron jobs**.

**You don't need to code.** Just message your bot:

> "Every morning at 8 AM, send me a brief of the latest tech news"
> "Every Monday at 9 AM, summarize my week and suggest focus areas"
> "Every Friday at 5 PM, remind me to plan next week"

OpenClaw will automatically create scheduled automations. You'll receive messages at exactly the right time.

### Step 5: Add Skills (Start Slow)

Resist the urge to install 50 skills immediately. Instead:

1. **Use your assistant for a week** - Get familiar with core features
2. **Identify gaps** - What would save you the most time?
3. **Add skills strategically** - Start with web search (Brave, Perplexity, or Tavily)
4. **Test thoroughly** - Run skills locally before going production
5. **Expand slowly** - Add more skills as needed

Visit **https://clawhub.com** to browse thousands of community-built skills.

---

## 📬 Your Welcome Email (What to Expect)

When you sign up for LaVerdi, you'll receive a branded welcome email from **noreply@laverdi.tech** containing:

✅ **Your API Key** - Keep this secret! Use it to make API calls
✅ **Dashboard Link** - https://laverdi.tech/dashboard to manage your account
✅ **Quick Start Guide** - This document (plus downloadable PDF)
✅ **Support Contact** - support@laverdi.tech for any questions
✅ **Getting Started Checklist** - Your roadmap for week 1

**Check your email right now** - it should already be there! 📧

---

## 🚀 Your First Week

### Day 1: Setup (30 minutes)
- [ ] Install companion app (or open browser dashboard)
- [ ] Connect messaging channel (Telegram recommended)
- [ ] Send identity/preferences message to your bot
- [ ] Create SOUL.md with boundaries

### Day 2-3: Learn (1 hour)
- [ ] Chat with your assistant naturally
- [ ] Ask it to help with real tasks
- [ ] Notice what it's good at
- [ ] Identify automation opportunities

### Day 4-5: Customize (1 hour)
- [ ] Create HEARTBEAT.md with monitoring tasks
- [ ] Set up 1-2 Cron jobs for recurring work
- [ ] Fine-tune SOUL.md based on learnings

### Day 6-7: Integrate (30 minutes)
- [ ] Install first skill (web search recommended)
- [ ] Test a real automation
- [ ] Plan next automations
- [ ] Share your setup with friends

---

## 📚 What's Possible

Here's what real users are building right now:

**Week 1:** Automation of routine messages and daily briefings
**Week 2:** Integration with APIs (Stripe, GitHub, Airtable, etc.)
**Week 3:** Complex workflows that used to take hours
**Week 4:** Revenue-generating automations (like the trading bridge example)

**The trajectory is clear:** You go from "helpful assistant" to "autonomous system that multiplies your productivity."

---

## 🆘 Quick Troubleshooting

**"My bot isn't responding"**
- Check that your API token is correct
- Verify your instance is running (check dashboard)
- Restart your app and try again

**"Messages aren't going to Telegram/Discord"**
- Make sure bot has permission to send messages
- Check your HEARTBEAT.md and SOUL.md files are valid
- View logs in the companion app for error messages

**"I'm hitting API limits"**
- Upgrade your plan (more API calls per month)
- Optimize your automations to use fewer calls
- Contact support@laverdi.tech for guidance

**"I want to integrate with [service]"**
- Check clawhub.com for existing skills
- Visit https://docs.openclaw.ai for API docs
- Contact support@laverdi.tech for custom integrations

---

## 🎯 Next Steps

1. **Download the companion app** - https://github.com/openclaw/openclaw/releases
2. **Connect your messaging channel** - Telegram recommended for beginners
3. **Send your intro message** - Tell your bot who you are
4. **Set up SOUL.md** - Define boundaries and personality
5. **Start automating** - Pick one task and automate it

---

## 📧 LaVerdi Communication Channels

Your OpenClaw assistant is powered by LaVerdi. Here's how we stay in touch:

### Welcome & Setup
**From:** noreply@laverdi.tech
**When:** Right after you sign up
**Contains:** Your API key, getting started guide, dashboard link

### Instance & Deployment Notifications
**From:** noreply@laverdi.tech
**When:** When your OpenClaw instance is deployed and ready
**Contains:** IP address, connection instructions, setup next steps

### Payment & Billing
**From:** billing@laverdi.tech
**When:** After you upgrade your plan or make a payment
**Contains:** Invoice link, payment confirmation, billing details

### Support & Questions
**Email:** support@laverdi.tech
**Available:** For any setup issues, configuration help, or questions
**Response time:** Usually within 24 hours

### Account & System Alerts
**From:** notifications@laverdi.tech
**When:** Trial ending soon, API limits approaching, system updates
**Contains:** Action items, upgrade prompts, important notices

---

## 📞 Support & Community

- **Documentation:** https://docs.openclaw.ai
- **Community Discord:** https://discord.gg/clawd
- **Skill Marketplace:** https://clawhub.com
- **Support Email:** support@laverdi.tech
- **Billing Questions:** billing@laverdi.tech
- **General Inquiries:** noreply@laverdi.tech

---

## 💡 Remember

Your OpenClaw assistant isn't just a chatbot—it's a system that adapts to you, learns your preferences, and compounds your productivity over time.

**The first week is about setup.
The second week is about efficiency.
The third week onwards, you start building things you couldn't before.**

Start small. Think big. Build incrementally. 

Your personal AI revolution starts now. 🚀

---

**LaVerdi OpenClaw**
*Your AI Assistant. Your Rules. Your VPS.*

https://laverdi.tech
