#!/usr/bin/env python3
"""Provision a test OpenClaw instance on Vultr"""

import requests
import time
import sys

vultr_api = 'https://api.vultr.com/v2'
vultr_key = '7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA'
user_id = '4593b36f-90c6-44a2-93d1-ba8e8be52a1c'  # chrislaverdiere@gmail.com

headers = {
    'Authorization': f'Bearer {vultr_key}',
    'Content-Type': 'application/json'
}

payload = {
    'region': 'sfo',
    'plan': 'vc2-1c-1gb',
    'os_id': 1743,
    'label': 'laverdi-openclaw-test',
    'tags': ['laverdi', 'openclaw', 'test', f'user-{user_id}']
}

print('🚀 Creating Vultr instance for test...')
print('=' * 50)
print()

resp = requests.post(f'{vultr_api}/instances', json=payload, headers=headers)

if resp.status_code != 202:
    print(f'ERROR: {resp.status_code}')
    print(resp.json())
    sys.exit(1)

data = resp.json()
instance = data['instance']
instance_id = instance['id']
status = instance.get('status')

print('✅ Instance created!')
print(f'   ID: {instance_id}')
print(f'   Status: {status}')
print(f'   Label: {instance.get("label")}')
print()
print('⏳ Waiting for IP assignment (polling every 5 seconds)...')
print('   This typically takes 30-60 seconds...')
print()

# Poll for IP
ip = None
for attempt in range(60):
    time.sleep(5)
    check_resp = requests.get(f'{vultr_api}/instances/{instance_id}', headers=headers)
    
    if check_resp.status_code == 200:
        inst = check_resp.json()['instance']
        ip = inst.get('main_ip')
        status = inst.get('status')
        
        if ip and ip != '':
            print(f'✅ IP assigned: {ip}')
            print(f'   Status: {status}')
            print()
            break
        else:
            elapsed = (attempt + 1) * 5
            print(f'   [{elapsed}s] Status: {status}, waiting for IP...')
    else:
        print(f'   ERROR checking status: {check_resp.status_code}')
        break

if not ip:
    print('ERROR: Could not get IP after 5 minutes')
    sys.exit(1)

print()
print('=' * 50)
print('✅ Instance provisioned successfully!')
print()
print('Instance Details:')
print(f'  Instance ID: {instance_id}')
print(f'  IP Address: {ip}')
print(f'  Region: sfo (San Francisco)')
print(f'  Plan: 1 CPU, 1GB RAM')
print()
print('Next steps:')
print(f'  1. SSH into: ssh root@{ip}')
print(f'  2. Install OpenClaw gateway')
print(f'  3. Update Supabase instances table with this IP')
print(f'  4. User can then pair Telegram and route messages')
print()
