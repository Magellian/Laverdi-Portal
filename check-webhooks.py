#!/usr/bin/env python3
import subprocess, json, urllib.request

result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "STRIPE_SECRET_KEY"],
    capture_output=True, text=True
)
SK = result.stdout.strip()

req = urllib.request.Request(
    "https://api.stripe.com/v1/webhook_endpoints?limit=10",
    headers={"Authorization": f"Bearer {SK}"}
)
data = json.loads(urllib.request.urlopen(req).read())

if not data.get('data'):
    print("⚠️  No webhook endpoints configured!")
    print("Need to create one pointing to: https://laverdi.tech/api/stripe/webhook")
else:
    for ep in data['data']:
        print(f"URL: {ep['url']}")
        print(f"  Status: {ep.get('status')}")
        print(f"  Events: {ep.get('enabled_events', [])}")
        print(f"  ID: {ep['id']}")
        print()
