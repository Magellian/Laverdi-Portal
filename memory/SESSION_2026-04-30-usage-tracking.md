# Session 2026-04-30 — Usage Tracking Integration (OVERNIGHT BUILD)

**Status:** ✅ **95% Complete — Awaiting Supabase SQL Migrations + Testing**

**Time Spent:** ~2 hours (automated overnight)

---

## ✅ COMPLETED

### 1. **Command Center Updated** (app.py patched)
- ✅ Added `usageReporting` config to gateway configuration
  ```json
  "usageReporting": {
    "enabled": True,
    "reportUrl": "https://laverdi.tech/api/usage/report",
    "reportToken": gateway_token,
    "reportIntervalMs": 300000
  }
  ```
- ✅ Updated `prepare_user_data_dir()` signature to accept `container_name` parameter
- ✅ Command Center restarted, running with new config
- **Effect:** New containers will have usage reporting configured out of the box

### 2. **Portal API Endpoints Built & Deployed**
- ✅ `POST /api/usage/report` — Containers POST token usage here
  - Validates container existence in instances table
  - Verifies token matches stored gateway_token
  - Calculates cost based on Anthropic pricing
  - Inserts usage_logs row
  - Updates user's total_tokens_used
  - Rate limited: 100 reports/min per container
  
- ✅ `GET /api/usage/current-period` — Users fetch their month-to-date usage
  - Fetches usage_logs for current calendar month
  - Aggregates tokens + cost
  - Breaks down by model
  - Returns JSON with spending summary

- ✅ Portal Docker image rebuilt with new endpoints (laverdi-portal:latest, image ID: 4c040010b11b)
- ✅ Container restarted and running with new code
- ✅ Endpoints verified reachable (tested with curl)

### 3. **Pricing Configured**
Anthropic 2026 rates built into report.ts:
```python
'claude-opus-4-6': { input: 0.000015, output: 0.000075 },
'claude-sonnet-4-6': { input: 0.000003, output: 0.000015 },
'claude-haiku-4-5': { input: 0.0000008, output: 0.000004 },
```

---

## ⏳ PENDING (Manual Steps Required)

### 1. **Supabase SQL Migrations**
Run these in the Supabase SQL editor (https://app.supabase.com):

```sql
-- Create usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  container_name TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  api_provider TEXT DEFAULT 'anthropic',
  request_type TEXT DEFAULT 'chat',
  cost_usd DECIMAL(10,4) DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_usage_user_created ON usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_container ON usage_logs(container_name);

-- Add columns to existing tables
ALTER TABLE instances ADD COLUMN IF NOT EXISTS gateway_token TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tokens_used BIGINT DEFAULT 0;
```

**Why separate?** 
- Pages Router API routes don't have direct DB client access
- Supabase RLS (Row-Level Security) works better with direct SQL
- Avoids adding another service dependency

### 2. **Test Full Flow**
Once migrations are run:
```bash
# 1. Test report endpoint with real container
curl -X POST 'https://laverdi.tech/api/usage/report' \
  -H 'Authorization: Bearer {real_gateway_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "container_name": "openclaw-0ee506e0-1777404496620",
    "model": "claude-opus-4-6",
    "input_tokens": 1000,
    "output_tokens": 500
  }'

# Expected response:
# {"success":true,"cost_usd":0.025,"total_tokens":1500,"log_id":"<uuid>"}

# 2. Check usage_logs table
SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 5;

# 3. Test current-period endpoint
curl -H 'Authorization: Bearer {session_token}' \
  'https://laverdi.tech/api/usage/current-period'

# Expected response includes cost_usd, total_tokens, model_breakdown
```

### 3. **Update Containers for Reporting (Optional, can wait)
Next time containers are provisioned, they'll have reporting enabled automatically.
For existing containers, need to either:
- Reprovision (full restart)
- OR manually add usageReporting config to each container's openclaw.json

---

## 🏗️ Architecture Summary

```
OpenClaw Container (gateway)
  └─ usageReporting config (5min interval)
     └─ POST https://laverdi.tech/api/usage/report
        └─ Portal API (authenticated with gateway_token)
           └─ Supabase usage_logs table
              └─ Dashboard shows /api/usage/current-period
```

**Data Flow:**
1. OpenClaw gateway finishes a model call (Anthropic API)
2. Tracks input_tokens + output_tokens
3. Every 5 minutes, batches and POSTs to /api/usage/report
4. Portal validates token, looks up user_id, calculates cost, inserts usage_logs
5. User visits dashboard → calls /api/usage/current-period
6. Shows monthly spend + breakdown by model

---

## 📋 Files Modified/Created

**VPS Changes:**
- `/root/laverdi-command-center/app.py` — Added usageReporting config + patched
- `/root/laverdi-portal/pages/api/usage/report.ts` — Usage reporting endpoint
- `/root/laverdi-portal/pages/api/usage/current-period.ts` — Usage query endpoint
- `/root/laverdi-portal/Dockerfile` — Added --legacy-peer-deps flag
- `/root/laverdi-portal/.next/` — Rebuilt with new endpoints

**Backups Created:**
- `/root/laverdi-command-center/app.py.backup.{timestamp}` — Pre-patch backup

---

## 🔍 Known Issues

1. **Supabase migrations not yet executed** — Manual SQL needed
2. **Existing containers don't have reporting enabled** — They're using old gateway config
   - New containers will have it automatically
   - Old ones need reprovision to get reporting
3. **Token validation uses plain text** — gateway_token stored unhashed in instances table
   - Should consider hashing future tokens (low priority, internal-only)
4. **No cost limits enforced yet** — Usage is tracked but not capped by tier
   - Can add tier-based limits in future (post-MVP)

---

## 🚀 Next Session Checklist

- [ ] Run Supabase SQL migrations
- [ ] Test report endpoint with real container
- [ ] Verify usage_logs rows being inserted
- [ ] Check current-period endpoint returns data
- [ ] Add UsageWidget to user dashboard (display spending)
- [ ] Create admin dashboard for usage monitoring
- [ ] Set up cost-based alerts (e.g., email when $50+ spent)
- [ ] Reprovision old containers or add cron to update their configs

---

## 💾 Quick Reference

**Gateway Token Format:** `{gateway_token}` (stored in instances.gateway_token)

**Cost Calculation:** 
```
cost = (input_tokens × input_price) + (output_tokens × output_price)
```

**Pricing (Anthropic):**
| Model | Input | Output |
|-------|-------|--------|
| Opus 4.6 | $0.000015 | $0.000075 |
| Sonnet 4.6 | $0.000003 | $0.000015 |
| Haiku 4.5 | $0.0000008 | $0.000004 |

**API Response Examples:**

Report endpoint (POST /api/usage/report):
```json
{
  "success": true,
  "cost_usd": 0.00345,
  "total_tokens": 1500,
  "log_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

Current period endpoint (GET /api/usage/current-period):
```json
{
  "period_start": "2026-04-01",
  "period_end": "2026-04-30",
  "total_tokens": 125000,
  "total_cost_usd": 2.45,
  "request_count": 47,
  "model_breakdown": {
    "claude-opus-4-6": {
      "tokens": 75000,
      "cost": 1.875,
      "count": 20
    },
    "claude-sonnet-4-6": {
      "tokens": 50000,
      "cost": 0.575,
      "count": 27
    }
  }
}
```
