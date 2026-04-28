#!/usr/bin/env python3
"""Test Stripe API connectivity and verify price IDs exist"""
import subprocess, json, urllib.request, urllib.error

# Get Stripe key from portal container
result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "STRIPE_SECRET_KEY"],
    capture_output=True, text=True
)
SK = result.stdout.strip()

def stripe_get(path):
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/{path}",
        headers={"Authorization": f"Bearer {SK}"}
    )
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": json.loads(e.read())}

# Check account
acct = stripe_get("account")
print(f"Account: {acct.get('business_profile', {}).get('name', acct.get('email', 'unknown'))}")
print(f"Mode: {'test' if 'test' in SK else 'live'}")

# Check price IDs
prices = {
    "starter": "price_1TOP3SBTYRav1HpsXRTdQpB3",
    "professional": "price_1TOOPxBTYRav1HpsXTTywQHc",
}

for name, price_id in prices.items():
    p = stripe_get(f"prices/{price_id}")
    if "error" in p:
        print(f"❌ {name}: {price_id} — {p['error'].get('message', 'error')}")
    else:
        amt = p.get('unit_amount', 0) / 100
        cur = p.get('currency', '?').upper()
        active = p.get('active', False)
        interval = p.get('recurring', {}).get('interval', '?')
        print(f"✅ {name}: ${amt}/{interval} ({cur}) active={active}")

# List all prices
print("\nAll prices in account:")
all_p = stripe_get("prices?limit=10")
for p in all_p.get('data', []):
    amt = p.get('unit_amount', 0) / 100
    interval = p.get('recurring', {}).get('interval', '?')
    print(f"  {p['id']}: ${amt}/{interval} active={p.get('active')}")

# Check webhook endpoints
print("\nWebhook endpoints:")
wh = stripe_get("webhook_endpoints?limit=5")
for ep in wh.get('data', []):
    print(f"  {ep['url']} status={ep.get('status')} events={len(ep.get('enabled_events', []))}")
