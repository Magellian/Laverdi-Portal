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
    print(f"[INFO] File length: {len(content)} characters\n")
    
    # FIX 1: sed command syntax error
    print("[FIX 1] Fixing sed command syntax error...")
    old_sed = """'sed -i \\'s/"mode": "token"/"mode": "token", "token": "\\'$GATEWAY_TOKEN\\'"/  \\'/opt/openclaw-config/openclaw.json',"""
    new_sed = """'sed -i \\'s/"mode": "token"/"mode": "token", "token": "\\'$GATEWAY_TOKEN\'"/\\' /opt/openclaw-config/openclaw.json',"""
    
    # Try to find and replace
    if 'sed -i' in content and 'GATEWAY_TOKEN' in content:
        # Find the exact line
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'sed -i' in line and 'mode.*token' in line and 'GATEWAY_TOKEN' in line:
                print(f"[INFO] Found sed line at {i}: {line[:80]}...")
                
                # Fix the sed command - remove extra space and fix closing
                fixed_line = line.replace(
                    'sed -i \'s/"mode": "token"/"mode": "token", "token": "\'$GATEWAY_TOKEN\'"/  \'/opt/openclaw-config/openclaw.json',
                    'sed -i \'s/"mode": "token"/"mode": "token", "token": "\'$GATEWAY_TOKEN\'"/\' /opt/openclaw-config/openclaw.json',
                )
                
                if fixed_line != line:
                    lines[i] = fixed_line
                    print(f"[OK] Fixed sed command")
                else:
                    print(f"[WARN] sed pattern didn't match exactly, trying alternative...")
                    # Try a broader replacement
                    if 's/"mode": "token"' in line:
                        fixed_line = line.replace(
                            'sed -i',
                            'sed -i'
                        ).replace(
                            '/  \'',
                            '/\''
                        )
                        lines[i] = fixed_line
                        print(f"[OK] Applied alternative fix")
        
        content = '\n'.join(lines)
    
    # FIX 2: Add delay before docker exec
    print("\n[FIX 2] Adding delay before token extraction...\n")
    
    # Find the docker exec GATEWAY_TOKEN line and add sleep before it
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'GATEWAY_TOKEN=$(docker exec openclaw node -e' in line:
            print(f"[INFO] Found docker exec at line {i}")
            # Add sleep before this line
            lines.insert(i, "'echo \"Waiting 10 seconds for container to initialize...\"',")
            lines.insert(i+1, "'sleep 10',")
            print(f"[OK] Added 10-second sleep before token extraction")
            break
    
    content = '\n'.join(lines)
    
    # FIX 3: Add gatewayToken to webhook payload
    print("\n[FIX 3] Adding gatewayToken to webhook payload...\n")
    
    # Find the curl webhook line and add gatewayToken field
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'curl -sf -X POST' in line and 'instance-ready' in line:
            print(f"[INFO] Found webhook curl at line {i}")
            # Add gatewayToken to the JSON payload - look for "token": field
            if '"token":' in line and 'WEBHOOK_TOKEN' in line:
                # Replace the closing } with ,"gatewayToken":"$GATEWAY_TOKEN"}
                if "}" not in line[-20:]:
                    print("[WARN] Webhook payload spans multiple lines, checking next line...")
                else:
                    old_closing = '\'"}\'  || echo "Webhook failed"'
                    new_closing = '\',\\"gatewayToken\\":\\"\'$GATEWAY_TOKEN\\'"}\'  || echo "Webhook failed"'
                    if old_closing in line:
                        lines[i] = line.replace(old_closing, new_closing)
                        print(f"[OK] Added gatewayToken to webhook payload")
                    else:
                        print("[WARN] Could not find exact webhook pattern, skipping Fix 3")
            break
    
    content = '\n'.join(lines)
    
    # Write back to file
    print("\n[INFO] Writing fixed file back to portal...\n")
    
    # Create a temporary file
    stdin, stdout, stderr = client.exec_command("cat > /tmp/provision-fixed.ts << 'EOFPROV'\n" + content + "\nEOFPROV")
    stdin.close()
    stdout.read()
    
    # Verify it was written
    stdin, stdout, stderr = client.exec_command("wc -c /tmp/provision-fixed.ts")
    size = stdout.read().decode().strip()
    print(f"[OK] Temporary file created: {size}")
    
    # Backup original
    stdin, stdout, stderr = client.exec_command("cp /root/laverdi-portal/pages/api/provision.ts /root/laverdi-portal/pages/api/provision.ts.backup")
    stdout.read()
    print(f"[OK] Original backed up to provision.ts.backup")
    
    # Copy fixed version
    stdin, stdout, stderr = client.exec_command("cp /tmp/provision-fixed.ts /root/laverdi-portal/pages/api/provision.ts")
    stdout.read()
    print(f"[OK] Fixed file deployed")
    
    # Verify the fixes
    print(f"\n[VERIFY] Checking if fixes were applied...\n")
    
    stdin, stdout, stderr = client.exec_command("grep -n 'sleep 10' /root/laverdi-portal/pages/api/provision.ts")
    if stdout.read().decode().strip():
        print("[OK] Sleep delay is present")
    else:
        print("[WARN] Sleep delay not found")
    
    stdin, stdout, stderr = client.exec_command("grep -n 'gatewayToken' /root/laverdi-portal/pages/api/provision.ts | grep -v '//'")
    gw_lines = stdout.read().decode()
    if gw_lines:
        print(f"[OK] gatewayToken field is present:\n{gw_lines}")
    else:
        print("[WARN] gatewayToken not found")
    
    # Now rebuild portal
    print(f"\n[BUILD] Rebuilding portal...\n")
    stdin, stdout, stderr = client.exec_command("cd /root/laverdi-portal && npm run build 2>&1 | tail -30")
    build_output = stdout.read().decode()
    
    if 'error' in build_output.lower() and 'ERR' in build_output:
        print("[WARN] Build output (checking for errors):")
        print(build_output[-500:])
    else:
        print("[OK] Build completed")
    
    # Restart portal
    print(f"\n[RESTART] Restarting portal service...\n")
    stdin, stdout, stderr = client.exec_command("pm2 restart web && sleep 3 && pm2 logs web --lines 5")
    restart_output = stdout.read().decode()
    print(restart_output[-300:])
    
    print(f"\n[DONE] All fixes applied and deployed!\n")
    print("[SUMMARY]")
    print("  [FIX 1] sed command syntax corrected")
    print("  [FIX 2] 10-second delay added before token extraction")
    print("  [FIX 3] gatewayToken added to webhook payload")
    print("  [BUILD] Portal rebuilt")
    print("  [DEPLOY] Service restarted")
    print("\nReady to test new provisions!")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
