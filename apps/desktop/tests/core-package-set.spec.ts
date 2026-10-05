import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DESKTOP_PACKAGES_DIR,
  DESKTOP_PACKAGE_SET_FILE,
  desktopCorePackageOverrides,
  desktopNeosisPackageSpec,
  parseDesktopCorePackageSet,
  verifyDesktopCoreLockfile,
  verifyDesktopCorePackageSet,
  type DesktopCorePackageRecord,
} from '../src/core-package-set.ts'

const roots: string[] = []

function record(name: string, file: string, body: Buffer, version = '1.2.3'): DesktopCorePackageRecord {
  return {
    name,
    version,
    file,
    bytes: body.byteLength,
    integrity: `sha512-${createHash('sha512').update(body).digest('base64')}`,
  }
}

function packageSetProject(): {
  root: string
  neosis: DesktopCorePackageRecord
  base: DesktopCorePackageRecord
  host: DesktopCorePackageRecord
} {
  const root = mkdtempSync(join(tmpdir(), 'neosis-desktop-package-set-'))
  roots.push(root)
  const packageDir = join(root, DESKTOP_PACKAGES_DIR)
  mkdirSync(packageDir)
  const neosisBody = Buffer.from('neosis')
  const baseBody = Buffer.from('base')
  const hostBody = Buffer.from('host')
  const neosis = record('@averqel/neosis', 'neosis.tgz', neosisBody)
  const base = record('@averqel/neosis-base', 'neosis-base.tgz', baseBody)
  const host = record('@averqel/neosis-desktop-host', 'neosis-desktop-host.tgz', hostBody)
  writeFileSync(join(packageDir, neosis.file), neosisBody)
  writeFileSync(join(packageDir, base.file), baseBody)
  writeFileSync(join(packageDir, host.file), hostBody)
  writeFileSync(join(root, DESKTOP_PACKAGE_SET_FILE), `${JSON.stringify({
    schemaVersion: 1,
    packages: [neosis, base, host],
  })}\n`)
  return { root, neosis, base, host }
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('desktop core package set', () => {
  it('pins the direct neosis dependency and every internal package to local tarballs', () => {
    const { root } = packageSetProject()
    const packageSet = verifyDesktopCorePackageSet(root, '1.2.3')
    expect(desktopNeosisPackageSpec(packageSet)).toBe('file:./desktop-packages/neosis.tgz')
    expect(desktopCorePackageOverrides(packageSet)).toEqual({
      '@averqel/neosis': 'file:./desktop-packages/neosis.tgz',
      '@averqel/neosis-base': 'file:./desktop-packages/neosis-base.tgz',
      '@averqel/neosis-desktop-host': 'file:./desktop-packages/neosis-desktop-host.tgz',
    })
  })

  it('rejects version drift, descriptor disorder, corruption, and extra files', () => {
    const { root, neosis, base, host } = packageSetProject()
    expect(() => verifyDesktopCorePackageSet(root, '2.0.0')).toThrow(/does not match Desktop/u)
    expect(() => parseDesktopCorePackageSet({
      schemaVersion: 1,
      packages: [neosis, base, { ...host, version: '2.0.0' }],
    }, '1.2.3')).toThrow(/neosis-desktop-host@2\.0\.0 does not match Desktop 1\.2\.3/u)
    expect(() => parseDesktopCorePackageSet({ schemaVersion: 1, packages: [base, neosis, host] }))
      .toThrow(/sorted by name/u)
    writeFileSync(join(root, DESKTOP_PACKAGES_DIR, neosis.file), 'changed')
    expect(() => verifyDesktopCorePackageSet(root, '1.2.3')).toThrow(/integrity check failed/u)
    writeFileSync(join(root, DESKTOP_PACKAGES_DIR, 'extra.tgz'), '')
    expect(() => verifyDesktopCorePackageSet(root, '1.2.3')).toThrow(/does not match its descriptor/u)
  })

  it('rejects registry resolutions for names supplied by the local package set', () => {
    const neosis = record('@averqel/neosis', 'neosis.tgz', Buffer.from('neosis'))
    const host = record('@averqel/neosis-desktop-host', 'host.tgz', Buffer.from('host'))
    const packageSet = parseDesktopCorePackageSet({ schemaVersion: 1, packages: [neosis, host] })
    expect(() => {
      verifyDesktopCoreLockfile(
        "packages:\n  '@averqel/neosis@file:desktop-packages/neosis.tgz':\n    resolution: {}\n",
        packageSet,
      )
    }).not.toThrow()
    expect(() => {
      verifyDesktopCoreLockfile(
        "packages:\n  '@averqel/neosis@1.2.3':\n    resolution: {integrity: sha512-registry}\n",
        packageSet,
      )
    }).toThrow(/outside the local package set/u)
  })
})
