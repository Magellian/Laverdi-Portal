#!/usr/bin/env python3
"""Approve Telegram pairing via gateway HTTP API"""
import json, urllib.request, urllib.error

uid = "0ee506e0-82df-464c-8909-47c4333f4f95"
config_path = f"/var/lib/laverdi/users/{uid}/.openclaw/openclaw.json"

with open(config_path) as f:
    c = json.load(f)

token = c["gateway"]["auth"]["token"]
code = "CJZZETK9"

# The pairing store is a file we can write directly
import os, glob

pairing_store_dir = f"/var/lib/laverdi/users/{uid}/.openclaw"
pairing_file = os.path.join(pairing_store_dir, "credentials", "telegram-pairing.json")
allowlist_file = os.path.join(pairing_store_dir, "credentials", "telegram-allowFrom.json")

print(f"Looking for pairing file: {pairing_file}")
print(f"Exists: {os.path.exists(pairing_file)}")

creds_dir = os.path.join(pairing_store_dir, "credentials")
print(f"\nCredentials dir contents:")
if os.path.exists(creds_dir):
    for f in os.listdir(creds_dir):
        print(f"  {f}")
        fpath = os.path.join(creds_dir, f)
        try:
            with open(fpath) as fp:
                print(f"    {fp.read()[:200]}")
        except:
            pass
else:
    print("  (no credentials dir)")

# Also check tasks dir
tasks_dir = os.path.join(pairing_store_dir, "tasks")
print(f"\nTasks dir:")
if os.path.exists(tasks_dir):
    for f in os.listdir(tasks_dir):
        print(f"  {f}")
else:
    print("  (no tasks dir)")
