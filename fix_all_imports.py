#!/usr/bin/env python3
from pathlib import Path
import re

fixes = {
    "convex/gameplay/gameEngine/positions.ts": (
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\nimport { requireAuthMutation } from "../../lib/convexAuth";',
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";'
    ),
    "convex/gameplay/gameEngine/spellsTraps.ts": (
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\nimport { requireAuthMutation } from "../../lib/convexAuth";',
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";'
    ),
    "convex/gameplay/gameEngine/summons.ts": (
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\nimport { requireAuthMutation } from "../../lib/convexAuth";',
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";'
    ),
    "convex/gameplay/gameEngine/turns.ts": (
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\nimport { requireAuthMutation } from "../../lib/convexAuth";',
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";'
    ),
    "convex/gameplay/games/lifecycle.ts": (
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\nimport { requireAuthMutation } from "../../lib/convexAuth";',
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";'
    ),
    "convex/gameplay/games/queries.ts": (
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\nimport { requireAuthQuery } from "../../lib/convexAuth";',
        'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../../lib/convexAuth";'
    ),
}

# Fix convexAuth.ts importing itself
convexAuth_file = Path("convex/lib/convexAuth.ts")
content = convexAuth_file.read_text()
content = re.sub(
    r'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\n',
    '',
    content
)
convexAuth_file.write_text(content)
print(f"✓ Fixed convex/lib/convexAuth.ts")

# Fix all other files
for file_path, (old, new) in fixes.items():
    path = Path(file_path)
    content = path.read_text()
    content = content.replace(old, new)
    path.write_text(content)
    print(f"✓ Fixed {file_path}")

print("\n✅ All imports fixed!")
