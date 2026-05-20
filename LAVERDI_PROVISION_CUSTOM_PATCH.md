# LaVerdi Provisioning Custom Patch

**File:** `/root/laverdi-portal/pages/api/provision.ts`

**Purpose:** Inject gateway auth token and pre-authorize allowedOrigins so customers don't see friction points (token prompt, redirect warning).

---

## Current Issue

The cloud-init script creates `/opt/openclaw-config/openclaw.json` but:
1. ❌ Never generates `gateway.auth.token` — it's omitted from the JSON
2. ✅ Does set `allowedOrigins` with user ID (good)

**Fix:** Generate a unique token and inject it into the config before the container starts.

---

## Solution: Add Token Generation to Cloud-Init

In the `cloudInitScript` array, find this section:

```typescript
'OCEOF',
'echo"Config pre-created."',
'',
'echo "Starting container..."',
```

**Replace with this:**

```typescript
'OCEOF',
'echo "Config pre-created."',
'',
'echo "Generating gateway auth token..."',
'GATEWAY_TOKEN=$(openssl rand -hex 32)',
'echo "Generated token: $GATEWAY_TOKEN"',
'',
'# Inject token into openclaw.json using sed (avoid jq dependency)',
'sed -i \'s/"mode": "token"/"mode": "token", "token": "\'$GATEWAY_TOKEN\'"/\' /opt/openclaw-config/openclaw.json',
'',
'# Store token metadata for admin retrieval',
'cat > /opt/openclaw-config/gateway-token.json << TOKENEOF',
'{',
'  "token": "$GATEWAY_TOKEN",',
'  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",',
'  "user_id": "' + userId + '",',
'  "instance_id": "' + instanceId + '"',
'}',
'TOKENEOF',
'chmod 600 /opt/openclaw-config/gateway-token.json',
'echo "Token injected and stored."',
'',
'echo "Starting container..."',
```

---

## Step-by-Step Integration

### Step 1: Open the file
```bash
nano /root/laverdi-portal/pages/api/provision.ts
```

### Step 2: Find the location
Search for: `'echo"Config pre-created."',`

(Line ~55 in your current code)

### Step 3: Replace the section
Delete from `'echo"Config pre-created."',` through `'echo "Starting container..."',`

Paste the replacement code above.

### Step 4: Save and rebuild
```bash
cd /root/laverdi-portal
npm run build
pm2 restart web  # or however you restart the portal
```

### Step 5: Test
Create a new test instance. SSH in and verify:
```bash
cat /opt/openclaw-config/openclaw.json | jq .gateway.auth.token
# Should output a 64-char hex string
```

---

## What This Does

**Before (current):**
```json
{
  "gateway": {
    "auth": {
      "mode": "token"
    },
    ...
  }
}
```

**After (patched):**
```json
{
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "87e86d6087a207b4475e5d7501681f7a2a040e610ba8ca15247dd46aaa852685"
    },
    ...
  }
}
```

---

## Why `sed` Instead of `jq`?

Your cloud-init runs in a minimal environment. Using `sed` to inject the token:
- ✅ No dependencies to install
- ✅ Fast and reliable
- ✅ Works on all Linux variants

---

## Optional: Surface Token in Admin Panel

If you want to display the token to customers or admins, add this to your instance details API:

```typescript
// In your instance details endpoint
const tokenFile = await fetch(`ssh://root@${instance.ip}:/opt/openclaw-config/gateway-token.json`);
const tokenData = JSON.parse(await tokenFile.text());
return { ...instance, gateway_token: tokenData.token };
```

Or simpler: Just read the file when you need it.

---

## Rollout Plan

1. **Apply patch** to `provision.ts`
2. **Test** on a new instance
3. **Deploy** (affects all future signups)
4. **Manual fix** for existing instances (optional):
   ```bash
   ssh root@<instance-ip>
   GATEWAY_TOKEN=$(openssl rand -hex 32)
   sed -i 's/"mode": "token"/"mode": "token", "token": "'$GATEWAY_TOKEN'"/g' /opt/openclaw-config/openclaw.json
   # Restart gateway
   ```

---

## Files Changed

- `/root/laverdi-portal/pages/api/provision.ts` — Add token generation to cloud-init

**Lines affected:** ~55 (the config pre-creation section)

---

## Verification Checklist

- [ ] Patch applied to provision.ts
- [ ] Code builds without errors (`npm run build`)
- [ ] Portal restarted (`pm2 restart web`)
- [ ] New test instance created
- [ ] Token exists in `/opt/openclaw-config/openclaw.json`
- [ ] Customer can connect without "paste token" prompt
- [ ] Redirect warning doesn't appear (already authorized)
- [ ] Deployed to production

---

## Expected Result

✅ Every new customer:
1. Signs up
2. Instance creates with unique token + authorized origins
3. Connects to Control UI immediately
4. No friction, no warnings, no confusion
5. Ready to use agent

