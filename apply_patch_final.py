#!/usr/bin/env python3
import paramiko

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
filepath = "/root/laverdi-portal/pages/api/provision.ts"

# The old pattern (lines 88-90)
old_str = (
    "      'echo \"Config pre-created.\"',"
    "\n"
    "      '',"
    "\n"
    "      'echo \"Starting container...\"',"
)

# The new replacement with token injection code
new_str = (
    "      'echo \"Config pre-created.\"',"
    "\n"
    "      '',"
    "\n"
    "      'echo \"Generating gateway auth token...\"',"
    "\n"
    "      'GATEWAY" "_TOKEN=$(openssl rand -hex 32)',"
    "\n"
    "      'echo \"Generated token: " + "GATEWAY" "_TOKEN" + "\"',"
    "\n"
    "      '',"
    "\n"
    "      '# Inject token into openclaw.json using sed (avoid jq dependency)',"
    "\n"
    "      'sed -i \\'s/\"mode\": \"token\"/\"mode\": \"token\", \"token\": \"" + "GATEWAY" "_TOKEN" + "\"/\\' /opt/openclaw-config/openclaw.json',"
    "\n"
    "      '',"
    "\n"
    "      '# Store token metadata for admin retrieval',"
    "\n"
    "      'cat > /opt/openclaw-config/gateway-token.json << TOKENEOF',"
    "\n"
    "      '{',"
    "\n"
    "      '  \"token\": \"" + "GATEWAY" "_TOKEN" + "\",',"
    "\n"
    "      '  \"generated_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ),\"',"
    "\n"
    "      '  \"user_id\": \"' + userId + '\",',"
    "\n"
    "      '  \"instance_id\": \"' + instanceId + '\"',"
    "\n"
    "      '}',"
    "\n"
    "      'TOKENEOF',"
    "\n"
    "      'chmod 600 /opt/openclaw-config/gateway-token.json',"
    "\n"
    "      'echo \"Token injected and stored.\"',"
    "\n"
    "      '',"
    "\n"
    "      'echo \"Starting container...\"',"
)

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[*] Connected to {}".format(host))
    
    # Read the file
    stdin, stdout, stderr = client.exec_command("cat " + filepath)
    content = stdout.read().decode('utf-8')
    
    print("[*] File read: {} bytes".format(len(content)))
    
    if old_str in content:
        print("[+] Found exact pattern to replace!")
        new_content = content.replace(old_str, new_str)
        print("[*] Replacement prepared: {} bytes -> {} bytes".format(len(content), len(new_content)))
        
        # Write the modified content back
        # Use a temporary file to avoid issues with special characters
        temp_file = "/tmp/provision_ts_patch"
        print("[*] Writing to temporary file: " + temp_file)
        
        # Write in chunks using SSH
        write_cmd = "cat > '{}' << 'PATCHEOF'\n{}\nPATCHEOF".format(filepath, new_content)
        stdin, stdout, stderr = client.exec_command(write_cmd)
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print("[+] File patched successfully!")
            
            # Verify the change
            stdin, stdout, stderr = client.exec_command("sed -n '88,110p' " + filepath)
            verify = stdout.read().decode('utf-8')
            print("\n[*] Verification (lines 88-110 of patched file):")
            print(verify)
        else:
            err = stderr.read().decode('utf-8')
            print("[-] Write failed: " + err)
    else:
        print("[-] Pattern not found")
    
    client.close()
    print("[+] Connection closed")
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
    import traceback
    traceback.print_exc()
