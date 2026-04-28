#!/usr/bin/env python3
path = '/root/laverdi-portal/components/Molty2D.tsx'
with open(path, 'r') as f:
    content = f.read()

# Remove the ear elements (6 lines: comments + circles + inner circles)
content = content.replace(
    """        {/* Left ear */}
        <circle cx="140" cy="135" r="22" fill="#FF3333" stroke="#CC2222" strokeWidth="2" className="ear-left" />
        <circle cx="140" cy="135" r="12" fill="#FF5555" opacity="0.4" />

        {/* Right ear */}
        <circle cx="260" cy="135" r="22" fill="#FF3333" stroke="#CC2222" strokeWidth="2" className="ear-right" />
        <circle cx="260" cy="135" r="12" fill="#FF5555" opacity="0.4" />""",
    ""
)

with open(path, 'w') as f:
    f.write(content)

print("✓ Ears removed from Molty")
