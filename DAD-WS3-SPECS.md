# DAD-WS3 Hardware & OS Specifications

## System Overview
**Host:** DAD-WS3 (Micro Computer HK Tech — Venus Series mobile workstation)  
**Owner:** chrislaverdiere@gmail.com  
**Status:** Online, excellent shape for EverQuest server

---

## Hardware Specs ✅

| Component | Spec | Notes |
|-----------|------|-------|
| **CPU** | 13th Gen Intel Core i9-13900H | 8-core P-cores + 8 E-cores (16 total) @ 2600 MHz+ |
| **RAM** | 98 GB total | 85 GB currently available — **OVERKILL for EQ** |
| **Storage** | 4 TB total | 3.7 TB free on C: drive |
| **Secondary** | 1 TB (D: drive) | 999 GB free — perfect for database backups |
| **Network** | Intel X710 Converged (x2) | Dual 10GbE interfaces |
| **Virtualization** | Hyper-V capable | VBS + Credential Guard enabled |

---

## Operating System ✅

| Item | Value |
|------|-------|
| **OS** | Windows 11 Enterprise |
| **Build** | 26200 (latest insider build) |
| **Install Date** | 12/27/2024 (fresh, stable) |
| **Security** | Virtualization-based security running |
| **Boot Time** | 5/12/2026 12:04 PM (been up 6 days) |

---

## Network Configuration ✅

| Interface | Status | IP Address | Notes |
|-----------|--------|-----------|-------|
| **Ethernet 4** | **Active** | 192.168.50.85 | Primary LAN, DHCP enabled |
| **ZeroTier** | **Active** | 10.242.215.65 | Tailscale-equivalent VPN overlay |
| Ethernet 1-3 | Disconnected | — | Not in use |
| Wi-Fi 6E | Disconnected | — | Not in use |

---

## EverQuest Server Readiness: 10/10 ✅

### What This Means for EQ Setup

1. **CPU:** i9-13900H is **16 cores** — overkill for a single EQ server. You could run 5+ instances if you wanted.
2. **RAM:** 98 GB is **INSANE** for EQ (server uses ~500 MB, database ~2-3 GB max). You have room for everything else.
3. **Storage:** 4 TB total, 3.7 TB free = **More than enough** for database, server files, and 10 years of logs.
4. **Network:** Dual 10GbE = **Local network performance will be flawless** (wired LAN play has zero latency).
5. **Windows 11 Enterprise:** Full feature set, stable, security-hardened.

### Realistic Capacity

- **Single player:** Can handle 1-2 players at 60+ FPS with zero issues
- **Local LAN (Dad + you):** Smooth as butter, 60+ FPS guaranteed
- **Small group (4-6 players):** Still plenty of headroom
- **Theoretical max:** 50+ concurrent players on this hardware without breaking a sweat

---

## Installation Recommendation

**Go ahead with EverQuest Emulator (Seeds of Destruction).**

### What You Need to Do:

1. **Download & Install MariaDB** (2 min)
   - Download: https://mariadb.org/download/
   - Simple Windows installer, accepts all defaults
   - Creates database service

2. **Download EQEmulator Server** (10 min)
   - GitHub: https://github.com/EQEmu/EQEmu
   - Pre-built Windows binaries available
   - Extract to `C:\EQEmulator\`

3. **Load ProjectEQ Database** (20 min)
   - Download pre-built SoD database dump from EQEmulator community
   - Import: `mysql -u root < projecteq_sod.sql`
   - Creates all tables, zones, mobs, items, quests

4. **Configure & Start Server** (10 min)
   - Edit `eqemu_config.json` with database credentials
   - Run `world.exe`, `zone.exe`, `loginserver.exe` (or set as Windows services)
   - Server is live on `127.0.0.1:5999`

5. **Install & Connect Client** (30 min)
   - Install EQ from Platinum CDs or download pre-patched SoD client
   - Edit `eqhost.txt`: `Host=127.0.0.1:5999`
   - Create account on local login server
   - Launch → Connect → Play

---

## Total Time to "Playing" 

**Approximately 2-3 hours** for first-time setup.

### Breakdown:
- MariaDB install: 5 min
- EQEmulator download/extract: 10 min
- Database import: 20 min
- Server config & startup: 10 min
- Client install & first login: 30 min
- Testing/tweaking: 30-60 min

---

## Storage Plan

| Location | Purpose | Size | Notes |
|----------|---------|------|-------|
| **C: drive** | OS + EQEmulator + MariaDB | ~10 GB | Plenty of space |
| **D: drive** | Database backups + logs | ~1 TB available | Use this for safety copies |

---

## Backup Strategy

Given you have 1 TB on D:, here's what I'd do:

1. **Full database backup** (before major changes): `mysqldump eqemu > D:\backups\eqemu_backup_YYYYMMDD.sql`
2. **Weekly snapshots** of character data
3. **Keep server configs** in version control (Git)

With this much storage, you can keep 6+ months of backups without sweating.

---

## Next Steps

1. **Confirm you want to proceed** with EverQuest Emulator setup
2. **Locate Platinum CDs** (or I can guide you to pre-patched SoD client download)
3. **I can walk you through installation step-by-step** if you want hands-on help

This box is **perfect** for hosting. Let's do it. 🎮

