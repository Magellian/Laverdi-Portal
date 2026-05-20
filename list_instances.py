#!/usr/bin/env python3
import subprocess
import json

result = subprocess.run([
    "curl", "-s",
    "https://dcvrkpgvxqdcboostkpz.supabase.co/rest/v1/instances?select=container_id,ip_address,status,created_at&order=created_at.desc&limit=50",
    "-H", "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDYyODIsImV4cCI6MjA5MDU4MjI4Mn0.xgfGg_l1aXrlZX2Hjz45ZfGIFl8-JE3Dl8vmsrFhmKg"
], capture_output=True, text=True, timeout=10)

try:
    data = json.loads(result.stdout)
    if isinstance(data, list):
        print(f"Total instances in database: {len(data)}\n")
        print("Most recent 20:")
        print("-" * 70)
        for i, inst in enumerate(data[:20], 1):
            id_short = inst['container_id'][:8] if inst.get('container_id') else '?'
            ip = inst.get('ip_address') or 'PENDING'
            status = inst.get('status', '?')
            date = inst.get('created_at', '?')[:10] if inst.get('created_at') else '?'
            print(f"{i:2}. {id_short}... | {ip:16} | {status:10} | {date}")
    else:
        print(f"Error response: {data}")
except json.JSONDecodeError:
    print("Parse error. Raw output:")
    print(result.stdout[:300])
except Exception as e:
    print(f"Error: {e}")
