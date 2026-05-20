# Discord Bot Setup Guide for LaVerdi

Complete guide to set up Discord integration with LaVerdi portal.

---

## Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter name: `LaVerdi` (or your preference)
4. Accept the terms and click "Create"
5. You're now in the application settings

---

## Step 2: Create Bot User

1. In the left sidebar, click "Bot"
2. Click "Add Bot"
3. Under "TOKEN", click "Copy" to copy your bot token
4. **Save this token** — you'll need it for pairing

**Important:** Keep this token secret! It's like a password for your bot.

---

## Step 3: Configure Bot Permissions

1. In the left sidebar, click "OAuth2" → "URL Generator"
2. Under "SCOPES", select:
   - `bot`
3. Under "PERMISSIONS", select:
   - `Send Messages`
   - `Read Messages/View Channels`
   - `Read Message History`
4. Copy the generated URL at the bottom
5. Open that URL in your browser to invite the bot to your server

---

## Step 4: Test the Bot

1. Go to your Discord server
2. Find the `LaVerdi` bot in the member list (should have a bot badge)
3. Send it a message in any channel where it can see messages

---

## Step 5: Pair with LaVerdi Portal

1. Log into [LaVerdi Portal](https://laverdi.tech)
2. Go to Dashboard → Channels
3. Find the Discord card
4. Paste your bot token into the field
5. Click "Connect"
6. You should see ✅ "Discord Paired"

---

## Step 6: Test Message Routing

1. Send a message to your Discord bot: `hello`
2. Your LaVerdi agent should respond automatically
3. If it works, you're all set! 🎉

---

## Troubleshooting

### Bot doesn't appear in server members
- Make sure the invitation URL included the `bot` scope
- Try the invite link again: [OAuth2 → URL Generator]

### Bot can't send messages
- Check permissions in the channel settings
- Make sure LaVerdi has "Send Messages" permission
- Bot needs to be able to see the channel

### "Invalid token" error
- Copy the ENTIRE token from Developer Portal
- Make sure there are no extra spaces
- Token format should be: `MTk4NjIyNDgzNTgxMjI4ODA.Clwa7A.l7wwh2dEp7pTBf0nwWAYK7I`

### Agent not responding
- Check that your LaVerdi instance is running
- Verify instance is registered in the portal
- Check agent logs for errors

---

## Discord Bot Token Format

Your token should look like:
```
MTk4NjIyNDgzNTgxMjI4ODA.Clwa7A.l7wwh2dEp7pTBf0nwWAYK7I
```

**Never share this token!** Anyone with it can control your bot.

---

## Architecture

```
Discord User
     ↓
Sends message to @LaVerdi bot
     ↓
Discord API
     ↓
POST /api/webhooks/discord?token=...
     ↓
LaVerdi Portal
     ↓
Looks up user & instance
     ↓
Routes to agent
     ↓
Agent responds
     ↓
Portal sends back to Discord
     ↓
User sees response
```

---

## Next: Add More Servers

Once paired, your bot can be in multiple Discord servers. Just use the same invite link to add it to other servers.

---

## Support

If you encounter issues:
1. Check that bot token is correct
2. Verify bot has message permissions
3. Check LaVerdi agent is running
4. Review agent logs for errors

For more help, check the [Multi-Channel Integration Guide](./CHANNELS_AUDIT.md).
