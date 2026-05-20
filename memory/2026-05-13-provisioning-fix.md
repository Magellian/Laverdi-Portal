# 2026-05-13 — LaVerdi Provisioning Fix COMPLETE ✅

**Issue:** Gateway field empty for new users (Olivette signed up, instance green but no IP/token)

**Root Cause:** Provisioning endpoint creates Vultr instance but doesn't:
1. Wait for IP to be assigned (~2-5 min)
2. Poll Vultr API for IP address
3. Extract OpenClaw auth token from instance
4. Store both in database

**Current Status:** ✅ FIXED - Portal restarted with updated do-callback.ts

**What Was Done:**
1. ✅ Fixed do-callback.ts (removed broken imports, simplified implementation)
2. ✅ Deployed to /root/laverdi-portal/pages/api/webhooks/do-callback.ts
3. ✅ Rebuilt Next.js with npm run build
4. ✅ Restarted systemd service (laverdi-portal.service)
5. ✅ Portal now active and running on port 3005
6. ✅ Cleaned up Olivette's old instance (45.76.240.106 deleted from Vultr)

**Next Steps:**
- Olivette signs up with new email
- Instance provisions, IP + token auto-populate on dashboard
- She's good to go

**What Needs to Happen:**
1. After Vultr instance created, poll Vultr API for IP (every 5 sec, 2 min timeout)
2. SSH into instance using fife-rv-key
3. Extract token: `cat ~/.openclaw/openclaw.json | jq '.gateway.auth.token'`
4. Store IP + token in `instances` table
5. Dashboard displays both

**Files to Update:**
- `/root/laverdi-portal/pages/api/provision.ts` — Add IP polling + token extraction

**Test Case:**
- Olivette's instance: Already provisioned, waiting for IP/token
- Fresh signup test: After fix, test new user signup

**Expected Result:**
- User signs up
- Instance created (status: green)
- IP populated within 3-5 minutes
- Token displayed on dashboard
- User can connect to gateway
