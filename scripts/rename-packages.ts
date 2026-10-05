/**
 * TypeScript compatibility entry point for the AverQel NeoSIS package audit.
 *
 * @deprecated Use `node scripts/rename-package-names.mjs --check`.
 */

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'rename-package-names.mjs')
const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], { stdio: 'inherit' })

if (result.error) throw result.error
process.exitCode = result.status ?? 1
