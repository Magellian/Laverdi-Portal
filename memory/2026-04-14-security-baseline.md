# Security Baseline Audit - 2026-04-14

## Summary
- **Critical Issues:** 0
- **Warnings:** 3
- **Info:** 1
- **Status:** Ready for hardening (no blockers)

## System Context

### OS & Infrastructure
- **OS:** Windows 10 Pro (Build 19045)
- **Firewall:** Enabled (Domain, Private, Public profiles all ON)
- **Network:** Local + Docker subnets active (172.19, 10.242, 192.168.50)
- **Disk Encryption:** BitLocker check failed (needs admin, but likely OFF)
- **Backups:** Not detected (no native Windows backup status)

### OpenClaw Gateway
- **Gateway Port:** 18789 (loopback-only, good)
- **Status:** Running and operational
- **Bind:** 127.0.0.1 (loopback) + ::1 (IPv6)
- **Update Available:** npm 2026.4.14 (should skip per Chris's policy)

### Open Ports (Notable)
- **18789:** OpenClaw Gateway (loopback only) ✓ Good
- **8090, 9993:** Docker/n8n services (0.0.0.0 exposed) ⚠️
- **3389:** RDP (exposed to all interfaces) ⚠️
- **445, 139:** SMB (Windows file sharing, local network) ⚠️
- **5040, 5357, 5354:** Windows services (normal)

## Findings

### WARN #1: Reverse Proxy Headers Not Trusted
**Issue:** If Control UI exposed through reverse proxy, headers can be spoofed.
**Current State:** Gateway is loopback-only (127.0.0.1:18789).
**Severity:** Low (not exposed publicly today).
**Action:** Only relevant if Control UI moves behind reverse proxy. Document for future.

### WARN #2: Weak Model Tier (Haiku in defaults)
**Issue:** `anthropic/claude-haiku-4-5` is set as primary default model.
**Risk:** Smaller models more susceptible to prompt injection.
**Recommendation:** Upgrade default to GPT-5.4 or Claude Opus 4-6.
**Note:** This is OK for your use case (personal assistant), but best practice is top-tier for tool access.

### WARN #3: Multi-User Heuristic Warning
**Issue:** OpenClaw detected Telegram group allowlist policy + full runtime tools without sandboxing.
**Current State:** This is your intentional setup (personal assistant, you're the operator).
**Risk Level:** Low (you control the gateway and trust the users).
**Recommendation:** If adding untrusted users later, split to separate gateways or enable sandbox mode.

### INFO: Attack Surface Summary
- Groups: 1 allowlist (Telegram)
- Tools.elevated: enabled
- Webhooks: disabled (good)
- Browser control: enabled
- Trust model: personal assistant (correct for your setup)

## Missing Security Checks

- **Disk Encryption:** BitLocker not accessible (needs admin check or separate audit)
- **Backup Status:** No automated backup detected
- **SSH/Remote Access:** RDP enabled and listening (0.0.0.0:3389) — consider restricting
- **API Key Storage:** Hardcoded secrets in n8n workflows (Etsy POD project) — needs migration

## Risk Profile & Recommendation

**Your Setup:** Windows 10 workstation, local Docker services, OpenClaw gateway loopback-only, personal use.

**Recommended Profile:** Developer/Workstation Balanced
- Firewall ON (already enabled) ✓
- RDP restricted to LAN only (consider)
- Docker services (8090, 9993) restricted or behind localhost proxy (consider)
- Credentials in environment variables or vault, not hardcoded (action item)
- Periodic security audits scheduled (recommend)

## Next Steps (Prioritized)

1. **High:** Migrate n8n hardcoded secrets to env vars / credentials vault
2. **High:** Restrict RDP to LAN-only (disable public access)
3. **Medium:** Restrict Docker ports (8090, 9993) to localhost or LAN
4. **Medium:** Enable BitLocker on OS drive (if acceptable delay)
5. **Medium:** Set up automated backup (File History or 3rd-party)
6. **Low:** Upgrade default model from Haiku to GPT-5.4
7. **Low:** Schedule periodic `openclaw security audit` runs via cron

## Commands Reference

```bash
# View RDP firewall rules
Get-NetFirewallRule -DisplayName "*Remote Desktop*" | Select-Object Name, Enabled, Direction

# Restrict RDP to LAN only (example)
# New-NetFirewallRule -DisplayName "RDP - LAN Only" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3389 -RemoteAddress 192.168.0.0/16

# Check Open Ports
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort

# Enable BitLocker (requires admin)
Enable-BitLocker -MountPoint C: -EncryptionMethod Aes256

# Schedule security audit
openclaw cron add --name healthcheck:security-audit ...
```

---
**Next Session:** Review this plan, approve actions, execute hardening steps.
