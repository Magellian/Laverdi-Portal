# Trading Bridge Setup & Troubleshooting Guide

**Status:** Service running on port 8000, logging enabled, Spot API working, Futures auth failing.

---

## 1. Fix Kraken Futures API Keys (ACTION REQUIRED)

### Why Futures Aren't Working
The Futures API keys in `.env` are either:
- Expired or revoked
- Regenerated on Kraken's side
- Wrong format/account mismatch

### Steps to Regenerate (Manual)

1. **Log in to Kraken Futures**: https://futures.kraken.com/settings/api
2. **Delete old API keys** (if shown):
   - Click "Delete" next to any existing keys
   - Confirm deletion
3. **Create new API key**:
   - Click "Generate" or "Add Key"
   - **Key Type**: Futures Trading
   - **Permissions**: Check all (View, Modify, Query Ledger)
   - Leave other settings at default
   - Click "Generate API Key"
4. **Copy credentials** (shown only once):
   ```
   API Key: [COPY THIS]
   API Secret: [COPY THIS]
   ```
5. **Send to me** (via secure channel):
   - New API Key
   - New API Secret

### I'll Then:
1. Update `C:\Services\trading-bridge\.env` with new keys
2. Restart the TradingBridge service
3. Verify Futures authentication works
4. Test with a small trade

---

## 2. Install as Windows Service (ADMIN REQUIRED)

The service is currently running as a manual Python process. To make it auto-start on reboot and auto-restart if it crashes:

### Run This Command (As Administrator):
```powershell
C:\Services\trading-bridge\install_service.ps1
```

### What This Does:
- Creates Windows Service named "TradingBridge"
- Sets startup type to "Automatic" (starts on boot)
- Configures logging to `C:\Services\trading-bridge\logs\trading-bridge.log`
- Grants SYSTEM permissions to the service directory

### After Installation:
```powershell
# Start the service
Start-Service -Name TradingBridge

# Check status
Get-Service -Name TradingBridge

# View logs
Get-Content 'C:\Services\trading-bridge\logs\trading-bridge.log' -Tail 50 -Wait

# Stop the service
Stop-Service -Name TradingBridge -Force
```

---

## 3. Logging (ALREADY SETUP)

### Log Location
`C:\Services\trading-bridge\logs\trading-bridge.log`

### What's Logged
- Service startup/shutdown
- Exchange authentication (Spot, Futures)
- API calls and responses
- Trade execution (LIVE)
- AI Risk Manager approvals/denials
- Errors and exceptions

### View Logs (Live)
```powershell
Get-Content 'C:\Services\trading-bridge\logs\trading-bridge.log' -Tail 50 -Wait
```

### Log Rotation (Optional)
Add to a scheduled task to keep logs from growing too large:
```powershell
# Archive old logs if > 10MB
if ((Get-Item 'C:\Services\trading-bridge\logs\trading-bridge.log').Length -gt 10MB) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    Rename-Item 'C:\Services\trading-bridge\logs\trading-bridge.log' "logs\trading-bridge-$timestamp.log"
}
```

---

## 4. Current Portfolio Status

**Last Checked:** 2026-04-15 12:42 UTC

| Asset | Amount | Value |
|-------|--------|-------|
| BTC   | 0.0328 | $2,463.79 |
| USD   | $757.36 | $757.36 |
| **Total** | — | **$3,221.15** |

**API Keys Status:**
- Spot: ✅ Working
- Futures: ❌ Needs regeneration
- AI Gates: ✅ Working

---

## 5. Testing the Service

### Health Check
```powershell
Invoke-WebRequest http://127.0.0.1:8000/health | ConvertFrom-Json
```

Expected response:
```
status            : ok
service           : trading-bridge
exchange          : kraken
dry_run           : False
ai_risk_manager   : True
futures_enabled   : True
futures_connected : True
```

### Test a Trade (Spot Only—Futures Down)
```powershell
$body = @{
    passphrase = "openclaw_test_secret"
    action = "buy"
    ticker = "BTC/USD"
    size = 0.001
    market = "spot"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://127.0.0.1:8000/webhook -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | ConvertFrom-Json
```

This will **execute a LIVE 0.001 BTC buy** if approved by AI. Use with caution.

---

## 6. Troubleshooting

### Service Won't Start
```powershell
# Check if Python process is running
Get-Process python

# View recent logs
Get-Content 'C:\Services\trading-bridge\logs\trading-bridge.log' -Tail 20
```

### Futures API Still Failing After Regenerating Keys
1. Double-check the new keys are copied correctly (no spaces, full strings)
2. Verify keys have Futures permission in Kraken settings
3. Check for typos in `.env` file
4. Restart the service: `Restart-Service -Name TradingBridge`

### Port 8000 Already in Use
```powershell
# Find what's using port 8000
netstat -ano | findstr "8000"

# Kill the process (if it's not TradingBridge)
Stop-Process -Id <ProcessId> -Force
```

### Logs Show "Authentication Successful" but Trades Failing
- Check available balance: `python check_balance.py` in service directory
- Ensure you have enough USD or BTC for the trade
- Verify passphrase matches "openclaw_test_secret"

---

## 7. Next Steps

1. **Regenerate Futures API keys** (manual, need to do this)
2. **Send new keys to me** (I'll update and restart)
3. **Run install_service.ps1** (requires admin, I can guide you)
4. **Verify Futures auth** with a test trade
5. **Deploy to TradingView** with webhook URL + passphrase

---

## Files Reference

| File | Purpose |
|------|---------|
| `main.py` | FastAPI server + trading logic |
| `run_service.py` | Service wrapper (logging, subprocess) |
| `signal_engine.py` | SMA crossover signal generator |
| `.env` | API keys (Kraken, Gemini, OpenAI) |
| `install_service.ps1` | Windows Service installer |
| `manage-service.ps1` | Service management helper |
| `logs/trading-bridge.log` | Live logs |

---

**Questions or issues? Let me know!**
