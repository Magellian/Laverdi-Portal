#!/usr/bin/env python3
import paramiko
import sys
import io

def ssh_command(host, user, password, command):
    """Execute SSH command with password authentication"""
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(host, username=user, password=password, timeout=10)
        
        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode('utf-8', errors='replace')
        error = stderr.read().decode('utf-8', errors='replace')
        
        client.close()
        
        if error:
            sys.stderr.write(error)
        return output
    except Exception as e:
        sys.stderr.write(f"SSH Error: {e}\n")
        return None

if __name__ == "__main__":
    host = "66.42.70.66"
    user = "root"
    password = "F,6f$)bZKYr9CTDN"
    command = sys.argv[1] if len(sys.argv) > 1 else "whoami"
    
    # Ensure stdout handles UTF-8
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    result = ssh_command(host, user, password, command)
    if result:
        sys.stdout.write(result)
