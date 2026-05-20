# LaVerdi Telegram Integration - Complete Fix Deployment

**Status:** Ready to deploy (SSH required)  
**Time to Complete:** ~2.5 hours  
**Files:** 4 local, 2 server-side  

---

## Overview

Three critical issues block Telegram integration:

| Issue | Fix | Time | Files |
|-------|-----|------|-------|
| Hostname doesn't resolve | Add `/etc/hosts` entry | 2 min | `fix_hostname.sh` |
| No database table | Run SQL migration | 30 min | `008_create_channels_table.sql` |
| No API endpoints | Add Python code to Command Center | 2 hours | `command_center_channel_endpoints.py` |

---

## Fix #1: Hostname Resolution (2 minutes)

**Problem:** Portal tries `http://laverdi-command-center:8000` but hostname isn't resolvable.

### Deploy

```bash
# SSH to server
ssh root@66.42.70.66

# Add hostname entry
bash /root/fix_hostname.sh
```

### Verify

```bash
# Should return 200 OK with health status
curl http://laverdi-command-center:8000/health | jq .
```

---

## Fix #2: Database Table (30 minutes)

**Problem:** No place to store Telegram/Discord/Slack credentials.

### Deploy

1. Log into Supabase: https://app.supabase.com
2. Go to your project → SQL Editor
3. Create new query
4. Copy entire contents of `008_create_channels_table.sql`
5. Click "RUN"

### Verify

```sql
-- In Supabase SQL Editor, run:
SELECT * FROM channels LIMIT 1;
-- Should return: (0 rows) — empty table is OK
```

---

## Fix #3: API Endpoints (2 hours)

**Problem:** Command Center doesn't have `/api/configure-channels` or `/api/get-channels` endpoints.

### Deploy

```bash
# SSH to server
ssh root@66.42.70.66

# Backup original
cp /root/command-center.py /root/command-center.py.backup.$(date +%s)

# Edit command-center.py
nano /root/command-center.py
```

**Location to insert code:** Find this line:
```python
if __name__ == '__main__':
```

**Insert before that line:** All code from `command_center_channel_endpoints.py`

**Save & exit:** Ctrl+X, Y, Enter

### Restart Service

```bash
pm2 restart command-center
pm2 logs command-center --lines 20
```

### Verify

```bash
# Test /api/configure-channels endpoint
curl -X POST http://laverdi-command-center:8000/api/configure-channels \
  -H "Authorization: Bearer laverdi-admin-api-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "channels": {
      "telegram": {
        "botToken": "INVALID_TOKEN",
        "enabled": true
      }
    }
  }'

# Should return:
# {
#   "success": true,
#   "channels": {
#     "telegram": {
#       "success": false,
#       "error": "Invalid token format..."
#     }
#   }
# }
```

---

## End-to-End Testing

Once all three fixes are deployed:

### 1. Create Test Telegram Bot

- Open Telegram
- Message `@BotFather`
- Send: `/newbot`
- Follow prompts
- Copy bot token (format: `123456789:AABbCc...`)

### 2. Test Portal UI

```
1. Log into https://laverdi.tech with test account
2. Go to Dashboard → Channels
3. Find Telegram card
4. Paste bot token into field
5. Click "Connect"
6. Should see: "✓ Telegram Paired"
```

### 3. Verify Database

```sql
-- In Supabase SQL Editor
SELECT channel_name, enabled, connected FROM channels 
WHERE channel_name = 'telegram' LIMIT 1;

-- Should show:
-- | channel_name | enabled | connected |
-- | telegram     | true    | true      |
```

### 4. Send Test Message

```
1. Open Telegram
2. Find your test bot
3. Send: "Hello"
4. Check Command Center logs: pm2 logs command-center
5. Should see: "[Telegram] Message received from user..."
6. Agent should respond
```

---

## Troubleshooting

### Hostname Resolution Fails

```bash
# Check if entry was added
grep laverdi /etc/hosts
# Should output: 127.0.0.1 laverdi-command-center

# Test DNS
nslookup laverdi-command-center localhost

# If still failing, try localhost directly
curl http://127.0.0.1:8000/health
```

### Database Migration Fails in Supabase

**Error:** "Invalid SQL"

**Fix:**
- Check for unclosed quotes or semicolons
- Copy from raw file, not this document
- Make sure you're in the correct project
- Check Supabase docs for your Postgres version

### Command Center Won't Start

```bash
# Check logs
pm2 logs command-center

# Common issues:
# - Python syntax error in inserted code
# - Missing imports (requests, json)
# - Wrong indentation
# - Duplicate function names

# If stuck, restore backup
cp /root/command-center.py.backup.* /root/command-center.py
pm2 restart command-center
```

### Telegram Token Returns "Invalid"

- Make sure token is copied in full (includes colon)
- Token format: `ID:TOKEN`
- Test token with `curl`:
  ```bash
  curl https://api.telegram.org/botYOUR_TOKEN/getMe
  # Should return JSON with bot info
  ```

---

## Files Used

| File | Location | Action |
|------|----------|--------|
| `fix_hostname.sh` | Local workspace | Deploy to `/root/` via SCP |
| `008_create_channels_table.sql` | Local workspace | Copy/paste into Supabase SQL Editor |
| `command_center_channel_endpoints.py` | Local workspace | Copy/paste into `/root/command-center.py` |

### Copy Files to Server

```bash
# From your local machine
scp fix_hostname.sh root@66.42.70.66:/root/
scp 008_create_channels_table.sql root@66.42.70.66:/root/
scp command_center_channel_endpoints.py root@66.42.70.66:/root/
```

---

## Rollback Plan

If something breaks:

```bash
ssh root@66.42.70.66

# 1. Restore Command Center
cp /root/command-center.py.backup.TIMESTAMP /root/command-center.py
pm2 restart command-center

# 2. Check hostname (can't easily roll back /etc/hosts)
# Just remove or comment the line manually

# 3. Drop problematic table (if needed)
# In Supabase SQL Editor:
# DROP TABLE channels;
```

---

## Success Criteria

✅ Fix #1: `curl http://laverdi-command-center:8000/health` returns 200  
✅ Fix #2: `SELECT COUNT(*) FROM channels;` returns success (even if 0 rows)  
✅ Fix #3: `curl -X POST http://laverdi-command-center:8000/api/configure-channels...` returns JSON  
✅ End-to-end: Telegram bot receives and responds to test messages  

---

## Timeline

- **T+0:** Deploy Fix #1 (2 min)
- **T+2:** Deploy Fix #2 (30 min)
- **T+32:** Deploy Fix #3 (2 hours including restart, testing)
- **T+152:** All fixes deployed ✓

**Total: ~2.5 hours**

---

## Support

If you get stuck:

1. **Check logs:**
   ```bash
   pm2 logs command-center --lines 50
   journalctl -u laverdi-portal.service -n 50
   ```

2. **Test connectivity:**
   ```bash
   curl http://laverdi-command-center:8000/health
   curl -I https://laverdi.tech
   ```

3. **Verify database:**
   ```sql
   -- In Supabase SQL Editor
   \dt  -- List all tables (should see "channels")
   ```

4. **Check process status:**
   ```bash
   pm2 status
   pm2 logs command-center
   ```

---

## Next: Integration Beyond Telegram

Once Telegram works, you can add:
- **Discord:** Similar validation in endpoint code
- **Slack:** Similar validation in endpoint code
- **Signal:** Similar validation in endpoint code
- **WhatsApp:** More complex (requires Business API)

The database schema and endpoints already support all of these — just need to add validation logic for each platform.

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-19  
**Status:** Ready for deployment
