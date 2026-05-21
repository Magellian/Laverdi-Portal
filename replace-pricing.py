#!/usr/bin/env python3
"""Replace pricing section in landing page"""

# Read the new pricing section
with open('/tmp/pricing-new.txt', 'r') as f:
    new_pricing = f.read()

# Read the old index file
with open('/root/laverdi-portal/pages/index.tsx', 'r') as f:
    content = f.read()

# Find the actual section tags
# The pricing section starts with <section id="pricing" and ends with </section> before QUICKSTART

section_start = content.find('<section id="pricing"')
section_end = content.find('</section>', section_start) + len('</section>')

if section_start == -1 or section_end == -1:
    print("ERROR: Could not find pricing section markers")
    exit(1)

print(f"Found pricing section from {section_start} to {section_end}")
print(f"Old section length: {section_end - section_start} characters")

# Replace
new_content = content[:section_start] + new_pricing + '\n\n' + content[section_end:]

# Write back
with open('/root/laverdi-portal/pages/index.tsx', 'w') as f:
    f.write(new_content)

print("✅ Pricing section replaced successfully")
print(f"New file size: {len(new_content)} characters")
