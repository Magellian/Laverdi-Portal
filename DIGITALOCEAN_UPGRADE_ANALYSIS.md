# DigitalOcean VPS Upgrade Analysis — Fife RV Laverdi Portal

**Date:** 2026-04-17 10:33 AM PST  
**Current Status:** CRITICAL — 83% disk full, deployment live  
**Recommendation:** Upgrade to next tier OR add block storage  

---

## Current VPS Specs (64.23.142.154)

```
CPU:     2 vCPU
RAM:     3.8 GB total (425MB used, 3.1GB available)
Disk:    25 GB total (20GB used, 4.2GB free — 80% FULL)
Network: Public IPs: 24.113.50.188, 216.177.230.94
OS:      Ubuntu 22.04.5 LTS
Swap:    2.0 GB (not in use)
```

**Problem:** Disk space at 80% capacity — this will cause issues as Docker grows

---

## DigitalOcean Upgrade Options

### Option A: Upgrade Droplet (Current Tier → Next Tier)
**Current:** Likely $6-12/month Basic droplet (2 vCPU, 3.8GB RAM, 25GB disk)  
**Next Tier:** $18/month (2 vCPU, 4GB RAM, 60GB disk)  
**OR:** $24/month (2 vCPU, 8GB RAM, 80GB disk)  

**Pros:**
- ✅ Solves disk problem (60GB or 80GB)
- ✅ More RAM (useful for Docker)
- ✅ Single invoice, no extra management
- ✅ Easy resize in DigitalOcean UI

**Cons:**
- ❌ Takes 5-10 minutes downtime (droplet reboots)
- ❌ Costs 2-4x current tier

---

### Option B: Add Block Storage (Keep Current Droplet)
**DigitalOcean Volumes:** $0.10/GB/month  
**Example:** 100GB volume = $10/month (adds to existing droplet)  

**Pros:**
- ✅ No downtime
- ✅ Cheapest option
- ✅ Can grow independently
- ✅ Keeps current droplet running

**Cons:**
- ❌ Requires mount/format (technical setup)
- ❌ Separate billing line
- ❌ Need to migrate Docker storage

---

### Option C: Snapshot + Resize + Restore
**Process:**
1. Snapshot current droplet
2. Delete old droplet
3. Create new larger droplet from snapshot
4. Re-attach volumes/IPs

**Pros:**
- ✅ Solves disk problem
- ✅ Keeps data
- ✅ Controlled timing

**Cons:**
- ❌ ~30 minutes downtime
- ❌ Risky (snapshot/restore can fail)

---

## Recommendation: **OPTION A — Upgrade to $24/month Tier**

**Why:**
1. **Disk:** 25GB → 80GB (3x more space)
2. **RAM:** 3.8GB → 8GB (2x more for Docker/databases)
3. **CPU:** Stays same (2 vCPU is fine for current load)
4. **Cost:** $24/month vs. current ~$6-12/month (+$12-18/month)
5. **Simplicity:** One-click resize in DigitalOcean UI
6. **Zero technical setup:** No mount/format needed

**Downtime:** 5-10 minutes (acceptable for live system — do during off-hours)

---

## Implementation Steps

### Step 1: Log into DigitalOcean
1. Go to https://cloud.digitalocean.com
2. Navigate to "Droplets"
3. Click on "64.23.142.154" (or find by name)

### Step 2: Resize Droplet
1. Click "More" (3-dot menu)
2. Select "Resize"
3. Choose: **$24/month plan (2 vCPU, 8GB RAM, 80GB SSD)**
4. Click "Resize Droplet"

### Step 3: Wait for Resize
- Droplet will reboot (~5-10 minutes)
- Portal will be down briefly
- You'll see status: "Resizing" → "New"

### Step 4: Verify After Resize
```bash
ssh root@64.23.142.154
df -h /        # Should show 80GB now
free -h        # Should show 8GB RAM
docker ps      # Services should restart automatically
```

### Step 5: Monitor Deployment
- Laverdi Portal should auto-restart
- Check: https://laverdi.tech
- Verify: No errors, all services running

---

## Cost Impact

| Plan | vCPU | RAM | Disk | Monthly | Annual |
|------|------|-----|------|---------|--------|
| Current | 2 | 3.8GB | 25GB | ~$6-12 | ~$72-144 |
| **Recommended** | 2 | 8GB | 80GB | **$24** | **$288** |
| **Difference** | — | +4.2GB | +55GB | **+$12-18** | **+$144-216** |

**ROI:** Solve disk crisis, get 3x more space, 2x more RAM for ~$15/month extra

---

## If Budget is Tight: Option B (Block Storage)

**Alternative:** Add 100GB block storage for $10/month
- Total cost: ~$16-22/month
- Keeps existing droplet
- No downtime

**But requires:**
- SSH into VPS
- Format volume
- Mount to /var/lib/docker or /data
- Move Docker storage (downtime unavoidable)

**Technical difficulty:** Medium (doable but requires careful steps)

---

## Decision Matrix

| Scenario | Best Option |
|----------|-------------|
| "Just fix it, cost doesn't matter" | **Option A: Upgrade** (5 min fix) |
| "Keep costs down, willing to do tech setup" | **Option B: Block Storage** ($10/mo) |
| "Risky, avoid if possible" | **Option C: Snapshot/Resize** |

---

## Recommended Action (NOW)

1. **Log into DigitalOcean**
2. **Click Droplet → Resize**
3. **Select $24/month tier**
4. **Confirm resize**
5. **Wait 10 minutes for reboot**
6. **Verify: https://laverdi.tech loads**

**Total time:** 15 minutes (mostly waiting)  
**Downtime:** 5-10 minutes (acceptable)  
**Risk:** Very low (DigitalOcean handles resizing)  

---

## Preventive Measures After Upgrade

Once upgraded to 80GB:

1. **Set up disk monitoring:**
   ```bash
   watch -n 60 'df -h /'  # Monitor every minute
   ```

2. **Clean Docker regularly:**
   ```bash
   docker system prune -a --volumes  # Monthly
   ```

3. **Set up alerts:**
   - DigitalOcean: Billing → Alerts (disk usage)
   - Or: cron job to check disk and email when >70%

4. **Plan next upgrade:**
   - At 70% of 80GB (56GB used) → Plan for next tier
   - Proactive, not reactive

---

## Questions for Chris

1. **Budget:** Can you spend +$12-18/month for the upgrade?
2. **Timing:** Resize now (during off-hours), or wait?
3. **Growth:** How much storage do you expect to need in 3-6 months?

**My recommendation:** **Upgrade now.** Laverdi Portal is live, and disk space issues will cause crashes. The extra $15/month is cheap insurance.

---

**Ready to proceed?** I can help guide the upgrade process via Telegram or continue here.
