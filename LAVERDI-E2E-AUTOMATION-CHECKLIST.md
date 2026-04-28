# Laverdi Portal E2E Automation Checklist

**Goal:** User signs up → Automatic OpenClaw instance provisioned on their own droplet → Dashboard shows connection details → They can use it immediately

---

## Phase 1: Stripe Webhook Handler ✅/🔄

### 1.1 Stripe Event Processing
- [ ] **File:** `pages/api/webhooks/stripe.ts`
- [ ] Listen for `customer.subscription.created` event (new subscription)
- [ ] Validate Stripe signature (security check)
- [ ] Extract from webhook:
  - `customer.id` (Stripe customer ID)
  - `subscription.items[0].price.product` (product ID)
  - `subscription.metadata` (custom data)
- [ ] Map to user:
  - Look up user by Stripe customer ID in Supabase
  - Get user's Supabase `user_id` and tier (free/starter/pro)

**Test Case:**
```bash
# Simulate Stripe webhook locally
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "stripe-signature: <signature>" \
  -d '{"type":"customer.subscription.created","data":{"object":{"customer":"cus_xxx","items":{"data":[{"price":{"product":"prod_xxx"}}]}}}}'
```

### 1.2 Subscription Created → Trigger Provisioning
- [ ] On successful subscription (free/starter/pro):
  - Call `provisionDroplet(userId, tier)`
  - Wait for provisioning to complete
  - Return success/error status
- [ ] Log the action in Supabase (audit trail)
- [ ] Handle failures gracefully (retry logic)

---

## Phase 2: Droplet Provisioning Engine ✅/🔄

### 2.1 Droplet Creation (`lib/droplet-provisioner.ts`)
- [ ] **File:** `lib/droplet-provisioner.ts`
- [ ] Take inputs: `userId`, `tier` → determine droplet size
  - Free: 1 vCPU, 512 MB RAM (smallest)
  - Starter: 2 vCPU, 2 GB RAM
  - Pro: 4 vCPU, 8 GB RAM
- [ ] Generate user data script:
  - Bash script that runs on first boot
  - Installs Docker
  - Clones your git repo (agent-service, command-center, portal)
  - Builds Docker images
  - Starts containers (laverdi-agent, laverdi-nginx, laverdi-command-center)
- [ ] Call DO API to create droplet:
  ```
  POST https://api.digitalocean.com/v2/droplets
  {
    "name": "laverdi-agent-<userId>",
    "region": "sfo3",
    "size": "s-1vcpu-512mb-10gb" (or larger for tiers),
    "image": "ubuntu-22-04-x64",
    "user_data": <bash script>,
    "tags": ["laverdi", "user:<userId>"]
  }
  ```
- [ ] Capture response:
  - `droplet.id` → save to DB
  - `droplet.networks.v4[0].ip_address` → save as public IP
  - Status: "provisioning"

**Test Case:**
```javascript
const droplet = await provisionDroplet('user-123', 'starter');
console.log(droplet.id); // Should return droplet ID
console.log(droplet.ip); // Should return public IP
```

### 2.2 Store Droplet Info in Supabase
- [ ] **Table:** `user_droplets` (create if not exists)
  ```sql
  CREATE TABLE user_droplets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    droplet_id BIGINT UNIQUE NOT NULL,
    public_ip VARCHAR(15),
    private_ip VARCHAR(15),
    region VARCHAR(10),
    tier VARCHAR(20),
    status VARCHAR(20) DEFAULT 'provisioning', -- provisioning, ready, error
    pairing_token VARCHAR(256),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE(user_id) -- one droplet per user
  );
  ```
- [ ] Insert/update row when droplet created
- [ ] Set status = "provisioning"

---

## Phase 3: Droplet Bootstrap Script 🔄

