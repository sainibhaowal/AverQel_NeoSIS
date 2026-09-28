/** Locate the archive containing a prepared Desktop runtime. */
import { basename, dirname } from 'node:path'

/**
 * @param runtimeDir - Prepared or ASAR-contained runtime directory.
 * @returns Parent archive path when the runtime is inside app.asar.
 */
export function runtimeArchivePath(runtimeDir: string): string | undefined {
  const parent = dirname(runtimeDir)
  return basename(parent) === 'app.asar' ? parent : undefined
}
