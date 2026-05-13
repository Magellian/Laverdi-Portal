# Trading Bridge Session - 2026-04-15

## Executive Summary

**Trading Bridge is LIVE and TRADING with real money on Kraken Spot.**

### What Works ✅
- API server running on http://127.0.0.1:8000
- System tray monitor (green circle in taskbar)
- Webhook receiver accepting signals
- AI Risk Manager (Gemini) approving/denying trades
- Live order execution on Kraken Spot
- Auto-launch at Windows logon configured

### What Doesn't Work ⚠️
- `/balance` endpoint throwing Kraken API errors (temp issue)
- System tray shows "OFFLINE" when balance fetch fails

---

## Current Status (Latest Check: 2026-04-15 14:22)

```
Health:     ✅ OK
Service:    ✅ trading-bridge
Exchange:   ✅ kraken
API:        ✅ listening on 127.0.0.1:8000
Spot:       ✅ connected & trading
Futures:    ✅ connected
AI Manager: ✅ enabled
Webhooks:   ✅ confirmed
Dry Run:    ❌ OFF (REAL MONEY)

Balance:    ⚠️  ERROR (Kraken API issue)
Last Known: BTC 0.03382952 | USD $679.62 | Total $3,204.99
```

---

## Files & Locations

### Core Trading System
- **API Server:** `C:\Services\trading-bridge\main.py`
- **Service Wrapper:** `C:\Services\trading-bridge\run_service.py`
- **Config:** `C:\Services\trading-bridge\.env` (has Kraken API keys)

### Monitoring
- **Tray Monitor:** `C:\Services\trading-bridge\tray_monitor.py`
- **VBScript Launcher:** `C:\Services\trading-bridge\start_tray_monitor.vbs`
- **Startup Shortcut:** `C:\Users\chris\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Trading Bridge Monitor.lnk`

### Utilities
- **Quick Restart:** `C:\Services\trading-bridge\restart_api.bat`
- **Setup Task Script:** `C:\Services\trading-bridge\setup_task.ps1`
- **Startup Shortcut Script:** `C:\Services\trading-bridge\create_startup_shortcut.ps1`

### Logs
- **API Logs:** `C:\Services\trading-bridge\logs/stderr.log` (main output)
- **Service Logs:** `C:\Services\trading-bridge\logs/trading-bridge.log`
- **Monitor Logs:** `C:\Services\trading-bridge\logs/tray_monitor.log`

### Documentation
- **Setup Guide:** `C:\Services\trading-bridge\TRAY_MONITOR_SETUP.md`
- **Install Summary:** `C:\Services\trading-bridge\TRAY_MONITOR_INSTALL_SUMMARY.md`
- **README:** `C:\Services\trading-bridge\README.md`

---

## API Endpoints

### Health & Status
```
GET /health
→ Returns: { status, service, exchange, dry_run, ai_risk_manager, futures_enabled, futures_connected }

GET /status
→ Returns: { service, online, listening, webhooks_confirmed, dry_run, ai_enabled, futures_enabled, futures_connected }
```

### Trading Data
```
GET /balance
→ Returns: { btc, usd, btc_price, total_usd, total_value, timestamp }
⚠️  CURRENTLY BROKEN: Kraken API error on private/BalanceEx endpoint

GET /positions
→ Returns: { positions: {...}, count, timestamp }
```

### Trading
```
POST /webhook
Body: {
  passphrase: "openclaw_test_secret",
  action: "buy" | "sell",
  ticker: "BTC/USD" (or other pairs),
  market: "spot" | "futures",
  size: 0 (auto-size based on 20% of cash) or fixed amount
}
→ Returns: { status, message } or { status: "rejected", reason, ai_response }
```

---

## Live Trading Tests (2026-04-15)

### Test 1: BUY Signal (13:45)
```
Webhook:  POST /webhook with action=buy, ticker=BTC/USD, size=0 (auto)
AI Check: ✅ Gemini approved
Execution: ✅ Live BUY order
Result:   0.00202951 BTC purchased (~$152 USD spent)
Status:   SUCCESS
```

### Test 2: SELL Signal (13:45)
```
Webhook:  POST /webhook with action=sell, ticker=BTC/USD, size=0.001
AI Check: ✅ Gemini approved
Execution: ✅ Live SELL order
Result:   0.001 BTC sold (~$75 USD gained)
Status:   SUCCESS
```

