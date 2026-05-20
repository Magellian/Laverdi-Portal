# Discord + Slack Deployment Guide

**Status:** Ready to deploy  
**Files:** discord_webhook_handler.ts, slack_webhook_handler.ts  
**Time to deploy:** ~10 minutes

---

## Pre-Deployment Checklist

- [ ] discord_webhook_handler.ts ready
- [ ] slack_webhook_handler.ts ready
- [ ] Portal has no build errors
- [ ] Webhook handlers tested locally

---

## Deployment Steps

### Step 1: Copy Files to Server

```bash
# From your local machine
scp discord_webhook_handler.ts root@66.42.70.66:/root/laverdi-portal/pages/api/webhooks/discord.ts
scp slack_webhook_handler.ts root@66.42.70.66:/root/laverdi-portal/pages/api/webhooks/slack.ts
```

### Step 2: Rebuild Portal

```bash
ssh root@66.42.70.66 "cd /root/laverdi-portal && npm run build"
```

**Expected output:**
```
✓ Compiled successfully
✓ Ready in 45s
```

If build fails, check:
- TypeScript syntax errors (use `npm run lint`)
- Missing dependencies (should be auto-installed)
- Environment variables (check .env.local)

### Step 3: Restart Portal

```bash
ssh root@66.42.70.66 "pm2 restart web && sleep 3 && pm2 logs web --lines 10"
```

**Expected output:**
```
[PM2] web process restarted successfully
▲ Next.js 14.2.35
- Local: http://localhost:3000
✓ Ready in 362ms
```

### Step 4: Verify Endpoints Exist

```bash
curl -s https://laverdi.tech/api/webhooks/discord 2>&1 | head -5
curl -s https://laverdi.tech/api/webhooks/slack 2>&1 | head -5
```

**Expected:** Both return "Method not allowed" (405) — which is correct since GET isn't allowed

### Step 5: Update Portal Configuration

The `configure-channels` endpoint already supports Discord and Slack (it's in the Telegram handler code), so they should work immediately.

---

## Testing Discord

### Prerequisites
- Discord bot created and token copied
- Bot invited to a test server

### Test Flow

1. **Pair in portal:**
   ```
   Go to https://laverdi.tech → Dashboard → Channels
   Find Discord card → Paste bot token → Click Connect
   Should show: ✅ "Discord Paired"
   ```

2. **Send test message:**
   ```
   In your Discord server, find the LaVerdi bot
   Send a message: "hello"
   Bot should respond with: (response from agent)
   ```

3. **Check logs:**
   ```bash
   ssh root@66.42.70.66 "tail -20 /root/.pm2/logs/web-out.log | grep Discord"
   ```
   
   Should see:
   ```
   [Discord] Message from @username: hello
   [Discord] Routing to port 9000
   [Discord] Agent responded, sending back
   ```

---

## Testing Slack

### Prerequisites
- Slack app created and token copied (starts with xoxb-)
- Slack bot invited to a test channel

### Test Flow

1. **Set up webhook URL:**
   - Go to Slack API → Your App → Event Subscriptions
   - Set Request URL: `https://laverdi.tech/api/webhooks/slack?token=xoxb-YOUR_TOKEN`
   - Wait for ✅ Verified

2. **Pair in portal:**
   ```
   Go to https://laverdi.tech → Dashboard → Channels
   Find Slack card → Paste bot token → Click Connect
   Should show: ✅ "Slack Paired"
   ```

3. **Send test message:**
   ```
   In your Slack workspace, mention the bot: @LaVerdi hello
   Bot should respond with: (response from agent)
   ```

4. **Check logs:**
   ```bash
   ssh root@66.42.70.66 "tail -20 /root/.pm2/logs/web-out.log | grep Slack"
   ```
   
   Should see:
   ```
   [Slack] Message from @username: hello
   [Slack] Routing to port 9000
   [Slack] Agent responded, sending back
   ```

---

## Troubleshooting

### Webhook Returns 404
- File not deployed correctly (check file path)
- Portal not rebuilt (run `npm run build`)
- Portal not restarted (run `pm2 restart web`)

### Bot token invalid
- Make sure entire token is copied (no spaces)
- Discord token should end with random characters
- Slack token should start with `xoxb-`

### Agent not responding
- Check agent is running: `ssh root@66.42.70.66 "ps aux | grep openclaw"`
- Check instance is registered in DB
- Check agent logs for errors

### Build fails
- Check TypeScript: `npm run lint`
- Check dependencies: `npm install`
- Check .env.local has required variables

---

## Rollback Plan

If something breaks:

```bash
# Restore backup and restart
ssh root@66.42.70.66 "cd /root/laverdi-portal && git checkout pages/api/webhooks && npm run build && pm2 restart web"
```

---

## Success Criteria

✅ Endpoints exist at `/api/webhooks/discord` and `/api/webhooks/slack`  
✅ Discord bot pairs successfully  
✅ Slack bot pairs successfully  
✅ Test message gets routed to agent  
✅ Agent response appears in Discord  
✅ Agent response appears in Slack  
✅ No errors in portal logs  

---

## Files Modified

- `/root/laverdi-portal/pages/api/webhooks/discord.ts` — NEW
- `/root/laverdi-portal/pages/api/webhooks/slack.ts` — NEW
- No changes to existing files needed

---

## Time Estimate

- Deploy: 5 min
- Test Discord: 5 min
- Test Slack: 5 min
- Troubleshoot (if needed): 10-20 min
- **Total: 15-35 min**

---

## Next Steps After Deployment

1. Test both bots with Dad's Claw instance
2. Update portal UI to show Discord/Slack cards properly
3. Hide Slack/WhatsApp/Signal cards until implemented
4. Start WhatsApp implementation (requires Business API approval)

---

**Ready to deploy?** The files are ready to go. Just copy them to the server and rebuild.
