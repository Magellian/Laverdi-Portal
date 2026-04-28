#!/usr/bin/env python3
import json, urllib.request, subprocess, os

# Get the real Supabase key from the portal container
result = subprocess.run(
    ["docker", "exec", "laverdi-portal", "printenv", "SUPABASE_SERVICE_ROLE_KEY"],
    capture_output=True, text=True
)
SB_KEY = result.stdout.strip()
SB_URL = "https://dcvrkpgvxqdcboostkpz.supabase.co"
H = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}

# Users table
req = urllib.request.Request(f"{SB_URL}/rest/v1/users?select=*", headers=H)
users = json.loads(urllib.request.urlopen(req).read())
print(f"Users table: {len(users)}")
for u in users:
    print(f"  {u.get('email')}  tier={u.get('tier')}  id={u.get('id','?')[:12]}")

# Instances
req2 = urllib.request.Request(f"{SB_URL}/rest/v1/instances?select=*", headers=H)
inst = json.loads(urllib.request.urlopen(req2).read())
print(f"\nInstances: {len(inst)}")
for i in inst:
    print(f"  user={i.get('user_id','?')[:12]}  status={i.get('status')}  port={i.get('port')}")

# Docker containers
print(f"\nDocker containers:")
os.system("docker ps --format '  {{.Names}}  {{.Status}}'")

# Command center logs (last 5 lines)
print(f"\nCommand Center recent logs:")
os.system("docker logs laverdi-command-center --tail 5 2>&1")
