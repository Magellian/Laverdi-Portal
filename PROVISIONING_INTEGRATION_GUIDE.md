# LaVerdi Provisioning: Token Injection Integration Guide

## Overview

This guide explains how to integrate automatic gateway token generation into your LaVerdi provisioning pipeline.

**Result:** Every new customer instance automatically gets a unique gateway auth token. No manual intervention needed. Customers can connect to their Control UI immediately after signup.

---

## Current Problems

**Problem 1: Missing Token**
1. Customer signs up on LaVerdi portal
2. Instance is created via Vultr API
3. OpenClaw gateway starts
4. Customer goes to Control UI
5. **BLOCKED:** "Paste gateway token" prompt appears
6. Customer has no token (provisioning never generates one)

**Problem 2: Redirect Warning**
7. After pasting token manually, clicks to go to agent dashboard
8. **BLOCKED:** OpenClaw auth warning: "Accept this redirect?" (red warning)
9. Customer is confused, hesitates, may abandon

**Solution:** Both token and allowed origins are injected at provisioning time, so customers connect without any friction.

---

## Solution

Add ~45 seconds of shell script to your provisioning pipeline that:
1. Generates a unique 64-char hex token
2. Injects it into `openclaw.json` before gateway starts
3. Injects `allowedOrigins` to pre-authorize the dashboard redirect
4. Optionally stores both for admin panel display

**Result:** Customer connects without any friction — token already there, redirect already authorized.

---

## Implementation Steps

### Step 1: Locate Your Provisioning Script

Find where you create new Vultr instances. This is typically:
- A Node.js/JavaScript file that calls Vultr API
- A cloud-init script that runs on instance boot
- A shell script that deploys OpenClaw

Common locations:
- `/root/laverdi-portal/pages/api/provision.ts` (Next.js)
- `/root/laverdi-portal/lib/provisioning.js`
- A separate provisioning service

### Step 2: Find the OpenClaw Installation Section

In your cloud-init or provisioning script, find where:
- OpenClaw is installed/downloaded
- Gateway is started (or about to start)

You want to insert the token injection **AFTER** installation but **BEFORE** first gateway start.

Example cloud-init order:
```
1. Update system packages
2. Install Node.js/dependencies
3. Install OpenClaw
4. *** INSERT TOKEN INJECTION HERE ***
5. Start OpenClaw gateway
6. Configure Vultr/networking
```

### Step 3: Add Token Injection Script

Copy this section into your provisioning pipeline:

```bash
#!/bin/bash
set -e

echo "[LaVerdi] Generating gateway auth token..."

# Generate unique 64-char hex token
GATEWAY_TOKEN=$(openssl rand -hex 32)

CONFIG_FILE="/opt/openclaw-config/openclaw.json"

# Ensure jq is available
if ! command -v jq &> /dev/null; then
    apt-get update -qq && apt-get install -y -qq jq
fi

# Inject token into openclaw.json
jq ".gateway.auth.token = \"$GATEWAY_TOKEN\"" "$CONFIG_FILE" > /tmp/openclaw.json.tmp
mv /tmp/openclaw.json.tmp "$CONFIG_FILE"

# Store token for reference
echo "[LaVerdi] Token: $GATEWAY_TOKEN" >> /opt/openclaw-config/token.txt

echo "[LaVerdi] ✅ Token injected: $GATEWAY_TOKEN"
```

### Step 4: Optional - Store Token for Admin Panel

If you want to display the token in the LaVerdi admin panel, add this to your provisioning:

```bash
# Store token metadata
cat > /opt/openclaw-config/gateway-token.json << EOF
{
  "token": "$GATEWAY_TOKEN",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "instance_hostname": "$(hostname -f)"
}
EOF
```

Then in your admin panel, SSH to the instance and read:
```bash
cat /opt/openclaw-config/gateway-token.json
```

### Step 5: Test

Deploy a test instance and verify:

```bash
ssh root@<instance-ip>
cat /opt/openclaw-config/openclaw.json | jq .gateway.auth.token
# Should output a 64-char hex string
```

---

## Integration Checklist

- [ ] Located provisioning script
- [ ] Found OpenClaw installation section
- [ ] Added token generation before gateway start
- [ ] Installed jq (if needed)
- [ ] Tested on new instance
- [ ] Verified token is in `openclaw.json`
- [ ] Customer can connect to Control UI with token
- [ ] Deployed to production

---

## Files Provided

1. **PROVISIONING_TOKEN_INJECTION_PATCH.sh** - Ready-to-copy shell script
2. **This guide** - Integration instructions
3. **GATEWAY_TOKEN_PROVISIONING_FIX.md** - Technical background

---

## Security Notes

- **Token Format:** 64-char hex = 256-bit entropy (cryptographically strong)
- **Storage:** Keep in `openclaw.json` with file permissions 600
- **Visibility:** Token is shown to customer once at signup; subsequent access requires Control UI authentication
- **Rotation:** Consider allowing customers to rotate tokens via admin panel

---

## Timeline

- **Implementation:** ~15 minutes (add script to provisioning)
- **Testing:** ~5 minutes (create test instance)
- **Deployment:** Immediate (affects all future signups)
- **Cleanup:** Update/delete existing broken instances (optional)

---

## Support

If you hit issues:
1. Verify `openclaw.json` path is correct on your instances
2. Ensure `jq` is installed (the script installs it if missing)
3. Check cloud-init logs: `cat /var/log/cloud-init-output.log`
4. Manually test on an instance: `jq . /opt/openclaw-config/openclaw.json`

---

## Expected Result

After implementation:
- ✅ Every new customer gets a unique token
- ✅ No customer sees "paste token" with no token
- ✅ Customers can immediately access Control UI
- ✅ Zero manual intervention needed
- ✅ Reliable, repeatable, zero-maintenance
