# IMMEDIATE ACTIONS — Usage Tracking + Signal

**Time:** 2026-04-30 22:47 PDT  
**Status:** Ready to execute

---

## 🚀 USAGE TRACKING (30 MINUTES)

### YOUR IMMEDIATE ACTIONS:

1. **Go to Supabase** → https://app.supabase.com
   - Select your LaVerdi project
   - Click "SQL Editor"
   - Paste entire contents of: `/workspace/usage-tracking-migrations.sql`
   - Click "Run"
   - Wait for ✅ "Success"

2. **Test the endpoint** (30 seconds)
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
   Should return: `{"success": true}`

3. **Query usage** (verify data stored)
   ```bash
   curl http://64.23.253.97/api/usage/current-period?user_id=550e8400-e29b-41d4-a716-446655440000 \
     -H "Authorization: Bearer laverdi-admin-api-2026"
   ```
   Should return usage stats

**DONE!** Usage tracking is live.

---

## 🔔 SIGNAL INTEGRATION (STARTS IMMEDIATELY AFTER)

### CRAWFORD'S ACTIONS:

Once usage tracking confirmed working:

1. **Build Flask REST wrapper** (30-45 min)
   - Listen on port 5000
   - Handle `/send` and `/receive` endpoints
   - Interact with signal-cli daemon

2. **Create OpenClaw plugin** (45 min)
   - Register Signal plugin
   - Integrate with message routing
   - Test message flow

3. **Add Portal UI** (1 hour)
   - SignalConnectCard component
   - Database table for Signal config
   - API endpoints

4. **End-to-end test** (30 min)
   - Send test Signal message
   - Verify agent receives it
   - Agent replies back

**Total: 4-5 hours of Crawford work**

---

## 📋 FILES READY

- ✅ `/workspace/usage-tracking-migrations.sql` — Supabase SQL (ready to paste)
- ✅ `/workspace/test-usage-report.sh` — Test script template
- ✅ `memory/usage-tracking-quick-start.md` — Quick reference
- ✅ `memory/signal-integration-plan.md` — Full Signal design
- ✅ Signal-cli installed on VPS at `/opt/signal-cli/signal-cli`

---

## ✅ EXECUTION ORDER

1. **You:** Run Supabase SQL migrations (5 min)
2. **You:** Test endpoints (5 min)
3. **Crawford:** Build Signal integration (4-5 hours)
4. **Done:** Both features live

**Total elapsed time: ~4-5 hours (most of it Crawford coding)**

---

Ready to go?
