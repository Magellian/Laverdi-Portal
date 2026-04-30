# Communication Channel Integrations

Connect OpenClaw agents to Telegram, Discord, WhatsApp, Slack, and Email for multi-platform AI automation.

---

## Overview

Users can integrate their agents with communication platforms, enabling:
- **Telegram:** Direct bot messaging
- **Discord:** Server channels + DMs
- **WhatsApp:** Business messaging
- **Slack:** Workspace automation
- **Email:** Automated responses

**How it works:**
1. User creates integration in dashboard
2. Follows platform-specific setup
3. Agent receives/responds via that platform
4. Usage tracked per integration
5. All credit rules apply (shared tier limit)

---

## Supported Platforms

### 1. Telegram

**Setup Time:** 5 minutes

**What It Does:**
- Agent responds to messages in a Telegram chat
- Supports groups and direct messages
- Can trigger commands with `/`

**Setup Steps:**
1. Create bot via [@BotFather](https://t.me/botfather)
2. Get bot token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
3. In portal: Add Telegram integration with token
4. Find your chat ID
5. Set webhook with `/setwebhook` command

**Webhook:** `https://laverdi.tech/api/webhooks/telegram/{integration_id}`

**API Config:**
```json
{
  "botToken": "123456:ABC-DEF...",
  "chatId": "123456789"
}
```

**Example Flow:**
```
User sends message in Telegram chat
  ↓
Telegram webhook → /api/webhooks/telegram/{id}
  ↓
Agent processes message
  ↓
Response sent back via Telegram bot
  ↓
User sees reply in chat
```

---

### 2. Discord

**Setup Time:** 10 minutes

**What It Does:**
- Agent responds in specific channels
- Mentions trigger agent
- Works in threads
- Can handle slash commands

**Setup Steps:**
1. Create app at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable "Message Content Intent" (required)
3. Create bot user
4. Get bot token
5. In portal: Add Discord integration with token
6. Invite bot to server (use OAuth2 invite link)
7. Set webhook in Discord settings

**Webhook:** `https://laverdi.tech/api/webhooks/discord/{integration_id}`

**API Config:**
```json
{
  "botToken": "OTc4MzE1MTI1MzAxNjk3NTQ2.G...",
  "serverId": "123456789",
  "channelId": "987654321"
}
```

**Example Flow:**
```
User mentions bot in Discord
  @agent hello

  ↓
Discord webhook → /api/webhooks/discord/{id}
  ↓
Agent processes mention
  ↓
Response sent to channel
```

---

### 3. WhatsApp

**Setup Time:** 15 minutes

**What It Does:**
- Agent responds to WhatsApp messages
- Works with WhatsApp Business API
- Supports media (images, files)
- Template-based responses optional

**Setup Steps:**
1. Sign up for [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
2. Create app and get Phone Number ID
3. Generate access token
4. In portal: Add WhatsApp integration
5. Set webhook URL in Meta dashboard
6. Subscribe to message events

**Webhook:** `https://laverdi.tech/api/webhooks/whatsapp/{integration_id}`

**API Config:**
```json
{
  "phoneNumberId": "102938475685...",
  "accessToken": "EAAP...",
  "verifyToken": "random_verify_token"
}
```

**Example Flow:**
```
User sends message to WhatsApp number
  ↓
WhatsApp webhook → /api/webhooks/whatsapp/{id}
  ↓
Agent processes message
  ↓
Response sent via WhatsApp API
```

---

### 4. Slack

**Setup Time:** 10 minutes

**What It Does:**
- Agent responds in channels
- Handles direct messages
- Slash commands trigger agent
- Supports threads and reactions

**Setup Steps:**
1. Create app at [Slack API](https://api.slack.com/apps)
2. Enable Event Subscriptions
3. Set webhook URL: `https://laverdi.tech/api/webhooks/slack/{integration_id}`
4. Subscribe to: `app_mention`, `message.im`, `app_mention` events
5. Get bot token and signing secret
6. In portal: Add Slack integration
7. Install app to workspace

**Webhook:** `https://laverdi.tech/api/webhooks/slack/{integration_id}`

**API Config:**
```json
{
  "botToken": "xoxb-your-bot-token",
  "signingSecret": "your-signing-secret"
}
```

**Example Flow:**
```
User mentions bot in Slack channel
  @agent what is the status?

  ↓
Slack webhook → /api/webhooks/slack/{id}
  ↓
Agent processes mention
  ↓
Response posted in channel thread
```

---

### 5. Email

**Setup Time:** 5 minutes

**What It Does:**
- Agent responds to incoming emails
- Forwards to agent email address
- Automatic reply generation
- Supports attachments (future)

**Setup Steps:**
1. Set up [SendGrid Parse Webhook](https://sendgrid.com/docs/for-developers/parsing-email/setting-up-the-inbound-parse-webhook/)
2. Create API key in SendGrid
3. In portal: Add Email integration
4. Configure parse webhook endpoint
5. Set webhook URL: `https://laverdi.tech/api/webhooks/email/{integration_id}`

**Webhook:** `https://laverdi.tech/api/webhooks/email/{integration_id}`

**API Config:**
```json
{
  "email": "agent@laverdi.tech",
  "sendgridKey": "SG.your_api_key"
}
```

**Example Flow:**
```
User sends email to agent address
  ↓
SendGrid parse webhook → /api/webhooks/email/{id}
  ↓
Agent processes email
  ↓
Auto-reply sent via SendGrid
```

---

## Dashboard Integration UI

### `/dashboard/integrations`

**Features:**
- List all integrations (per agent)
- Status: Active / Inactive / Error
- Platform icons + setup status
- Add new integration button
- Last activity timestamp
- Quick test button
- Delete integration

**Example UI:**
```
Active Integrations (4/10)

Telegram Bot (Support)
├─ Status: ✓ Active
├─ Last message: 2 min ago
├─ Messages today: 24
└─ [Open Setup] [Test] [Delete]

Discord (general channel)
├─ Status: ✓ Active
├─ Last message: 15 min ago
├─ Messages today: 8
└─ [Open Setup] [Test] [Delete]

WhatsApp (Business)
├─ Status: ○ Inactive
├─ Setup needed: Verify webhook
└─ [Complete Setup] [Delete]

Slack (@agent)
├─ Status: ! Error
├─ Error: Signing secret invalid
└─ [Fix Setup] [Delete]
```

---

## API Endpoints

### List Integrations
**GET /api/integrations**

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "agentId": "agent-uuid",
      "platform": "telegram",
      "status": "active",
      "connectedAt": "2026-04-18T15:30:00Z",
      "lastActivity": "2026-04-18T15:45:00Z",
      "isActive": true
    }
  ]
}
```

### Create Integration
**POST /api/integrations**

Request:
```json
{
  "agentId": "agent-uuid",
  "platform": "telegram",
  "config": {
    "botToken": "123456:ABC-DEF...",
    "chatId": "123456789"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "agentId": "agent-uuid",
    "platform": "telegram",
    "status": "inactive",
    "connectedAt": "2026-04-18T15:30:00Z",
    "isActive": false
  }
}
```

### Get Setup Instructions
**GET /api/integrations/:id/setup**

Response:
```json
{
  "success": true,
  "data": {
    "platform": "telegram",
    "webhookUrl": "https://laverdi.tech/api/webhooks/telegram/uuid-123",
    "setupSteps": [
      "1. Create bot via @BotFather",
      "2. Copy bot token",
      "3. Paste token above and save",
      "4. Find chat ID",
      "5. Set webhook"
    ],
    "config": [
      {
        "key": "botToken",
        "label": "Bot Token",
        "type": "password",
        "required": true
      }
    ],
    "status": "inactive"
  }
}
```

### Activate/Deactivate Integration
**PUT /api/integrations/:id**

Request:
```json
{
  "isActive": true
}
```

### Delete Integration
**DELETE /api/integrations/:id**

---

## Webhook Processing

### Telegram Webhook Handler
**`pages/api/webhooks/telegram/[id].ts`**

```typescript
POST /api/webhooks/telegram/{integration_id}

Receives: Telegram Update object
  {
    "update_id": 123456,
    "message": {
      "message_id": 1,
      "chat": { "id": 123456789 },
      "text": "Hello agent!"
    }
  }

Process:
1. Verify webhook token
2. Extract message text & chat ID
3. Log webhook event
4. Send to agent for processing
5. Get agent response
6. Send back via Telegram API
```

### Discord Webhook Handler
**`pages/api/webhooks/discord/[id].ts`**

```typescript
POST /api/webhooks/discord/{integration_id}

Receives: Discord Interaction object
  {
    "type": 1,
    "data": {
      "content": "hello",
      "mentions": [{ "id": "bot_id" }]
    }
  }

Process:
1. Verify signing secret (HMAC)
2. Handle 3-second ping
3. Extract mention/message
4. Send to agent
5. Defer response (if needed)
6. Post message to channel
```

### WhatsApp Webhook Handler
**`pages/api/webhooks/whatsapp/[id].ts`**

```typescript
POST /api/webhooks/whatsapp/{integration_id}

Receives: WhatsApp webhook
  {
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "text": { "body": "hello" }
          }]
        }
      }]
    }]
  }

