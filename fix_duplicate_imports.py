#!/usr/bin/env python3
import re
from pathlib import Path

def fix_duplicate_imports(content):
    lines = content.split('\n')
    seen_imports = set()
    fixed_lines = []
    
    for line in lines:
        # Check if it's a convexAuth import
        if 'from' in line and 'lib/convexAuth' in line:
            # Normalize the import for comparison
            normalized = re.sub(r'["\']\.\./+lib/convexAuth["\']', '"lib/convexAuth"', line)
            if normalized in seen_imports:
                continue  # Skip duplicate
            seen_imports.add(normalized)
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

root = Path.cwd()
convex_dir = root / "convex"

for ts_file in convex_dir.rglob("*.ts"):
    if '_generated' in str(ts_file) or '.backup' in str(ts_file):
        continue
    
    content = ts_file.read_text()
    fixed = fix_duplicate_imports(content)
    
    if content != fixed:
        ts_file.write_text(fixed)
        print(f"✓ Fixed duplicates in {ts_file.relative_to(root)}")

print("Done!")
