#!/usr/bin/env python3
import subprocess
import json
import time

print("[DELETE] Test Instances\n")

# IDs to delete (all the testing ones from today)
to_delete = [
    "10ce1898-7ef9-4723-831a-bb218397ec3e",  # openclaw-6fe59da4
    "782a4d6f-cef9-43e3-889b-68ff28e9b953",  # openclaw-0497d4b4
    "eb4aead9-c88a-44f9-b558-388c39ad7aff",  # openclaw-d3733aa6
    "354ae4e3-38eb-4d74-bfb2-c1b142cf7c09",  # openclaw-73aeceaf
    "876f78a0-d049-4784-9531-500b3729533f",  # openclaw-test-env
    "051f493b-b402-44fc-a313-421e00235eb7",  # openclaw-9f744f07
    "f4e3451d-0650-4d52-a4b9-e21b0d75f6aa",  # openclaw-test-con
]

VULTR_KEY = "7HX3W7CLSGH4VS27CQFHTKTN6TTAGDM4HUSA"

deleted = 0
failed = 0

print(f"Deleting {len(to_delete)} instances...\n")

for i, inst_id in enumerate(to_delete, 1):
    label = inst_id[:8]
    print(f"[{i}/{len(to_delete)}] Deleting {label}... ", end='', flush=True)
    
    result = subprocess.run([
        "curl", "-s", "-X", "DELETE",
        f"https://api.vultr.com/v2/instances/{inst_id}",
        "-H", f"Authorization: Bearer {VULTR_KEY}"
    ], capture_output=True, text=True, timeout=10)
    
    # 204 = success, 200 = also success, anything else might be error
    if result.returncode == 0 and (not result.stdout.strip() or "error" not in result.stdout.lower()):
        print("[OK]")
        deleted += 1
    else:
        print(f"[FAIL]")
        if result.stdout:
            print(f"      Response: {result.stdout[:100]}")
        failed += 1
    
    time.sleep(0.5)

print(f"\n{'='*60}")
print(f"[COMPLETE] Cleanup finished")
print(f"{'='*60}")
print(f"Deleted: {deleted}")
print(f"Failed: {failed}")
print(f"\nKept:")
print(f"  - 41b535c2... (Dad's Claw)")
print(f"  - 6839faae... (fife-rv-receptionist)")
print(f"  - 4e53efa2... (laverdi portal)")
