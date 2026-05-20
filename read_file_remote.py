#!/usr/bin/env python3
import paramiko
import base64

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
filepath = "/root/laverdi-portal/pages/api/provision.ts"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    # Read file and base64 encode it for local processing
    stdin, stdout, stderr = client.exec_command("base64 < {}".format(filepath))
    b64_content = stdout.read().decode('utf-8')
    
    # Decode and save to local file
    file_content = base64.b64decode(b64_content).decode('utf-8')
    
    local_path = "C:\\Users\\chris\\.openclaw\\workspace\\provision_original.ts"
    with open(local_path, "w") as f:
        f.write(file_content)
    
    print("[+] File retrieved and saved to: {}".format(local_path))
    print("[*] File size: {} bytes".format(len(file_content)))
    
    client.close()
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
