#!/usr/bin/env python3
"""Replace the simple configure_channels endpoint with the full implementation"""

import sys
import re

with open('/root/command-center.py', 'r') as f:
    content = f.read()

# Find the simple endpoint and its associated functions
# Pattern: @app.route('/api/configure-channels'... through the next @app.route

# Find where configure_channels starts
pattern = r'@app\.route\(\'/api/configure-channels\'.*?\n(?:@app\.route|if __name__)'

match = re.search(pattern, content, re.DOTALL)
if not match:
    print("Could not find configure_channels endpoint")
    sys.exit(1)

# Find its boundaries
start = match.start()
end = match.end() - len(match.group().split('\n')[-1])  # Back up to before next @app.route

print(f"Found endpoint at chars {start}-{end}")
print(f"Length: {end - start} chars")

# Check what's between here and if __name__
if_name_pos = content.find("if __name__ == '__main__':")
if if_name_pos == -1:
    print("ERROR: Could not find if __name__")
    sys.exit(1)

print(f"if __name__ at char {if_name_pos}")

# For now, just verify we can find it
old_section = content[start:end]
print("Found section:")
print(old_section[:200] + "...")
