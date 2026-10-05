/** Filesystem ownership for the Electron-managed desktop installation. */

import { join } from 'node:path'
import { resolveNeosisHome } from '@averqel/neosis-home-paths'

/** Stable desktop installation paths under the shared Harness home. */
export interface DesktopPaths {
  readonly profile: string
  readonly lock: string
}

/**
 * Resolve every Electron-owned path without changing the shared data roots.
 * @param neosisHome - Harness home shared with npm-installed neosis.
 * @returns immutable desktop path set.
 */
export function resolveDesktopPaths(neosisHome: string = resolveNeosisHome()): DesktopPaths {
  return {
    profile: join(neosisHome, 'profiles', 'desktop'),
    lock: join(neosisHome, 'profiles', 'desktop', 'lock'),
  }
}
