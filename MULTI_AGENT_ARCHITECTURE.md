# Multi-Agent Architecture

Users can provision and manage multiple OpenClaw agents, all sharing a single tier-based credit pool.

---

## Overview

**Key Principle:** All agents owned by a user share the same monthly credit allocation.

```
User (Starter Tier)
├─ 1,000 credits/month (shared pool)
│
├─ Agent 1: Support Bot (uses 300 credits)
├─ Agent 2: Data Analyzer (uses 400 credits)
└─ Agent 3: Email Processor (uses 250 credits)
   
Total used: 950 / 1,000 credits
```

---

## Agent Limits by Tier

| Tier | Agents | Monthly Credits | Credits/Agent |
|------|--------|-----------------|---------------|
| Free | 1 | 100 | ~100 avg |
| Starter | 3 | 1,000 | ~333 avg |
| Pro | 10 | 5,000 | ~500 avg |

**Important:** All agents share the pool — users can't exceed tier limits even if they have multiple agents.

---

## Database Schema

### `agents` Table
Represents individual agents owned by a user.

```sql
id UUID PRIMARY KEY
user_id UUID (FK users)
name TEXT
description TEXT
droplet_id INTEGER (FK user_droplets)
is_primary BOOLEAN
is_active BOOLEAN
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP
```

### `user_agents` View
Combined agent + droplet info:

```sql
id, user_id, name, description
is_primary, is_active
droplet_id, ip_address, port, tier, status
created_at
```

### `user_shared_credit_pool` View
Real-time credit stats for all agents:

```sql
user_id, tier, monthly_limit
credits_used (sum across ALL agents)
credits_remaining
agent_count
reset_date
```

### `usage_logs` Enhanced
Tracks which agent made each call:

```sql
id UUID
user_id UUID (which user)
agent_id UUID (which agent)
droplet_id INTEGER (which droplet)
model TEXT
token_count INTEGER
created_at TIMESTAMP
```

---

## API Endpoints

### Provision Agent
**POST /api/agents/provision**

Request:
```json
{
  "agentName": "Support Bot"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "agentId": "uuid-123",
    "agentName": "Support Bot",
    "dropletId": 561234567,
    "ipAddress": "192.0.2.1",
    "status": "provisioning"
  }
}
```

### List Agents & Credit Pool
**GET /api/agents**

Response:
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "uuid-1",
        "name": "Support Bot",
        "isPrimary": true,
        "isActive": true,
        "endpoint": "http://192.0.2.1:18789",
        "status": "active",
        "createdAt": "2026-04-18T15:30:00Z"
      }
    ],
    "creditPool": {
      "tier": "starter",
      "monthlyLimit": 1000,
      "creditsUsed": 450,
      "creditsRemaining": 550,
      "agentCount": 1,
      "resetDate": "2026-05-01T00:00:00Z"
    },
    "agentLimit": 3
  }
}
```

### Delete Agent
**DELETE /api/agents/:id**

Response:
```json
{
  "success": true
}
```

### Usage Stats (Updated)
**GET /api/usage/stats**

Now shows breakdown per agent:

```json
{
  "success": true,
  "data": {
    "tier": "starter",
    "monthlyCredits": 1000,
    "creditsUsed": 450,
    "creditsRemaining": 550,
    "modelUsage": [
      {
        "model": "claude-sonnet-4.6",
        "creditsUsed": 300,
        "callCount": 100
      }
    ]
  }
}
```

---

## Usage Tracking Flow

### When Agent Makes API Call

1. **Agent** executes prompt using a model
2. **Droplet** logs to `usage_logs`:
   ```sql
   {
     user_id: 'user-123',
     agent_id: 'agent-uuid',
     droplet_id: 561234567,
     model: 'claude-sonnet-4.6',
     token_count: 1500,
     created_at: NOW()
   }
   ```

3. **Usage Stats API** queries:
   - `user_shared_credit_pool` view
   - Sums ALL usage for the user (all agents)
   - Calculates remaining credits
   - Enforces tier limit

4. **Result:** If user exceeds monthly limit:
   - Call rejected with error
   - User must wait for monthly reset
   - (Or upgrade tier)

---

## Example Scenarios

### Scenario 1: User with 3 Agents
```
User: Chris (Starter, 1,000 credits/month)

Agents:
1. Support Bot (primary)
   - Used 300 credits
   - 45 calls

2. Data Analyzer
   - Used 350 credits
   - 20 calls

3. Email Processor
   - Used 200 credits
   - 80 calls

Total: 850 credits used / 1,000 available
Remaining: 150 credits

All three agents compete for the same 150 credits
remaining until reset on May 1.
```

### Scenario 2: Upgrade Tier
```
User: Jane (Free, 100 credits/month)
- 1 Agent: Support Bot
- Credits used: 80
- Remaining: 20

Jane upgrades to Starter (1,000 credits)
- Same 1 Agent continues
- Credits reset to 1,000 on next month
- Can now provision 2 more agents
```

### Scenario 3: Out of Credits
```
User: Bob (Free, 100 credits/month)
- 1 Agent: Data Processor
- Credits used: 100
- Remaining: 0

Bob tries to make API call
→ Error: "Monthly credit limit exceeded"
→ Options:
   - Wait for reset (May 1)
   - Upgrade to Starter
```

---

## Dashboard Pages

### `/dashboard/agents`
Main agent management:
- List all agents (name, status, IP, endpoint)
- Shared credit pool progress bar
- Provision new agent (if limit not reached)
- Delete agent
- Quick links to each agent's web UI

### `/dashboard/agent-control`
Single agent control (primary/selected):
- Same as before
- Shows usage for THIS agent specifically
- Provider API key management
- Agent settings

---

## Provisioning Flow (Multi-Agent)

```
User clicks "New Agent"
  ↓
