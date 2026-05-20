# LaVerdi System Architecture - Visual Diagrams

## 1. Current Physical Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VULTR VPS (66.42.70.66)                              │
│                             Seattle Datacenter                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                        Nginx Reverse Proxy                            │   │
│  │                   (TLS, HTTP/HTTPS Routing)                           │   │
│  │                  Ports 80, 443 (Public)                              │   │
│  └────────────┬──────────────────────────────────────────────┬──────────┘   │
│               │                                              │                │
│               ▼                                              ▼                │
│        ┌──────────────┐                          ┌──────────────────┐       │
│        │ Next.js App  │                          │  Docker Runtime  │       │
│        │ (Port 3005)  │                          │  (Unused)        │       │
│        │              │                          │  • containerd    │       │
│        │ • Portal UI  │                          │  • No containers │       │
│        │ • Auth       │                          └──────────────────┘       │
│        │ • Stripe     │                                                      │
│        │ • Channels   │                                                      │
│        │   (BROKEN)   │                                                      │
│        └──────┬───────┘                                                      │
│               │                                                              │
│               │ (BROKEN)                                                     │
│               │ http://laverdi-command-center:8000                           │
│               │ (hostname doesn't resolve)                                  │
│               │                                                              │
│               ▼                                                              │
│        ┌──────────────┐                                                      │
│        │ Command      │                                                      │
│        │ Center       │                                                      │
│        │ (Port 8000)  │                                                      │
│        │              │                                                      │
│        │ • Provision  │◄─────────────────────────────────────────────┐     │
│        │   Container  │                                              │     │
│        │ • List       │                                              │     │
│        │ • Status     │                                              │     │
│        │ X Configure  │                                              │     │
│        │   Channels   │                                              │     │
│        │ X Get        │                                              │     │
│        │   Channels   │                                              │     │
│        └──────┬───────┘                                              │     │
│               │                                                      │     │
│               │ (HTTPS)                                             │     │
│               ▼                                                      │     │
│        ┌──────────────┐                                              │     │
│        │ Vultr API    │                                              │     │
│        │ v2.0         │                                              │     │
│        │              │                                              │     │
│        │ • Create     │                                              │     │
│        │   Instance   │                                              │     │
│        │ • Query      │                                              │     │
│        │   Status     │                                              │     │
│        │ • Destroy    │                                              │     │
│        └──────────────┘                                              │     │
│               │                                                      │     │
└───────────────┼──────────────────────────────────────────────────────┼─────┘
                │                                                      │
                ▼                                                      │
        ┌──────────────────────┐                                      │
        │ Vultr Datacenter     │                                      │
        │ (AWS-like)           │                                      │
        │                      │                                      │
        │ ┌──────────────────┐ │                                      │
        │ │ Instance #1      │ │                                      │
        │ │ 45.76.241.188    │ │◄─────────────────────────────────────┘
        │ │ Port 9000        │ │ ◄─ Created May 13
        │ │ Ubuntu 22.04     │ │   (haiku-4.5 tier)
        │ │ • OpenClaw       │ │
        │ │ • Gateway client │ │
        │ └──────────────────┘ │
        │                      │
        │ (More instances      │
        │  would go here)      │
        └──────────────────────┘
                │
                ▼ (HTTP:9000)
        ┌──────────────────┐
        │ User's Device    │
        │ (OpenClaw app)   │
        │                  │
        │ • Pairing token  │
        │ • SSH tunnel     │
        │ • WebSocket      │
        └──────────────────┘
```

---

## 2. Data Flow Diagram

### A. Instance Provisioning Flow (WORKING ✅)

```
┌─────────────────────┐
│ User clicks         │
│ "Create Instance"   │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────┐
│ Portal:                      │
│ POST /api/provision-instance │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Generate SSH keypair         │
│ Generate pairing token       │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Command Center:              │
│ /api/provision-container     │
│                              │
│ 1. Upload SSH key to Vultr   │
│ 2. Create instance on Vultr  │
│ 3. Boot Ubuntu 22.04         │
│ 4. Run user-data script      │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Vultr API Response:          │
│ {                            │
│   instance_id: UUID,         │
│   ip_address: "45.76.x.x",   │
│   status: "provisioning"     │
│ }                            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Command Center stores in DB: │
│ instances table:             │
│ • container_id (Vultr ID)    │
│ • user_id (FK)               │
│ • ip_address                 │
│ • status: "ready"            │
│ • pairing_token              │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Portal returns to UI:        │
│ {                            │
│   instanceId: UUID,          │
│   pairingToken: "abc123",    │
│   endpoint: "45.76.x.x:9000" │
│ }                            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ User scans QR code with      │
│ OpenClaw mobile app          │
│                              │
│ App connects to:             │
│ 45.76.x.x:9000               │
│ Pairing token validates      │
│ SSH tunnel established       │
└──────────────────────────────┘
```

### B. Telegram Pairing Flow (BROKEN ❌)

```
┌──────────────────────────────┐
│ User:                        │
│ Creates Telegram Bot         │
│ Copies bot token:            │
│ "123:ABCdefGHIjklMNOpqrStuv" │
└──────────┬────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Portal UI: "Pair Telegram"       │
│ Input field: [bot token]        │
│ Button: "Connect"               │
└──────────┬──────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Portal Frontend:                 │
│ POST /api/channels               │
│ Body: {                          │
│   channel: "telegram",           │
│   config: {                      │
│     botToken: "123:ABC..."       │
│   }                              │
│ }                                │
└──────────┬──────────────────────┘
           │
           ▼
┌────────────────────────────────────────┐
│ Portal Backend (/pages/api/channels/)  │
│                                        │
│ 1. Verify user auth ✓                 │
│ 2. Parse request ✓                    │
│ 3. Forward to Command Center:          │
│                                        │
│    POST ${VPS_API_URL}/               │
│         api/configure-channels        │
│    Authorization: Bearer               │
│    {                                   │
│      userId: UUID,                    │
│      channels: {                      │
│        telegram: {                    │
│          enabled: true,               │
│          botToken: "123:ABC..."       │
│        }                              │
│      }                                │
│    }                                   │
│                                        │
│    ❌ REQUEST FAILS HERE               │
│    VPS_API_URL =                      │
│    "http://laverdi-command-center:8000"│
│                                        │
│    Error 1: Hostname not found        │
│    nslookup laverdi-command-center    │
│    → NXDOMAIN                         │
│                                        │
│    Error 2: Even if localhost:        │
│    404 Not Found                      │
│    Endpoint doesn't exist             │
└────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Portal returns to UI:        │
│ {                            │
│   error:                     │
│   "Failed to configure       │
│    channel"                  │
│ }                            │
└──────────┬────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ User sees error ✗            │
│ Telegram pairing failed      │
│                              │
│ What should happen next:     │
│ • Webhook registered         │
│ • Telegram messages routed   │
│ • Instance processes msgs    │
│                              │
│ What actually happens:       │
│ NOTHING                      │
└──────────────────────────────┘
```

---

## 3. Database Schema

### Current State (Incomplete)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                           │
│              (dcvrkpgvxqdcboostkpz.supabase.co)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │ users            │         │ subscriptions    │              │
│  ├──────────────────┤         ├──────────────────┤              │
│  │ id (PK)          │◄────────│ id (PK)          │              │
│  │ email            │  (FK)   │ user_id (FK)     │              │
│  │ tier             │         │ stripe_id        │              │
│  │ api_key          │         │ status           │              │
│  │ trial_expires_at │         │ period dates     │              │
│  │ monthly_limit    │         └──────────────────┘              │
│  │ created_at       │                                            │
│  │ updated_at       │         ┌──────────────────┐              │
│  └────────┬─────────┘         │ api_keys         │              │
│           │                   ├──────────────────┤              │
│           │                   │ id (PK)          │              │
│           │            ┌─────►│ user_id (FK)     │              │
│           │            │      │ key              │              │
│           │            │      │ expires_at       │              │
│           │            │      └──────────────────┘              │
│  ┌────────┴────────────┴──────┐                                 │
│  │ instances          │        │ usage_logs       │              │
│  ├──────────────────┤ │        ├──────────────────┤              │
│  │ id (PK)          │         │ id (PK)          │              │
│  │ user_id (FK)──────┼────────►│ user_id (FK)     │              │
│  │ container_id     │         │ endpoint         │              │
│  │ ip_address       │         │ status_code      │              │
│  │ status           │         │ response_time    │              │
│  │ pairing_token    │         │ timestamp        │              │
│  │ created_at       │         └──────────────────┘              │
│  │ updated_at       │                                            │
│  └──────────────────┘                                            │
│                                                                   │
│  ✗ MISSING: channels table                                      │
│  ✗ MISSING: credentials/tokens table                            │
│  ✗ MISSING: webhook_events table                                │
│  ✗ MISSING: instance_channels (junction) table                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Required: channels Table Schema

```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES instances(id) ON DELETE CASCADE,
  
  -- Channel Metadata
  channel_name VARCHAR(50) NOT NULL,  -- telegram|discord|slack|whatsapp|signal
  enabled BOOLEAN DEFAULT FALSE,
  
  -- Credentials (encrypted would be ideal)
  config JSONB,  -- { botToken, appToken, phoneNumber, etc. }
  
  -- Webhook Management
  webhook_url VARCHAR(255),           -- The URL Telegram/Discord/etc posts to
  webhook_secret VARCHAR(255),        -- For HMAC verification
  webhook_verified BOOLEAN DEFAULT FALSE,
  last_webhook_ping TIMESTAMP,
  
  -- Status
  connected BOOLEAN DEFAULT FALSE,
  last_error TEXT,
  
  -- Audit Trail
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, channel_name, instance_id),
  CHECK (channel_name IN ('telegram', 'discord', 'slack', 'whatsapp', 'signal'))
);

CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_instance_id ON channels(instance_id);
CREATE INDEX idx_channels_enabled ON channels(enabled);
```

---

## 4. Network Communication Flows

### A. Portal to Command Center (BROKEN)

```
Portal (Next.js)                Command Center (Flask)
       │                               │
       │ POST /api/channels            │
       │ {botToken: "..."}             │
       │                               │
       ├──── HTTP Request ────►        │
       │                               │
       │ VPS_API_URL =                 │
       │ "http://laverdi-                │
       │  command-center:8000"         │
       │                               │
       │ ❌ DNS Resolution Fails       │
       │    "laverdi-command-center"   │
       │    not found                  │
       │                               │
       ◄──── Error Response ───        │
       │ Timeout / NXDOMAIN           │
       │                               │
       │ ERR_NAME_NOT_RESOLVED        │
       │                               │
```

### B. Portal to Command Center (WHAT SHOULD WORK)

```
Portal (Next.js)                Command Center (Flask)
       │                               │
       │ POST /api/channels            │
       │ {botToken: "..."}             │
       │                               │
       ├──────────────────────────────►│
       │ http://127.0.0.1:8000/api/    │
       │ configure-channels            │
       │                               │
       │ Authorization: Bearer         │
       │ Content-Type: application/json│
       │                               │
       │ {                             │
       │   userId: "...",              │
       │   channels: {                 │
       │     telegram: {               │
       │       enabled: true,          │
       │       botToken: "..."         │
       │     }                         │
       │   }                           │
       │ }                             │
       │                               │
       │ ❌ Currently fails:            │
       │    404 Not Found             │
       │    Endpoint doesn't exist    │
       │                               │
       ◄──────────────────────────────┤
       │ 404 Not Found               │
       │                               │
       │ What SHOULD happen:           │
       │ 1. Validate auth token       │
       │ 2. Store in channels table   │
       │ 3. Call Telegram API:        │
       │    setWebhook(url)           │
       │ 4. Update DB webhook_verified│
       │ 5. Return success            │
       │                               │
       ◄──────────────────────────────┤
       │ 200 OK                       │
       │ { success: true }            │
       │                               │
