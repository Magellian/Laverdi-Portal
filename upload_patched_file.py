#!/usr/bin/env python3
import paramiko
import base64

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
local_file = "C:\\Users\\chris\\.openclaw\\workspace\\provision_original.ts"
remote_file = "/root/laverdi-portal/pages/api/provision.ts"

try:
    # Read the patched local file
    with open(local_file, "r") as f:
        patched_content = f.read()
    
    print("[*] Read patched file: {} bytes".format(len(patched_content)))
    
    # Connect to remote server
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[+] Connected to {}".format(host))
    
    # Create a backup first
    stdin, stdout, stderr = client.exec_command("cp {} {}.backup".format(remote_file, remote_file))
    exit_code = stdout.channel.recv_exit_status()
    if exit_code == 0:
        print("[+] Backup created: {}.backup".format(remote_file))
    
    # Use SFTP to upload the file (more reliable than trying to pipe through SSH)
    sftp = client.open_sftp()
    sftp.putfo(open(local_file, "rb"), remote_file)
    sftp.close()
    
    print("[+] File uploaded to {}".format(remote_file))
    
    # Verify the upload
    stdin, stdout, stderr = client.exec_command("wc -l {}".format(remote_file))
    verify = stdout.read().decode('utf-8').strip()
    print("[*] Remote file info: " + verify)
    
    # Check for syntax errors by looking for the new code
    stdin, stdout, stderr = client.exec_command("grep -n 'Generating gateway auth token' {}".format(remote_file))
    grep_result = stdout.read().decode('utf-8').strip()
    if grep_result:
        print("[+] Patch verified! Found new code:")
        print("    " + grep_result)
    else:
        print("[-] New code not found - patch may have failed")
    
    client.close()
    print("[+] Done")
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
    import traceback
    traceback.print_exc()