### 3.1 User Data Script Generation
- [ ] **Create:** `lib/user-data-template.sh` (bash script template)
- [ ] Script does on first boot:
  ```bash
  #!/bin/bash
  set -e
  
  # 1. Update system
  apt-get update && apt-get upgrade -y
  
  # 2. Install Docker
  curl -fsSL https://get.docker.com | sh
  
  # 3. Clone repo
  cd /tmp && git clone https://github.com/<your-org>/laverdi-portal.git
  cd laverdi-portal
  
  # 4. Build images
  docker build -t laverdi-agent:latest ./agent-service
  docker build -t laverdi-command-center:latest ./command-center
  
  # 5. Create network
  docker network create laverdi-net
  
  # 6. Start containers
  docker run -d --name laverdi-agent --network laverdi-net -p 5000:5000 laverdi-agent:latest
  docker run -d --name laverdi-command-center --network laverdi-net -p 8000:8000 laverdi-command-center:latest
  docker run -d --name laverdi-nginx --network laverdi-net -p 80:80 -p 443:443 -v /etc/nginx/nginx.conf:/etc/nginx/nginx.conf:ro nginx:alpine
  
  # 7. Callback to portal to say we're ready
  curl -X POST https://laverdi.example.com/api/webhooks/do-callback \
    -H "Content-Type: application/json" \
    -d "{\"droplet_id\": <DROPLET_ID>, \"public_ip\": \"<PUBLIC_IP>\", \"user_id\": \"<USER_ID>\"}"
  ```
- [ ] Inject into droplet creation (DO API `user_data` field)
- [ ] Make sure script is base64-encoded (DO requirement)

**Key:** Script must call back to portal when ready (see Phase 4)

---

## Phase 4: Droplet Ready Callback 🔄

### 4.1 Webhook Endpoint for Droplet Callback
- [ ] **File:** `pages/api/webhooks/do-callback.ts`
- [ ] Receives POST from new droplet with:
  ```json
  {
    "droplet_id": 12345678,
    "public_ip": "192.0.2.1",
    "user_id": "user-uuid"
  }
  ```
- [ ] Validate:
  - User exists in Supabase
  - Droplet matches their user_id
  - IP is valid
- [ ] Update Supabase:
  ```sql
  UPDATE user_droplets
  SET 
    public_ip = $1,
    status = 'ready',
    updated_at = NOW()
  WHERE user_id = $2 AND droplet_id = $3
  ```
- [ ] Generate pairing token (UUID):
  - Store in `pairing_token` column
  - Use for OpenClaw device pairing
- [ ] Send email to user:
  - Subject: "Your OpenClaw Agent is Ready!"
  - Body: "Your agent is live at: `<public_ip>:<port>`"
  - Include pairing token for linking

**Test Case:**
```bash
# Simulate droplet callback
curl -X POST http://localhost:3000/api/webhooks/do-callback \
  -H "Content-Type: application/json" \
  -d '{"droplet_id":12345,"public_ip":"192.0.2.1","user_id":"user-123"}'

# Check Supabase — user_droplets should be updated with status='ready'
```

### 4.2 Email Notification
- [ ] Use SendGrid or similar to send:
  ```
  To: user@email.com
  Subject: Your OpenClaw Agent is Ready!
  
  Your agent is live and ready to connect:
  
  • IP: 192.0.2.1
  • Port: 3000 (Portal), 5000 (Agent API), 8000 (Dashboard)
  • Pairing Token: <token>
  
  Next steps:
  1. Open http://192.0.2.1:3000 in your browser
  2. Use pairing token to link your account
  3. Add API keys (OpenAI, Anthropic, etc.)
  4. Set up integrations (Telegram, Discord, etc.)
  ```

---

## Phase 5: Dashboard Integration 🔄

### 5.1 Show Droplet Info on User Dashboard
- [ ] **File:** `pages/dashboard/agent.tsx`
- [ ] Query Supabase:
  ```sql
  SELECT * FROM user_droplets WHERE user_id = $1
  ```
