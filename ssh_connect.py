#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import json
import warnings
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Suppress warnings
warnings.filterwarnings("ignore")

ip = "45.32.228.157"
user = "root"
password = "Q,6s]doR]xez%Jns"

print(f"Connecting to {user}@{ip}...")

try:
    # Create SSH client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # Connect
    ssh.connect(ip, username=user, password=password, timeout=30, allow_agent=False, look_for_keys=False)
    print("[OK] Connected successfully")
    
    # Run command to get openclaw.json
    print("\nFetching /opt/openclaw-config/openclaw.json...")
    stdin, stdout, stderr = ssh.exec_command('cat /opt/openclaw-config/openclaw.json')
    openclaw_content = stdout.read().decode('utf-8')
    openclaw_error = stderr.read().decode('utf-8')
    
    if openclaw_error:
        print(f"Error reading openclaw.json: {openclaw_error}")
    else:
        print("[OK] File retrieved")
        try:
            data = json.loads(openclaw_content)
            token = data.get('gateway', {}).get('auth', {}).get('token', 'NOT_FOUND')
            print(f"\nToken (full): {token}")
            print(f"Token length: {len(token)} chars")
            
            # Print full openclaw.json for verification
            print("\nFull openclaw.json content:")
            print(json.dumps(data, indent=2))
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print(f"Raw content: {openclaw_content[:500]}")
    
    # Get gateway-token.json
    print("\nFetching /opt/openclaw-config/gateway-token.json...")
    stdin, stdout, stderr = ssh.exec_command('cat /opt/openclaw-config/gateway-token.json')
    metadata_content = stdout.read().decode('utf-8')
    metadata_error = stderr.read().decode('utf-8')
    
    if metadata_error and "No such file" in metadata_error:
        print(f"Metadata file not found (expected if not yet created)")
    elif metadata_error:
        print(f"Error: {metadata_error}")
    else:
        print("[OK] Metadata file retrieved")
        print(f"Content: {metadata_content[:500]}")
    
    # Check gateway health
    print("\nChecking gateway health...")
    stdin, stdout, stderr = ssh.exec_command('curl -s http://localhost:18789/health || echo "UNREACHABLE"')
    health = stdout.read().decode('utf-8')
    print(f"Health: {health[:200]}")
    
    ssh.close()
    
except Exception as e:
    print(f"[FAIL] Connection failed: {e}")
    import traceback
    traceback.print_exc()
