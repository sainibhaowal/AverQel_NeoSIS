/** Resolve the NeoSIS-bundled LibreOffice executable without weakening development fallback. */

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function bundledCandidates(root: string): string[] {
  if (process.platform === 'win32') return [
    join(root, 'program', 'soffice.exe'),
    join(root, 'LibreOffice', 'program', 'soffice.exe'),
  ]
  if (process.platform === 'darwin') return [
    join(root, 'LibreOffice.app', 'Contents', 'MacOS', 'soffice'),
    join(root, 'Contents', 'MacOS', 'soffice'),
  ]
  const candidates = [join(root, 'program', 'soffice')]
  const opt = join(root, 'opt')
  if (!existsSync(opt)) return candidates
  for (const entry of readdirSync(opt, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    candidates.push(join(opt, entry.name, 'program', 'soffice'))
  }
  return candidates
}

/**
 * Resolve the executable selected by the host environment.
 * @param bundleRoot - Optional unpacked LibreOffice resource directory.
 * @returns A bundled executable path when present, otherwise the system command.
 */
export function resolveOfficeExecutable(bundleRoot = process.env.NEOSIS_OFFICE_BUNDLE_ROOT): string {
  if (bundleRoot !== undefined && bundleRoot !== '') {
    for (const candidate of bundledCandidates(bundleRoot)) if (existsSync(candidate)) return candidate
  }
  const configured = process.env.NEOSIS_OFFICE_EXECUTABLE?.trim()
  if (configured !== undefined && configured !== '') return configured
  if (process.env.NEOSIS_OFFICE_BUNDLE_REQUIRED === '1') {
    throw new Error('NeoSIS bundled LibreOffice is required, but no bundled soffice executable was found.')
  }
  return 'soffice'
}
