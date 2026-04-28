import ccxt
import time

ex = ccxt.kraken({'enableRateLimit': True})
markets = ex.load_markets()
usd_pairs = [s for s in markets if s.endswith('/USD') and markets[s]['active']]

print("Scanning " + str(len(usd_pairs)) + " USD pairs...")
results = []
count = 0
for pair in usd_pairs:
    try:
        t = ex.fetch_ticker(pair)
        count += 1
        if count % 20 == 0:
            print("  scanned " + str(count) + "...")
        last = t.get('last', 0) or 0
        high = t.get('high', 0) or 0
        low = t.get('low', 0) or 0
        qvol = t.get('quoteVolume', 0) or 0
        chg = t.get('percentage', 0) or 0
        if last > 0 and high > 0 and low > 0 and qvol > 50000:
            rng = ((high - low) / last) * 100
            results.append((pair, last, chg, round(rng, 2), round(qvol)))
    except:
        pass
    time.sleep(0.1)

results.sort(key=lambda x: x[3], reverse=True)

print("")
print("TOP 20 MOST VOLATILE (24h range %, >$50k vol)")
print("=" * 70)
print("%-14s %12s %10s %10s %14s" % ("Pair", "Price", "24h Chg", "Range%", "Volume $"))
print("-" * 70)
for r in results[:20]:
    print("%-14s %12.4f %+9.1f%% %9.1f%% %14s" % (r[0], r[1], r[2], r[3], "{:,}".format(r[4])))

print("")
print("Range% = how much the price swung in 24h relative to current price")
print("Higher range = more opportunity for SMA crossover captures")
