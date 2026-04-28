import sys

with open("/root/laverdi-command-center/app.py", "r") as f:
    content = f.read()

# Fix 1: Add file server port mapping
old1 = "ports={'8700/tcp': port},  # OpenClaw default port"
new1 = "file_port = port + 1\n            ports={'8700/tcp': port, '8701/tcp': file_port},  # OpenClaw + file server"
content = content.replace(old1, new1)

# Fix 2: Add file port to response
old2 = '"accessUrl": f"http://64.23.142.154:{port}",'
new2 = '"accessUrl": f"http://64.23.142.154:{port}",\n            "filePort": file_port,'
content = content.replace(old2, new2)

with open("/root/laverdi-command-center/app.py", "w") as f:
    f.write(content)

print("Command Center updated")