```

### C. Telegram Webhook (NEVER GETS HERE)

```
Telegram Servers              Instance (45.76.x.x:9000)
       │                              │
       │ User sends message           │
       │ in bot chat                  │
       │                              │
       ├─ POST webhook_url ──────────►│
       │ ?token=bot_token&message=... │
       │                              │
       │ ❌ WEBHOOK NEVER SET UP       │
       │    Because configure-channels│
       │    endpoint doesn't exist    │
       │                              │
       │                              ✗ Never receives
       │                                messages
       │                              
       │ What SHOULD happen:          │
       │ 1. Instance receives POST    │
       │ 2. Validates bot token      │
       │ 3. Parses Telegram payload  │
       │ 4. Processes via OpenClaw   │
       │ 5. Returns 200 OK           │
       │                              │
       ◄─────── 200 OK ──────────────┤
       │ { ok: true }                │
       │                              │
```

---

## 5. Broken Connection Diagram

```
┌─────────────────────────────┐
│ Portal Server               │
│ (66.42.70.66)              │
│                             │
│ ┌──────────────────────┐    │
│ │ Next.js Portal       │    │
│ │ Port 3005            │    │
│ │                      │    │
│ │ .env.local:          │    │
│ │ VPS_API_URL=         │    │
│ │ http://              │    │
│ │ laverdi-command-     │    │
│ │ center:8000          │    │
│ │                      │    │
│ │ ❌ Hostname wrong    │    │
│ └─────────┬────────────┘    │
│           │                 │
│           │ Try to resolve: │
│           │ "laverdi-       │
│           │  command-       │
│           │  center"        │
│           │                 │
│ ┌─────────▼─────────────┐   │
│ │ /etc/hosts            │   │
│ │ 127.0.0.1 localhost   │   │
│ │ 127.0.1.1             │   │
│ │ laverdi-portal-seattle│   │
│ │ ::1 localhost         │   │
│ │                       │   │
│ │ ❌ NO ENTRY FOR       │   │
│ │ laverdi-command-center│   │
│ └───────────────────────┘   │
│                             │
│ ┌─────────────────────────┐ │
│ │ /root/.pm2/logs         │ │
│ │ command-center-         │ │
│ │ error.log:              │ │
│ │                         │ │
│ │ 127.0.0.1 -            │ │
│ │ [14/May/2026]           │ │
│ │ "GET /health 200"       │ │
│ │                         │ │
│ │ ✓ Service healthy      │ │
│ │ ✓ Running on port 8000 │ │
│ │ ✓ Can serve requests   │ │
│ │                         │ │
│ │ ❌ But can't be reached │ │
│ │ from portal because     │ │
│ │ of hostname issue       │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
           ▼
    ❌ BROKEN CONNECTION
