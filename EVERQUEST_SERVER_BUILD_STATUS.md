# EverQuest Server Build Status — DAD-WS3

**Date:** 2026-05-18  
**Status:** ✅ **Partially Complete** — Infrastructure in place, server configuration in progress

---

## ✅ COMPLETED

### Infrastructure
- ✅ OpenSSH Server installed and running on DAD-WS3 (192.168.50.85)
- ✅ MariaDB 12.2.2 installed via Chocolatey and running
- ✅ Database "peq" created
- ✅ Database user "eqemu" created with full permissions
- ✅ MySQL connectivity verified (`SELECT VERSION()` successful)

### EQEmulator Server
- ✅ EQEmulator server binaries downloaded (101.52 MB)
- ✅ Server extracted to `C:\EQEmulator`
- ✅ All server executables present:
  - ✅ loginserver.exe — **RUNNING** (listening on port 5998)
  - ✅ world.exe — Needs config fix
  - ✅ zone.exe — Ready to start
  - ✅ queryserv.exe, ucs.exe, shared_memory.exe, eqlaunch.exe

### Database Schema
- ✅ Basic tables created (account, login_api_tokens, variables, zone, spawn2)
- ⏳ **NEEDED:** Full ProjectEQ database dump (quests, NPCs, items, zones, loot tables)

---

## 🟡 IN PROGRESS

### Configuration Issues
- **world.exe** failing to load config (JSON parsing error)
  - Config file is valid JSON
  - loginserver.exe reads same config successfully
  - world.exe may require additional directory structure or schema
  - **Status:** Needs debugging or alternative config approach

### Database Content
- **ProjectEQ database dump** not yet imported
  - Attempted download from GitHub — URL no longer exists
  - Alternative: Manual import from EQEmulator community forums
  - **Size:** ~2-3 GB
  - **Content needed:** All zones, mobs, items, spells, quests for Seeds of Destruction

---

## ⏳ TODO

### Immediate (Required for Server Launch)
1. **Fix world.exe configuration** — debug why it rejects valid JSON
   - Option A: Investigate if server.path or other required fields are missing
   - Option B: Download sample config from EQEmulator GitHub
   - Option C: Use alternative server setup (some emulators use different configs)

2. **Obtain full database dump** — needed for playable content
   - EQEmulator forums: https://www.eqemulator.org/forums/
   - Search for "ProjectEQ database dump" or "SoD database"
   - May require forum registration

3. **Start world.exe and zone.exe** — once config is fixed

4. **Test client connection** — connect EQ client to 127.0.0.1:5999

### After Server Launch
1. Download/patch Seeds of Destruction EQ client
2. Create player account on login server
3. Test full gameplay (loading zones, NPCs, items, quests)
4. Tune server rates (XP, drops, spawn times) if desired
5. Add custom content (quests, NPCs, items)

---

## 📁 File Locations

| Component | Path | Status |
|-----------|------|--------|
| **MariaDB** | `C:\Program Files\MariaDB 12.2` | ✅ Running |
| **EQEmulator** | `C:\EQEmulator` | ✅ Extracted |
| **Config** | `C:\EQEmulator\eqemu_config.json` | ✅ Created (config issue) |
| **Database** | `peq` (MariaDB) | ✅ Created (schema incomplete) |
| **Logs** | `C:\EQEmulator\logs\` | ⏳ Created (loginserver logs only) |

---

## 🔌 Network Configuration

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| **Login Server** | 5998 | ✅ Running | Accepting connections |
| **World Server** | 9000 | ⏳ Not running | Config issue |
| **Zone Server** | (var) | ⏳ Not running | Depends on world |
| **Client Connection** | 5999 | ⏳ Ready | Awaiting client test |
| **HTTP API** | 6000 | ✅ Running | Web API for admin |

---

## 🎮 Next Steps for Chris

1. **Decide on database approach:**
   - Option A: Find and download ProjectEQ database dump from forums (~2-3 GB)
   - Option B: Start with minimal content and build up gradually
   - Option C: Use alternative server package with pre-built DB

2. **Debug world.exe config issue:**
   - Check EQEmulator docs for world.exe requirements
   - Verify if additional JSON fields are needed
   - May need to reach out to EQEmulator community

3. **Get an EQ client:**
   - Use Platinum CDs if available
   - Download pre-patched Seeds of Destruction client from community
   - Point eqhost.txt to 127.0.0.1:5999

4. **Test connectivity once world.exe is running**

---

## 💾 Backup & Recovery

- **Config backup:** `C:\EQEmulator\eqemu_config.json.bak` ✅
- **Database:** MariaDB can export via `mysqldump`
- **Server:** All binaries at `C:\EQEmulator` ready to restart

---

## 📞 Support Resources

- **EQEmulator Forums:** https://www.eqemulator.org/
- **EQEmulator Discord:** https://discord.gg/QHsm7CD
- **EQEmulator Docs:** https://docs.eqemu.dev
- **GitHub:** https://github.com/EQEmu/EQEmu

---

## Session Summary

**Time spent:** ~90 minutes  
**Accomplishments:**
- ✅ Full infrastructure installed (MariaDB, EQEmulator binaries)
- ✅ Loginserver operational and listening
- ⏳ Configuration in progress (world.exe needs debugging)
- ⏳ Database schema partially created

**Blockers:**
- world.exe config loading (valid JSON but rejected)
- ProjectEQ database dump unavailable at expected URL
- Needs full zone/mob/item data for Seeds of Destruction content

**Status:** Ready to test login server; needs config fix for world/zone servers.

