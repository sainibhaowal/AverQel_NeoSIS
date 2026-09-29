/** Restore the executable bit stripped from node-pty's prebuilt helper. */

import { chmodSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const entry = createRequire(import.meta.url).resolve('node-pty')
const packageRoot = dirname(dirname(entry))
const candidates = [
  join(packageRoot, 'prebuilds', `${process.platform}-${process.arch}`, 'spawn-helper'),
  join(packageRoot, 'build', 'Release', 'spawn-helper'),
]

for (const helper of candidates) {
  if (existsSync(helper)) chmodSync(helper, 0o755)
}
