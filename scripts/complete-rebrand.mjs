/**
 * Audit the repository for product identifiers that predate AverQel NeoSIS.
 *
 * The product rename is complete, so this command is intentionally read-only.
 * Provider names such as DeepSeek remain valid integrations and are not flagged.
 * Historical release records, archived Agent Notes, vendored sources, and
 * internal skill identifiers are excluded because repository policy freezes them.
 *
 * Usage: `node scripts/complete-rebrand.mjs --check`
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDirectory, '..')

const LEGACY_IDENTIFIERS = [
  ['DeepSeek Harness', /DeepSeek Harness/gi],
  ['DeepSeekHarness', /DeepSeekHarness/g],
  ['deepseek-harness', /deepseek-harness/gi],
  ['deepseek_harness', /deepseek_harness/gi],
  ['deepseekharness', /deepseekharness/gi],
  ['@deepseek-ai/dsh', /@deepseek-ai\/dsh/g],
  ['DSH_HOME', /DSH_HOME/g],
  ['DSH_*', /DSH[_-][A-Z0-9_*-]+/g],
  ['dsh-desktop', /dsh-desktop/gi],
  ['dsh-app', /dsh-app/gi],
  ['com.deepseek.harness', /com\.deepseek\.(?:harness|neosis|qualification)/gi],
  ['logo=deepseek', /logo=deepseek/gi],
  ['深度求索', /深度求索/g],
  ['legacy dsh identifier', /(?:parse|packed|desktop|buildDual|assertDual|inspect|expected|is|Private)?Dsh[A-Za-z]*/g],
  ['legacy dsh token', /\bdsh\b/gi],
]

const TEXT_EXTENSIONS = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.mjs', '.md', '.mts', '.scss',
  '.sh', '.svg', '.ts', '.tsx', '.txt', '.vue', '.yaml', '.yml',
])

/**
 * Return whether a path belongs to repository history or tooling that must not
 * be changed by an active product rename.
 *
 * @param {string} relativePath Repository-relative path.
 * @returns {boolean} Whether the path is protected.
 */
export function isProtectedPath(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/')
  return normalized.startsWith('vendor/')
    || normalized.startsWith('.agents/notes/archived/')
    || normalized.startsWith('.agents/skills/')
    || normalized.startsWith('docs/persistence-changes/releases/')
    || /^scripts\/(?:complete-rebrand|rename-package-names|rename-packages)\.(?:js|mjs|ts)$/.test(normalized)
    || normalized.includes('/node_modules/')
    || normalized.includes('/lib/')
    || normalized.includes('/dist/')
    || normalized.includes('/coverage/')
    || normalized.includes('/.next/')
}

/**
 * List tracked and non-ignored files so the audit covers source, docs, tests,
 * configuration, and package metadata at every repository depth.
 *
 * @returns {string[]} Repository-relative file paths.
 */
export function listRepositoryFiles() {
  const output = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
  return output.split('\0').filter(Boolean).filter((relativePath) => existsSync(resolve(root, relativePath)))
}

/**
 * Return whether a file can be inspected as text.
 *
 * @param {string} relativePath Repository-relative path.
 * @param {Buffer} content File contents.
 * @returns {boolean} Whether the file should be scanned.
 */
function isTextFile(relativePath, content) {
  if (content.includes(0)) return false
  return TEXT_EXTENSIONS.has(extname(relativePath).toLowerCase())
    || basename(relativePath).startsWith('.')
}

/**
 * Find legacy product identifiers in active repository files and filenames.
 *
 * @returns {{path: string, line: number, identifier: string, text: string}[]} Findings.
 */
export function findLegacyIdentifiers() {
  const findings = []
  for (const relativePath of listRepositoryFiles()) {
    if (isProtectedPath(relativePath)) continue

    const filenameMatch = LEGACY_IDENTIFIERS.find(([, pattern]) => pattern.test(relativePath))
    LEGACY_IDENTIFIERS.forEach(([, pattern]) => pattern.lastIndex = 0)
    if (filenameMatch) {
      findings.push({ path: relativePath, line: 0, identifier: filenameMatch[0], text: relativePath })
    }

    const absolutePath = resolve(root, relativePath)
    let content
    try {
      content = readFileSync(absolutePath)
    } catch {
      continue
    }
    if (!isTextFile(relativePath, content)) continue

    const lines = content.toString('utf8').split('\n')
    lines.forEach((lineText, index) => {
      for (const [identifier, pattern] of LEGACY_IDENTIFIERS) {
        pattern.lastIndex = 0
        if (pattern.test(lineText)) {
          findings.push({ path: relativePath, line: index + 1, identifier, text: lineText.trim() })
        }
      }
    })
  }
  return findings
}

/**
 * Run the read-only product rebrand audit.
 *
 * @param {string[]} args Command-line arguments.
 * @returns {number} Process exit status.
 */
export function runAudit(args = []) {
  if (args.includes('--apply')) {
    console.error('The AverQel NeoSIS rebrand is complete; --apply is disabled because this audit is read-only.')
    return 2
  }
  if (args.some((arg) => arg !== '--check' && arg !== '--help')) {
    console.error('Usage: node scripts/complete-rebrand.mjs --check')
    return 2
  }
  if (args.includes('--help')) {
    console.log('Usage: node scripts/complete-rebrand.mjs --check')
    console.log('Audits active repository files and filenames for legacy product identifiers.')
    return 0
  }

  const files = listRepositoryFiles()
  const findings = findLegacyIdentifiers()
  console.log('AverQel NeoSIS rebrand audit')
  console.log(`Scanned ${files.length} repository files across all active directories.`)
  console.log('Protected history: vendor/, .agents/notes/archived/, .agents/skills/, docs/persistence-changes/releases/.')
  console.log('Audit implementations are excluded from their own findings.')
  if (findings.length === 0) {
    console.log('PASS: no legacy product identifiers found in the active repository.')
    return 0
  }

  console.error(`FAIL: found ${findings.length} legacy identifier occurrence(s):`)
  for (const finding of findings) {
    const location = finding.line === 0 ? finding.path : `${finding.path}:${finding.line}`
    console.error(`- ${location} [${finding.identifier}] ${finding.text}`)
  }
  return 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runAudit(process.argv.slice(2))
}
