# Trading Bridge Project

## Architecture
- **Brain (Signal Generation):** Python script (`src/trading-bridge/brain.py`) polling exchange data and calculating indicators (e.g., SMA crossovers) locally. Bypasses TradingView paywalls.
- **Bridge (Webhook Catcher):** FastAPI server (Python).
- **Execution (Exchange API):** Exchange API via `ccxt`.

## Current State
- **Live Status:** Bridge is running natively on Port 8000 (`DRY_RUN = False`).
- **Signal Generator:** `signal_engine.py` using `ccxt` to pull 5m candles and generate SMA crossovers locally. Built-in Stop-And-Reverse (SAR) logic sizes trades dynamically (1x to open, 2x to flip).
- **AI Risk Manager:** Armed and active. Primary is Google Gemini (analyzing live CoinDesk RSS news). Fallback is OpenAI ChatGPT. Retries built-in for transient 503/429 errors. Fails closed (blocks trades) if AI is unavailable.
- **Futures Branch:** Codebase updated to support `ccxt.krakenfutures`. Requires `{"market": "futures"}` in webhook payload. Futures keys are loaded successfully and the bridge reports `futures_connected: true`, but execution is still gated safely behind `ENABLE_FUTURES=False` in `.env`.

## Phase 1: Exchange Setup & Security
- Create account on preferred exchange.
- Generate API Keys.
- **Security:** Enable "Spot & Futures Trading" permissions. Disable "Withdrawal" permissions.
- Move test capital ($50-$100) to Futures/Derivatives.

## Phase 2: Webhook Receiver (Python/FastAPI)
- Build dedicated script (FastAPI + `ccxt`).
- Logic: Receive JSON (`{"action": "long", "ticker": "BTC/USDT", "size": 0.01}`) -> Authenticate -> Place Order.

## Phase 3: TradingView Integration
- Write basic Pine Script strategy.
- Create Alert pointing to Webhook URL (ngrok/localtunnel for local, VPS for prod).
- Format alert message to send dynamic JSON.

## Phase 4: AI Layer (Optional)
- Add LLM filter before execution (analyze signal + news/sentiment).

## Maintenance Log
- **2026-03-28:** ngrok setup confirmed working locally for routing Webhooks from TradingView to the Python/FastAPI application. Local ngrok token authenticated.
- **2026-03-28:** Successfully tested public internet access using `localtunnel` (`npx localtunnel --port 8000`). Public POST request hit the FastAPI `/webhook` endpoint successfully.
- **2026-03-28:** Kraken API Key and Secret successfully secured in `.env` and authenticated. The webhook receiver successfully pinged Kraken to read the account balance on boot.
- **2026-04-09:** Upgraded AI Risk Gate (Switched Anthropic -> Gemini with OpenAI fallback). Implemented Kraken Futures branch in `main.py` using `ccxt.krakenfutures`. Upgraded `signal_engine.py` with Stop-And-Reverse (SAR) logic and futures market payload flags. Set `DRY_RUN = False`.
- **2026-04-09:** Spot bridge sizing changed from 30% to 20% of available cash. Futures keys added and verified, returning `futures_connected: true` on health checks while `ENABLE_FUTURES=False` keeps the futures branch safely disabled.