Check agent limit (free=1, starter=3, pro=10)
  ↓
If limit reached:
  → Error: "Agent limit reached for [tier]"
  → User must delete agent or upgrade
  ↓
If limit OK:
  → Call createUserDroplet()
  → Create agents table record
  → Agent starts provisioning
  ↓
After ~2 min:
  → Agent becomes "active"
  → Shows in dashboard
  → Shares credit pool with other agents
```

---

## Billing Logic

### Credit Calculation

```sql
-- Get shared pool stats (user_shared_credit_pool view)
SELECT 
  monthly_limit,     -- Based on tier (100/1000/5000)
  SUM(credits_used)  -- Sum ALL agents
FROM usage_logs
WHERE user_id = :user_id
  AND DATE_TRUNC('month', created_at) = THIS_MONTH

-- If SUM(credits_used) >= monthly_limit:
→ Reject new API calls
```

### Monthly Reset

Automatic on 1st of each month:
- All agents' usage resets
- Credits reset to tier limit
- Counters start at 0

---

## Security

### RLS Policies

```sql
-- agents table
-- Users can only see their own agents
WHERE auth.uid() = user_id

-- usage_logs table
-- Users can see their own usage
WHERE user_id IN (SELECT id FROM users WHERE auth.uid() = id)

-- user_shared_credit_pool view
-- Limited to authenticated users
GRANT SELECT ON user_shared_credit_pool TO authenticated
```

### Audit Trail

Every agent operation logged:
- Provision: `agent_audit_log` records `action='provision'`
- Delete: `agent_audit_log` records `action='delete'`
- Error: `agent_audit_log` records `action='error'`, `details={'error': '...'}`

---

## Configuration

### Agent Limits (Configurable)

In provisioning logic:
```typescript
const agentLimit = {
  free: 1,
  starter: 3,
  pro: 10,
}[tier] || 1;
```

Change limits in `pages/api/agents/provision.ts`.

### Credit Pricing (Configurable)

In `pages/api/usage/stats.ts`:
```typescript
const MODEL_COSTS: Record<string, number> = {
  "claude-opus-4.6": 0.015,
  "claude-sonnet-4.6": 0.003,
  "claude-haiku-4.5": 0.0008,
  "gpt-5.4": 0.01,
};
```

---

## Testing

### Manual Testing

1. **Provision Multiple Agents**
   ```bash
   POST /api/agents/provision
   { "agentName": "Agent 1" }
   
   POST /api/agents/provision
   { "agentName": "Agent 2" }
   
   POST /api/agents/provision
   { "agentName": "Agent 3" }
   ```

2. **Check Shared Credits**
   ```bash
   GET /api/agents
   
   Response shows:
   - All 3 agents
   - Shared credit pool (1,000 for Starter)
   ```

3. **Make API Call from Agent 1**
   ```bash
   # Agent 1 makes a call (uses 100 credits)
   # Check shared pool: 900 remaining
   ```

4. **Make API Call from Agent 2**
   ```bash
   # Agent 2 makes a call (uses 200 credits)
   # Check shared pool: 700 remaining
   # (Both agents consumed from same 1,000)
   ```

5. **Try to Exceed Limit**
   ```bash
   # Make calls until credits = 0
   # Next call fails: "Monthly credit limit exceeded"
   ```

### Monitoring Queries

```sql
-- Agents per user
SELECT user_id, COUNT(*) as agent_count
FROM agents
WHERE deleted_at IS NULL
GROUP BY user_id
ORDER BY agent_count DESC;

-- Users exceeding 80% of credits
SELECT u.id, u.email, u.tier, uscp.credits_remaining, uscp.monthly_limit
FROM users u
JOIN user_shared_credit_pool uscp ON u.id = uscp.user_id
WHERE (uscp.credits_used / uscp.monthly_limit) > 0.8;

-- Top agents by credit usage
SELECT a.id, a.name, a.user_id, COUNT(*) as calls, SUM(ul.token_count) as total_tokens
FROM agents a
LEFT JOIN usage_logs ul ON a.id = ul.agent_id
WHERE DATE_TRUNC('month', ul.created_at) = DATE_TRUNC('month', NOW())
GROUP BY a.id, a.name, a.user_id
ORDER BY total_tokens DESC;
```

---

## Future Enhancements

1. **Per-Agent Limits**
   - Option to set limits per agent
   - Prevent one agent from consuming all credits

2. **Priority/QoS**
   - Primary agent gets priority during shortage
   - Secondary agents degrade gracefully

3. **Credit Sharing**
   - Teams: Multiple users share a credit pool
   - Fine-grained role management

4. **Auto-scaling**
   - Smaller droplets when agent idle
   - Larger when in heavy use

5. **Marketplace**
   - Share agents with others
   - Rent out idle agents

---

## Migration Path

### From Single-Agent to Multi-Agent

1. **Run migration:** `003_multi_agent_support.sql`
2. **Create agents records** for existing user_droplets:
   ```sql
   INSERT INTO agents (user_id, name, droplet_id, is_primary, is_active)
   SELECT DISTINCT user_id, 'default', droplet_id, true, true
   FROM user_droplets
   WHERE deleted_at IS NULL;
   ```
3. **Update usage_logs** to link to agents
4. **Test views** (user_agents, user_shared_credit_pool)
5. **Deploy new UI pages** (/dashboard/agents)
6. **Gradually migrate users** to multi-agent dashboard
