#!/usr/bin/env python3
"""Test creating a Stripe checkout session"""
import subprocess, json, urllib.request, urllib.parse

result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "STRIPE_SECRET_KEY"],
    capture_output=True, text=True
)
SK = result.stdout.strip()

# Create a test customer
data = urllib.parse.urlencode({"email": "test@example.com"}).encode()
req = urllib.request.Request(
    "https://api.stripe.com/v1/customers",
    data=data,
    headers={"Authorization": f"Bearer {SK}"}
)
cust = json.loads(urllib.request.urlopen(req).read())
print(f"Customer: {cust['id']}")

# Create checkout session
session_data = urllib.parse.urlencode({
    "customer": cust['id'],
    "payment_method_types[0]": "card",
    "line_items[0][price]": "price_1TOP3SBTYRav1HpsXRTdQpB3",
    "line_items[0][quantity]": "1",
    "mode": "subscription",
    "success_url": "https://laverdi.tech/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    "cancel_url": "https://laverdi.tech/dashboard",
}).encode()

req2 = urllib.request.Request(
    "https://api.stripe.com/v1/checkout/sessions",
    data=session_data,
    headers={"Authorization": f"Bearer {SK}"}
)
session = json.loads(urllib.request.urlopen(req2).read())
print(f"Session ID: {session['id']}")
print(f"Session URL: {session['url']}")
print(f"Status: {session.get('status')}")

# Clean up test customer
req3 = urllib.request.Request(
    f"https://api.stripe.com/v1/customers/{cust['id']}",
    headers={"Authorization": f"Bearer {SK}"},
    method="DELETE"
)
urllib.request.urlopen(req3)
print("Test customer deleted")
