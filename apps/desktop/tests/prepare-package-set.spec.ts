import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  assertDesktopHostPackageFiles,
  selectDesktopPackageClosure,
  type PackedDesktopPackage,
} from '../scripts/prepare-package-set.ts'

function packed(name: string, manifest: Record<string, unknown> = {}): PackedDesktopPackage {
  return { tarball: `${name}.tgz`, manifest: { name, version: '1.0.0', ...manifest } }
}

describe('desktop package-set selection', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not select a packaging target when imported as a library', async () => {
    vi.stubEnv('NEOSIS_DESKTOP_TARGET_PLATFORM', 'linux')
    vi.stubEnv('NEOSIS_DESKTOP_TARGET_ARCH', 'x64')
    vi.resetModules()
    await expect(import('../scripts/prepare-package-set.ts')).resolves.toHaveProperty('prepareDesktopPackageSet')
  })

  it('includes only the available internal production closure', () => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@averqel/neosis', packed('@averqel/neosis', {
        dependencies: { '@averqel/neosis-base': '^1.0.0', external: '^2.0.0' },
        optionalDependencies: { '@averqel/platform-package': '1.0.0', '@averqel/missing-platform': '1.0.0' },
      })],
      ['@averqel/neosis-desktop-host', packed('@averqel/neosis-desktop-host', {
        dependencies: { '@averqel/neosis': '^1.0.0' },
      })],
      ['@averqel/neosis-base', packed('@averqel/neosis-base', {
        peerDependencies: { '@averqel/cordis': '^1.0.0' },
      })],
      ['@averqel/cordis', packed('@averqel/cordis')],
      ['@averqel/platform-package', packed('@averqel/platform-package')],
      ['@averqel/unused', packed('@averqel/unused')],
    ])
    expect(selectDesktopPackageClosure(available).map(entry => entry.manifest.name)).toEqual([
      '@averqel/cordis',
      '@averqel/neosis',
      '@averqel/neosis-base',
      '@averqel/neosis-desktop-host',
      '@averqel/platform-package',
    ])
  })

  it('keeps the host native platform optional dependency in the local package set', () => {
    const platformName = `@averqel/node-addon-system-${process.platform}-${process.arch}`
    const available = new Map<string, PackedDesktopPackage>([
      ['@averqel/neosis', packed('@averqel/neosis', {
        optionalDependencies: { [platformName]: '~0.1.2' },
      })],
      ['@averqel/neosis-desktop-host', packed('@averqel/neosis-desktop-host')],
      [platformName, packed(platformName)],
    ])

    expect(selectDesktopPackageClosure(available).map(entry => entry.manifest.name)).toContain(platformName)
  })

  it.each([
    '@averqel/neosis-base', '@averqel/cordis', '@averqel/node-addon-system',
  ])('rejects required prepared package %s absent from the packed release inputs', (dependency) => {
    const available = new Map<string, PackedDesktopPackage>([
      ['@averqel/neosis', packed('@averqel/neosis', {
        dependencies: { [dependency]: '^1.0.0' },
      })],
      ['@averqel/neosis-desktop-host', packed('@averqel/neosis-desktop-host', {
        dependencies: { '@averqel/neosis': '^1.0.0' },
      })],
    ])
    expect(() => selectDesktopPackageClosure(available)).toThrow(/unpacked package/u)
    expect(() => selectDesktopPackageClosure(new Map([
      ['@averqel/neosis', packed('@averqel/neosis')],
    ]))).toThrow(/omit @averqel\/neosis-desktop-host/u)
  })

  it('requires the Desktop Host entry', () => {
    const files = [
      'package/lib/index.js',
    ]
    expect(() => {
      assertDesktopHostPackageFiles(files)
    }).not.toThrow()
    expect(() => {
      assertDesktopHostPackageFiles(files.slice(1))
    }).toThrow(/lib\/index\.js/u)
  })
})
