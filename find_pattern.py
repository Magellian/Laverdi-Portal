#!/usr/bin/env python3
import paramiko

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
filepath = "/root/laverdi-portal/pages/api/provision.ts"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    # Read the file
    stdin, stdout, stderr = client.exec_command("cat " + filepath)
    content = stdout.read().decode('utf-8')
    
    # Find the section with Config pre-created
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'Config pre-created' in line:
            print("[*] Found at line {}: {}".format(i+1, repr(line)))
            # Print surrounding lines
            start = max(0, i-2)
            end = min(len(lines), i+5)
            print("\n[*] Context (lines {}-{}):\n".format(start+1, end))
            for j in range(start, end):
                print("{}: {}".format(j+1, repr(lines[j])))
    
    client.close()
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
