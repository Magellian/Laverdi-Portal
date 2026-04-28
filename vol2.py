import ccxt, sys

ex = ccxt.kraken({'enableRateLimit': True})

# Known volatile pairs on Kraken
pairs = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'DOGE/USD', 'XRP/USD',
    'AVAX/USD', 'LINK/USD', 'ADA/USD', 'DOT/USD', 'MATIC/USD',
    'SHIB/USD', 'PEPE/USD', 'FET/USD', 'RENDER/USD', 'INJ/USD',
    'SUI/USD', 'APT/USD', 'NEAR/USD', 'ARB/USD', 'OP/USD',
    'ATOM/USD', 'FIL/USD', 'LTC/USD', 'UNI/USD', 'AAVE/USD',
    'MKR/USD', 'WIF/USD', 'BONK/USD', 'FLOKI/USD', 'TRX/USD',
]

results = []
for pair in pairs:
    try:
        t = ex.fetch_ticker(pair)
        last = t.get('last', 0) or 0
        high = t.get('high', 0) or 0
        low = t.get('low', 0) or 0
        qvol = t.get('quoteVolume', 0) or 0
        chg = t.get('percentage', 0) or 0
        if last > 0 and high > 0:
            rng = ((high - low) / last) * 100
            results.append((pair, last, chg, round(rng, 2), round(qvol)))
    except Exception as e:
        sys.stderr.write(str(pair) + " skipped: " + str(e) + "\n")

results.sort(key=lambda x: x[3], reverse=True)

print("%-14s %12s %10s %10s %14s" % ("PAIR", "PRICE", "24H CHG", "RANGE%", "VOLUME $"))
print("-" * 64)
for r in results:
    print("%-14s %12.4f %+9.1f%% %9.1f%% %14s" % (r[0], r[1], r[2], r[3], "{:,}".format(r[4])))
