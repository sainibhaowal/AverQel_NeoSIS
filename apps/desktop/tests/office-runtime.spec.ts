/** Pinned Office payload selection and source materialization checks. */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, expect, it } from 'vitest'
import { officeRuntimeSpec } from '../scripts/office-runtime-manifest.ts'
import { prepareOfficeRuntime } from '../scripts/prepare-office-runtime.ts'

const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

it('pins every supported Desktop target to an official checksum', () => {
  for (const target of ['linux-x64', 'linux-arm64', 'mac-x64', 'mac-arm64', 'win-x64']) {
    const spec = officeRuntimeSpec(target)
    expect(spec.url).toMatch(/^https:\/\/download\.documentfoundation\.org\//u)
    expect(spec.sha256).toMatch(/^[0-9a-f]{64}$/u)
  }
})

it('materializes a prepared payload without downloading or changing the source', async () => {
  const root = await mkdtemp(join(tmpdir(), 'neosis-office-runtime-test-'))
  roots.push(root)
  const source = join(root, 'source')
  const destination = join(root, 'destination')
  const cache = join(root, 'cache')
  await mkdir(join(source, 'program'), { recursive: true })
  await writeFile(join(source, 'program', 'soffice'), 'fixture')
  const executable = await prepareOfficeRuntime({ target: 'linux-x64', sourceRoot: source, destination, cache })
  expect(executable).toBe(join(destination, 'program', 'soffice'))
  expect(await readFile(executable, 'utf8')).toBe('fixture')
  expect(JSON.parse(await readFile(join(destination, 'office-runtime.json'), 'utf8'))).toMatchObject({
    schemaVersion: 1, target: 'linux-x64', version: '26.8.0',
  })
})
