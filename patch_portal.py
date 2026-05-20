#!/usr/bin/env python3
import paramiko
import sys

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
filepath = "/root/laverdi-portal/pages/api/provision.ts"

try:
    # Create SSH client
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    # Read the file
    stdin, stdout, stderr = client.exec_command(f"cat {filepath}")
    content = stdout.read().decode('utf-8')
    
    print(content)
    client.close()
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
