# Trading Bridge - Quick Reference

## Status Check (Copy & Paste)

```powershell
# Health
Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

# Balance (currently broken due to Kraken API)
Invoke-WebRequest -Uri "http://127.0.0.1:8000/balance" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json

# Status
Invoke-WebRequest -Uri "http://127.0.0.1:8000/status" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

## Restart API

```powershell
C:\Services\trading-bridge\restart_api.bat
```

## View Logs

```powershell
# Main API logs (live)
Get-Content "C:\Services\trading-bridge\logs\stderr.log" -Tail 50 -Wait

# Monitor logs
notepad "C:\Services\trading-bridge\logs\tray_monitor.log"
```

## Send Test Webhook

```powershell
$payload = @{
    passphrase = "openclaw_test_secret"
    action = "buy"
    ticker = "BTC/USD"
    market = "spot"
    size = 0
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:8000/webhook" -Method POST -Body $payload -ContentType "application/json" | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json
```

## System Tray Monitor

- **Visible:** Green circle in taskbar (bottom-right)
- **Hover:** See status + balance
- **Right-click:** Refresh, Logs, Health, Quit
- **Auto-start:** Windows logon

## File Locations

| What | Where |
|------|-------|
| API | `C:\Services\trading-bridge\main.py` |
| Monitor | `C:\Services\trading-bridge\tray_monitor.py` |
| Logs | `C:\Services\trading-bridge\logs\` |
| Config | `C:\Services\trading-bridge\.env` |
| Restart | `C:\Services\trading-bridge\restart_api.bat` |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/status` | GET | Operational status |
| `/balance` | GET | Current balance (⚠️ currently broken) |
| `/positions` | GET | Open positions |
| `/webhook` | POST | Receive trading signals |

## Current Status

- **API:** ✅ Running on 127.0.0.1:8000
- **Kraken Spot:** ✅ Connected & trading
- **Kraken Futures:** ✅ Connected
- **AI Manager:** ✅ Enabled
- **Trading Mode:** ❌ LIVE (real money)
- **Balance Display:** ⚠️ Kraken API error
- **Last Known Balance:** BTC 0.03382952 | USD $679.62 | Total $3,204.99

## Common Tasks

### Check if API is running
```powershell
Get-Process python | Where-Object {$_.CommandLine -like "*main.py*"}
```

### Kill and restart
```powershell
taskkill /F /IM python.exe
Start-Sleep 2
Start-Process python -ArgumentList '"C:\Services\trading-bridge\main.py"' -NoNewWindow
```

### Check Kraken directly
https://www.kraken.com/account/balances

## Issues

### Balance endpoint failing
- Kraken API error on private/BalanceEx
- Workaround: Check balance directly at Kraken website
- Next session: Add retry logic

### Tray monitor showing "OFFLINE"
- Usually means balance fetch is failing
- Doesn't affect trading capability
- Restart API if persistent

---

**Last Updated:** 2026-04-15 14:34  
**Trading Status:** ✅ LIVE
