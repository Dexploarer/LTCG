#!/usr/bin/env python3
"""
Complete Convex Auth Migration Script - Finds and migrates ALL files
"""

import re
import os
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log_success(msg):
    print(f"{Colors.GREEN}✓{Colors.RESET} {msg}")

def log_info(msg):
    print(f"{Colors.BLUE}ℹ{Colors.RESET} {msg}")

class CompleteMigrator:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.files_modified = 0
        self.changes = []

    def find_all_convex_files(self):
        """Find all .ts files in convex/ directory"""
        convex_dir = self.root_dir / "convex"
        return list(convex_dir.rglob("*.ts"))

    def needs_migration(self, content: str) -> bool:
        """Check if file needs migration"""
        return (
            'token: v.string()' in content or
            'getUserFromToken' in content or
            ('requireAuthQuery' in content and 'args.token' in content) or
            ('requireAuthMutation' in content and 'args.token' in content)
        )

    def migrate_file(self, file_path: Path) -> bool:
        """Migrate a single file"""
        try:
            content = file_path.read_text()

            # Skip files that don't need migration
            if not self.needs_migration(content):
                return False

            original_content = content

            # 1. Update imports - remove old auth imports
            content = re.sub(
                r'import\s*{[^}]*}\s*from\s*["\'][\.\/]*lib/auth(?:\.standardized)?["\'];\s*\n',
                '',
                content
            )

            # 2. Add new import if using auth and not present
            if ('getCurrentUser' in content or 'requireAuth' in content) and 'from' in content:
                if 'lib/convexAuth' not in content:
                    # Find where to insert import
                    import_match = re.search(r'(import.*from.*_generated.*\n)', content)
                    if import_match:
                        insertion_point = import_match.end()
                        # Determine import path depth
                        path_parts = str(file_path.relative_to(self.root_dir / "convex")).split('/')
                        depth = len(path_parts) - 1
                        import_path = '../' * depth + 'lib/convexAuth' if depth > 0 else './lib/convexAuth'
                        new_import = f'import {{ getCurrentUser, requireAuthQuery, requireAuthMutation }} from "{import_path}";\n'
                        content = content[:insertion_point] + new_import + content[insertion_point:]

            # 3. Remove token from args
            def remove_token_arg(match):
                args_content = match.group(1)
                # Remove token line
                args_content = re.sub(r',?\s*token:\s*v\.string\(\)\s*,?', '', args_content)
                # Clean up
                args_content = re.sub(r',\s*}', ' }', args_content)
                args_content = re.sub(r'{\s*,', '{ ', args_content)
                args_content = re.sub(r',\s*,', ',', args_content)
                return f'args: {{{args_content}}}'

            content = re.sub(r'args:\s*{([^}]*)}', remove_token_arg, content)

            # 4. Replace getUserFromToken
            content = re.sub(
                r'const\s+{\s*userId\s*,\s*username\s*}\s*=\s*await\s+getUserFromToken\(ctx,\s*args\.token\);',
                'const auth = await getCurrentUser(ctx);\n    if (!auth) throw new Error("Not authenticated");\n    const { userId, username } = auth;',
                content
            )

            # 5. Replace requireAuth calls with token
            content = re.sub(
                r'await\s+requireAuthQuery\(ctx,\s*args\.token\)',
                'await requireAuthQuery(ctx)',
                content
            )
            content = re.sub(
                r'await\s+requireAuthMutation\(ctx,\s*args\.token\)',
                'await requireAuthMutation(ctx)',
                content
            )

            # Write if changed
            if content != original_content:
                file_path.write_text(content)
                self.files_modified += 1
                self.changes.append(str(file_path.relative_to(self.root_dir)))
                return True

            return False

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return False

    def run(self):
        log_info("Finding all Convex files...")
        files = self.find_all_convex_files()

        log_info(f"Found {len(files)} files. Checking for migration needs...")

        for file_path in files:
            # Skip generated files and backups
            if '_generated' in str(file_path) or '.backup' in str(file_path):
                continue

            if self.migrate_file(file_path):
                log_success(f"Migrated: {file_path.name}")

        print("\n" + "="*60)
        print(f"COMPLETE! Modified {self.files_modified} files")
        print("="*60)

        if self.changes:
            print("\nFiles changed:")
            for change in self.changes:
                print(f"  - {change}")

def main():
    print("🔄 Complete Migration - Finding ALL files...\n")
    migrator = CompleteMigrator(os.getcwd())
    migrator.run()
    log_success("Done!")

if __name__ == "__main__":
    main()