Process:
1. Verify webhook token
2. Extract message content & sender
3. Send to agent
4. Get response
5. Send via WhatsApp API
```

---

## Database Schema

### `integrations` Table
```sql
id UUID PRIMARY KEY
user_id UUID (FK users)
agent_id UUID (FK agents)
platform TEXT ('telegram'|'discord'|'whatsapp'|'slack'|'email')
config JSONB (platform-specific credentials)
status TEXT ('active'|'inactive'|'error')
is_active BOOLEAN
connected_at TIMESTAMP
last_activity TIMESTAMP
deleted_at TIMESTAMP (soft delete)
```

### `webhook_logs` Table
Tracks all incoming webhook events:
```sql
id UUID PRIMARY KEY
integration_id UUID
agent_id UUID
platform TEXT
event_type TEXT
source_id TEXT (chat_id, user_id, etc.)
message_content TEXT
raw_payload JSONB
processed BOOLEAN
created_at TIMESTAMP
```

### `integration_usage` Table
Tracks message volume per day:
```sql
id UUID PRIMARY KEY
integration_id UUID
date DATE
messages_received INTEGER
messages_sent INTEGER
errors INTEGER
```

---

## Usage & Monitoring

### Track Integration Activity
```sql
-- Messages per integration today
SELECT 
  i.platform,
  COUNT(*) as total_messages,
  SUM(CASE WHEN wl.processed = true THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN wl.processed = false THEN 1 ELSE 0 END) as failed
