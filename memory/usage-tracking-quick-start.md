# Usage Tracking — Quick Start (30 minutes)

**Status:** Endpoints built. Tables missing. Simple 3-step fix.

---

## STEP 1: Create Supabase Tables (5 min)

Go to: https://app.supabase.com → Your Project → SQL Editor

Copy/paste this entire block:

```sql
-- Usage Tracking Tables for LaVerdi
CREATE TABLE IF NOT EXISTS usage_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  container_id TEXT NOT NULL,
  model_name TEXT,
  input_tokens INT,
  output_tokens INT,
  total_tokens INT,
  cost_usd DECIMAL(10, 6),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_usage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(12, 6) DEFAULT 0,
  tier VARCHAR(50),
  token_limit BIGINT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_reports_user_id ON usage_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_reports_container_id ON usage_reports(container_id);
CREATE INDEX IF NOT EXISTS idx_usage_reports_timestamp ON usage_reports(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_usage_summary_user_id ON user_usage_summary(user_id);

-- RLS
ALTER TABLE usage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own summary"
  ON user_usage_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can write usage"
  ON usage_reports FOR INSERT
  WITH CHECK (true);
```

Click **Run** → Wait for ✅ "Success"

---

## STEP 2: Test the Endpoint (5 min)

In Terminal, run:

```bash
curl -X POST http://64.23.253.97/api/usage/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer laverdi-admin-api-2026" \
  -d '{
    "container_id": "test-001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "model": "gpt-opus-4-6",
    "input_tokens": 1000,
    "output_tokens": 500,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

Expected response:
```json
{"success": true, "recorded": true}
```

---

## STEP 3: Query Current Usage (5 min)

```bash
curl -X GET "http://64.23.253.97/api/usage/current-period?user_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer laverdi-admin-api-2026"
```

Should return:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_tokens": 1500,
  "total_cost": 0.045,
  "tier": "professional",
  "tokens_used": 1500,
  "token_limit": null
}
```

---

## Done ✅

Usage tracking is now fully operational:
- ✅ Tables created
- ✅ Endpoints working
- ✅ Ready for containers to report usage
- ✅ Users can query spending

---

## Next: Signal Integration

Once usage tracking is confirmed working, move immediately to Signal integration (signal-cli already installed on VPS).

See: memory/signal-integration-plan.md
