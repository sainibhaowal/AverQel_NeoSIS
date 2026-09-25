/**
 * TypeScript compatibility entry point for the AverQel NeoSIS rebrand audit.
 *
 * @deprecated Use `node scripts/complete-rebrand.mjs --check`.
 */

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'complete-rebrand.mjs')
const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], { stdio: 'inherit' })

if (result.error) throw result.error
process.exitCode = result.status ?? 1
