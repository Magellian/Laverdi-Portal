# LaVerdi Portal - Final Deployment Checklist

**Current Status:** 95% complete | Waiting on Fix #2 database table

---

## ✅ COMPLETED (Do Not Repeat)

- [x] SSH key added to server (`id_ed25519` authorized)
- [x] Hostname resolution fixed (`/etc/hosts`)
- [x] Command Center API endpoints deployed
- [x] Telegram token validation working
- [x] API tested and returning 200 OK responses
- [x] Portal deployed at https://laverdi.tech

---

## ⏳ NEXT STEP (5 minutes)

### Step 1: Create Database Table

1. **Log into Supabase:**
   - Go to: https://app.supabase.com
   - Select your project (dcvrkpgvxqdcboostkpz)

2. **Create new SQL query:**
   - Click: SQL Editor → New Query
   - Paste entire contents of: `migrations/008_create_channels_table.sql`
   - Click: RUN

3. **Verify table created:**
   ```sql
   SELECT * FROM channels LIMIT 1;
   -- Should return: (0 rows) — empty table is OK
   ```

**Time:** ~2 minutes

---

## ✅ THEN: Test End-to-End

### Step 2: Create Telegram Bot

1. **Message @BotFather on Telegram**
2. **Type:** `/newbot`
3. **Follow prompts:**
   - "What's the name of your bot?" → e.g., `LaVerdi Test Bot`
   - "Okay, a new bot. How are we going to call it? Give the bot a username. It must end with the word "bot"." → e.g., `laverdi_test_bot`
4. **Copy the token** (format: `123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh`)

**Time:** ~1 minute

### Step 3: Pair Telegram in Portal

1. **Log into portal:** https://laverdi.tech
2. **Navigate to:** Dashboard → Channels
3. **Find Telegram card**
4. **Paste bot token** into the field
5. **Click:** Connect / Save
6. **Verify:** Should see ✓ "Telegram Paired" or similar

**Time:** ~1 minute

### Step 4: Send Test Message

1. **Find your bot on Telegram**
2. **Send:** "Hello" or any message
3. **Check portal logs** for message receipt:
   ```bash
   # On server:
   pm2 logs web --lines 50 | grep -i telegram
   ```
4. **Verify agent responds** in Telegram

**Time:** ~2 minutes

---

## 📋 Quick Reference Commands

**Check Command Center:**
```bash
ssh root@66.42.70.66
curl http://laverdi-command-center:8000/health | jq .
```

**Check Portal:**
```bash
curl https://laverdi.tech/api/status | jq .
```

**View logs:**
```bash
ssh root@66.42.70.66
tail -50 /tmp/cc.log          # Command Center
pm2 logs web --lines 50       # Portal
```

**Restart services:**
```bash
ssh root@66.42.70.66
python3 /root/command-center.py &  # Command Center
pm2 restart web                    # Portal
```

---

## 🎯 Success Criteria

✅ Database table `channels` exists  
✅ Can pair Telegram bot in portal UI  
✅ Bot receives messages  
✅ Portal agent responds in Telegram  

---

## 🆘 Troubleshooting

### "Database table doesn't exist"
- Make sure you ran the SQL in Supabase (check for errors)
- Run again if it failed

### "Telegram bot won't pair"
- Check token format: should be `ID:TOKEN` (with colon)
- Verify bot exists: `@BotFather` → `/mybots` → select bot → check token
- Check portal logs for errors

### "Bot doesn't receive messages"
- Check webhook is set up: `@BotFather` → `/mybots` → select bot → "Edit Commands"
- Verify Command Center is running: `ps aux | grep command-center`
- Check Command Center logs: `tail -100 /tmp/cc.log`

### "Agent doesn't respond"
- Verify user instance is running: `pm2 list`
- Check user's OpenClaw agent is accessible
- Check portal logs for routing errors

---

## 📞 Support

All fixes are in `/workspace`:
- `FIX3_STATUS.md` — Detailed status
- `LAVERDI_FIX_DEPLOYMENT.md` — Full deployment guide
- `QUICK_FIX_REFERENCE.md` — Quick commands
- `migrations/008_create_channels_table.sql` — Database schema

---

## Timeline

| Step | Action | Time | Status |
|------|--------|------|--------|
| 1 | Create database table | 2 min | ⏳ Ready |
| 2 | Create Telegram bot | 1 min | ⏳ Ready |
| 3 | Pair in portal | 1 min | ⏳ Ready |
| 4 | Test message | 2 min | ⏳ Ready |
| **Total** | | **~6 min** | ✅ |

---

**When complete, LaVerdi will be fully operational for Telegram integration! 🚀**
