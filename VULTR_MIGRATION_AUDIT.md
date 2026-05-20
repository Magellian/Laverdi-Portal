# ⚠️ VULTR MIGRATION AUDIT - CRITICAL FINDINGS

**Date:** 2026-05-20  
**Status:** 🔴 **INCOMPLETE** — DigitalOcean code still present throughout codebase

---

## Executive Summary

While the **provisioning API** (`/api/provision`) was updated to use Vultr, **the entire codebase still contains DigitalOcean references, APIs, and configuration files**. This creates inconsistency and potential bugs.

**Risk Level:** 🔴 **HIGH** — Code is calling DO APIs alongside Vultr, creating confusion and potential failures.

---

## Files with DigitalOcean References

### 1. Environment Files (Configuration)

**Location:** `/root/laverdi-portal/.env.local` and `.env.production`

```
# DigitalOcean Configuration (For Agent Server Provisioning)
DIGITALOCEAN_API_KEY=...
```

**Status:** ❌ **Needs update** — Should reference VULTR_API_KEY instead

---

### 2. Legacy Code Files (Not Yet Removed)

**File:** `/root/laverdi-portal/lib/digitalocean.ts`
- **Status:** ❌ **Exists but unused** — old droplet provisioner
- **Action:** Should be deleted or deprecated

**File:** `/root/laverdi-portal/lib/droplet-provisioner.ts`
- **Status:** ❌ **Exists but unused** — old droplet provisioner
- **Action:** Should be deleted or deprecated

**File:** `/root/laverdi-portal/lib/do-gradient-pricing.ts`
- **Status:** ❌ **Exists** — DigitalOcean Gradient AI pricing
- **Action:** Replace with Vultr pricing or remove if not using DO Gradient

---

### 3. Documentation Files (Misleading)

**File:** `/root/laverdi-portal/lib/models.ts`
- **Content:** "Uses DigitalOcean Gradient AI Platform models via serverless inference"
- **Status:** ❌ **Outdated** — Should reference Vultr inference instead

---

### 4. Compiled/Built Files (Affected)

**Files:** `.next/server/pages/api/webhooks/stripe.js` and `.next/server/pages/api/agents/provision.js`
- **Status:** ❌ **Compiled from old code** — Build artifacts contain old API calls
- **Impact:** When rebuilt, these will use the new Vultr code, but current builds still have DO references

**Private Pages:** `/dashboard/agent-control` and `/legal/privacy`
- **Status:** ❌ **Still referencing DO** in compiled JavaScript
- **Action:** Rebuild required to update

---

## What's Correct (Vultr)

✅ **Current Provisioning API** (`/root/laverdi-portal/pages/api/provision.ts`)
- Already using Vultr API
- Credentials: `VULTR_API_KEY`
- Correct endpoint: `https://api.vultr.com/v2/instances`

✅ **Server Infrastructure**
- Portal: Vultr VPS `66.42.70.66`
- API Key: `7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA` (stored in credentials)

---

## What Needs Fixing

### Priority 1: Environment & Config (15 minutes)

```bash
# Check current .env files
grep -i "DIGITALOCEAN\|DO_API" /root/laverdi-portal/.env*

# Remove DigitalOcean entries:
# Remove: DIGITALOCEAN_API_KEY
# Ensure: VULTR_API_KEY is set

# Update comments to reference Vultr
```

**Fix:**
```bash
# In /root/laverdi-portal/.env.local
# OLD:
# DigitalOcean Configuration (For Agent Server Provisioning)
# DIGITALOCEAN_API_KEY=...

# NEW:
# Vultr Configuration (For Agent Server Provisioning)
# VULTR_API_KEY=7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA
```

---

### Priority 2: Legacy Code Cleanup (30 minutes)

**Delete these files:**
1. `/root/laverdi-portal/lib/digitalocean.ts` — Old DO provisioner
2. `/root/laverdi-portal/lib/droplet-provisioner.ts` — Old DO provisioner
3. `/root/laverdi-portal/lib/do-gradient-pricing.ts` — If using Vultr inference only

**Search for imports of deleted files:**
```bash
grep -r "from.*digitalocean\|from.*droplet-provisioner\|from.*do-gradient" /root/laverdi-portal/pages --include="*.ts" --include="*.tsx"
```

If none found, safe to delete.

---

### Priority 3: Code Updates (1-2 hours)

**Update these files to reference Vultr correctly:**

