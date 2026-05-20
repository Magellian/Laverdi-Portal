#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[INFO] Checking webhook endpoint code...\n")
    
    # Check for the webhook handler
    print("[1] Looking for webhook handlers in portal...\n")
    
    stdin, stdout, stderr = client.exec_command("find /root/laverdi-portal/pages/api -name '*webhook*' -o -name '*instance*' | head -10")
    files = stdout.read().decode()
    print("Found files:")
    print(files)
    
    # Check instance-ready webhook
    print("\n[2] Checking /api/webhooks/instance-ready endpoint...")
    stdin, stdout, stderr = client.exec_command("head -80 /root/laverdi-portal/pages/api/webhooks/instance-ready.ts 2>/dev/null || echo 'File not found'")
    webhook_code = stdout.read().decode()
    print(webhook_code)
    
    # Check if there's an update-token endpoint
    print("\n[3] Checking /api/update-token endpoint...")
    stdin, stdout, stderr = client.exec_command("head -60 /root/laverdi-portal/pages/api/update-token.ts 2>/dev/null || echo 'File not found'")
    token_code = stdout.read().decode()
    print(token_code)
    
    # Check for any token-related functions
    print("\n[4] Searching for token handling code...")
    stdin, stdout, stderr = client.exec_command("grep -r 'gateway.*token\\|GATEWAY_TOKEN' /root/laverdi-portal/pages/api --include='*.ts' 2>/dev/null | head -20")
    token_refs = stdout.read().decode()
    print(token_refs if token_refs else "(none found)")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
