#!/usr/bin/env python3
"""Add debugging to the configure_channels endpoint"""

with open('/root/command-center.py', 'r') as f:
    content = f.read()

# Find the configure_channels function
old_code = '''def configure_channels():
    """Configure a communication channel (Telegram, Discord, etc.)"""
    try:
        data = request.json or {}'''

new_code = '''def configure_channels():
    """Configure a communication channel (Telegram, Discord, etc.)"""
    try:
        print(f"[DEBUG] Content-Type: {request.content_type}", flush=True)
        print(f"[DEBUG] Content-Length: {request.content_length}", flush=True)
        print(f"[DEBUG] Data: {request.data}", flush=True)
        data = request.json or {}'''

if old_code not in content:
    print(f"ERROR: Could not find the code block to modify")
    exit(1)

new_content = content.replace(old_code, new_code)

with open('/root/command-center.py', 'w') as f:
    f.write(new_content)

print("✓ Added debugging")
