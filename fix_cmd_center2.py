with open("/root/laverdi-command-center/app.py", "r") as f:
    content = f.read()

# Add file server injection after container creation
old = 'logger.info(f"\\u2713 Container created: {container.id[:12]}")'
new = '''logger.info(f"\\u2713 Container created: {container.id[:12]}")

        # Inject and start file server for workspace access
        try:
            import time as _time
            _time.sleep(3)  # Wait for container to initialize
            
            # Copy file_server.js into the container
            import subprocess
            file_server_path = "/root/laverdi-command-center/file_server.js"
            subprocess.run(["docker", "cp", file_server_path, f"{container_name}:/root/file_server.js"], check=True)
            
            # Start the file server in the background
            container.exec_run("node /root/file_server.js", detach=True)
            logger.info(f"\\u2713 File server started in {container_name}")
        except Exception as fs_err:
            logger.error(f"Failed to start file server: {fs_err}")'''

content = content.replace(old, new)

with open("/root/laverdi-command-center/app.py", "w") as f:
    f.write(content)

print("Command Center updated with file server injection")