FROM integrations i
LEFT JOIN webhook_logs wl ON i.id = wl.integration_id
  AND DATE(wl.created_at) = CURRENT_DATE
WHERE i.is_active = true
GROUP BY i.platform;
```

### Integration Health
```sql
-- Integrations with errors
SELECT i.id, i.platform, i.status, i.error_message, COUNT(*) as error_count
FROM integrations i
LEFT JOIN webhook_logs wl ON i.id = wl.integration_id
  AND wl.processed = false
WHERE i.is_active = true
GROUP BY i.id
HAVING COUNT(*) > 0;
```

---

## Security

### Webhook Verification
- **Telegram:** Bot token in URL (authenticated via token)
- **Discord:** HMAC-SHA256 signing secret verification
- **WhatsApp:** Webhook verify token + signature
- **Slack:** HMAC-SHA256 signing secret
- **Email:** SendGrid IP whitelist

### Config Encryption
- Platform credentials encrypted at rest (AES-256)
- Keys never exposed in API responses
- Decrypted only when sending to agent
- Audit log tracks access

### Rate Limiting
- Per-integration rate limits (prevent abuse)
- Credit system applies (usage counts toward tier)
- Spam detection (rapid message filtering)

---

## Testing Integrations

### Telegram
```bash
# Test webhook (manual)
curl -X POST https://laverdi.tech/api/webhooks/telegram/uuid-123 \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123456,
    "message": {
      "chat": { "id": 123456789 },
      "text": "test message"
    }
  }'
```

### Discord
```bash
# Test interaction
curl -X POST https://laverdi.tech/api/webhooks/discord/uuid-123 \
  -H "X-Signature-Ed25519: <signature>" \
  -H "X-Signature-Timestamp: <timestamp>" \
  -d '{"type": 1}'  # Ping
```

---

## Future Enhancements

1. **More Platforms**
   - SMS (Twilio)
   - Microsoft Teams
   - Google Chat
   - Messenger
   - WeChat

2. **Advanced Features**
   - Multi-agent routing per platform
   - Conditional message handling
   - Message templates
   - Auto-responses based on keywords

3. **Analytics**
   - Per-platform sentiment analysis
   - Response time tracking
   - Engagement metrics
   - User satisfaction scoring

4. **Automation**
   - Cross-platform message forwarding
   - Unified inbox (all messages in one place)
   - Platform-specific workflows

---

## Troubleshooting

### Webhook Not Triggering
1. Verify integration is `is_active = true`
2. Check webhook URL in platform settings
3. Verify signing secret/token is correct
4. Check webhook_logs table for errors

### Agent Not Responding
1. Verify agent is `is_active = true`
2. Check agent has credits remaining
3. Review usage_logs for API errors
4. Check agent status (provisioning/active/error)

### Signature Verification Failed
1. Verify signing secret matches platform
2. Check HMAC-SHA256 implementation
3. Ensure timestamp is recent (<5 min)
4. Look for encoding issues (hex vs base64)
