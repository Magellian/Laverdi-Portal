# Kraken Futures API Key Regeneration

## Steps to Regenerate API Keys

1. **Log in to Kraken** → https://futures.kraken.com/settings/api
2. **Delete old keys** (if they exist):
   - Find "Kraken Futures API" section
   - Click "Delete" on the old key
   - Confirm deletion
3. **Generate new API key**:
   - Click "Generate" or "Add Key"
   - **Key Type**: Select "Futures"
   - **Permissions**: 
     - ☑ View (read balances, positions)
     - ☑ Modify (place/cancel orders)
     - ☑ Query Ledger (view history)
   - **Nonce Window**: Leave default (optional security)
   - Click "Create API Key"
4. **Copy the credentials** (you'll only see them once):
   - API Key (public)
   - API Secret (private—STORE SECURELY)
5. **Paste them below** and run the update script

## New API Key

**API Key:** (paste here)
**API Secret:** (paste here)

---

## After Updating .env

Run this PowerShell command to test:
```powershell
cd C:\Services\trading-bridge
python -c "import ccxt; fut=ccxt.krakenfutures({'apiKey':'YOUR_KEY','secret':'YOUR_SECRET'}); bal=fut.fetch_balance(); print('Success! Futures authenticated')"
```

## Auto-Update Script

Once you have the new keys, I'll:
1. Update `.env` automatically
2. Restart the trading-bridge service
3. Verify futures auth works
4. Install Windows Service (auto-restart on reboot)
5. Set up logging to file
