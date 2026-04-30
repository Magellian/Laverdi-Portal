# User Control Panel - Agent Management

User-facing OpenClaw control panel with credit-based billing, provider key management, and usage tracking.

---

## Overview

Each user gets:
1. **Direct access to OpenClaw web UI** (their agent's command center)
2. **Provider API key management** (add/remove external inference APIs)
3. **Monthly credit system** (usage tracked across models)
4. **Usage analytics** (calls per model, credit burn rate)
5. **Agent settings** (primary model, system prompt)

---

## Pages & Components

### 1. Agent Control Panel (`pages/dashboard/agent-control.tsx`)

**Main dashboard for agent management.**

**Features:**
- Quick access link to OpenClaw web UI
- Real-time agent status (provisioning/active/error)
- Monthly credit balance and progress bar
- Usage breakdown by model
- Add/remove external provider API keys
- Agent settings (primary model, system prompt)

**Endpoint:** `/dashboard/agent-control`

**Example Screenshot:**
```
┌─ Agent Control Panel ────────────────────────────────┐
│                                                      │
│  OpenClaw Web UI                          [Open UI]  │
│  http://192.0.2.1:18789                             │
│  Status: ✓ Active                                    │
│                                                      │
│  Monthly Credits                                     │
│  ████████░░░░░░░░░░ 450 / 1000 (45%)               │
│  Reset: May 18, 2026                                │
│                                                      │
│  Usage by Model                                      │
│  ├─ Claude Sonnet 4.6: 200 credits (45 calls)      │
│  ├─ GPT-5.4: 150 credits (20 calls)                │
│  └─ Claude Haiku 4.5: 100 credits (80 calls)       │
│                                                      │
│  Provider API Keys                      [Add Key]   │
│  ├─ OpenAI (Active) - Added Apr 18                 │
│  │  └─ [Eye] [Delete]                              │
│  └─ Anthropic (Active) - Added Apr 10              │
│     └─ [Eye] [Delete]                              │
│                                                      │
│  Agent Settings                                      │
│  Primary Model: [Claude Sonnet 4.6 ▼]             │
│  System Prompt: [You are a helpful...]             │
│                        [Save Settings]              │
└──────────────────────────────────────────────────────┘
```

---

## Credit System

### How Credits Work

Users get **monthly credits** based on their tier:
- **Free:** 100 credits/month
- **Starter:** 1,000 credits/month
- **Pro:** 5,000 credits/month

Credits reset on the 1st of each month.

### Credit Pricing (Token-based)

Credits are deducted based on tokens used:

| Model | Cost |
|-------|------|
| Claude Opus 4.6 | 0.15¢ per 1K tokens |
| Claude Sonnet 4.6 | 0.03¢ per 1K tokens |
| Claude Haiku 4.5 | 0.008¢ per 1K tokens |
| GPT-5.4 | 0.10¢ per 1K tokens |
| GPT-4o | 0.15¢ per 1K tokens |
| DeepSeek | 0.01¢ per 1K tokens |

**Example:**
- User makes a call using Claude Sonnet that uses 1,000 tokens
- Cost: 1,000 tokens × $0.00003 = $0.03 = 3 credits
- 997 credits remain

### Overages

If user runs out of credits:
- Free tier: Agent stops working until next month
- Starter/Pro: Automatically uses next cheaper available model
- (Or could offer optional credit purchase)

---

## Provider API Key Management

### Adding External Provider Keys

Users can add API keys for:
- **OpenAI** (GPT-5.4, GPT-4o, etc.)
- **Anthropic** (Claude models)
- **Google** (Gemini)
- **DeepSeek** (open source models)
- **OpenRouter** (aggregate of many providers)

### Security

1. **Encryption at Rest:** Keys encrypted with AES-256-GCM before storing
2. **User Isolation:** Users can only access their own keys
3. **Audit Trail:** Each key access is logged
4. **Easy Revocation:** Delete key immediately if compromised

### API: Manage Provider Keys

**GET /api/provider-keys**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-123",
      "provider": "openai",
      "keyName": "openai-1713401400000",
      "isActive": true,
      "createdAt": "2026-04-18T15:30:00Z",
      "lastUsed": "2026-04-18T15:45:00Z"
    }
  ]
}
```

**POST /api/provider-keys**
```json
{
  "provider": "openai",
  "key": "sk_..."
}
```

**DELETE /api/provider-keys/:id**
```json
{
  "success": true
}
```

---

## Usage Statistics API

**GET /api/usage/stats**

Returns real-time credit usage and breakdown:

```json
{
  "success": true,
  "data": {
    "tier": "starter",
    "monthlyCredits": 1000,
    "creditsUsed": 450,
    "creditsRemaining": 550,
    "percentageUsed": 45,
    "resetDate": "2026-05-01T00:00:00Z",
    "modelUsage": [
      {
        "model": "claude-sonnet-4.6",
        "creditsUsed": 200,
        "callCount": 45
      },
      {
        "model": "gpt-5.4",
        "creditsUsed": 150,
        "callCount": 20
      },
      {
        "model": "claude-haiku-4.5",
        "creditsUsed": 100,
        "callCount": 80
      }
    ]
  }
}
```

---

## Database Schema

### `provider_keys` Table
Stores encrypted API keys for external providers.

```sql
id UUID PRIMARY KEY
user_id UUID (FK)
provider TEXT ('openai', 'anthropic', 'google', 'deepseek', 'openrouter')
encrypted_key TEXT
key_name TEXT
is_active BOOLEAN
created_at TIMESTAMP
last_used TIMESTAMP
last_tested TIMESTAMP
test_status TEXT ('untested', 'success', 'failed')
error_message TEXT
```

### `usage_logs` Table (Enhanced)
Tracks API calls with model information.

```sql
id UUID PRIMARY KEY
user_id UUID (FK)
model TEXT (e.g., 'claude-sonnet-4.6')
token_count INTEGER
call_count INTEGER
provider TEXT
cost_cents NUMERIC
created_at TIMESTAMP
```

### `user_monthly_credits` View
Real-time view of current month's credits.

```sql
user_id UUID
tier TEXT
monthly_limit NUMERIC
credits_used NUMERIC
credits_remaining NUMERIC
reset_date TIMESTAMP
```

---

## Agent Settings

### Configurable Options

1. **Primary Model**
   - Which model the agent uses by default
   - Options: Claude Sonnet, Claude Opus, GPT-5.4, etc.

2. **System Prompt**
   - Customize agent behavior
   - Example: "You are a customer support agent for..."

3. **Features** (future)
   - Tool/plugin installation
   - Custom memory settings
   - Rate limiting preferences

### Endpoint

**POST /api/agent/settings**
```json
{
  "primaryModel": "anthropic/claude-sonnet-4-6",
  "systemPrompt": "You are helpful..."
}
```

---

## User Journey

### 1. First-time Setup
```
User upgrades to Starter
  ↓
