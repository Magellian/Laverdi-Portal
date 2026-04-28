#!/usr/bin/env python3
"""Pre-populate user workspace with welcome files instead of BOOTSTRAP.md
   The Command Center creates these when preparing the user data directory."""

import json

path = '/root/laverdi-command-center/app.py'
with open(path, 'r') as f:
    content = f.read()

# Find the prepare_user_data_dir function and add workspace file creation
old = """    os.makedirs(config_dir, exist_ok=True)
    os.makedirs(workspace_dir, exist_ok=True)"""

new = """    os.makedirs(config_dir, exist_ok=True)
    os.makedirs(workspace_dir, exist_ok=True)
    
    # Pre-populate workspace with welcome files (prevents BOOTSTRAP.md prompt)
    agents_md = os.path.join(workspace_dir, 'AGENTS.md')
    if not os.path.exists(agents_md):
        with open(agents_md, 'w') as wf:
            wf.write(\"\"\"# Your AI Assistant

Welcome to your personal AI assistant, powered by LaVerdi.

## Getting Started
- Just type a message to start chatting
- Your assistant can help with writing, coding, research, and more
- Use /help to see available commands
- Use /model to check or change your AI model
- Use /status to see your current session info

## Your Workspace
This directory is your assistant's workspace. Files created during conversations are saved here.

## Need Help?
Visit https://laverdi.tech/dashboard for account management and support.
\"\"\")
    
    soul_md = os.path.join(workspace_dir, 'SOUL.md')
    if not os.path.exists(soul_md):
        with open(soul_md, 'w') as wf:
            wf.write(\"\"\"# SOUL.md - Your Assistant's Personality

Your AI assistant is helpful, direct, and knowledgeable.
It provides clear answers without unnecessary filler.

Feel free to customize this file to shape your assistant's personality.
\"\"\")
    
    identity_md = os.path.join(workspace_dir, 'IDENTITY.md')
    if not os.path.exists(identity_md):
        with open(identity_md, 'w') as wf:
            wf.write(\"\"\"# IDENTITY.md

- **Name:** Assistant
- **Vibe:** Helpful and direct
- **Emoji:** 🦞
\"\"\")"""

content = content.replace(old, new)

with open(path, 'w') as f:
    f.write(content)

print("✓ Command Center updated: workspace pre-populated with welcome files")
