import ccxt

ex = ccxt.kraken({'enableRateLimit': True})

for symbol in ['BTC/USD', 'SOL/USD', 'SUI/USD']:
    try:
        ohlcv = ex.fetch_ohlcv(symbol, '5m', limit=26)
        closes = [c[4] for c in ohlcv]
        sma9 = sum(closes[-9:]) / 9
        sma21 = sum(closes[-21:]) / 21
        price = closes[-1]
        spread = ((sma9 - sma21) / price) * 100
        signal = "BUY" if sma9 > sma21 else "SELL"
        print("%s | Price: %.4f | SMA9: %.4f | SMA21: %.4f | Spread: %+.2f%% | Signal: %s" % (
            symbol, price, sma9, sma21, spread, signal))
    except Exception as e:
        print("%s | ERROR: %s" % (symbol, e))
