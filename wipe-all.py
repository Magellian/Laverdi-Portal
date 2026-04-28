#!/usr/bin/env python3
import json, urllib.request, subprocess

result = subprocess.run(
    ["docker", "exec", "laverdi-command-center", "printenv", "ANTHROPIC_API_KEY"],
    capture_output=True, text=True
)
# Get Supabase key from portal
result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "SUPABASE_SERVICE_ROLE_KEY"],
    capture_output=True, text=True
)
SB_KEY = result.stdout.strip()
SB_URL = "https://dcvrkpgvxqdcboostkpz.supabase.co"
H = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}

# 1. Delete instances
req = urllib.request.Request(
    f"{SB_URL}/rest/v1/instances?id=neq.00000000-0000-0000-0000-000000000000",
    headers={**H, "Prefer": "return=representation"},
    method="DELETE"
)
try:
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    print(f"Deleted {len(d)} instances")
except Exception as e:
    print(f"Instances: {e}")

# 2. Delete users table
req = urllib.request.Request(
    f"{SB_URL}/rest/v1/users?id=neq.00000000-0000-0000-0000-000000000000",
    headers={**H, "Prefer": "return=representation"},
    method="DELETE"
)
try:
    resp = urllib.request.urlopen(req)
    d = json.loads(resp.read())
    print(f"Deleted {len(d)} user rows")
except Exception as e:
    print(f"Users: {e}")

# 3. Delete auth users
req = urllib.request.Request(f"{SB_URL}/auth/v1/admin/users", headers=H)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
users = data.get("users", []) if isinstance(data, dict) else data
for u in users:
    dreq = urllib.request.Request(
        f"{SB_URL}/auth/v1/admin/users/{u['id']}",
        headers=H, method="DELETE"
    )
    urllib.request.urlopen(dreq)
    print(f"  Deleted auth: {u.get('email')}")
print(f"Deleted {len(users)} auth users")

# Verify
req = urllib.request.Request(f"{SB_URL}/auth/v1/admin/users", headers=H)
resp = urllib.request.urlopen(req)
data = json.loads(resp.read())
a = len(data.get("users", []))
req2 = urllib.request.Request(f"{SB_URL}/rest/v1/users?select=id", headers=H)
u = len(json.loads(urllib.request.urlopen(req2).read()))
req3 = urllib.request.Request(f"{SB_URL}/rest/v1/instances?select=id", headers=H)
i = len(json.loads(urllib.request.urlopen(req3).read()))
print(f"\nAuth: {a} | Users: {u} | Instances: {i}")
print("✅ ALL CLEAN" if a == 0 and u == 0 and i == 0 else "⚠️ Still has data")
