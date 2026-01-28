#!/usr/bin/env python3
"""Fix remaining auth errors - handles args.token references in code"""

import re
from pathlib import Path

files_with_errors = [
    "convex/gameplay/gameEngine/positions.ts",
    "convex/gameplay/gameEngine/spellsTraps.ts",
    "convex/gameplay/gameEngine/summons.ts",
    "convex/gameplay/gameEngine/turns.ts",
    "convex/gameplay/games/lifecycle.ts",
    "convex/gameplay/games/lobby.ts",
    "convex/gameplay/games/queries.ts",
]

def fix_args_token_references(content: str) -> str:
    """Replace args.token references with proper auth"""

    # Pattern 1: Session lookup with args.token
    content = re.sub(
        r'const session = await ctx\.db\s*\.query\("sessions"\)\s*\.withIndex\("token", \(q\) => q\.eq\("token", args\.token\)\)\s*\.first\(\);',
        'const auth = await getCurrentUser(ctx);',
        content
    )

    # Pattern 2: if (!session || session.expiresAt...)
    content = re.sub(
        r'if \(!session \|\| session\.expiresAt < Date\.now\(\)\) {([^}]*throw new Error\("Not authenticated"\);[^}]*)}',
        'if (!auth) throw new Error("Not authenticated");',
        content,
        flags=re.DOTALL
    )

    # Pattern 3: session.userId -> auth.userId
    content = content.replace('session.userId', 'auth.userId')

    return content

def main():
    root = Path.cwd()

    for file_path in files_with_errors:
        full_path = root / file_path
        if not full_path.exists():
            print(f"⚠ Skipping {file_path} (not found)")
            continue

        content = full_path.read_text()
        fixed_content = fix_args_token_references(content)

        if content != fixed_content:
            full_path.write_text(fixed_content)
            print(f"✓ Fixed {file_path}")
        else:
            print(f"• No changes needed for {file_path}")

if __name__ == "__main__":
    main()
