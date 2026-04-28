# Handoff Brief — Crypto Trader — 2026-03-28 10:09 PDT

Use this at the start of the next session to get up to speed fast.

---

## What We're Building
A live crypto trading system on **Kraken** with:
1. A **Mission Control dashboard tab** showing real account data
2. A **Python bot** that syncs account state every 15s
3. A **Kraken-native signal engine** (SMA9/21 crossover on 5m candles)
4. A **FastAPI trading bridge** that routes signals through a Claude AI risk gate → Kraken execution
5. **No TradingView** (skipping subscription fee)

---

## Current State

### Everything Running (as of session end ~10:09 PDT)

| Component | Status | How to Start |
|-----------|--------|--------------|
| Trading bridge | **LIVE** on port 8000, DRY_RUN=False | `cd src/trading-bridge; uvicorn main:app --host 127.0.0.1 --port 8000` |
| Signal engine | **LIVE** — SMA9/21, BTC/USD 5m, polling 60s | `cd src/trading-bridge; python signal_engine.py` |
| Kraken bot | **LIVE** — syncing account every 15s | `python mission-control/bots/kraken_bot.py` |
| Dashboard | **LIVE** — http://localhost:8080 | `cd mission-control; python -m http.server 8080` |

### First Trade Executed
- **09:29 PDT**: BUY 0.0001 BTC/USD (~$6.70) — AI approved, live order placed
- Still holding as of 10:09 PDT, SMA9 above SMA21

### Account
- Starting balance: $200.00
- Exchange: Kraken
- API keys: `src/trading-bridge/.env`

---

## Key Files
| File | Purpose |
|------|---------|
| `src/trading-bridge/main.py` | Webhook receiver + Claude AI risk gate + Kraken executor |
| `src/trading-bridge/signal_engine.py` | Kraken-native SMA crossover → POSTs to webhook |
| `mission-control/bots/kraken_bot.py` | Account sync → writes `state/crypto.json` |
| `mission-control/state/crypto.json` | Live state file |
| `mission-control/index.html` | Dashboard UI (fixed: crypto tab uses display:block) |
| `mission-control/serve.ps1` | Start HTTP server for dashboard |
| `src/trading-bridge/.env` | KRAKEN_API_KEY, KRAKEN_API_SECRET, ANTHROPIC_API_KEY |

---

## Webhook Format
```json
{
  "passphrase": "openclaw_test_secret",
  "action": "buy",
  "ticker": "BTC/USD",
  "size": 0.0001
}
```

---

## Next Priorities
1. **Stop-loss logic** — add max drawdown guard to signal engine
2. **Trade log in crypto.json** — track entry price + per-position P&L in dashboard
3. **Multi-pair support** — expand beyond BTC/USD
4. **Confirm dashboard fix** — Crypto tab should now populate after Ctrl+Shift+R

---

## Decisions Locked In
- Exchange: **Kraken only**
- Signal source: **Kraken OHLCV via ccxt** (no TradingView)
- Strategy: **SMA9/21 crossover, 5m timeframe**
- Trade size: **0.0001 BTC per signal**
- AI gate: **Claude Haiku** — reads crypto news, APPROVE/DENY
- Safety: **DRY_RUN = False** (live trading active)
