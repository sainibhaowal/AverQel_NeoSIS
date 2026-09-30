/**
 * Fix third-party package names that were incorrectly rebranded
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = resolve(__filename, '..');
const root = resolve(scriptsDir, '..');

/** Third-party packages that should not be rebranded */
const THIRD_PARTY_FIXES = [
  { from: '@averqel/oxlint', to: 'oxlint' },
  { from: '@averqel/oxlint-types', to: 'oxlint-types' },
  { from: '@averqel/js-yaml', to: 'js-yaml' },
  { from: '@averqel/commander', to: 'commander' },
  { from: '@averqel/ws', to: 'ws' },
  { from: '@averqel/@types', to: '@types' },
  { from: '@averqel/typescript', to: 'typescript' },
  { from: '@averqel/execa', to: 'execa' },
  { from: '@averqel/ajv', to: 'ajv' },
];

function findPackageJsonFiles() {
  try {
    const result = execSync(
      'find . -name "package.json" ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/lib/*" ! -path "*/dist/*"',
      {
        cwd: root,
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024
      }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding package.json files:', error);
    return [];
  }
}

function fixPackageInFile(filePath, apply) {
  if (!existsSync(filePath)) return null;

  const content = readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changed = false;

  try {
    const pkg = JSON.parse(content);

    // Fix dependencies
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (pkg[depType]) {
        for (const fix of THIRD_PARTY_FIXES) {
          if (pkg[depType][fix.from]) {
            pkg[depType][fix.to] = pkg[depType][fix.from];
            delete pkg[depType][fix.from];
            changed = true;
            console.log(`  ${filePath}: ${fix.from} → ${fix.to}`);
          }
        }
      }
    }

    if (changed && apply) {
      newContent = JSON.stringify(pkg, null, 2) + '\n';
      writeFileSync(filePath, newContent, 'utf-8');
    }
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
  }

  return changed ? { filePath, changed } : null;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');

  console.log('🔧 Fixing Third-Party Package Names');
  console.log('====================================\n');

  if (!apply) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('📋 Run with --apply to make these changes\n');
  }

  const packageFiles = findPackageJsonFiles();
  console.log(`📊 Found ${packageFiles.length} package.json files\n`);

  let changes = 0;
  for (const file of packageFiles) {
    const change = fixPackageInFile(resolve(root, file), apply);
    if (change) changes++;
  }

  console.log(`\n📝 Total packages fixed: ${changes}`);

  if (apply) {
    console.log('\n✅ Third-party package names fixed successfully!');
    console.log('⚠️  Next steps:');
    console.log('   1. Run: rm -rf node_modules && pnpm install');
    console.log('   2. Run: pnpm run build');
  } else {
    console.log('\n📋 Run with --apply to make these changes');
  }
}

main();
