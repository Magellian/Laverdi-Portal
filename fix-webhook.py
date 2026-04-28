#!/usr/bin/env python3
import subprocess, json, urllib.request, urllib.parse

result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "STRIPE_SECRET_KEY"],
    capture_output=True, text=True
)
SK = result.stdout.strip()

# Update webhook endpoint URL
webhook_id = "we_1THFqGBTYRav1HpsAjyNk7bz"
data = urllib.parse.urlencode({
    "url": "https://laverdi.tech/api/stripe/webhook",
}).encode()

req = urllib.request.Request(
    f"https://api.stripe.com/v1/webhook_endpoints/{webhook_id}",
    data=data,
    headers={"Authorization": f"Bearer {SK}"},
    method="POST"
)
resp = json.loads(urllib.request.urlopen(req).read())
print(f"✅ Webhook updated:")
print(f"  URL: {resp['url']}")
print(f"  Status: {resp.get('status')}")
print(f"  Secret: {resp.get('secret', 'unchanged')}")

# Check if we need to update the webhook secret in .env
if resp.get('secret'):
    print(f"\n⚠️  NEW webhook secret generated: {resp['secret']}")
    print("  Update STRIPE_WEBHOOK_SECRET in .env.local!")
