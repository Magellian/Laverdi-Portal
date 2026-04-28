#!/usr/bin/env python3
import json, urllib.request, subprocess

result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "SUPABASE_SERVICE_ROLE_KEY"],
    capture_output=True, text=True
)
SB_KEY = result.stdout.strip()
SB_URL = "https://dcvrkpgvxqdcboostkpz.supabase.co"
H = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}

req = urllib.request.Request(f"{SB_URL}/rest/v1/users?select=id,email,tier&email=eq.chrislaverdiere@gmail.com", headers=H)
users = json.loads(urllib.request.urlopen(req).read())
if users:
    print(f"Full ID: {users[0]['id']}")
    print(f"Email: {users[0]['email']}")
    print(f"Tier: {users[0]['tier']}")
