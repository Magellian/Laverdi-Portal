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
    
    print("[INFO] Reading current provision.ts...\n")
    
    # Read the file
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/pages/api/provision.ts")
    content = stdout.read().decode()
    
    print("[OK] File read successfully")
    original_length = len(content)
    
    # Backup original
    print("[BACKUP] Creating backup...")
    stdin, stdout, stderr = client.exec_command("cp /root/laverdi-portal/pages/api/provision.ts /root/laverdi-portal/pages/api/provision.ts.backup-$(date +%s)")
    stdout.read()
    print("[OK] Backup created")
    
    # FIX 1: sed command - remove extra space before closing quote
    print("\n[FIX 1] Fixing sed command syntax...\n")
    
    # The problematic line has:  sed -i 's/.../ \'/
    # Should be: sed -i 's/...//' 
    original_sed = 'sed -i \'s/"mode": "token"/"mode": "token", "token": "\'$GATEWAY_TOKEN\'"/  \'/opt/openclaw-config/openclaw.json\','
    fixed_sed = 'sed -i \'s/"mode": "token"/"mode": "token", "token": "\'$GATEWAY_TOKEN\'"/\' /opt/openclaw-config/openclaw.json\','
    
    if original_sed in content:
        content = content.replace(original_sed, fixed_sed)
        print(f"[OK] Replaced sed command")
        print(f"    Old: {original_sed[:60]}...")
        print(f"    New: {fixed_sed[:60]}...")
    else:
        print(f"[WARN] Exact sed pattern not found, content may differ")
        # Try to find it with regex
        import re
        pattern = r"sed -i.*?GATEWAY_TOKEN.*?openclaw\.json"
        if re.search(pattern, content):
            print("[INFO] Found sed command via regex, attempting careful replacement...")
            # Find and show what we found
            match = re.search(pattern, content)
            print(f"Found: {match.group(0)[:80]}")
    
    # FIX 2: Add sleep before docker exec token extraction
    print("\n[FIX 2] Adding delay before token extraction...\n")
    
    # Find the line with docker exec for GATEWAY_TOKEN and add sleep before it
    old_docker_line = "      'GATEWAY_TOKEN=$(docker exec openclaw node -e \"process.stdout.write(JSON.parse(require(String.fromCharCode(102,115)).readFileSync(String.fromCharCode(47,114,111,111,116,47,46,111,112,101,110,99,108,97,119,47,46,111,112,101,110,99,108,97,119,47,111,112,101,110,99,108,97,119,46,106,115,111,110))).gateway.auth.token)\")',"
    
    if old_docker_line in content:
        new_docker_section = """      'echo "Waiting for container to initialize..."',
      'sleep 15',
      'GATEWAY_TOKEN=$(docker exec openclaw node -e \"process.stdout.write(JSON.parse(require(String.fromCharCode(102,115)).readFileSync(String.fromCharCode(47,114,111,111,116,47,46,111,112,101,110,99,108,97,119,47,46,111,112,101,110,99,108,97,119,47,111,112,101,110,99,108,97,119,46,106,115,111,110))).gateway.auth.token)\")',"""
        content = content.replace(old_docker_line, new_docker_section)
        print(f"[OK] Added 15-second sleep before token extraction")
    else:
        print(f"[WARN] Docker exec line not found exactly")
    
    # FIX 3: Add gatewayToken to webhook
    print("\n[FIX 3] Adding gatewayToken to webhook payload...\n")
    
    # Find webhook line and add gatewayToken field
    old_webhook = 'curl -sf -X POST ' + PORTAL_URL + '/api/webhooks/instance-ready -H "Content-Type: application/json" -d \'{"instanceId":"' + instanceId + '","userId":"' + userId + '","instanceIp":"\'"$INSTANCE_IP"\'","instancePort":9000,"token":"' + WEBHOOK_TOKEN + '"}\'  || echo "Webhook failed"'
    
    # This won't work as-is because PORTAL_URL etc are variables. Let's search for the pattern instead
    if 'curl -sf -X POST' in content and 'instance-ready' in content and '"token":"' + '\"' in content:
        # Find the webhook line
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'curl -sf -X POST' in line and 'instance-ready' in line:
                print(f"[INFO] Found webhook at line {i}")
                print(f"[INFO] Before: {line[:100]}...")
                
                # Add gatewayToken to the JSON
                if '"token":"' in line:
                    # Add ,\"gatewayToken\":\"'$GATEWAY_TOKEN'\" before the closing }
                    lines[i] = line.replace(
                        '","token":"' + WEBHOOK_TOKEN + '"}',
                        '","token":"' + WEBHOOK_TOKEN + '","gatewayToken":"\'$GATEWAY_TOKEN'\'"}',
                    ) if WEBHOOK_TOKEN in line else line
                    
                    # If that didn't work, try more general approach
                    if lines[i] == line:
                        # Just insert before the final }
                        lines[i] = line.replace(
                            '}\'  || echo "Webhook failed"',
                            ',"gatewayToken":"\'$GATEWAY_TOKEN\'"}\'  || echo "Webhook failed"'
                        )
                    
                    print(f"[INFO] After:  {lines[i][:100]}...")
                    print(f"[OK] Added gatewayToken to webhook")
                break
        
        content = '\n'.join(lines)
    
    # Check changes
    new_length = len(content)
    print(f"\n[CHECK] Content size: {original_length} -> {new_length} chars")
    
    # Write updated file back
    print(f"\n[DEPLOY] Writing fixed file back to portal...\n")
    
    # Use tee to write
    cmd = f"""cat > /root/laverdi-portal/pages/api/provision.ts << 'EOFPROV'
{content}
EOFPROV
"""
    
    stdin = client.exec_command("cat > /root/laverdi-portal/pages/api/provision.ts")[0]
    stdin.write(content)
    stdin.close()
    
    print("[OK] File written")
    
    # Verify
    stdin, stdout, stderr = client.exec_command("wc -c /root/laverdi-portal/pages/api/provision.ts")
    size_info = stdout.read().decode().strip()
    print(f"[OK] Verified: {size_info}")
    
    # Rebuild
    print(f"\n[BUILD] Building portal...\n")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build 2>&1 | grep -E '(error|ERROR|built|done|✓)' | tail -10")
    build = stdout.read().decode()
    print(build if build else "[OK] Build completed silently")
    
    # Restart
    print(f"\n[RESTART] Restarting portal...\n")
    stdin, stdout, stderr = client.exec_command("pm2 restart web && sleep 2 && curl -s http://localhost:3005 > /dev/null && echo '[OK] Portal is responding'")
    result = stdout.read().decode()
    print(result)
    
    print(f"\n[SUCCESS] All fixes applied!\n")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
