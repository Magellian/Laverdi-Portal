#!/usr/bin/env python3

import paramiko
import sys

host = "66.42.70.66"
username = "root"
password = "F,6f$)bZKYr9CTDN"

commands = [
    ("1. Docker daemon status", "docker ps"),
    ("2. All containers", "docker ps -a"),
    ("3. LaVerdi containers", "docker ps -a | grep -i laverdi || echo 'No laverdi containers'"),
    ("4. docker-compose.yml location", "ls -la /root/laverdi-portal/docker-compose.yml 2>/dev/null || echo 'File not found'"),
    ("5. LaVerdi systemd services", "systemctl list-units --all 2>/dev/null | grep -i laverdi || echo 'No laverdi services'"),
    ("6. Port 3000 listeners", "netstat -tlnp 2>/dev/null | grep 3000 || ss -tlnp 2>/dev/null | grep 3000 || lsof -i :3000 2>/dev/null || echo 'Port 3000 unknown'"),
    ("7. Directory listing", "ls -la /root/laverdi-portal/"),
    ("8. docker-compose version", "docker-compose --version 2>/dev/null && docker compose --version 2>/dev/null"),
    ("9. Node/npm processes", "ps aux | grep -E '(node|npm|3000)' | grep -v grep || echo 'No node processes'"),
    ("10. Docker info", "docker info 2>&1 | head -20"),
    ("11. find deployment files", "find /root/laverdi-portal -type f \\( -name '*.json' -o -name 'Dockerfile*' -o -name 'docker-compose*' -o -name '*.yml' \\) 2>/dev/null"),
]

try:
    print(f"Connecting to {host}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password, timeout=10)
    print("Connected!")
    
    for title, cmd in commands:
        print(f"\n=== {title} ===")
        print(f"$ {cmd}")
        try:
            stdin, stdout, stderr = ssh.exec_command(cmd, timeout=10)
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if output:
                print(output)
            if error:
                print(f"[ERROR] {error}")
        except Exception as e:
            print(f"[ERROR] {e}")
    
    ssh.close()
    print("\n\n=== DIAGNOSIS COMPLETE ===")
    
except Exception as e:
    print(f"Failed to connect: {e}", file=sys.stderr)
    sys.exit(1)