- [ ] Display:
  - Droplet status (provisioning / ready / error)
  - If ready: public IP, port, pairing status
  - If provisioning: "Your agent is starting... refresh in 30 seconds"
  - Action: "Copy IP to Clipboard" button
  - Action: "Open Agent" button (http://IP:3000)

### 5.2 Connection Test
- [ ] Add "Test Connection" button that:
  - Calls `GET https://<droplet_ip>:5000/health`
  - Shows "✓ Connected" or "✗ Connection Failed"
  - Helps user debug network issues

---

## Phase 6: Multi-Agent Support (Optional But Recommended) 🔄

### 6.1 Allow Multiple Agents Per User
- [ ] **Tier Limits:**
  - Free: 1 agent
  - Starter: 3 agents
  - Pro: 10 agents
- [ ] Endpoint: `POST /api/agents/provision`
  - Input: `userId`, `agentName`
  - Creates new droplet for this agent
  - Returns agent IP + pairing token
- [ ] Database:
  ```sql
  CREATE TABLE user_agents (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    droplet_id BIGINT UNIQUE,
    name VARCHAR(255),
    status VARCHAR(20),
    public_ip VARCHAR(15),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
  );
  ```

---

## Phase 7: Integration Setup 🔄

### 7.1 Telegram Bot Integration
- [ ] **File:** `pages/api/integrations/telegram/setup.ts`
- [ ] User provides:
  - Telegram Bot Token (from BotFather)
  - Chat ID (user's chat with bot)
- [ ] Store encrypted in Supabase:
  ```sql
  CREATE TABLE integrations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(50), -- 'telegram', 'discord', 'whatsapp', 'slack', 'email'
    token_encrypted TEXT,
    config JSONB,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
  );
  ```
- [ ] Webhook endpoint: `POST /api/webhooks/telegram`
  - Telegram sends message → portal receives it
  - Forward to agent at `https://<droplet_ip>:5000/message`
  - Agent processes, responds
  - Send response back to Telegram

### 7.2 Discord Integration
- [ ] Similar flow:
  - Store bot token + server ID
  - Webhook: `POST /api/webhooks/discord`
  - Messages → agent → responses back to Discord

### 7.3 WhatsApp, Slack, Email
- [ ] Same pattern for each platform

---

## Phase 8: Testing & Verification 🔄

### 8.1 End-to-End Test (Manual)
- [ ] Create test account on portal
- [ ] Choose "Starter" tier
- [ ] Go through Stripe test payment (use test card: `4242 4242 4242 4242`)
- [ ] Verify:
  - [ ] Stripe webhook fires (check logs)
  - [ ] Droplet created in DO (check DO console)
  - [ ] Supabase `user_droplets` updated
  - [ ] Droplet boots and runs user data script (wait ~2 min)
  - [ ] User data script completes, calls callback webhook
  - [ ] Dashboard shows droplet as "ready"
  - [ ] Can click "Open Agent" and see portal
  - [ ] Agent API health check works
  - [ ] Command Center dashboard loads

### 8.2 Automated Tests
- [ ] Unit tests for provisioning logic
- [ ] Mock DO API responses
- [ ] Test Stripe webhook signature validation
- [ ] Test database updates

### 8.3 Error Handling
- [ ] What if droplet fails to create? → Mark as "error", notify user
- [ ] What if callback doesn't arrive? → Timeout after 5 min, offer manual retry
- [ ] What if user deletes subscription? → Delete droplet (add cleanup job)

---

## Phase 9: Production Readiness 🔄

### 9.1 Security
- [ ] Stripe API keys in `.env` (never commit)
- [ ] DO API token in `.env` (never commit)
- [ ] Encrypt sensitive data in Supabase (use `pgcrypto`)
- [ ] HTTPS only (self-signed cert OK for testing)
- [ ] Rate limiting on webhook endpoints

### 9.2 Monitoring
- [ ] Log all provisioning steps (CloudWatch, Datadog, etc.)
- [ ] Alert if provisioning fails
- [ ] Monitor droplet health (CPU, memory, disk)
- [ ] Track subscription lifecycle (created, updated, cancelled)

### 9.3 Documentation
- [ ] User onboarding guide
- [ ] Admin dashboard (see all users, agents, droplets)
- [ ] Troubleshooting guide

---

## Summary Checklist

**Priority 1 (Blocking):**
- [ ] Stripe webhook handler (Phase 1)
- [ ] Droplet provisioner (Phase 2)
- [ ] User data script (Phase 3)
- [ ] DO callback webhook (Phase 4)
- [ ] Dashboard integration (Phase 5)

**Priority 2 (High):**
- [ ] Multi-agent support (Phase 6)
- [ ] Integration setup (Phase 7)
- [ ] E2E testing (Phase 8)

**Priority 3 (Polish):**
- [ ] Security hardening (Phase 9)
- [ ] Monitoring & alerts
- [ ] Documentation

---

## Quick Start (Today)

1. **Review existing code:**
   - Do you have `lib/droplet-provisioner.ts`? 
   - Do you have `pages/api/webhooks/stripe.ts`?
   - Do you have `pages/api/webhooks/do-callback.ts`?

2. **If missing, create minimal versions:**
   - Start with Phase 1 (Stripe webhook)
   - Test with Stripe test mode
   - Add each phase incrementally

3. **Test manually:**
   - Sign up as test user
   - Go through Stripe checkout
   - Watch droplet creation in DO console
   - Verify callback webhook fires

Would you like me to create these files from scratch, or do some already exist in your codebase?
