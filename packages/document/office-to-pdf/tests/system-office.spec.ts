/** Isolated subprocess checks for the system LibreOffice adapter. */
import { access, chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { createSystemOfficeConverter, writeOfficeInput } from '../src/system-office.ts'

const pdf = '%PDF-1.7\nsystem adapter\n%%EOF\n'

async function fixture(script: string): Promise<{ root: string; executable: string }> {
  const root = await mkdtemp(join(tmpdir(), 'neosis-system-office-test-'))
  const executable = join(root, 'fake-soffice.mjs')
  await writeFile(executable, `#!/usr/bin/env node\n${script}\n`, { mode: 0o700 })
  await chmod(executable, 0o700)
  return { root, executable }
}

it('runs an isolated executable with provider-owned input and output paths', async () => {
  const { root, executable } = await fixture(`
    import { writeFile } from 'node:fs/promises'
    import { join } from 'node:path'
    const outdir = process.argv[process.argv.indexOf('--outdir') + 1]
    await writeFile(join(outdir, 'document.pdf'), ${JSON.stringify(pdf)})
  `)
  try {
    const paths = await writeOfficeInput(root, new Uint8Array([80, 75, 3, 4]), 'docx')
    const converter = await createSystemOfficeConverter({ executable, timeoutMs: 500 })
    await expect(converter.render(paths)).resolves.toEqual({ backend: 'system', missingFonts: [] })
    await expect(readFile(paths.outputPath, 'utf8')).resolves.toBe(pdf)
    await expect(access(join(root, 'profile'))).rejects.toMatchObject({ code: 'ENOENT' })
    await converter.dispose()
  } finally { await rm(root, { recursive: true, force: true }) }
})

it('classifies an unavailable system executable and removes its profile', async () => {
  const root = await mkdtemp(join(tmpdir(), 'neosis-system-office-missing-'))
  try {
    const paths = await writeOfficeInput(root, new Uint8Array([80, 75, 3, 4]), 'docx')
    const converter = await createSystemOfficeConverter({ executable: join(root, 'missing-soffice'), timeoutMs: 500 })
    await expect(converter.render(paths)).rejects.toMatchObject({ code: 'unavailable' })
    await expect(access(join(root, 'profile'))).rejects.toMatchObject({ code: 'ENOENT' })
  } finally { await rm(root, { recursive: true, force: true }) }
})
