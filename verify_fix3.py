#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verify FIX #3 was successful
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

try:
    import paramiko
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

HOST = "66.42.70.66"
USER = "root"
PASSWORD = "F,6f$)bZKYr9CTDN"
REMOTE_FILE = "/root/command-center.py"

print("=" * 60)
print("Verification of FIX #3")
print("=" * 60)

print(f"\n[*] Connecting to {USER}@{HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
    print("[✓] Connected successfully!")
    
    # Read the file
    print(f"\n[*] Reading {REMOTE_FILE}...")
    stdin, stdout, stderr = ssh.exec_command(f"cat {REMOTE_FILE}")
    content = stdout.read().decode('utf-8')
    
    # Check for the new endpoints
    endpoints = [
        '/api/configure-channels',
        '/api/get-channels',
        '/api/delete-channel',
        'from datetime import datetime',
        'from supabase import create_client'
    ]
    
    print("\n[*] Checking for new content...")
    print("-" * 60)
    
    all_found = True
    for endpoint in endpoints:
        if endpoint in content:
            print(f"[✓] Found: {endpoint}")
        else:
            print(f"[✗] Missing: {endpoint}")
            all_found = False
    
    print("-" * 60)
    
    if all_found:
        print("\n[✓✓✓] FIX #3 SUCCESSFUL!")
        print("All new endpoints and imports are present in command-center.py")
    else:
        print("\n[!] Some items are missing - verification failed")
    
    # Show snippet of the new endpoints
    print("\n[*] Snippet of new endpoints in the file:")
    print("-" * 60)
    
    if '/api/configure-channels' in content:
        start = content.find("@app.route('/api/configure-channels'")
        if start > 0:
            end = content.find("\n@app.route", start + 100)
            snippet = content[start:end if end > 0 else start + 500]
            lines = snippet.split('\n')[:15]
            for line in lines:
                print(line)
        print("...")
    
    print("-" * 60)
    
    # Test the endpoint
    print("\n[*] Testing API endpoint (curl)...")
    stdin, stdout, stderr = ssh.exec_command(
        "timeout 5 curl -s -X POST http://localhost:8000/api/get-channels "
        "-H 'Content-Type: application/json' "
        "-d '{\"user_id\":\"test-user-123\"}' 2>&1 || echo 'Connection test'"
    )
    api_response = stdout.read().decode('utf-8')
    print(f"API Response:\n{api_response}")
    
    ssh.close()
    
except Exception as e:
    print(f"[✗] Error: {e}")
    sys.exit(1)
