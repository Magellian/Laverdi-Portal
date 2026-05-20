# 🚀 LaVerdi Telegram Fix - Quick Reference

**Status:** SSH currently flaky (timeouts), but site is live at https://laverdi.tech

---

## Three Fixes (In Order)

### ✅ STEP 1: Fix Hostname (2 minutes)

```bash
ssh root@66.42.70.66 "echo '127.0.0.1 laverdi-command-center' >> /etc/hosts"
ssh root@66.42.70.66 "curl http://laverdi-command-center:8000/health"
# Should return: HTTP 200 + JSON
```

---

### ✅ STEP 2: Create Database Table (5 minutes)

1. Open: https://app.supabase.com
2. Select your project
3. Click: SQL Editor
4. Click: New Query
5. Paste contents of: `migrations/008_create_channels_table.sql`
6. Click: RUN
7. Done!

---

### ✅ STEP 3: Add API Endpoints (1 hour)

```bash
# 1. SSH in
ssh root@66.42.70.66

# 2. Backup
cp /root/command-center.py /root/command-center.py.backup

# 3. Edit (paste code from command_center_channel_endpoints.py before the "if __name__" line)
nano /root/command-center.py
# [Ctrl+Shift+V to paste]
# [Ctrl+X, Y, Enter to save]

# 4. Restart
pm2 restart command-center
pm2 logs command-center

# 5. Test
curl -X POST http://laverdi-command-center:8000/api/configure-channels \
  -H "Authorization: Bearer laverdi-admin-api-2026" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","channels":{"telegram":{"botToken":"123:ABC"}}}'
# Should return: {"success": true, "channels": {...}}
```

---

## Full Deployment Script (Copy-Paste)

If SSH is stable, run this one-liner:

```bash
# Fix #1: Hostname
ssh root@66.42.70.66 "echo '127.0.0.1 laverdi-command-center' >> /etc/hosts && curl http://laverdi-command-center:8000/health"

# Fix #2: Database (manual in Supabase console — can't automate via SSH)

# Fix #3: API Endpoints (requires manual edit of command-center.py)
```

---

## Verify Each Fix

### Test Hostname
```bash
curl http://laverdi-command-center:8000/health
# Expected: 200 OK with health JSON
```

### Test Database
```
Supabase Console → SQL Editor:
SELECT COUNT(*) FROM channels;
# Expected: (1 row) [ count: 0 ]
```

### Test API
```bash
curl -X GET "http://laverdi-command-center:8000/api/get-channels?userId=test" \
  -H "Authorization: Bearer laverdi-admin-api-2026"
# Expected: 200 OK with {"channels": {}}
```

---

## When Telegram Works (End-to-End Test)

1. Create bot via @BotFather (get token like `123456:ABC...`)
2. Log into https://laverdi.tech
3. Dashboard → Channels → Telegram → Paste token → Save
4. Open Telegram, find your bot, send "Hello"
5. Should see response from your agent

---

## Files in Workspace

- `fix_hostname.sh` — Hostname setup script
- `migrations/008_create_channels_table.sql` — Database schema
- `command_center_channel_endpoints.py` — API endpoint code
- `LAVERDI_FIX_DEPLOYMENT.md` — Full deployment guide (you are here)

---

## Current Issues

| Issue | Status | Impact |
|-------|--------|--------|
| SSH timeout | 🟡 Flaky | Can work with retries; affects automation |
| Portal HTTP | 🟢 Healthy | https://laverdi.tech working fine |
| Hostname | ❌ Broken | Portal can't reach Command Center |
| Database | ❌ Missing | No place to store credentials |
| API endpoints | ❌ Missing | Can't save/retrieve channel config |
| Telegram integration | ❌ Broken | Blocked by above three issues |

---

## After All Three Fixes

| Component | Status |
|-----------|--------|
| Users can sign up | ✅ Works |
| Users can create instances | ✅ Works |
| Users can pair Telegram | ✅ Will work |
| Messages route to agent | ✅ Will work |
| Agent responds in Telegram | ✅ Will work |

---

## Emergency Rollback

If something breaks after Fix #3:

```bash
ssh root@66.42.70.66
cp /root/command-center.py.backup /root/command-center.py
pm2 restart command-center
```

The fix is atomic — if you mess up, just restore and try again.

---

**Time to Deploy:** 2-3 hours (depending on SSH stability)  
**Complexity:** Medium (mostly copy-paste + one manual edit)  
**Risk Level:** Low (easy rollback)  

Ready to go? 🚀
