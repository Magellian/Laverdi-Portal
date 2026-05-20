#!/usr/bin/env python3
import paramiko
import os

host = "66.42.70.66"
user = "root"
password = "F,6f$)bZKYr9CTDN"
filepath = "/root/laverdi-portal/pages/api/provision.ts"

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("[*] Connected to {}".format(host))
    
    # Read the file to show what we're working with
    stdin, stdout, stderr = client.exec_command("wc -l {}".format(filepath))
    lines_info = stdout.read().decode('utf-8').strip()
    print("[*] File info: " + lines_info)
    
    # First, backup the file
    stdin, stdout, stderr = client.exec_command("cp {} {}.bak".format(filepath, filepath))
    exit_code = stdout.channel.recv_exit_status()
    if exit_code == 0:
        print("[+] Backup created")
    
    # Now let's create a Python script on the remote server to do the replacement
    # This avoids shell injection issues
    remote_script = "/tmp/do_patch.py"
    
    script_content = '''#!/usr/bin/env python3
filepath = "/root/laverdi-portal/pages/api/provision.ts"

with open(filepath, "r") as f:
    content = f.read()

old_str = "      'echo \\"Config pre-created.\\"'," + "\\n" + "      ''," + "\\n" + "      'echo \\"Starting container...\\"',"

if old_str in content:
    print("[+] Pattern found!")
    # Perform replacement - build the new string step by step
    new_lines = [
        "      'echo \\"Config pre-created.\\"',",
        "      '',",
        "      'echo \\"Generating gateway auth token...\\"',",
        "      'GATEWAY_TOKEN=$(openssl rand -hex 32)',",
        "      'echo \\"Generated token: GATEWAY_TOKEN\\"',",
        "      '',",
        "      '# Inject token into openclaw.json using sed (avoid jq dependency)',",
        "      'sed -i \\\\'s/\\"mode\\": \\"token\\"/\\"mode\\": \\"token\\", \\"token\\": \\"GATEWAY_TOKEN\\"/\\\\' /opt/openclaw-config/openclaw.json',",
        "      '',",
        "      '# Store token metadata for admin retrieval',",
        "      'cat > /opt/openclaw-config/gateway-token.json << TOKENEOF',",
        "      '{',",
        "      '  \\"token\\": \\"GATEWAY_TOKEN\\",',",
        "      '  \\"generated_at\\": \\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\\",',",
        "      '  \\"user_id\\": \\"' + userId + '\\",',",
        "      '  \\"instance_id\\": \\"' + instanceId + '\\"',",
        "      '}',",
        "      'TOKENEOF',",
        "      'chmod 600 /opt/openclaw-config/gateway-token.json',",
        "      'echo \\"Token injected and stored.\\"',",
        "      '',",
        "      'echo \\"Starting container...\\"',",
    ]
    new_str = "\\n".join(new_lines)
    new_content = content.replace(old_str, new_str)
    
    with open(filepath, "w") as f:
        f.write(new_content)
    print("[+] File patched successfully!")
else:
    print("[-] Pattern not found")
    print("[*] Checking for Config pre-created...")
    if "Config pre-created" in content:
        print("[+] Found Config pre-created text")
'''
    
    # Write the script to remote server
    stdin, stdout, stderr = client.exec_command("cat > {} << 'SCRIPTEOF'\n{}SCRIPTEOF".format(remote_script, script_content))
    exit_code = stdout.channel.recv_exit_status()
    if exit_code == 0:
        print("[+] Remote script created")
    else:
        print("[-] Failed to create remote script")
    
    # Execute the remote script
    stdin, stdout, stderr = client.exec_command("python3 {}".format(remote_script))
    output = stdout.read().decode('utf-8')
    print("\n[*] Script output:\n" + output)
    
    exit_code = stdout.channel.recv_exit_status()
    if exit_code != 0:
        err = stderr.read().decode('utf-8')
        if err:
            print("[-] Error output: " + err)
    
    # Clean up remote script
    client.exec_command("rm {}".format(remote_script))
    
    client.close()
    print("[+] Done")
    
except Exception as e:
    print("[-] Error: {}".format(str(e)))
    import traceback
    traceback.print_exc()
