/** Download, verify, and materialize the private LibreOffice runtime for one Desktop target. */

import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { cp, mkdir, mkdtemp, open, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { LIBREOFFICE_VERSION, officeRuntimeSpec, type OfficeRuntimeSpec } from './office-runtime-manifest.ts'

const execute = promisify(execFile)
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024

interface PrepareOfficeRuntimeOptions {
  readonly target: string
  readonly destination: string
  readonly cache: string
  readonly sourceRoot?: string
}

async function sha256(path: string): Promise<string> {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}

async function download(spec: OfficeRuntimeSpec, destination: string): Promise<void> {
  const response = await fetch(spec.url)
  if (!response.ok || response.body === null) throw new Error(`desktop office: download failed with HTTP ${response.status}`)
  const length = Number(response.headers.get('content-length') ?? 0)
  if (Number.isSafeInteger(length) && length > MAX_ARCHIVE_BYTES) throw new Error('desktop office: download exceeds the archive limit')
  const handle = await open(destination, 'wx')
  let complete = false
  try {
    const reader = response.body.getReader()
    let total = 0
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) break
      total += chunk.value.byteLength
      if (total > MAX_ARCHIVE_BYTES) throw new Error('desktop office: download exceeds the archive limit')
      await handle.write(chunk.value)
    }
    complete = true
  }
  finally { await handle.close() }
  if (!complete) await rm(destination, { force: true })
  const actual = await sha256(destination)
  if (actual !== spec.sha256) {
    await rm(destination, { force: true })
    throw new Error(`desktop office: SHA-256 mismatch for ${spec.filename}`)
  }
}

async function filesMatching(root: string, predicate: (name: string) => boolean): Promise<string[]> {
  const found: string[] = []
  const visit = async (directory: string): Promise<void> => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile() && predicate(entry.name)) found.push(path)
    }
  }
  await visit(root)
  return found
}

async function materializeDebTar(archive: string, destination: string): Promise<void> {
  const extracted = await mkdtemp(join(tmpdir(), 'neosis-office-deb-'))
  try {
    await execute('tar', ['-xzf', archive, '-C', extracted])
    const debs = await filesMatching(extracted, name => name.endsWith('.deb'))
    if (debs.length === 0) throw new Error('desktop office: LibreOffice archive contains no Debian packages')
    const root = join(extracted, 'root')
    await mkdir(root)
    for (const deb of debs) await execute('dpkg-deb', ['-x', deb, root])
    await cp(root, destination, { recursive: true })
  }
  finally { await rm(extracted, { recursive: true, force: true }) }
}

async function materializeDmg(archive: string, destination: string): Promise<void> {
  const mount = await mkdtemp(join(tmpdir(), 'neosis-office-dmg-'))
  try {
    await execute('hdiutil', ['attach', '-nobrowse', '-readonly', '-mountpoint', mount, archive])
    const app = join(mount, 'LibreOffice.app')
    await cp(app, join(destination, 'LibreOffice.app'), { recursive: true })
  }
  finally {
    await execute('hdiutil', ['detach', mount, '-force']).catch(() => undefined)
    await rm(mount, { recursive: true, force: true })
  }
}

async function materializeMsi(archive: string, destination: string): Promise<void> {
  await execute('msiexec.exe', ['/a', archive, '/qn', `TARGETDIR=${destination}`])
}

async function assertExecutable(root: string, target: string): Promise<string> {
  const name = target.startsWith('win-') ? 'soffice.exe' : 'soffice'
  const candidates = await filesMatching(root, candidate => candidate === name)
  const executable = candidates.find(path => path.includes(`${process.platform === 'win32' ? '\\' : '/'}program${process.platform === 'win32' ? '\\' : '/'}`))
    ?? candidates[0]
  if (executable === undefined) throw new Error(`desktop office: ${target} payload has no ${name} executable`)
  return executable
}

/**
 * Materialize an official LibreOffice payload in an unpacked resource directory.
 * @param options - Target, output path, immutable cache, and optional prepared source.
 * @returns The executable path inside the materialized bundle.
 */
export async function prepareOfficeRuntime(options: PrepareOfficeRuntimeOptions): Promise<string> {
  const spec = officeRuntimeSpec(options.target)
  await rm(options.destination, { recursive: true, force: true })
  await mkdir(options.destination, { recursive: true })
  if (options.sourceRoot !== undefined) {
    await cp(options.sourceRoot, options.destination, { recursive: true })
  }
  else {
    await mkdir(options.cache, { recursive: true })
    const archive = join(options.cache, spec.filename)
    const cached = await stat(archive).catch(() => undefined)
    if (cached === undefined || !cached.isFile()) await download(spec, archive)
    else if (await sha256(archive) !== spec.sha256) throw new Error(`desktop office: cached ${spec.filename} has the wrong SHA-256`)
    if (spec.archive === 'deb-tar') await materializeDebTar(archive, options.destination)
    else if (spec.archive === 'dmg') await materializeDmg(archive, options.destination)
    else await materializeMsi(archive, options.destination)
  }
  const executable = await assertExecutable(options.destination, options.target)
  await writeFile(join(options.destination, 'office-runtime.json'), `${JSON.stringify({
    schemaVersion: 1, target: options.target, version: LIBREOFFICE_VERSION,
    archive: spec.filename, sha256: spec.sha256, source: spec.url,
  }, undefined, 2)}\n`)
  return executable
}

if (import.meta.main) {
  const target = process.env.NEOSIS_DESKTOP_TARGET_PLATFORM === 'darwin'
    ? `mac-${process.env.NEOSIS_DESKTOP_TARGET_ARCH ?? process.arch}`
    : process.env.NEOSIS_DESKTOP_TARGET_PLATFORM === 'win32'
      ? `win-${process.env.NEOSIS_DESKTOP_TARGET_ARCH ?? process.arch}`
      : `linux-${process.env.NEOSIS_DESKTOP_TARGET_ARCH ?? process.arch}`
  const root = process.env.NEOSIS_DESKTOP_OFFICE_SOURCE
  const destination = process.env.NEOSIS_DESKTOP_OFFICE_DESTINATION
  const cache = process.env.NEOSIS_DESKTOP_OFFICE_CACHE
  if (destination === undefined || cache === undefined) throw new Error('desktop office: destination and cache environment variables are required')
  await prepareOfficeRuntime({ target, destination, cache, ...(root === undefined ? {} : { sourceRoot: root }) })
}