Droplet provisioned (1-2 min)
  ↓
User sees agent IP in dashboard
  ↓
Clicks "Open UI" → Lands in OpenClaw web interface
  ↓
Sees 1,000 monthly credits available
  ↓
Optionally adds external API keys (OpenAI, Google, etc.)
  ↓
Configures primary model and system prompt
  ↓
Ready to use!
```

### 2. Making API Calls
```
Agent in OpenClaw web UI
  ↓
User sends prompt
  ↓
Agent checks available models:
   1. User's configured primary model (if key available)
   2. Fallback to Laverdi's DO Gradient model
  ↓
Call executed
  ↓
Usage logged (model, tokens, credits)
  ↓
Credits deducted from monthly balance
```

### 3. Monitoring Usage
```
User visits /dashboard/agent-control
  ↓
Sees real-time credit balance
  ↓
Breakdown by model shows highest cost sources
  ↓
Can optimize by:
   - Switching to cheaper models
   - Adding external provider keys
   - Upgrading to higher tier
```

---

## Configuration

### Environment Variables
```bash
# Encryption for API keys
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Used by agent to access user's provider keys
SUPABASE_SERVICE_ROLE_KEY=...
```

### Credit Pricing (Configurable)
In `pages/api/usage/stats.ts`:

```typescript
const MODEL_COSTS: Record<string, number> = {
  "claude-opus-4.6": 0.015,     // cents per token
  "claude-sonnet-4.6": 0.003,
  "claude-haiku-4.5": 0.0008,
  "gpt-5.4": 0.01,
  "gpt-4o": 0.0015,
  deepseek: 0.001,
};
```

### Credit Limits (Configurable)
```typescript
const TIER_CREDITS: Record<string, number> = {
  free: 100,
  starter: 1000,
  pro: 5000,
};
```

---

## Future Enhancements

### Short-term
1. [ ] Credit purchase/top-up (outside monthly allotment)
2. [ ] Usage alerts (notify at 80%, 100%)
3. [ ] Cost estimation before API call
4. [ ] Spending limits per month

### Medium-term
1. [ ] Multi-agent management (multiple agents per user)
2. [ ] Shared teams (manage agents as a group)
3. [ ] Custom webhooks for usage events
4. [ ] Audit log (view all API key accesses)

### Long-term
1. [ ] Advanced analytics (cost trends, ROI)
2. [ ] Auto-scaling models based on cost/speed tradeoffs
3. [ ] Third-party marketplace (plugins, tools)
4. [ ] Custom billing rules (per-team, per-project)

---

## Security Checklist

- [x] API keys encrypted at rest (AES-256-GCM)
- [x] User isolation (RLS policies)
- [x] Audit trail (usage_logs)
- [x] Key rotation support
- [x] Immediate revocation on delete
- [ ] Rate limiting on key management endpoints
- [ ] API key expiration/rotation enforced
- [ ] Monitoring for suspicious key usage patterns

---

## Testing

### Manual Testing

1. **Add Provider Key**
   ```
   POST /api/provider-keys
   { "provider": "openai", "key": "sk_..." }
   ```

2. **List Keys**
   ```
   GET /api/provider-keys
   ```

3. **Check Usage**
   ```
   GET /api/usage/stats
   ```

4. **Delete Key**
   ```
   DELETE /api/provider-keys/:id
   ```

### Monitoring

```sql
-- Top models by credit usage this month
SELECT model, SUM(token_count) as total_tokens, COUNT(*) as calls
FROM usage_logs
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY model
ORDER BY total_tokens DESC;

-- Users near credit limit
SELECT u.id, u.email, u.tier, umc.credits_remaining
FROM users u
JOIN user_monthly_credits umc ON u.id = umc.user_id
WHERE umc.credits_remaining < umc.monthly_limit * 0.1;

-- Active provider keys per user
SELECT user_id, COUNT(*) as key_count, array_agg(provider) as providers
FROM provider_keys
WHERE is_active = true
GROUP BY user_id;
```

---

## Deployment

1. Run migration: `002_add_provider_keys.sql`
2. Set `ENCRYPTION_KEY` in `.env`
3. Deploy new API endpoints
4. Update dashboard navigation
5. Monitor first few users
6. Adjust credit pricing if needed
