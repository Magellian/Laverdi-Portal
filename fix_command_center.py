#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Update /root/command-center.py with new API endpoints
"""

import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

# Try paramiko for SSH
try:
    import paramiko
except ImportError:
    print("Installing paramiko for SSH...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko", "-q"])
    import paramiko

HOST = "66.42.70.66"
USER = "root"
PASSWORD = "F,6f$)bZKYr9CTDN"
REMOTE_FILE = "/root/command-center.py"

# New endpoint functions to add
NEW_ENDPOINTS = '''# Channel Management Endpoints
@app.route('/api/configure-channels', methods=['POST'])
def configure_channels():
    """Configure a communication channel (Telegram, Discord, etc.)"""
    try:
        data = request.json
        user_id = data.get('user_id')
        platform = data.get('platform')  # 'telegram', 'discord', etc.
        token = data.get('token')
        
        if not all([user_id, platform, token]):
            return {'error': 'Missing required fields'}, 400
        
        # Insert into Supabase using service role key
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        result = supabase.table('channels').upsert({
            'user_id': user_id,
            'platform': platform,
            'token': token,
            'verified': True,
            'verified_at': datetime.utcnow().isoformat()
        }).execute()
        
        return {'success': True, 'data': result.data}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/get-channels', methods=['POST'])
def get_channels():
    """Get user's configured channels"""
    try:
        data = request.json
        user_id = data.get('user_id')
        
        if not user_id:
            return {'error': 'Missing user_id'}, 400
        
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        result = supabase.table('channels').select('*').eq('user_id', user_id).execute()
        return {'channels': result.data}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/delete-channel', methods=['POST'])
def delete_channel():
    """Delete a channel configuration"""
    try:
        data = request.json
        user_id = data.get('user_id')
        platform = data.get('platform')
        
        if not all([user_id, platform]):
            return {'error': 'Missing required fields'}, 400
        
        supabase = create_client(
            'https://dcvrkpgvxqdcboostkpz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJrcGd2eHFkY2Jvb3N0a3B6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTAwNjI4MiwiZXhwIjoyMDkwNTgyMjgyfQ.oS_T_nKibwBMf7Jfod2gMNnnTu8FPk8kdhlDSk0onNY'
        )
        
        supabase.table('channels').delete().eq('user_id', user_id).eq('platform', platform).execute()
        return {'success': True}, 200
    except Exception as e:
        return {'error': str(e)}, 500

'''

def ssh_connect():
    """Connect to remote server via SSH"""
    print(f"[*] Connecting to {USER}@{HOST}...")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10, look_for_keys=False, allow_agent=False)
        print("[✓] Connected successfully!")
        return ssh
    except Exception as e:
        print(f"[✗] Connection failed: {e}")
        sys.exit(1)

def read_remote_file(ssh, filename):
    """Read remote file"""
    print(f"[*] Reading {filename}...")
    try:
        stdin, stdout, stderr = ssh.exec_command(f"cat {filename}")
        content = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if error and "No such file" in error:
            print(f"[✗] File not found: {filename}")
            return None
        
        print(f"[✓] File read successfully ({len(content)} bytes)")
        return content
    except Exception as e:
        print(f"[✗] Error reading file: {e}")
        return None

def update_file(ssh, filename, content):
    """Update remote file"""
    print(f"[*] Updating {filename}...")
    
    # Find the insertion point (before 'if __name__')
    if 'if __name__' not in content:
        print("[✗] Could not find 'if __name__' in file")
        return False
    
    # Insert imports if missing
    imports_needed = []
    if 'from datetime import datetime' not in content:
        imports_needed.append('from datetime import datetime')
    if 'from supabase import create_client' not in content:
        imports_needed.append('from supabase import create_client')
    
    # Add imports at the top
    if imports_needed:
        lines = content.split('\n')
        # Find where to insert (after other imports)
        insert_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('import ') or line.startswith('from '):
                insert_idx = i + 1
        
        for imp in imports_needed:
            lines.insert(insert_idx, imp)
            insert_idx += 1
        
        content = '\n'.join(lines)
        print(f"[✓] Added {len(imports_needed)} missing imports")
    
    # Insert endpoints before 'if __name__'
    insertion_point = content.find("if __name__")
    if insertion_point == -1:
        print("[✗] Could not find insertion point")
        return False
    
    updated_content = content[:insertion_point] + NEW_ENDPOINTS + '\n' + content[insertion_point:]
    
    # Write back using a temporary file approach
    temp_file = "/tmp/command-center.py.tmp"
    
    # Create a Python script that writes the content
    write_script = f"""
import sys
with open(r'{filename}', 'w') as f:
    f.write(sys.stdin.read())
"""
    
    print(f"[*] Writing updated content to {filename}...")
    try:
        # Use sftp for more reliable file transfer
        sftp = ssh.open_sftp()
        
        # Write to temp file first
        with sftp.file(temp_file, 'w') as f:
            f.write(updated_content)
        
        # Move temp file to target
        stdin, stdout, stderr = ssh.exec_command(f"mv {temp_file} {filename}")
        stderr.read()
        
        print(f"[✓] File updated successfully!")
        sftp.close()
        return True
    except Exception as e:
        print(f"[✗] Error writing file: {e}")
        return False

def restart_service(ssh):
    """Restart command-center via pm2"""
    print("[*] Restarting command-center service...")
    
    try:
        stdin, stdout, stderr = ssh.exec_command("pm2 restart command-center")
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        print(f"[✓] Restart command sent")
        print(f"Output: {output}")
        if error:
            print(f"Error output: {error}")
        
        return True
    except Exception as e:
        print(f"[✗] Error restarting service: {e}")
        return False

def verify_endpoints(ssh):
    """Verify the endpoints are accessible"""
    print("[*] Verifying API endpoints...")
    
    try:
        stdin, stdout, stderr = ssh.exec_command(
            "curl -s -X POST http://localhost:8000/api/get-channels -H 'Content-Type: application/json' -d '{\"user_id\":\"test\"}'"
        )
        response = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        print(f"[*] API Response: {response}")
        if error:
            print(f"[*] Curl error: {error}")
        
        return response
    except Exception as e:
        print(f"[✗] Error testing endpoint: {e}")
        return None

def get_pm2_status(ssh):
    """Get pm2 status"""
    print("[*] Getting pm2 status...")
    
    try:
        stdin, stdout, stderr = ssh.exec_command("pm2 status")
        output = stdout.read().decode('utf-8')
        print(output)
        return output
    except Exception as e:
        print(f"[✗] Error getting status: {e}")
        return None

def main():
    print("=" * 60)
    print("FIX #3: Update command-center.py on remote server")
    print("=" * 60)
    
    # Connect
    ssh = ssh_connect()
    
    # Read current file
    original_content = read_remote_file(ssh, REMOTE_FILE)
    if not original_content:
        ssh.close()
        sys.exit(1)
    
    # Update file
    if not update_file(ssh, REMOTE_FILE, original_content):
        ssh.close()
        sys.exit(1)
    
    # Restart service
    if not restart_service(ssh):
        print("[!] Warning: Service restart may have failed")
    
    # Wait a moment for restart
    import time
    time.sleep(2)
    
    # Get status
    print("\n" + "=" * 60)
    print("PM2 Status:")
    print("=" * 60)
    get_pm2_status(ssh)
    
    # Verify endpoints
    print("\n" + "=" * 60)
    print("API Verification:")
    print("=" * 60)
    verify_endpoints(ssh)
    
    ssh.close()
    print("\n[✓] All tasks completed!")

if __name__ == "__main__":
    main()
