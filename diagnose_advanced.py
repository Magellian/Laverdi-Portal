#!/usr/bin/env python3

import paramiko
import sys

host = "66.42.70.66"
username = "root"
password = "F,6f$)bZKYr9CTDN"

commands = [
    ("1. systemctl status laverdi-portal.service", "systemctl status laverdi-portal.service"),
    ("2. systemd service file location", "systemctl cat laverdi-portal.service"),
    ("3. Check if npm process is still running", "ps aux | grep npm | grep -v grep"),
    ("4. Node version", "node --version"),
    ("5. npm version", "npm --version"),
    ("6. Check do-callback.ts file location", "find /root/laverdi-portal -name 'do-callback*' -type f 2>/dev/null"),
    ("7. Check pages/api/webhooks for callback files", "ls -la /root/laverdi-portal/pages/api/webhooks/ 2>/dev/null || echo 'Directory not found'"),
    ("8. View current do-callback file", "cat /root/laverdi-portal/pages/api/webhooks/do-callback.ts 2>/dev/null || echo 'File not found'"),
]

try:
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password, timeout=10)
    print("Connected!\n")
    
    for title, cmd in commands:
        print(f"\n{'='*60}")
        print(f"=== {title} ===")
        print(f"{'='*60}")
        try:
            stdin, stdout, stderr = ssh.exec_command(cmd, timeout=15)
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if output:
                print(output)
            if error and "grep" not in cmd:
                print(f"[STDERR] {error}")
        except Exception as e:
            print(f"[ERROR] {e}")
    
    ssh.close()
    print("\n\n" + "="*60)
    print("=== ADVANCED DIAGNOSIS COMPLETE ===")
    print("="*60)
    
except Exception as e:
    print(f"Failed to connect: {e}", file=sys.stderr)
    sys.exit(1)