```

---

## 6. What's Implemented vs. Missing

### Portal API (pages/api/channels/index.ts)

```
✓ IMPLEMENTED:
  ├─ GET /api/channels
  │  ├─ Verify auth token
  │  ├─ Forward to VPS_API_URL/api/get-channels
  │  └─ Parse & return status
  │
  └─ POST /api/channels
     ├─ Verify auth token
     ├─ Validate channel type (telegram|discord|slack|signal)
     ├─ Build channel config
     ├─ Forward to VPS_API_URL/api/configure-channels
     └─ Return success/error

✗ MISSING (Command Center Endpoints):
  ├─ POST /api/configure-channels
  │  ├─ Receive channel config
  │  ├─ Validate bot token (call Telegram API)
  │  ├─ Store in database
  │  ├─ Register webhook (Telegram setWebhook)
  │  └─ Return status
  │
  └─ GET /api/get-channels
     ├─ Query database for user's channels
     └─ Return { telegram: { enabled, connected } }

✗ MISSING (Database):
  ├─ channels table
  ├─ channel_credentials table (encrypted)
  ├─ webhook_events table
  └─ instance_channels junction table
```

---

## 7. Fix Implementation Order

```
Priority 1 (IMMEDIATE - 30 min)
├─ Fix hostname resolution
│  ├─ Add /etc/hosts entry: 127.0.0.1 laverdi-command-center
│  └─ OR: Change VPS_API_URL to localhost:8000
│
└─ Verify portal can reach command center:
   └─ curl http://laverdi-command-center:8000/health

Priority 2 (SHORT TERM - 2 hours)
├─ Create migration 008_create_channels_table.sql
├─ Implement /api/configure-channels endpoint
├─ Implement /api/get-channels endpoint
├─ Add Telegram token validation
├─ Add webhook registration logic
│
└─ Test endpoints:
   ├─ curl -X POST http://localhost:8000/api/configure-channels
   └─ curl http://localhost:8000/api/get-channels?userId=...

Priority 3 (MEDIUM TERM - 1 day)
├─ End-to-end testing
├─ Add Discord, Slack, Signal support
├─ Implement webhook payload routing
├─ Add monitoring & alerts
│
└─ Deploy & verify Telegram works

Priority 4 (LONG TERM - Polish)
├─ Message queue for reliability
├─ Rate limiting
├─ Channel status dashboard
├─ Credentials encryption
├─ Audit logging
│
└─ Production hardening
```

---

## 8. Problem Summary Table

| Issue | Symptom | Root Cause | Fix | Severity |
|-------|---------|-----------|-----|----------|
| Hostname resolution | Portal can't reach Command Center | VPS_API_URL points to non-existent hostname | Add `/etc/hosts` entry or change to localhost | CRITICAL |
| Missing endpoints | 404 when calling configure-channels | Endpoints never implemented | Implement both endpoints | CRITICAL |
| No database table | Can't store credentials | No migration created | Create channels table migration | CRITICAL |
| No webhook logic | Telegram never connects | No webhook registration code | Add setWebhook() call | CRITICAL |
| Docker legacy | Unused but still configured | Old system not cleaned up | Remove docker config | LOW |
| Weak secrets | Credentials visible | .env file plaintext | Move to secrets manager | MEDIUM |

