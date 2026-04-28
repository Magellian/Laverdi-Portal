#!/usr/bin/env python3
"""Fix provision-async.ts: update hardcoded IP address"""

path = '/root/laverdi-portal/pages/api/agents/provision-async.ts'
with open(path, 'r') as f:
    content = f.read()

# Fix hardcoded old IP
content = content.replace('ip_address: "64.23.142.154"', 'ip_address: "64.23.253.97"')

with open(path, 'w') as f:
    f.write(content)

print("Fixed ip_address in provision-async.ts")
