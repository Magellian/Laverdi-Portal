#!/usr/bin/env python3
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
    
    print("[KEY CHECK] Getting Supabase credentials from portal...\n")
    
    # Check .env file
    print("[1] Checking portal .env for Supabase key...")
    stdin, stdout, stderr = client.exec_command("grep -i 'SUPABASE.*KEY\\|SUPABASE.*SECRET' /root/laverdi-portal/.env.local | head -5")
    env = stdout.read().decode()
    print(env if env else "  (no keys found)")
    
    # Check how portal calls Supabase
    print("\n[2] Checking provision.ts for Supabase auth...")
    stdin, stdout, stderr = client.exec_command("grep -A 2 'createClient' /root/laverdi-portal/pages/api/provision.ts | head -10")
    auth = stdout.read().decode()
    print(auth)
    
    # Check other API files
    print("\n[3] Checking other API files...")
    stdin, stdout, stderr = client.exec_command("grep -r 'SUPABASE_SERVICE_ROLE_KEY\\|SERVICE_ROLE' /root/laverdi-portal/pages/api --include='*.ts' | head -3")
    service_key = stdout.read().decode()
    print(service_key if service_key else "  (no service role refs)")
    
    # Check .env example
    print("\n[4] Checking .env.example...")
    stdin, stdout, stderr = client.exec_command("cat /root/laverdi-portal/.env.example 2>/dev/null | grep -i supabase")
    example = stdout.read().decode()
    print(example if example else "  (file not found)")
    
    client.close()
    
except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
