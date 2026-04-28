# 🚨 CRITICAL NOTES FOR TONIGHT'S LAUNCH

## Issue Found: OpenClaw Container Not Starting

**Status:** Container spins up but OpenClaw process fails immediately

**Error Message:**
```
Invalid --bind (use "loopback", "lan", "tailnet", "auto", or "custom")
```

**Root Cause:**
The OpenClaw Docker image (or entrypoint script) is trying to start with `--bind 0.0.0.0`, but OpenClaw doesn't accept that argument. It wants one of: `loopback`, `lan`, `tailnet`, `auto`, or `custom`.

**Fix Options:**
1. **Rebuild OpenClaw image** with correct `--bind` argument (e.g., `--bind auto`)
2. **Use environment variable** in container to override bind parameter
3. **Skip OpenClaw image** and use test image for tonight (prove concept works)

## Port Mapping WORKS ✅
The fix we just applied is working:
- Container created on port 8824
- Port mapping is correct: `0.0.0.0:8824->8700/tcp`
- Public IP returns correctly: `64.23.142.154`
- Docker provisioning API working perfectly

## What This Means for Tonight

### Option A: Quick Fix (30 min)
1. Create custom Dockerfile that overrides the entrypoint
2. Use `--bind auto` instead of `--bind 0.0.0.0`
3. Rebuild image
4. Test launch

### Option B: Prove Concept with Test Image (5 min)
1. Modify Command Center to use `alpine:latest` for testing
2. Run through full payment → provisioning → access cycle
3. Proves all the infrastructure works
4. Fix OpenClaw startup tomorrow

## Recommendation
**Go with Option B for tonight:**
- Proves end-to-end pipeline works
- Payment → Webhook → Container → Access all confirmed
- OpenClaw startup is a separate issue (fixable tomorrow)
- You get the infrastructure working TODAY

Then tomorrow: Fix OpenClaw and launch real containers.

## How to Test Option B

In Command Center, change:
```python
image_name = 'laverdi-openclaw:latest'
```
to:
```python
image_name = 'alpine:latest'
```

Then test full payment cycle. Alpine containers will start fine and prove the provisioning works.

## Files Affected
- `/root/laverdi-command-center/app.py` — Image name selection
- OpenClaw Dockerfile — Will need `--bind auto` fix

## Next Steps After Tonight
1. Fix OpenClaw image --bind parameter
2. Rebuild `laverdi-openclaw:latest`
3. Re-test with real OpenClaw
4. Full launch
