#!/usr/bin/env python3
"""
Convex Auth Migration Script

Automatically migrates from old token-based auth to new Convex Auth.

What it does:
1. Removes token parameters from all Convex queries/mutations
2. Replaces getUserFromToken() with getCurrentUser() or requireAuth()
3. Updates all import statements
4. Removes old auth helper files
5. Generates a report of changes

Run: python3 migrate_auth.py
"""

import re
import os
from pathlib import Path
from typing import List, Tuple

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log_success(msg):
    print(f"{Colors.GREEN}✓{Colors.RESET} {msg}")

def log_warning(msg):
    print(f"{Colors.YELLOW}⚠{Colors.RESET} {msg}")

def log_error(msg):
    print(f"{Colors.RED}✗{Colors.RESET} {msg}")

def log_info(msg):
    print(f"{Colors.BLUE}ℹ{Colors.RESET} {msg}")

class AuthMigrator:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.convex_dir = self.root_dir / "convex"
        self.changes = []
        self.files_modified = 0

    def migrate_backend_file(self, file_path: Path) -> bool:
        """Migrate a single backend file"""
        try:
            content = file_path.read_text()
            original_content = content
            modified = False

            # Skip if already using Convex Auth
            if 'getAuthUserId' in content and 'token: v.string()' not in content:
                return False

            # 1. Update imports
            if 'from "../lib/auth"' in content or 'from "./lib/auth"' in content:
                content = re.sub(
                    r'import\s*{[^}]*}\s*from\s*["\']\.\.?/lib/auth["\'];?\n',
                    '',
                    content
                )
                modified = True

            if 'getUserFromToken' in content or 'requireAuthQuery' in content or 'requireAuthMutation' in content:
                # Add new imports if not present
                if 'from "../lib/convexAuth"' not in content and 'from "./lib/convexAuth"' not in content:
                    # Find the import section
                    import_section = re.search(r'(import.*from.*_generated.*\n)+', content)
                    if import_section:
                        insertion_point = import_section.end()
                        new_import = 'import { getCurrentUser, requireAuthQuery, requireAuthMutation } from "../lib/convexAuth";\n'
                        content = content[:insertion_point] + new_import + content[insertion_point:]
                        modified = True

            # 2. Remove token from query args
            def remove_token_arg(match):
                args_content = match.group(1)
                # Remove token: v.string() line
                args_content = re.sub(r',?\s*token:\s*v\.string\(\)\s*,?', '', args_content)
                # Clean up trailing commas
                args_content = re.sub(r',\s*}', ' }', args_content)
                args_content = re.sub(r'{\s*,', '{ ', args_content)
                return f'args: {{{args_content}}}'

            content = re.sub(r'args:\s*{([^}]*token:\s*v\.string\(\)[^}]*)}', remove_token_arg, content)
            if content != original_content:
                modified = True
                original_content = content

            # 3. Replace getUserFromToken with getCurrentUser
            if 'getUserFromToken' in content:
                # Pattern: const { userId, username } = await getUserFromToken(ctx, args.token);
                content = re.sub(
                    r'const\s+{\s*userId\s*,\s*username\s*}\s*=\s*await\s+getUserFromToken\(ctx,\s*args\.token\);',
                    'const auth = await getCurrentUser(ctx);\n    if (!auth) throw new Error("Not authenticated");\n    const { userId, username } = auth;',
                    content
                )
                modified = True

            # 4. Replace requireAuthQuery/Mutation calls
            content = re.sub(
                r'const\s+{\s*userId\s*,\s*username\s*}\s*=\s*await\s+requireAuthQuery\(ctx,\s*args\.token\);',
                'const { userId, username } = await requireAuthQuery(ctx);',
                content
            )
            content = re.sub(
                r'const\s+{\s*userId\s*,\s*username\s*}\s*=\s*await\s+requireAuthMutation\(ctx,\s*args\.token\);',
                'const { userId, username } = await requireAuthMutation(ctx);',
                content
            )
            if content != original_content:
                modified = True

            # Write back if modified
            if modified:
                file_path.write_text(content)
                self.changes.append(f"Backend: {file_path.relative_to(self.root_dir)}")
                self.files_modified += 1
                return True

            return False

        except Exception as e:
            log_error(f"Error processing {file_path}: {e}")
            return False

    def migrate_backend_files(self):
        """Migrate all backend Convex files"""
        log_info("Migrating backend files...")

        backend_files = [
            self.convex_dir / "core" / "users.ts",
            self.convex_dir / "core" / "cards.ts",
            self.convex_dir / "core" / "decks.ts",
            self.convex_dir / "gameplay" / "games" / "lifecycle.ts",
            self.convex_dir / "gameplay" / "games" / "queries.ts",
            self.convex_dir / "gameplay" / "games" / "lobby.ts",
            self.convex_dir / "gameplay" / "gameEngine" / "turns.ts",
            self.convex_dir / "gameplay" / "gameEngine" / "summons.ts",
            self.convex_dir / "gameplay" / "gameEngine" / "spellsTraps.ts",
            self.convex_dir / "gameplay" / "gameEngine" / "positions.ts",
            self.convex_dir / "gameplay" / "phaseManager.ts",
            self.convex_dir / "gameplay" / "combatSystem.ts",
            self.convex_dir / "gameplay" / "chainResolver.ts",
            self.convex_dir / "economy" / "shop.ts",
            self.convex_dir / "economy" / "economy.ts",
            self.convex_dir / "economy" / "marketplace.ts",
            self.convex_dir / "social" / "globalChat.ts",
            self.convex_dir / "social" / "friends.ts",
            self.convex_dir / "social" / "matchmaking.ts",
            self.convex_dir / "social" / "leaderboards.ts",
            self.convex_dir / "progression" / "achievements.ts",
            self.convex_dir / "progression" / "quests.ts",
            self.convex_dir / "progression" / "story.ts",
            self.convex_dir / "progression" / "matchHistory.ts",
            self.convex_dir / "admin" / "mutations.ts",
            self.convex_dir / "agents.ts",
        ]

        for file_path in backend_files:
            if file_path.exists():
                if self.migrate_backend_file(file_path):
                    log_success(f"Migrated {file_path.name}")
            else:
                log_warning(f"File not found: {file_path}")

    def delete_old_auth_files(self):
        """Delete old deprecated auth files"""
        log_info("Removing old auth files...")

        old_files = [
            self.convex_dir / "lib" / "auth.ts",
            self.convex_dir / "lib" / "auth.standardized.ts",
        ]

        for file_path in old_files:
            if file_path.exists():
                # Backup before deleting
                backup_path = file_path.with_suffix('.ts.backup')
                file_path.rename(backup_path)
                log_success(f"Backed up {file_path.name} to {backup_path.name}")
                self.changes.append(f"Deleted: {file_path.relative_to(self.root_dir)}")

    def generate_report(self):
        """Generate migration report"""
        print("\n" + "="*60)
        print("MIGRATION REPORT")
        print("="*60)
        print(f"\nFiles modified: {self.files_modified}")
        print(f"\nChanges made:")
        for change in self.changes:
            print(f"  - {change}")

        print("\n" + "="*60)
        print("NEXT STEPS")
        print("="*60)
        print("""
1. Test your app thoroughly
2. Check that all queries/mutations work
3. If issues occur, restore from .backup files
4. Delete .backup files once confirmed working

Run: bun run dev
        """)

def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║        CONVEX AUTH MIGRATION SCRIPT                      ║
║  Migrating from token-based auth to Convex Auth          ║
╚══════════════════════════════════════════════════════════╝
    """)

    root_dir = os.getcwd()
    log_info(f"Working directory: {root_dir}")

    migrator = AuthMigrator(root_dir)

    # Run migrations
    migrator.migrate_backend_files()
    migrator.delete_old_auth_files()

    # Generate report
    migrator.generate_report()

    log_success("Migration complete!")

if __name__ == "__main__":
    main()
