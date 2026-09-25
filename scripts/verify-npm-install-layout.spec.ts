import { describe, expect, it } from 'vitest'
import type { NpmPackageLock, RegistryIndex } from './benchmark-npm-resolution.ts'
import {
  assertDualNeosisInstallLayout,
  buildDualNeosisRegistry,
} from './verify-npm-install-layout.ts'

function validLayout(): NpmPackageLock {
  return {
    lockfileVersion: 3,
    packages: {
      '': { dependencies: { '@averqel/neosis': '0.2.0', 'neosis-previous': 'npm:@averqel/neosis@0.1.0' } },
      'node_modules/@averqel/cordis': { version: '4.0.1' },
      'node_modules/@averqel/neosis': {
        version: '0.2.0',
        dependencies: { '@averqel/neosis-child': '^0.2.0' },
        peerDependencies: { '@averqel/cordis': '^4.0.1' },
      },
      'node_modules/@averqel/neosis-child': {
        version: '0.2.0',
        dependencies: { '@averqel/neosis-leaf': '^0.2.0' },
      },
      'node_modules/@averqel/neosis-leaf': { version: '0.2.0' },
      'node_modules/neosis-previous': {
        name: '@averqel/neosis',
        version: '0.1.0',
        dependencies: { '@averqel/neosis-child': '^0.1.0' },
        peerDependencies: { '@averqel/cordis': '^4.0.1' },
      },
      'node_modules/neosis-previous/node_modules/@averqel/neosis-child': {
        version: '0.1.0',
        dependencies: { '@averqel/neosis-leaf': '^0.1.0' },
      },
      'node_modules/neosis-previous/node_modules/@averqel/neosis-leaf': { version: '0.1.0' },
    },
  }
}

describe('npm install layout verifier', () => {
  it('creates two incompatible versions of every NEOSIS package', () => {
    const index: RegistryIndex = new Map([
      ['@averqel/neosis', new Map([['0.1.1-rc.2', {
        name: '@averqel/neosis',
        version: '0.1.1-rc.2',
        dependencies: { '@averqel/neosis-child': '^0.1.1-rc.2' },
        peerDependencies: { '@averqel/cordis': '^4.0.1' },
      }]])],
      ['@averqel/neosis-child', new Map([['0.1.1-rc.2', {
        name: '@averqel/neosis-child',
        version: '0.1.1-rc.2',
      }]])],
      ['@averqel/cordis', new Map([['4.0.1', {
        name: '@averqel/cordis',
        version: '4.0.1',
      }]])],
    ])

    const dual = buildDualNeosisRegistry(index, '0.1.1-rc.2')

    expect([...dual.get('@averqel/neosis')?.keys() ?? []]).toEqual(['0.1.0', '0.2.0'])
    expect(dual.get('@averqel/neosis')?.get('0.1.0')).toMatchObject({
      version: '0.1.0',
      dependencies: { '@averqel/neosis-child': '^0.1.0' },
      peerDependencies: { '@averqel/cordis': '^4.0.1' },
    })
    expect(dual.get('@averqel/neosis')?.get('0.2.0')).toMatchObject({
      version: '0.2.0',
      dependencies: { '@averqel/neosis-child': '^0.2.0' },
    })
    expect(dual.get('@averqel/cordis')).toBe(index.get('@averqel/cordis'))
  })

  it('accepts isolated NEOSIS releases with one shared Cordis installation', () => {
    expect(assertDualNeosisInstallLayout(validLayout())).toEqual({
      neosisPackagesPerVersion: 3,
      checkedNeosisEdges: 4,
    })
  })

  it.each([
    ['react', 'node_modules/react'],
    ['react-dom', 'node_modules/react-dom'],
    ['react', 'node_modules/neosis-previous/node_modules/react'],
    ['react-dom', 'node_modules/neosis-previous/node_modules/react-dom'],
  ])('rejects browser runtime %s installed at %s in the NEOSIS-only consumer', (name, path) => {
    const layout = validLayout()
    const packages = { ...layout.packages, [path]: { version: '18.3.1' } }
    expect(() => assertDualNeosisInstallLayout({ ...layout, packages })).toThrow(
      `${path}: ${name} is a browser build input`,
    )
  })

  it('rejects an internal edge that crosses release versions', () => {
    const layout = validLayout()
    const packages = { ...layout.packages }
    Reflect.deleteProperty(packages, 'node_modules/neosis-previous/node_modules/@averqel/neosis-leaf')

    expect(() => assertDualNeosisInstallLayout({ ...layout, packages })).toThrow(
      'node_modules/neosis-previous/node_modules/@averqel/neosis-child: dependencies '
      + '@averqel/neosis-leaf resolves to node_modules/@averqel/neosis-leaf@0.2.0, expected 0.1.0',
    )
  })

  it('rejects a second Cordis installation', () => {
    const layout = validLayout()
    const packages = {
      ...layout.packages,
      'node_modules/neosis-previous/node_modules/@averqel/cordis': { version: '4.0.1' },
    }

    expect(() => assertDualNeosisInstallLayout({ ...layout, packages })).toThrow(
      'expected one shared @averqel/cordis',
    )
  })
})
