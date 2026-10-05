/** Temporary materialized packages for Desktop resource and profile behavior tests. */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DESKTOP_HOST_RUNTIME_FILES } from '../src/core-package-set.ts'
import { DESKTOP_HOST_PROTOCOL_VERSION } from '../src/host-protocol.ts'
import { writeDesktopRuntime, type DesktopRuntimeDescriptor } from '../src/runtime-tree.ts'

/**
 * Write a package fixture with explicit runtime exports.
 * @param modules - Owning node_modules directory.
 * @param name - Package name.
 * @param fields - Manifest fields.
 * @param source - ESM entry contents.
 * @returns Installed package directory.
 */
export function writePackage(modules: string, name: string, fields: Record<string, unknown> = {}, source = 'export const identity = {}\n'): string {
  const path = join(modules, name)
  mkdirSync(path, { recursive: true })
  writeFileSync(join(path, 'package.json'), JSON.stringify({ name, version: '1.0.0', type: 'module', exports: './index.js', ...fields }))
  writeFileSync(join(path, 'index.js'), source)
  return path
}

/**
 * Seal a minimal release containing Host entry files and a shared Cordis package.
 * @param root - New runtime directory.
 * @param version - Shell and neosis version.
 * @param nodeVersion - Bundled Node version recorded in resource metadata.
 * @returns Sealed runtime metadata.
 */
export function runtimeFixture(root: string, version = '1.0.0', nodeVersion = '24.17.0'): DesktopRuntimeDescriptor {
  const names = ['@averqel/neosis', '@averqel/neosis-desktop-host', '@averqel/neosis-base', '@averqel/neosis-web-app', '@averqel/cordis']
  for (const name of names) {
    const bundle = name === '@averqel/neosis-base' || name === '@averqel/neosis-web-app'
    const path = writePackage(join(root, 'node_modules'), name, {
      version,
      ...(name === '@averqel/neosis' ? { dependencies: Object.fromEntries(names.slice(1).map(dependency => [dependency, version])) } : {}),
      ...(bundle ? { neosis: { bundle: { patch: './bundle.yml' } } } : {}),
    })
    if (bundle) writeFileSync(join(path, 'bundle.yml'), '[]\n')
  }
  for (const file of DESKTOP_HOST_RUNTIME_FILES) {
    const path = join(root, 'node_modules', '@averqel/neosis-desktop-host', file)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, '')
  }
  writeFileSync(join(root, 'package.json'), '{"type":"module"}\n')
  return writeDesktopRuntime(root, { schemaVersion: 1, version, nodeVersion, pnpmVersion: '11.7.0', hostProtocolVersion: DESKTOP_HOST_PROTOCOL_VERSION }, names)
}
