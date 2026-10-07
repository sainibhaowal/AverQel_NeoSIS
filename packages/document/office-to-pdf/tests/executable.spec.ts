/** Bundled executable selection remains deterministic and keeps development fallback. */
import { mkdir, rm, writeFile, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { tmpdir } from 'node:os'
import { resolveOfficeExecutable } from '../src/executable.ts'

const roots: string[] = []

afterEach(async () => {
  vi.unstubAllEnvs()
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

it('uses the bundled platform executable when the resource is present', async () => {
  const root = await mkdtemp(join(tmpdir(), 'neosis-office-executable-'))
  roots.push(root)
  const executable = join(root, 'program', process.platform === 'win32' ? 'soffice.exe' : 'soffice')
  await mkdir(join(root, 'program'))
  await writeFile(executable, '')
  expect(resolveOfficeExecutable(root)).toBe(executable)
})

it('uses the configured system command when the bundle is absent', () => {
  vi.stubEnv('NEOSIS_OFFICE_EXECUTABLE', '/custom/soffice')
  expect(resolveOfficeExecutable('/missing/office-bundle')).toBe('/custom/soffice')
  vi.stubEnv('NEOSIS_OFFICE_EXECUTABLE', '')
  vi.stubEnv('NEOSIS_OFFICE_BUNDLE_REQUIRED', '1')
  expect(() => resolveOfficeExecutable('/missing/office-bundle')).toThrow(/bundled LibreOffice/u)
})
