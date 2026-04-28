#!/usr/bin/env python3
path = '/root/laverdi-portal/components/ConnectDevices.tsx'
with open(path, 'r') as f:
    content = f.read()

# Replace OpenClaw docs links with our own pages
content = content.replace(
    'href="https://docs.openclaw.ai/channels"',
    'href="/dashboard/channels"'
)
content = content.replace(
    'href="https://docs.openclaw.ai/web/control-ui"',
    'href="/dashboard/channels"'
)
# Update label
content = content.replace(
    'Setup Channels',
    'Connect Apps'
)

with open(path, 'w') as f:
    f.write(content)

print("✓ ConnectDevices updated - Chat Apps card now links to /dashboard/channels")
