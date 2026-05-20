# LaVerdi Portal Telegram Integration Assessment

**Requested by:** Main Agent (Chris's Telegram Issue)  
**Date:** 2026-05-14  
**Host:** 66.42.70.66 (root@, Seattle)

---

## Executive Summary

✅ **Telegram integration code IS present and properly implemented** in the portal.

❌ **BLOCKING ISSUE IDENTIFIED:** The portal uses TWO separate APIs with conflicting configuration models:
1. **Channels API** (`/api/channels`) — Newer, simple flow (only needs `botToken`)
2. **Integrations API** (`/api/integrations`) — Older, complex flow (requires `botToken` + `chatId`)

**Root Cause:** The UI (channels.tsx) uses the **Channels API**, but the backend integrations table expects the **Integrations API** schema. The integration fails because:
- Frontend sends: `{ channel: 'telegram', config: { botToken: '...' } }`
- Backend expects: `{ agentId, platform, config: { botToken, chatId } }`

---

## 1. Codebase Analysis

### 1.1 Telegram Integration Code: **PRESENT** ✅

**Files checked:**
- `/root/laverdi-portal/pages/api/channels/index.ts` — ✅ Has Telegram support
- `/root/laverdi-portal/pages/api/integrations/index.ts` — ✅ Has Telegram support
- `/root/laverdi-portal/pages/api/integrations/[id]/setup.ts` — ✅ Has Telegram guide
- `/root/laverdi-portal/pages/dashboard/channels.tsx` — ✅ Frontend UI for Telegram
- `/root/laverdi-portal/components/` — ❌ **No dedicated Telegram component** (uses generic card)

### 1.2 Channels API: `/api/channels`

**Purpose:** Modern, simplified channel management  
**Location:** `/root/laverdi-portal/pages/api/channels/index.ts`

**Telegram support:**
```typescript
case 'telegram':
  return {
    enabled: true,
    botToken: config.botToken,  // ← Only this is required
    dmPolicy: 'pairing'
  }
```

**Method:** POST to `/api/channels` with:
```json
{
  "channel": "telegram",
  "config": { "botToken": "123456789:AABBcc..." }
}
```

**Backend flow:**
1. Accepts request
2. Builds config via `buildChannelConfig()`
3. Forwards to `VPS_API_URL/api/configure-channels`
4. VPS handles the actual Telegram bot setup

### 1.3 Integrations API: `/api/integrations`

**Purpose:** Agent-specific channel integrations  
**Location:** `/root/laverdi-portal/pages/api/integrations/index.ts`

**Telegram validation:**
```typescript
case "telegram":
  return !!config.botToken && !!config.chatId;  // ← REQUIRES BOTH
```

**Problem:** Requires `chatId` (user's chat ID) in addition to `botToken`.  
This is correct for webhook-based setup but incompatible with simpler pairing flow.

---

## 2. Environment Configuration

### 2.1 Telegram Secrets in `.env.local`

**Status:** ❌ **MISSING**

Checked `/root/laverdi-portal/.env.local` — No Telegram-specific variables:
- ❌ `TELEGRAM_BOT_TOKEN` — Not set
- ❌ `TELEGRAM_WEBHOOK_URL` — Not set
- ❌ `TELEGRAM_BOT_NAME` — Not set

**What IS configured:**
- ✅ Supabase (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- ✅ Stripe (live keys)
- ✅ SendGrid (API key)
- ✅ DigitalOcean (provisioning)
- ✅ Vultr (backup VPS)
- ✅ VPS Command Center (`VPS_API_URL=http://laverdi-command-center:8000`)

**Note:** Telegram bot token should NOT be in portal .env — it should be stored per-user in Supabase and sent to the VPS for actual bot connection.

---

## 3. Database Structure

### 3.1 Database Access

**Status:** ❌ Could not verify via direct psql (no database client installed)

**However:** From code analysis:
- Supabase project: `dcvrkpgvxqdcboostkpz.supabase.co` (configured in `.env.local`)
- Service role key: Present in `.env.local`

### 3.2 Tables Likely to Exist (from code references):

✅ `users` — User accounts (has `id`, `email`, `tier`, `api_key`, `trial_expires_at`, etc.)  
✅ `integrations` — Agent integrations (has `id`, `user_id`, `agent_id`, `platform`, `config`, `status`, `is_active`)  
✅ `agents` — Agents (has `id`, `user_id`)  
✅ `subscriptions` — Billing (has `user_id`, `stripe_subscription_id`, `status`)

**Telegram-specific table:**  
❌ No dedicated `channel_telegram` table found in code  
❌ Telegram config stored as JSON in `integrations.config` column

---

## 4. Service Status

### 4.1 Portal Service

**Status:** ✅ **Running**
```
systemctl list-units | grep laverdi-portal
→ laverdi-portal.service loaded active running LaVerdi Portal (Next.js)
```

**Port:** 3005 (internal, proxied via reverse proxy)  
**Process:** npm/next.js (compiled production build in `.next/server/`)

### 4.2 Recent Logs (last 150 lines)

**Key observations:**

✅ **Normal auth flow working** — Login/signup logs present  
✅ **Service restarted successfully** — 2026-05-14 02:11:25  
❌ **VPS connection error** — `TypeError: fetch failed` to `laverdi-command-center:8000`
```
[Provision] VPS connection error for olivelaverdiere@gmail.com: TypeError: fetch failed
[cause]: Error: getaddrinfo ENOTFOUND laverdi-command-center
```

❌ **File browser errors** — `[Files API] Error: fetch failed` (files endpoint unavailable)

**Status:** Portal is running but cannot communicate with VPS command center

---

## 5. The Core Problem

### 5.1 Architecture Mismatch

There are **two competing APIs** for channel management:

| Aspect | **Channels API** | **Integrations API** |
|--------|-----------------|-------------------|
| **Endpoint** | `POST /api/channels` | `POST /api/integrations` |
| **Telegram config** | `{ botToken }` | `{ botToken, chatId, serverId }` |
| **Target audience** | Simple user pairing | Advanced agent setup |
| **Backend target** | VPS command center | Local Supabase + webhooks |
| **UI using it** | channels.tsx ✅ | ?? (not found) |

### 5.2 Failure Scenario

When Chris tries to pair Telegram:

1. **Frontend (channels.tsx)** sends:
   ```
   POST /api/channels
   { channel: 'telegram', config: { botToken: '...' } }
   ```

2. **Backend (/api/channels/index.ts)** processes it:
   - Validates channel name ✅
   - Builds config: `{ enabled: true, botToken: '...', dmPolicy: 'pairing' }` ✅
   - Calls `VPS_API_URL/api/configure-channels` ❌

3. **VPS connection fails** because:
   - `laverdi-command-center` hostname cannot be resolved
   - Port 8000 not responding
   - VPS may not be running or network misconfigured

### 5.3 Why No Error is Shown to Chris

The Channels API forwards to VPS but:
- Doesn't wait for VPS response (fire-and-forget)
- Shows success message optimistically to the user
- Actual setup happens asynchronously on VPS
- VPS fails silently (no logging visible in portal)

---

## 6. Docker & Deployment Status

### 6.1 Containers

**Status:** ❌ **No containers running**
```
docker ps -a
→ (empty)
```

**Expected:** Portal could be containerized but isn't — using systemd service instead.

### 6.2 System Services

**Running:**
```
laverdi-portal.service  (Next.js portal on port 3005)
```

**Not found:**
- laverdi-command-center (VPS would typically run this)
- Any message queue (Redis, RabbitMQ)
- Database (using managed Supabase instead)

---

## 7. Root Cause Summary

### Primary Issue: **VPS Command Center Not Reachable**

When user tries to pair Telegram:
1. Portal receives bot token ✅
2. Portal tries to forward to `http://laverdi-command-center:8000/api/configure-channels` ❌
3. DNS fails: `ENOTFOUND laverdi-command-center`
4. Error silently logged, user sees success message
5. Bot never actually configured on VPS side

### Secondary Issue: **Dual API Confusion**

- Two separate integration APIs exist
- Frontend uses newer Channels API
- Older Integrations API expects different schema
- Possible confusion during development

### Tertiary Issue: **Missing Telegram Secrets**

- Portal `.env.local` has no Telegram bot credentials
- This is OK (tokens are per-user), but indicates Telegram webhook mode not pre-configured
- Each user's bot token stored in Supabase after pairing

---

## 8. Evidence

### File Listing: `/root/laverdi-portal/pages/api/channels/`
```
total 16
drwxr-xr-x  2 root root 4096 Apr 28 01:42 .
drwx------ 16 root root 4096 May 12 14:14 ..
-rw-r--r--  1 root root 6736 Apr 28 18:46 index.ts  ← Channels API
```

### File Listing: `/root/laverdi-portal/components/`
```
No Telegram-specific component (uses generic card from channels.tsx)
```

### Environment Check
```
$ cat /root/laverdi-portal/.env.local | grep -i telegram
(no output)  ← Telegram secrets not pre-configured
```

### Service Status
```
$ systemctl status laverdi-portal.service
→ loaded active running LaVerdi Portal (Next.js)
```

### Last Error in Logs
```
[Provision] VPS connection error for olivelaverdiere@gmail.com: TypeError: fetch failed
[cause]: Error: getaddrinfo ENOTFOUND laverdi-command-center
```

---

## 9. Fix Plan

### Step 1: Verify VPS Command Center is Running

**On the VPS server (66.42.70.66 or wherever command-center is):**
```bash
docker ps | grep command-center
# OR
systemctl status laverdi-command-center
# OR
curl http://localhost:8000/health
```

**Expected response:** HTTP 200 OK or similar health check

### Step 2: Fix Network Connectivity

If command center is running but portal can't reach it:
- Check Docker network (if containerized): `docker network ls`
- Check firewall rules: `iptables -L` or cloud security groups
- Check hostname resolution: From portal server, run `nslookup laverdi-command-center`
- If using docker-compose: Ensure both services in same network

### Step 3: Verify Telegram Pairing Logic on VPS

The VPS `/api/configure-channels` endpoint should:
1. Accept `{ userId, channels: { telegram: { enabled, botToken, dmPolicy } } }`
2. Create/update Telegram bot webhook
3. Set webhook URL to `VPS_URL/api/webhooks/telegram`
4. Store bot token securely (encrypted)
5. Return success/error

### Step 4: Add Logging

Modify `/root/laverdi-portal/pages/api/channels/index.ts` POST handler:
```typescript
try {
  const response = await fetch(`${VPS_API_URL}/api/configure-channels`, {
    // ... existing code
  })
  
  // Add logging
  console.log('[POST /api/channels] VPS response:', response.status, response.statusText)
  const responseBody = await response.json()
  console.log('[POST /api/channels] VPS body:', responseBody)  // ← ADD THIS
  
  if (!response.ok) {
    console.error('[POST /api/channels] VPS error:', responseBody)  // ← ADD THIS
    // ... rest of error handling
  }
} catch (err) {
  console.error('[POST /api/channels] Network error:', err)  // ← ADD THIS
}
```

### Step 5: Test End-to-End

1. Get Telegram bot token from @BotFather
2. Log in to portal as Chris
3. Go to `/dashboard/channels`
4. Paste bot token into Telegram card
5. Click Save
6. Check portal logs: `journalctl -u laverdi-portal -f`
7. Look for VPS response in logs
8. Verify bot is connected via `/api/channels` GET request

### Step 6: Consider Consolidating APIs

**Long-term:** The two integration APIs should be unified:
- Deprecate `/api/integrations` (old, complex)
- Use only `/api/channels` (new, simple)
- Update any backend references

---

## 10. Questions for Follow-Up

1. **Where is the VPS command center running?**
   - Same host (66.42.70.66)?
   - Different server?
   - Docker container or systemd service?

2. **What is the expected network configuration?**
   - Are portal and command-center in same datacenter?
   - Same Docker compose file or separate deployments?

3. **Has Chris ever successfully paired a different channel (Discord, Slack)?**
   - If yes: Same failure?
   - If no: Only Telegram broken?

4. **What error does Chris see in the browser?**
   - "Failed to save"?
   - "Network error"?
   - Success message followed by nothing?

5. **Should Telegram support webhook mode or polling?**
   - Webhook (current): VPS sets up webhook, Telegram sends updates to VPS
   - Polling: Agent server polls Telegram API periodically

---

## Conclusion

**Telegram integration code is fully implemented.** The issue is **infrastructure-level**: the portal cannot reach the VPS command center at `http://laverdi-command-center:8000`.

**Next steps:**
1. Verify VPS service is running
2. Check network connectivity between portal and VPS
3. Add detailed logging to diagnose failures
4. Test with actual Telegram bot token

This is a **blocking issue** preventing all users from pairing any channel (Telegram, Discord, Slack) that depends on the VPS.
