/** Verify npm's physical package placement for two incompatible NEOSIS releases. */

import { readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import {
  buildRegistryIndex,
  resolveNpmPackageLock,
  type NpmLockPackage,
  type NpmPackageLock,
  type RegistryIndex,
} from './benchmark-npm-resolution.ts'

const NEOSIS_PACKAGE = '@averqel/neosis'
const CORDIS_PACKAGE = '@averqel/cordis'
const NESTED_NEOSIS_ALIAS = 'neosis-previous'
const NESTED_NEOSIS_PATH = `node_modules/${NESTED_NEOSIS_ALIAS}`
const DEPENDENCY_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'] as const
const TIMEOUT_MS = 300_000

/** Synthetic incompatible versions used to expose cross-release placement errors. */
export const SYNTHETIC_NEOSIS_VERSIONS = ['0.1.0', '0.2.0'] as const

interface MutableRegistryManifest {
  name: string
  version: string
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  [key: string]: unknown
}

/** Summary of a verified two-release npm layout. */
export interface NeosisInstallLayoutSummary {
  readonly neosisPackagesPerVersion: number
  readonly checkedNeosisEdges: number
}

function isNeosisPackage(name: string): boolean {
  return name === NEOSIS_PACKAGE || name.startsWith(`${NEOSIS_PACKAGE}-`)
}

function cloneForVersion(manifest: object, version: string): MutableRegistryManifest {
  const cloned = structuredClone(manifest) as MutableRegistryManifest
  cloned.version = version
  for (const field of DEPENDENCY_FIELDS) {
    const dependencies = cloned[field]
    if (dependencies === undefined) continue
    for (const name of Object.keys(dependencies)) {
      if (isNeosisPackage(name)) dependencies[name] = `^${version}`
    }
  }
  return cloned
}

/**
 * Replace the working release with two incompatible, internally consistent NEOSIS releases.
 * @param index - Registry metadata containing the working release.
 * @param sourceVersion - Workspace version copied into each synthetic release.
 * @returns Registry metadata containing both synthetic NEOSIS releases and unchanged external packages.
 */
export function buildDualNeosisRegistry(index: RegistryIndex, sourceVersion: string): RegistryIndex {
  const output = new Map(index)
  let neosisPackages = 0
  for (const [name, versions] of index) {
    if (!isNeosisPackage(name)) {
      output.set(name, versions)
      continue
    }
    const source = versions.get(sourceVersion)
    if (source === undefined) throw new Error(`${name} has no workspace version ${sourceVersion}`)
    neosisPackages++
    output.set(name, new Map(SYNTHETIC_NEOSIS_VERSIONS.map(version => [
      version,
      cloneForVersion(source, version),
    ])))
  }
  if (neosisPackages === 0) throw new Error('registry contains no NEOSIS packages')
  return output
}

function packageNameAtPath(path: string, manifest: NpmLockPackage): string | undefined {
  if (manifest.name !== undefined) return manifest.name
  const marker = 'node_modules/'
  const markerIndex = path.lastIndexOf(marker)
  if (markerIndex < 0) return undefined
  const segments = path.slice(markerIndex + marker.length).split('/')
  if (segments[0]?.startsWith('@')) {
    return segments[1] === undefined ? undefined : `${segments[0]}/${segments[1]}`
  }
  return segments[0]
}

function resolvePackagePath(
  packages: Readonly<Record<string, NpmLockPackage>>,
  sourcePath: string,
  dependency: string,
): string | undefined {
  let directory = sourcePath
  while (directory !== '.') {
    const candidate = posix.join(directory, 'node_modules', dependency)
    if (packages[candidate] !== undefined) return candidate
    directory = posix.dirname(directory)
  }
  const rootCandidate = posix.join('node_modules', dependency)
  return packages[rootCandidate] === undefined ? undefined : rootCandidate
}

function setDifference(left: ReadonlySet<string>, right: ReadonlySet<string>): string[] {
  return [...left].filter(value => !right.has(value)).sort()
}

/**
 * Assert that npm isolates both NEOSIS releases while sharing the Cordis runtime.
 * @param packageLock - Metadata-only package lock produced by npm.
 * @returns Counts for the verified NEOSIS packages and dependency edges.
 */
export function assertDualNeosisInstallLayout(packageLock: NpmPackageLock): NeosisInstallLayoutSummary {
  const [nestedVersion, rootVersion] = SYNTHETIC_NEOSIS_VERSIONS
  const errors: string[] = []
  const namesByVersion = new Map<string, Set<string>>([
    [nestedVersion, new Set()],
    [rootVersion, new Set()],
  ])
  const installed = Object.entries(packageLock.packages)
  let checkedNeosisEdges = 0

  for (const [path, manifest] of installed) {
    const name = packageNameAtPath(path, manifest)
    if (name === 'react' || name === 'react-dom') {
      errors.push(`${path}: ${name} is a browser build input, not a dependency of the synthetic NEOSIS-only consumer`)
    }
    if (name === undefined || !isNeosisPackage(name)) continue
    const version = manifest.version
    if (version !== nestedVersion && version !== rootVersion) {
      errors.push(`${path}: expected NEOSIS version ${nestedVersion} or ${rootVersion}, got ${String(version)}`)
      continue
    }
    namesByVersion.get(version)?.add(name)
    const expectedPath = version === rootVersion
      ? `node_modules/${name}`
      : name === NEOSIS_PACKAGE
        ? NESTED_NEOSIS_PATH
        : `${NESTED_NEOSIS_PATH}/node_modules/${name}`
    if (path !== expectedPath) {
      errors.push(`${path}: expected ${name}@${version} at ${expectedPath}`)
    }

    for (const field of DEPENDENCY_FIELDS) {
      for (const dependency of Object.keys(manifest[field] ?? {})) {
        if (!isNeosisPackage(dependency)) continue
        const targetPath = resolvePackagePath(packageLock.packages, path, dependency)
        const optionalPeer = field === 'peerDependencies'
          && manifest.peerDependenciesMeta?.[dependency]?.optional === true
        if (targetPath === undefined) {
          if (field === 'optionalDependencies' || optionalPeer) continue
          errors.push(`${path}: ${field} ${dependency} does not resolve`)
          continue
        }
        checkedNeosisEdges++
        const targetVersion = packageLock.packages[targetPath]?.version
        if (targetVersion !== version) {
          errors.push(
            `${path}: ${field} ${dependency} resolves to ${targetPath}@${String(targetVersion)}, expected ${version}`,
          )
        }
      }
    }
  }

  const nestedNames = namesByVersion.get(nestedVersion) ?? new Set<string>()
  const rootNames = namesByVersion.get(rootVersion) ?? new Set<string>()
  if (!nestedNames.has(NEOSIS_PACKAGE)) errors.push(`${NESTED_NEOSIS_PATH}: missing ${NEOSIS_PACKAGE}@${nestedVersion}`)
  if (!rootNames.has(NEOSIS_PACKAGE)) errors.push(`node_modules/${NEOSIS_PACKAGE}: missing ${NEOSIS_PACKAGE}@${rootVersion}`)
  const onlyNested = setDifference(nestedNames, rootNames)
  const onlyRoot = setDifference(rootNames, nestedNames)
  if (onlyNested.length > 0) errors.push(`only ${nestedVersion} contains: ${onlyNested.join(', ')}`)
  if (onlyRoot.length > 0) errors.push(`only ${rootVersion} contains: ${onlyRoot.join(', ')}`)

  const cordisPaths = installed.flatMap(([path, manifest]) =>
    packageNameAtPath(path, manifest) === CORDIS_PACKAGE ? [path] : [])
  if (cordisPaths.length !== 1 || cordisPaths[0] !== `node_modules/${CORDIS_PACKAGE}`) {
    errors.push(`expected one shared ${CORDIS_PACKAGE} at node_modules/${CORDIS_PACKAGE}, got ${cordisPaths.join(', ')}`)
  }

  if (errors.length > 0) throw new Error(`invalid npm install layout:\n${errors.map(error => `  - ${error}`).join('\n')}`)
  return { neosisPackagesPerVersion: rootNames.size, checkedNeosisEdges }
}

function workspaceVersion(root: string): string {
  const manifest = JSON.parse(readFileSync(resolve(root, 'apps/cli/package.json'), 'utf8')) as { version?: unknown }
  if (typeof manifest.version !== 'string') throw new Error('apps/cli/package.json has no string version')
  return manifest.version
}

async function main(): Promise<void> {
  const root = resolve(import.meta.dirname, '..')
  const index = buildDualNeosisRegistry(buildRegistryIndex(root), workspaceVersion(root))
  const [nestedVersion, rootVersion] = SYNTHETIC_NEOSIS_VERSIONS
  const result = await resolveNpmPackageLock(index, {
    [NEOSIS_PACKAGE]: rootVersion,
    [NESTED_NEOSIS_ALIAS]: `npm:${NEOSIS_PACKAGE}@${nestedVersion}`,
  }, TIMEOUT_MS)
  if (result.archiveRequests !== 0) throw new Error(`npm requested ${String(result.archiveRequests)} package archive(s)`)
  const summary = assertDualNeosisInstallLayout(result.packageLock)
  console.log(
    `verify-npm-install-layout: ${String(summary.neosisPackagesPerVersion)} NEOSIS package(s) per release and `
    + `${String(summary.checkedNeosisEdges)} internal edge(s) verified in ${(result.durationMs / 1000).toFixed(2)} s; `
    + `both releases share one Cordis installation; ${String(result.unknownPackages.length)} unavailable optional `
    + 'package name(s) ignored by npm.',
  )
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    console.error(`verify-npm-install-layout: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
