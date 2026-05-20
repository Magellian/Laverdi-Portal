# Telegram Integration Implementation Plan

**Audit Date:** 2026-05-17  
**Current Status:** 85% Complete — Missing UI + End-to-End Testing  
**Estimated Work:** 2-3 hours for full deployment

---

## 🎯 EXECUTIVE SUMMARY

**What Exists:**
- ✅ Database schema (channels table, RLS policies)
- ✅ Backend API endpoints (Command Center has `/api/configure-channels`, etc.)
- ✅ Hostname resolution fixed (laverdi-command-center in /etc/hosts)
- ✅ Portal API code (channels API, integration code)
- ⚠️ Frontend UI exists but is **archived/not deployed** to production

**What's Missing:**
- ❌ Telegram UI component deployed to dashboard
- ❌ End-to-end testing with real Telegram bot
- ❌ Error handling/user feedback UI
- ❌ Webhook verification on VPS side

**Blocker Identified:**
- The Command Center `/api/configure-channels` endpoint receives the token but **doesn't set up the actual Telegram webhook**
- System accepts tokens but doesn't configure the bot to actually receive messages

---

## 📋 WHAT WE HAVE

### 1. Database (✅ READY)
**File:** `channels.sql`

```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT CHECK (platform IN ('telegram', 'discord', 'slack', 'signal', 'whatsapp')),
  token TEXT NOT NULL,
  webhook_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  config JSONB DEFAULT '{}',
  UNIQUE(user_id, platform)
);
```

**Status:** ✅ Table should exist in Supabase (created 2026-05-14)  
**Action:** Verify table exists: `SELECT * FROM channels LIMIT 1;`

---

### 2. Backend API Code (✅ PARTIALLY READY)

**Portal API:** `/root/laverdi-portal/pages/api/channels/index.ts`
- ✅ Receives POST with `{ channel: 'telegram', config: { botToken } }`
- ✅ Validates structure
- ✅ Calls Command Center: `POST /api/configure-channels`

**Command Center API:** (Deployed on VPS)
- ✅ Endpoint exists: `/api/configure-channels`
- ⚠️ **ISSUE:** Accepts token but doesn't actually set up the Telegram bot webhook
- Currently just stores token in database

**What Command Center SHOULD do:**
```python
POST /api/configure-channels
{
  "user_id": "uuid",
  "platform": "telegram",
  "token": "123456789:AABbc..."
}

THEN:
1. Validate token with Telegram API (GET /getMe)
2. Set up webhook: POST /api/setWebhook to Telegram
3. Webhook URL should be: https://laverdi.tech/api/webhooks/telegram?user_id={user_id}
4. Store in database with verified=true
5. Return success to portal
```

**Current behavior:**
```python
# Just stores token, doesn't validate or set up webhook
INSERT INTO channels (user_id, platform, token) 
VALUES (...) 
RETURNING *;
```

---

### 3. Frontend UI (⚠️ ARCHIVED, NOT DEPLOYED)

**Dead Code Location:** `/_archive/dead-code/channels.tsx`
- ✅ Beautiful, fully functional Telegram input card
- ✅ Instructions for getting bot token
- ✅ Save/disconnect buttons
- ✅ Error handling
- ❌ **Not deployed to production**

**What needs to happen:**
- Restore from archive
- Deploy to `/root/laverdi-portal/pages/dashboard/channels.tsx`
- Or: Create new minimal component in `/components/TelegramConnectCard.tsx`

---

### 4. Webhook Handler (❌ MISSING)

**Should exist:** `/root/laverdi-portal/pages/api/webhooks/telegram.ts`

**Purpose:** When user sends message via Telegram:
1. Telegram sends POST to webhook URL
2. Webhook handler receives message
3. Routes message to user's OpenClaw agent
4. Agent responds
5. Response sent back to Telegram user

**Current status:** ❌ **DOES NOT EXIST**

---

## 🔴 THE CORE PROBLEM

The system **collects bot tokens** but **never configures them with Telegram**.

Here's what happens when a user pairs Telegram today:

```
User enters bot token → Portal saves to database → ❌ That's it

User never gets:
- Message from Telegram: "Bot is ready!"
- Ability to chat with their agent
- Any indication of success
```

