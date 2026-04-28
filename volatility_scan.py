import ccxt, os
from dotenv import load_dotenv
load_dotenv('C:/Services/trading-bridge/.env')

ex = ccxt.kraken({
    'apiKey': os.getenv('KRAKEN_API_KEY'),
    'secret': os.getenv('KRAKEN_API_SECRET'),
    'enableRateLimit': True
})

markets = ex.load_markets()
usd_pairs = [s for s in markets if s.endswith('/USD') and markets[s]['active']]

print(f"Scanning {len(usd_pairs)} USD pairs on Kraken...")
results = []
for pair in usd_pairs:
    try:
        t = ex.fetch_ticker(pair)
        if t.get('last') and t.get('high') and t.get('low') and t['last'] > 0:
            vol_pct = ((t['high'] - t['low']) / t['last']) * 100
            volume_usd = t.get('quoteVolume') or 0
            if volume_usd > 100000:
                results.append({
                    'pair': pair,
                    'price': t['last'],
                    'change': t.get('percentage', 0) or 0,
                    'range': round(vol_pct, 2),
                    'vol': round(volume_usd),
                })
    except Exception as e:
        pass

results.sort(key=lambda x: x['range'], reverse=True)

print()
print("=" * 72)
print("TOP 20 MOST VOLATILE KRAKEN PAIRS (24h range, >$100k volume)")
print("=" * 72)
header = f"{'Pair':<14}{'Price':>12}{'24h Chg':>10}{'Range':>10}{'Volume $':>14}"
print(header)
print("-" * 72)
for r in results[:20]:
    line = f"{r['pair']:<14}{r['price']:>12.4f}{r['change']:>+9.1f}%{r['range']:>9.1f}%{r['vol']:>14,}"
    print(line)

print()
print("Range % = (24h High - Low) / Price — higher = more volatile")
print("These are the pairs where SMA crossover strategies capture the most movement.")
