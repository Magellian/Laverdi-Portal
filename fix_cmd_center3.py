with open("/root/laverdi-command-center/app.py", "r") as f:
    content = f.read()

# Fix: move file_port before the run() call
old = """container = client.containers.run(
            OPENCLAW_IMAGE,
            name=container_name,
            file_port = port + 1
            ports={'8700/tcp': port, '8701/tcp': file_port},  # OpenClaw + file server"""

new = """file_port = port + 1
        container = client.containers.run(
            OPENCLAW_IMAGE,
            name=container_name,
            ports={'8700/tcp': port, '8701/tcp': file_port},  # OpenClaw + file server"""

content = content.replace(old, new)

with open("/root/laverdi-command-center/app.py", "w") as f:
    f.write(content)

print("Fixed")
