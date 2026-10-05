/**
 * Compatibility entry point for the AverQel NeoSIS rebrand audit.
 *
 * @deprecated Use `node scripts/complete-rebrand.mjs --check`.
 */

import { runAudit } from './complete-rebrand.mjs'

process.exitCode = runAudit(process.argv.slice(2))
