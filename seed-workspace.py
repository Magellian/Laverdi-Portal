#!/usr/bin/env python3
"""Seed workspace files for existing users to kill the bootstrap prompt"""
import os

user_dir = "/var/lib/laverdi/users"

AGENTS_MD = """# Your AI Assistant

Welcome! I'm your personal AI assistant, powered by LaVerdi.

## Getting Started
- Just type a message to start chatting
- I can help with writing, research, coding, scheduling, and more
- Use /help to see available commands
- Use /model to check your current AI model
- Use /status to see session info

## Your Workspace
Files created during our conversations are saved here on your private server.

## Need Help?
Visit https://laverdi.tech/dashboard for account management.
"""

SOUL_MD = """# Assistant Personality

Be helpful, direct, and concise. Skip filler phrases like "Great question!"
Just help. Have opinions when asked. Be resourceful before asking for clarification.
"""

IDENTITY_MD = """# Identity

- **Name:** Assistant
- **Vibe:** Helpful and direct
- **Emoji:** 🦞
"""

for uid in os.listdir(user_dir):
    workspace = os.path.join(user_dir, uid, "workspace")
    os.makedirs(workspace, exist_ok=True)
    
    files = {
        "AGENTS.md": AGENTS_MD,
        "SOUL.md": SOUL_MD,
        "IDENTITY.md": IDENTITY_MD,
    }
    
    for fname, content in files.items():
        path = os.path.join(workspace, fname)
        with open(path, 'w') as f:
            f.write(content)
    
    # Make sure BOOTSTRAP.md does NOT exist
    bootstrap = os.path.join(workspace, "BOOTSTRAP.md")
    if os.path.exists(bootstrap):
        os.remove(bootstrap)
        print(f"  Removed BOOTSTRAP.md for {uid[:12]}")
    
    print(f"  Seeded workspace for {uid[:12]}")

print("Done. Restart containers.")