1. `/root/laverdi-portal/lib/models.ts`
   - Change: "DigitalOcean Gradient AI Platform" → "Vultr Inference"
   - Update documentation/comments

2. `/root/laverdi-portal/pages/api/provision.ts`
   - ✅ Already correct

3. All references in `/root/laverdi-portal/pages/api/` and `/root/laverdi-portal/pages/dashboard/`
   - Verify they use VULTR_API_KEY
   - Verify they call Vultr endpoints

---

### Priority 4: Rebuild (20 minutes)

```bash
cd /root/laverdi-portal

# Clean build to remove old artifacts
rm -rf .next

# Rebuild
npm run build

# Restart portal
pm2 restart web
```

---

## Audit Checklist

- [ ] Check `.env.local` — Remove DIGITALOCEAN_API_KEY, add VULTR_API_KEY
- [ ] Check `.env.production` — Same as above
- [ ] Delete `/root/laverdi-portal/lib/digitalocean.ts`
- [ ] Delete `/root/laverdi-portal/lib/droplet-provisioner.ts`
- [ ] Delete `/root/laverdi-portal/lib/do-gradient-pricing.ts` (if not using DO Gradient)
- [ ] Update `/root/laverdi-portal/lib/models.ts` — Change "DigitalOcean" to "Vultr"
- [ ] Search codebase for remaining "digitalocean" references
- [ ] Verify `/root/laverdi-portal/pages/api/provision.ts` uses Vultr
- [ ] Clean build: `rm -rf .next && npm run build`
- [ ] Restart portal: `pm2 restart web`
- [ ] Test provisioning: Create test instance and verify it appears on Vultr dashboard

---

## Verification Commands

```bash
# Find all DO references (should return nothing after cleanup)
ssh root@66.42.70.66 "grep -r 'digitalocean\|DigitalOcean\|droplet' /root/laverdi-portal/pages /root/laverdi-portal/lib --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v node_modules"

# Verify Vultr API key is configured
ssh root@66.42.70.66 "grep VULTR_API_KEY /root/laverdi-portal/.env.local"

# Check that provision.ts uses Vultr
ssh root@66.42.70.66 "grep 'vultr.com' /root/laverdi-portal/pages/api/provision.ts"
```

---

## Impact Assessment

### Current State
- **Provisioning:** Uses Vultr ✅
- **Documentation:** References DO ❌
- **Legacy code:** Still present but unused ⚠️
- **Build artifacts:** Contain old DO code ❌

### After Cleanup
- **Provisioning:** Uses Vultr ✅
- **Documentation:** References Vultr ✅
- **Legacy code:** Removed ✅
- **Build artifacts:** Vultr-only ✅

---

## Files That Need Review

```
/root/laverdi-portal/
├── .env.local                           ❌ Remove DO_API_KEY
├── .env.production                      ❌ Remove DO_API_KEY
├── lib/
│   ├── digitalocean.ts                  ❌ DELETE
│   ├── droplet-provisioner.ts           ❌ DELETE
│   ├── do-gradient-pricing.ts           ❌ DELETE/REPLACE
│   └── models.ts                        ⚠️  Update comment
└── pages/
    ├── api/
    │   ├── provision.ts                 ✅ Already correct
    │   └── [...other endpoints]         ⚠️  Verify
    └── dashboard/
        └── [pages]                      ⚠️  May need rebuild
```

---

## Timeline to Complete

| Task | Time | Priority |
|------|------|----------|
| Update .env files | 5 min | 🔴 HIGH |
| Delete legacy files | 5 min | 🔴 HIGH |
| Update comments | 10 min | 🟡 MEDIUM |
| Search remaining refs | 5 min | 🟡 MEDIUM |
| Clean build | 15 min | 🔴 HIGH |
| Test provisioning | 10 min | 🔴 HIGH |
| **TOTAL** | **~50 min** | |

---

## Notes

1. **Build Artifacts:** The `.next/` directory contains compiled code with old references. A clean rebuild will fix this.
2. **Safe to Delete:** Old files (`digitalocean.ts`, `droplet-provisioner.ts`) are not imported by new code.
3. **No Production Risk:** The actual provisioning already uses Vultr; cleanup is for consistency.
4. **Recommendation:** Do cleanup to avoid confusion and potential bugs if someone accidentally imports old code.

---

**Status:** Ready for cleanup  
**Next Step:** Execute the audit checklist above