**Why?** The Command Center's `/api/configure-channels` endpoint needs to:
1. Call Telegram API to validate the token
2. Set up a webhook so Telegram knows where to send messages
3. Tell the user "Success!"

---

## 📊 IMPLEMENTATION BREAKDOWN

### Phase 1: Fix Backend (1-2 hours)

**Task 1.1: Update Command Center to validate + configure Telegram**

Location: Command Center `app.py` (on VPS)

```python
@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    data = request.json
    user_id = data.get('user_id')
    platform = data.get('platform')
    token = data.get('token')
    
    if platform == 'telegram':
        # ✅ NEW: Validate token with Telegram
        try:
            import requests
            resp = requests.get(
                f"https://api.telegram.org/bot{token}/getMe"
            )
            if resp.status_code != 200:
                return {'success': False, 'error': 'Invalid bot token'}
            bot_info = resp.json()['result']
        except Exception as e:
            return {'success': False, 'error': str(e)}
        
        # ✅ NEW: Set up webhook
        webhook_url = f"https://laverdi.tech/api/webhooks/telegram?user_id={user_id}"
        try:
            webhook_resp = requests.post(
                f"https://api.telegram.org/bot{token}/setWebhook",
                json={'url': webhook_url}
            )
            if webhook_resp.status_code != 200:
                return {'success': False, 'error': 'Failed to set webhook'}
        except Exception as e:
            return {'success': False, 'error': f'Webhook setup failed: {e}'}
        
        # ✅ Store in database with verified=true
        supabase.table('channels').insert({
            'user_id': user_id,
            'platform': 'telegram',
            'token': token,
            'verified': True,
            'verified_at': datetime.now().isoformat(),
            'config': {'bot_id': bot_info['id'], 'bot_name': bot_info['username']}
        }).execute()
        
        return {'success': True, 'data': bot_info}
```

**Task 1.2: Create Telegram webhook handler**

File: `/root/laverdi-portal/pages/api/webhooks/telegram.ts`

```typescript
// Receives POST from Telegram when user sends message
// Format: { message: { chat: { id }, text }, from: { id, username } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const userId = req.query.user_id as string
  const update = req.body
  
  if (!update.message) return res.status(200).json({ ok: true })
  
  const chatId = update.message.chat.id
  const text = update.message.text
  const telegramUserId = update.from.id
  
  // TODO: Route to user's agent via RPC/websocket
  // GET user's agent ID from database
  // Send message to agent: { type: 'message', channel: 'telegram', text, chatId }
  // Receive agent response
  // Send back to Telegram: POST /sendMessage with chatId, text
  
  res.status(200).json({ ok: true })
}
```

---

### Phase 2: Deploy Frontend (30-60 minutes)

**Task 2.1: Restore and deploy Telegram UI**

Option A: Copy from archive
```bash
cp /_archive/dead-code/channels.tsx pages/dashboard/channels.tsx
```

Option B: Create minimal component
```bash
cat > components/TelegramConnectCard.tsx << 'EOF'
// Minimal Telegram pairing UI
// Shows:
// - Bot token input
// - Save button
// - Status: Connected/Not Connected
// - Disconnect button
// - Instructions
EOF
```

**Task 2.2: Update dashboard to show Telegram card**

File: `/pages/dashboard/channels.tsx` or similar

```typescript
import TelegramConnectCard from '@/components/TelegramConnectCard'

export default function ChannelsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TelegramConnectCard />
      <SignalConnectCard />
      {/* Discord, Slack, WhatsApp */}
    </div>
  )
}
```

---

### Phase 3: Wire Agent Routing (1-2 hours)

**Task 3.1: Route Telegram messages to agent**

File: `/pages/api/webhooks/telegram.ts`

```typescript
// Get user's agent
const { data: instance } = await supabase
  .from('user_instances')
  .select('*')
  .eq('user_id', userId)
  .single()

// Send message to agent via RPC or HTTP
const agentResponse = await fetch(
  `http://127.0.0.1:${instance.gateway_port}/rpc`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'send_message',
      params: {
        channel: 'telegram',
        user_id: telegramUserId,
        message: text
      }
    })
  }
)