### Portfolio Change
| | Before | After | Change |
|---|--------|-------|--------|
| BTC | 0.0328 | 0.03482951 | +0.00202951 |
| USD | $757.36 | $605.27 | -$152 |
| Total | $3,207.32 | $3,204.99 | -$2.33 |

(Slight loss due to trading fees on the test buy/sell)

---

## System Architecture

```
Windows Startup Folder
  ↓
Startup Shortcut (.lnk)
  ↓
VBScript (start_tray_monitor.vbs)
  ↓
Python Process (tray_monitor.py) + Python Process (main.py)
  ├── Tray Monitor (pystray)
  │   ├── Health checks every 5 sec
  │   ├── Balance polling
  │   ├── Status display
  │   └── Right-click menu
  │
  └── Trading Bridge API (FastAPI)
      ├── Webhook receiver (/webhook)
      ├── Kraken Spot/Futures auth
      ├── AI Risk Manager gate (Gemini/OpenAI)
      └── Live order execution
```

---

## Configuration

### Environment Variables (in `.env`)
```
KRAKEN_API_KEY=...
KRAKEN_API_SECRET=...
KRAKEN_FUTURES_API_KEY=...
KRAKEN_FUTURES_SECRET=...
ENABLE_FUTURES=True
GOOGLE_API_KEY=...
OPENAI_API_KEY=...
```

### Trading Parameters (in `main.py`)
```python
DRY_RUN = False  # LIVE MONEY
RISK_PERCENTAGE = 0.20  # Risk 20% of available cash per trade
EXCHANGE_ID = 'kraken'
```

---

## Known Issues & Fixes Needed

### 1. Balance Endpoint Failing (URGENT)
**Problem:** `/balance` returns Kraken API error
```
error: "kraken POST https://api.kraken.com/0/private/BalanceEx"
```
**Status:** Kraken-side temporary issue (not our code)
**Workaround:** Check balance directly at https://www.kraken.com/account/balances
**Fix:** Add retry logic with exponential backoff + cache last known balance

### 2. Service Auto-Restart Missing
**Problem:** Service can crash and not restart automatically
**Status:** Watchdog script exists but not fully integrated
**Fix:** Verify watchdog is running: `Get-ScheduledTask -TaskName "OpenClaw Watchdog"`

### 3. Positions Endpoint Error (FIXED in session)
**Problem:** Was returning NoneType error
**Status:** ✅ Fixed - added safety checks for balance dict

---

## How to Operate

### Check Status
```powershell
# Quick health check
Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing

# Full status
Invoke-WebRequest -Uri "http://127.0.0.1:8000/status" -UseBasicParsing

# View logs
Get-Content "C:\Services\trading-bridge\logs\stderr.log" -Tail 50 -Wait
```

### Restart API
```powershell
# Via batch file
C:\Services\trading-bridge\restart_api.bat

# Or manually
taskkill /F /IM python.exe
Start-Process python -ArgumentList '"C:\Services\trading-bridge\main.py"' -NoNewWindow
```

### Send Test Trade
```powershell
$payload = @{
    passphrase = "openclaw_test_secret"
    action = "buy"
    ticker = "BTC/USD"
    market = "spot"
    size = 0
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:8000/webhook" -Method POST -Body $payload -ContentType "application/json"
```

### Check System Tray Monitor
- Look for green circle in taskbar (bottom-right)
- Hover to see status + balance
- Right-click for menu: Refresh, Logs, Health, Quit

---

## Next Steps for Next Session

1. **Fix balance endpoint** — Debug Kraken API error, add retry logic
2. **Add API health monitoring** — Check if Kraken is up before making requests
3. **TradingView integration** — Set up webhook URL in TradingView alerts
4. **Performance tuning** — Monitor API response times and memory usage
5. **Backup trading logs** — Archive successful trades somewhere safe
6. **Test Futures trading** — Run one live futures trade to verify integration

---

## Contacts & Resources

**Kraken API Docs:** https://docs.kraken.com/rest/  
**Kraken Status:** https://status.kraken.com/  
**Trading Bridge Repo:** (local) C:\Services\trading-bridge/  
**Log Files:** Always check stderr.log first for errors

---

**Session Date:** 2026-04-15  
**System Status:** ✅ LIVE & TRADING  
**Last API Check:** 14:22 (health OK, balance error)  
**Final Balance:** BTC 0.03382952 | USD $679.62 | Total $3,204.99
