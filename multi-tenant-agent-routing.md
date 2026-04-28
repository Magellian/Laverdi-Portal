# Multi-Tenant OpenClaw Routing Strategy

## Current Issue
All users point to the same `agent.laverdi.tech` instance. This doesn't scale and isn't secure.

## Solution: Dynamic Subdomain Routing

### Architecture
```
User 1: chrisl@fifervcenter.com → https://agent-abc123.laverdi.tech
User 2: user2@example.com      → https://agent-def456.laverdi.tech
User 3: user3@example.com      → https://agent-ghi789.laverdi.tech

(Each with own container, own token, own model)
```

### Implementation Steps

#### 1. DNS Wildcard
Add to DNS: `*.agent.laverdi.tech A 64.23.142.154`
This makes `agent-<anything>.laverdi.tech` → VPS

#### 2. nginx Wildcard Config
```nginx
server {
    listen 443 ssl;
    server_name ~^agent-(?<instance_id>.+)\.laverdi\.tech$;
    
    ssl_certificate /etc/letsencrypt/live/app.laverdi.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.laverdi.tech/privkey.pem;
    
    location / {
        # Route to the user's specific container port
        # Port = 9000 + hash(instance_id) % 1000
        proxy_pass http://127.0.0.1:$instance_port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 3. Provision Script Update
When provisioning a user, allocate:
- Unique instance ID: `abc123` (short UUID)
- Unique port: `9100-9999` (hash-based)
- Container name: `openclaw-abc123`
- Subdomain: `agent-abc123.laverdi.tech`
- Auth token: Random, stored in DB

#### 4. Dashboard Button
```
Button Link: https://agent-${user.instance_id}.laverdi.tech/?token=${user.instance_token}
```

### Database Schema (instances table)
```sql
CREATE TABLE instances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  instance_id VARCHAR(12) UNIQUE,  -- "abc123" 
  port INTEGER UNIQUE,              -- 9123
  subdomain VARCHAR(100),            -- "agent-abc123"
  auth_token VARCHAR(256),           -- OpenClaw token
  model VARCHAR(100),                -- "sonnet"
  status VARCHAR(50),                -- "running", "stopped"
  container_id VARCHAR(256),         -- Docker container ID
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Implementation Order
1. Add DNS wildcard record
2. Update nginx config with regex routing
3. Update provision endpoint to allocate instance_id + port
4. Update instances table schema
5. Update dashboard to use user's subdomain
6. Test with multiple users

### Benefits
- ✅ Isolated instances per user (security)
- ✅ Different models per tier
- ✅ Easy to scale (more containers as needed)
- ✅ Can pause/stop individual instances
- ✅ Usage tracking per instance

### Testing Checklist
- [ ] DNS wildcard propagates
- [ ] nginx routes `agent-abc123.laverdi.tech` to correct port
- [ ] User 1 sees User 2's agent (should fail)
- [ ] User 1 can only access their own auth token URL
- [ ] Multiple users provision simultaneously