const { result } = await agentResponse.json()

// Send response back to Telegram
await sendTelegramMessage(token, chatId, result)
```

---

### Phase 4: Testing (30-60 minutes)

**Task 4.1: End-to-end test**

```bash
# 1. Get Telegram bot token
#    → Message @BotFather on Telegram
#    → Send /newbot
#    → Follow prompts
#    → Copy token

# 2. Go to https://laverdi.tech/dashboard/channels

# 3. Paste bot token into Telegram card

# 4. Click Save

# 5. Verify in logs:
#    → Command Center receives token
#    → Validates with Telegram API
#    → Sets webhook
#    → Returns success to portal

# 6. Send message to bot on Telegram

# 7. Agent responds

# 8. Verify in Telegram: Message appears
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Backend (Phase 1)
- [ ] Review current Command Center `/api/configure-channels` code
- [ ] Add Telegram validation (call Telegram API /getMe)
- [ ] Add webhook setup (call Telegram API /setWebhook)
- [ ] Test with sample token
- [ ] Create webhook handler at `/api/webhooks/telegram.ts`
- [ ] Add error logging

### Frontend (Phase 2)
- [ ] Restore channels.tsx from archive (or create minimal component)
- [ ] Deploy to production build
- [ ] Test input validation
- [ ] Test success/error feedback

### Integration (Phase 3)
- [ ] Wire Telegram messages to agent RPC
- [ ] Wire agent responses back to Telegram
- [ ] Handle edge cases (offline agent, timeout, etc.)
- [ ] Add logging

### Testing (Phase 4)
- [ ] Create test Telegram bot
- [ ] Test signup → pairing → message → response flow
- [ ] Test error handling (invalid token, webhook failure, etc.)
- [ ] Load test (multiple messages)

---

## 🚀 QUICK START

**If you want to get Telegram working ASAP (fastest path):**

1. **SSH to portal:**
   ```bash
   ssh root@66.42.70.66
   ```

2. **Check if channels table exists:**
   ```bash
   psql postgresql://... -c "SELECT * FROM channels LIMIT 1;"
   ```

3. **Deploy frontend UI:**
   ```bash
   # Option A: Copy from archive (fastest)
   cp /_archive/dead-code/channels.tsx pages/dashboard/channels.tsx
   npm run build
   pm2 restart web
   
   # Option B: Create minimal component (safer)
   cat > components/TelegramConnectCard.tsx << 'EOF'
   [paste minimal Telegram input component]
   EOF
   ```

4. **Fix Command Center backend:**
   ```bash
   # Edit Command Center app.py
   # Add Telegram validation + webhook setup
   # Restart: pm2 restart command-center
   ```

5. **Test:**
   ```bash
   # Get bot token from @BotFather
   # Go to https://laverdi.tech/dashboard/channels
   # Paste token
   # Click Save
   # Message bot on Telegram
   ```

---

## 📝 SUMMARY

| Component | Status | Work Needed |
|-----------|--------|------------|
| **Database** | ✅ Ready | Verify table exists |
| **Portal API** | ✅ Ready | None |
| **Command Center API** | ⚠️ Partial | Add Telegram validation + webhook setup |
| **Webhook Handler** | ❌ Missing | Create `/api/webhooks/telegram.ts` |
| **Frontend UI** | ⚠️ Archived | Deploy from archive |
| **Agent Routing** | ⚠️ Partial | Wire Telegram messages to agent |
| **Testing** | ❌ Not done | E2E test with real bot |

**Total Effort:** ~3-4 hours for full working implementation

**Minimum Viable:** 2 hours (just UI + backend validation, no agent routing yet)

---

## 🎯 RECOMMENDATION

**Option 1: Full Implementation (3-4 hours)**
- Complete all phases
- Telegram fully functional
- Messages routed to agents
- Production-ready

**Option 2: MVP (2 hours)**
- Deploy UI (Phase 2)
- Fix backend validation (Phase 1, partial)
- Test token acceptance
- Agent routing deferred to next sprint

**My Recommendation:** Go with **Option 1** — you're close enough that finishing it now makes sense. All the infrastructure is there; just need to wire it up.

