# LaVerdi Portal - Seattle Migration Notes
_Date: 2026-05-02_

## Server Comparison

| | Old (Silicon Valley / SJC) | New (Seattle / SEA) |
|---|---|---|
| IP | 45.77.184.252 | 66.42.70.66 |
| Region | sjc (Silicon Valley) | sea (Seattle) |
| Instance ID | (existing) | 4e53efa2-45df-456c-b249-560a01cc1790 |
| Plan | (existing) | vhf-4c-16gb (4vCPU, 16GB RAM) |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |
| Label | (existing) | laverdi-portal-seattle |

## Seattle Server Status
- **IP:** 66.42.70.66
- **Instance ID:** 4e53efa2-45df-456c-b249-560a01cc1790
- Portal: ✅ Running via PM2 (port 3000, Next.js)
- Command Center: ✅ Running via PM2 (port 8000, Python Flask)
- Nginx: ✅ Reverse proxy on port 80 → portal
- Firewall: SSH (22), HTTP (80), HTTPS (443) open; port 8000 firewalled

## DNS Cutover Instructions
1. Update DNS A record: laverdi.tech → 66.42.70.66
2. Once DNS propagates, provision SSL cert: `certbot --nginx -d laverdi.tech -d www.laverdi.tech`
3. Verify HTTPS works
4. Old SJC server (45.77.184.252) can be deleted after confirmation

## Notes
- SSL is NOT yet configured on SEA (no cert since DNS still points to SJC)
- Nginx config is HTTP-only, ready to upgrade to HTTPS after certbot
- PM2 configured with startup (pm2-root.service) so portal survives reboots
- .env.production copied from SJC
- command-center.py copied from SJC
