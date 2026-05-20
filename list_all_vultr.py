#!/usr/bin/env python3
import subprocess
import json

print("[VULTR] All Instances\n")

result = subprocess.run([
    "curl", "-s",
    "https://api.vultr.com/v2/instances",
    "-H", "Authorization: Bearer 7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA"
], capture_output=True, text=True, timeout=15)

try:
    data = json.loads(result.stdout)
    instances = data.get('instances', [])
    
    print(f"Total on Vultr: {len(instances)}\n")
    
    keep_id = "41b535c2-ca64-441d-aef3-4113702442b7"
    keep_inst = None
    others = []
    
    for inst in instances:
        if inst['id'] == keep_id:
            keep_inst = inst
        else:
            others.append(inst)
    
    if keep_inst:
        print("KEEP:")
        print(f"  ID: {keep_inst['id'][:8]}...")
        print(f"  Label: {keep_inst.get('label', 'N/A')}")
        print(f"  IP: {keep_inst.get('main_ip', 'PENDING')}")
        print(f"  Status: {keep_inst.get('status')}")
        print(f"  Created: {keep_inst.get('date_created', '?')[:10]}")
        print()
    
    print(f"DELETE (Others): {len(others)}\n")
    for i, inst in enumerate(others, 1):
        print(f"{i}. ID: {inst['id']}")
        print(f"   Label: {inst.get('label', 'NONE')}")
        print(f"   IP: {inst.get('main_ip', 'PENDING')}")
        print(f"   Status: {inst.get('status')}")
        print(f"   Created: {inst.get('date_created', '?')[:10]}")
        print()
        
except json.JSONDecodeError as e:
    print("Parse error:", e)
    print("Response:", result.stdout[:500])
except Exception as e:
    print("Error:", e)
