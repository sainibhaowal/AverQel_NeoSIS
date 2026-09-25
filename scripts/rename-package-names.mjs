/**
 * Verify the AverQel NeoSIS package graph after the product rename.
 *
 * Package renaming is complete and package metadata is shared by many
 * consumers, so this command is intentionally read-only. It checks package
 * names, duplicate manifests, and workspace dependency targets.
 *
 * Usage: `node scripts/rename-package-names.mjs --check`
 */

import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isProtectedPath, listRepositoryFiles } from './complete-rebrand.mjs'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const dependencySections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

/**
 * Read active package manifests.
 *
 * @returns {{path: string, manifest: Record<string, unknown>}[]} Parsed manifests.
 */
function readManifests() {
  const manifests = []
  for (const path of listRepositoryFiles()) {
    if (basename(path) !== 'package.json' || isProtectedPath(path)) continue
    try {
      const manifest = JSON.parse(readFileSync(resolve(root, path), 'utf8'))
      manifests.push({ path, manifest })
    } catch (error) {
      throw new Error(`Unable to parse ${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return manifests
}

/**
 * Check package names and workspace dependency references.
 *
 * @returns {string[]} Validation errors.
 */
export function findPackageGraphErrors() {
  const manifests = readManifests()
  const errors = []
  const names = new Map()
  for (const { path, manifest } of manifests) {
    const name = typeof manifest.name === 'string' ? manifest.name : null
    if (!name) continue
    const previous = names.get(name)
    if (previous) errors.push(`duplicate package name ${name}: ${previous} and ${path}`)
    names.set(name, path)
    if (name.includes('dsh') || name.includes('DeepSeekHarness')) {
      errors.push(`${path}: legacy product token remains in package name ${name}`)
    }
  }

  for (const { path, manifest } of manifests) {
    for (const section of dependencySections) {
      const dependencies = manifest[section]
      if (!dependencies || typeof dependencies !== 'object') continue
      for (const [name, version] of Object.entries(dependencies)) {
        if (!name.startsWith('@averqel/neosis') || typeof version !== 'string' || !version.startsWith('workspace:')) continue
        if (!names.has(name)) errors.push(`${path}: workspace dependency ${name} has no active package manifest`)
      }
    }
  }
  return errors
}

/**
 * Run the package graph audit.
 *
 * @param {string[]} args Command-line arguments.
 * @returns {number} Process exit status.
 */
export function runPackageAudit(args = []) {
  if (args.includes('--apply')) {
    console.error('Package renaming is complete; --apply is disabled because this audit is read-only.')
    return 2
  }
  if (args.some((arg) => arg !== '--check' && arg !== '--help')) {
    console.error('Usage: node scripts/rename-package-names.mjs --check')
    return 2
  }
  if (args.includes('--help')) {
    console.log('Usage: node scripts/rename-package-names.mjs --check')
    console.log('Checks active package names, duplicates, and workspace dependency targets.')
    return 0
  }

  const errors = findPackageGraphErrors()
  console.log('AverQel NeoSIS package graph audit')
  if (errors.length === 0) {
    console.log('PASS: package names and workspace dependency targets are consistent.')
    return 0
  }
  console.error(`FAIL: found ${errors.length} package graph error(s):`)
  errors.forEach((error) => console.error(`- ${error}`))
  return 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runPackageAudit(process.argv.slice(2))
}
