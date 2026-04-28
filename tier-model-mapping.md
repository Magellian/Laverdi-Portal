# Tier-Based Model Mapping System

## Database Schema Updates

### 1. Add columns to `users` table (Supabase)

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS model_id TEXT DEFAULT 'anthropic-claude-haiku-4.5';
ALTER TABLE users ADD COLUMN IF NOT EXISTS do_api_key_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS openclaw_base_url TEXT DEFAULT 'https://inference.do-ai.run/v1';
```

### 2. Create `model_tier_map` table

```sql
CREATE TABLE IF NOT EXISTS model_tier_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE,
  model_id TEXT NOT NULL,
  price_monthly INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO model_tier_map (tier, model_id, price_monthly, description) VALUES
  ('free', 'anthropic-claude-haiku-4.5', 0, 'Best bang-for-buck, fast inference'),
  ('starter', 'anthropic-claude-4.6-sonnet', 99, 'General-purpose, balanced'),
  ('professional', 'anthropic-claude-opus-4.6', 249, 'Most capable, advanced reasoning')
ON CONFLICT(tier) DO UPDATE SET
  model_id = EXCLUDED.model_id,
  price_monthly = EXCLUDED.price_monthly;
```

## API Endpoints

### 1. GET `/api/models/tier-mapping`
Returns current tier → model mapping

```typescript
// Response
{
  "tiers": [
    {
      "tier": "free",
      "model_id": "anthropic-claude-haiku-4.5",
      "price_monthly": 0,
      "description": "Best bang-for-buck, fast inference"
    },
    ...
  ]
}
```

### 2. POST `/api/provision-openclaw-user`
Provisions OpenClaw container with correct model based on user tier

**Input:**
```json
{
  "userId": "user-uuid",
  "tier": "starter"
}
```

**Output:**
```json
{
  "success": true,
  "container": {
    "id": "openclaw-user-uuid",
    "model_id": "anthropic-claude-4.6-sonnet",
    "endpoint": "https://inference.do-ai.run/v1",
    "apiKey": "sk-do-REDACTED_DO_INFERENCE_KEY",
    "port": 8824,
    "url": "http://64.23.142.154:8824"
  }
}
```

## Container Startup (Docker)

```bash
docker run -d \
  --name openclaw-{userId} \
  --network laverdi-net \
  -p {dynamicPort}:18789 \
  -e OPENAI_API_BASE='https://inference.do-ai.run/v1' \
  -e OPENAI_API_KEY='sk-do-REDACTED_DO_INFERENCE_KEY' \
  -e OPENAI_MODEL='{modelId}' \
  laverdi-openclaw:latest
```

## Portal Integration Points

### On User Signup
1. Create user with tier='free'
2. Set model_id='anthropic-claude-haiku-4.5'
3. Store DO key reference (shared across all users)

### On Upgrade (Stripe webhook)
1. Update tier to 'starter' or 'professional'
2. Look up model_id from model_tier_map
3. Call `/api/provision-openclaw-user` to update container
4. OR: Provision new container with new model (preferred)

### User Dashboard
Show:
- Current tier
- Current model (model_id)
- Estimated monthly tokens
- Upgrade/downgrade options

## DO API Key Management

**Current:** Shared key across all users
- **Key:** `sk-do-REDACTED_DO_INFERENCE_KEY`
- **Benefit:** Simpler, single key to manage
- **Security:** Tied to your DO account, usage-based billing, no per-user leakage risk

**Optional:** Per-user keys (future)
- Create key per user for audit trail
- Use DO API: `POST /v2/gen-ai/models/api_keys`
- Store in users.do_api_key_id
