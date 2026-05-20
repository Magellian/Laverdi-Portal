# Gateway Auth Token Provisioning Fix

**Issue:** New LaVerdi instances don't get `gateway.auth.token` generated during provisioning. Customers see "paste token" prompt with no token.

**Root Cause:** Provisioning pipeline creates instance and starts OpenClaw gateway but doesn't inject a unique auth token.

**Impact:** 
- Customer signs up → Instance created → Control UI loads → WebSocket rejects with `reason=token_missing`
- Customer has no token to paste
- Instance is unusable until manual token injection

---

## Solution: Token Injection at Provisioning Time

### What to Add

When provisioning a new instance, before the gateway starts:

1. **Generate unique token:**
   ```bash
   GATEWAY_TOKEN=$(openssl rand -hex 32)  # 64-char hex string
   ```

2. **Inject into openclaw.json:**
   ```bash
   openclaw config set gateway.auth.token "$GATEWAY_TOKEN"
   openclaw config set gateway.controlUi.allowedOrigins "[\"https://<instance-hostname>.agent.laverdi.tech\"]"
   ```

3. **Store for customer visibility** (in LaVerdi admin panel or via API)

---

## Implementation Options

### Option A: In Cloud-Init (Recommended)
Add to the provisioning script that runs on instance boot:

```bash
#!/bin/bash
# After OpenClaw is installed but before gateway starts

GATEWAY_TOKEN=$(openssl rand -hex 32)

# Inject token
cd ~/.openclaw
openclaw config set gateway.auth.token "$GATEWAY_TOKEN"
openclaw config set gateway.controlUi.allowedOrigins "[\"https://$(hostname -f).agent.laverdi.tech\"]"

# Store token in a temp file for retrieval
echo "$GATEWAY_TOKEN" > /tmp/gateway-token.txt
chmod 600 /tmp/gateway-token.txt

# Start gateway
openclaw gateway start
```

### Option B: In Vultr Instance Provisioning API
When creating instance via Vultr API, include cloud-init script with token generation.

### Option C: Via Webhook After Instance Ready
After instance reaches "ready" state, SSH in and inject token:

```bash
ssh -i key root@instance-ip "
  GATEWAY_TOKEN=\$(openssl rand -hex 32)
  openclaw config set gateway.auth.token \"\$GATEWAY_TOKEN\"
  openclaw config set gateway.controlUi.allowedOrigins \"[\\\"https://instance-hostname.agent.laverdi.tech\\\"]\"
  echo \"\$GATEWAY_TOKEN\"
"
```

---

## For Existing Broken Instance (9609fb7c)

**Option 1: Manual Fix via SSH**
```bash
ssh -i key root@4593b36f.agent.laverdi.tech

# Generate token
GATEWAY_TOKEN=$(openssl rand -hex 32)
echo "Generated token: $GATEWAY_TOKEN"

# Inject
openclaw config set gateway.auth.token "$GATEWAY_TOKEN"

# Verify
openclaw config get gateway.auth.token

# Restart gateway
openclaw gateway restart
```

**Option 2: Surface in Admin Panel**
- Display generated token in LaVerdi admin for instance
- Customer can paste into their Control UI prompt
- Token is automatically injected on next gateway restart

---

## Files to Modify

1. **Provisioning Script** (wherever instances are created)
   - Add token generation before gateway start

2. **LaVerdi Portal Admin Panel** (optional)
   - Show token for each instance
   - Allow manual token reset/regeneration

3. **LaVerdi API** (if applicable)
   - Expose endpoint to get/regenerate instance token

---

## Security Notes

- **Token Format:** 64-char hex (256-bit entropy) is sufficient
- **Storage:** Keep in openclaw.json with proper file permissions (600)
- **Rotation:** Allow customers to rotate via admin panel if needed
- **Exposure:** Token is only revealed once at creation; subsequent access requires control UI auth

---

## Migration Path

For customers with existing instances missing tokens:

1. **Immediate:** Provide manual token injection script or SSH access
2. **Short-term:** Bulk update existing instances via provisioning system
3. **Long-term:** Implement token management in admin panel

---

## Testing Checklist

- [ ] New instance created → Token automatically in openclaw.json
- [ ] Control UI can connect with token
- [ ] Token is accessible in admin panel (if implemented)
- [ ] Existing broken instance can be fixed via SSH
- [ ] Token rotation works

---

**Status:** Ready for implementation  
**Priority:** High (affects all new signups)  
**Time to Fix:** ~30 min - 2 hours depending on approach chosen
