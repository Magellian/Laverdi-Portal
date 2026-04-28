import json, urllib.request

SB_URL = "https://dcvrkpgvxqdcboostkpz.supabase.co"
SB_KEY = "REDACTED_SUPABASE_SERVICE_ROLE_KEY"
HEADERS = {"apikey": SB_KEY, "Authorization": f"Bearer {SB_KEY}"}

# Check users table
req = urllib.request.Request(f"{SB_URL}/rest/v1/users?select=*", headers=HEADERS)
resp = urllib.request.urlopen(req)
users = json.loads(resp.read())
print(f"Users table: {len(users)} rows")
for u in users:
    print(f"  email={u.get('email')} tier={u.get('tier')} id={u.get('id','?')[:12]}")

# Check instances
req2 = urllib.request.Request(f"{SB_URL}/rest/v1/instances?select=*", headers=HEADERS)
resp2 = urllib.request.urlopen(req2)
instances = json.loads(resp2.read())
print(f"\nInstances: {len(instances)} rows")
for i in instances:
    print(f"  user={i.get('user_id','?')[:12]} status={i.get('status')} port={i.get('port')}")

# Check auth users
req3 = urllib.request.Request(f"{SB_URL}/auth/v1/admin/users", headers=HEADERS)
resp3 = urllib.request.urlopen(req3)
data = json.loads(resp3.read())
auth_users = data.get("users", [])
print(f"\nAuth users: {len(auth_users)}")
for u in auth_users:
    print(f"  email={u.get('email')} id={u.get('id','?')[:12]} confirmed={u.get('email_confirmed_at') is not None}")
