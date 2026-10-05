/** The Web bundle's Office rows retain independent configuration and Session file authorization. */
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Context } from '@averqel/cordis'
import Loader from '@averqel/cordis-plugin-loader'
import Include, { applyEntryPatches } from '@averqel/cordis-plugin-include'
import { loadOverlayPatches } from '@averqel/neosis-app-boot'
import WorkspaceFiles, { type WorkspaceFileScope } from '@averqel/neosis-api-workspace-files'
import OfficeToPdf from '@averqel/neosis-office-to-pdf'
import * as DocumentPreview from '@averqel/neosis-client-ui-sidebar-documentpreview'
import type { IndexInjection } from '@averqel/neosis-host-webserver'
import SessionStore, { SessionId } from '@averqel/neosis-session'
import SessionProjectionRegistry from '@averqel/neosis-session-projection'
import SandboxPolicyService from '@averqel/neosis-sandbox-policy'
import LocalFileSystem from '@averqel/neosis-fs-local'
import { FsError } from '@averqel/neosis-fs'
import TypertRegistry from '@averqel/neosis-typert-registry'
import type { SystemOfficeConverter, SystemOfficeConverterOptions } from '../../../document/office-to-pdf/src/system-office.ts'
import { expect, it, onTestFinished, vi } from 'vitest'

const systemOffice = vi.hoisted(() => ({ create: vi.fn<(options: SystemOfficeConverterOptions) => Promise<SystemOfficeConverter>>() }))
vi.mock('../../../document/office-to-pdf/src/system-office.ts', async importOriginal => ({
  ...(await importOriginal<typeof import('../../../document/office-to-pdf/src/system-office.ts')>()),
  createSystemOfficeConverter: systemOffice.create,
}))

it('loads the shipped Office rows with separately patched settings and authorized PDF output', async () => {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'neosis-web-office-')))
  const ctx = new Context()
  onTestFinished(async () => {
    try { await ctx.fiber.dispose() }
    finally { vi.restoreAllMocks(); await rm(directory, { recursive: true, force: true }) }
  })
  const configPath = join(directory, 'cordis.yml')
  const expectedRows = {
    'office-to-pdf': '@averqel/neosis-office-to-pdf',
    'ui-sidebar-documentpreview': '@averqel/neosis-client-ui-sidebar-documentpreview',
  }
  const rows = loadOverlayPatches('web-office-test', fileURLToPath(new URL('../cordis.patch.yml', import.meta.url)))
    .flatMap(patch => patch.insert ?? []).filter(row => row.id !== undefined && Object.hasOwn(expectedRows, row.id))
  expect(rows.map(row => [row.id, row.name])).toEqual(Object.entries(expectedRows))
  const providerConfig = { maxInputBytes: 4096, maxConcurrentConversions: 1, fontFallbacks: [['Missing Serif', 'Available Serif']] }
  const clientConfig = DocumentPreview.Config({ office: { maxCachedEntries: 3, maxCachedBytes: 8192 } })
  const configured = applyEntryPatches(rows, [
    { id: 'office-to-pdf', config: providerConfig },
    { id: 'ui-sidebar-documentpreview', config: clientConfig },
  ], (message) => { throw new Error(message) })
  expect(configured.find(row => row.id === 'ui-sidebar-documentpreview')!.config).toEqual(clientConfig)
  await writeFile(configPath, JSON.stringify([
    { name: '@averqel/neosis-session' },
    { name: '@averqel/neosis-session-projection' },
    { name: '@averqel/neosis-sandbox-policy', config: { workspaceRoot: directory } },
    { name: '@averqel/neosis-fs-local', config: { cwd: directory } },
    { name: '@averqel/neosis-typert-registry' },
    { name: '@averqel/neosis-api-workspace-files', config: { maxFileBytes: 1 } },
    ...configured,
  ]))
  const pdf = Buffer.from('%PDF-1.7\nLoader preview\n%%EOF\n')
  const render = vi.fn<SystemOfficeConverter['render']>().mockImplementation(async ({ inputPath, outputPath }) => {
    expect(await readFile(inputPath)).toEqual(Buffer.from('authorized OOXML'))
    await writeFile(outputPath, pdf)
    return { backend: 'system', missingFonts: ['Missing Serif'] }
  })
  systemOffice.create.mockReset().mockResolvedValue({ backend: 'system', render, dispose: async () => {} })
  ctx.baseUrl = pathToFileURL(directory).href + '/'
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  // Loader's native imports must share the test's source-plane Service classes.
  const modules = new Map<string, unknown>([
    ['@averqel/neosis-session', SessionStore],
    ['@averqel/neosis-session-projection', SessionProjectionRegistry],
    ['@averqel/neosis-sandbox-policy', SandboxPolicyService],
    ['@averqel/neosis-fs-local', LocalFileSystem],
    ['@averqel/neosis-typert-registry', TypertRegistry],
    ['@averqel/neosis-api-workspace-files', WorkspaceFiles],
    ['@averqel/neosis-office-to-pdf', OfficeToPdf],
    ['@averqel/neosis-client-ui-sidebar-documentpreview', DocumentPreview],
  ])
  ctx.loader.internal = {
    version: 'v2',
    async import(specifier: string) {
      if (!modules.has(specifier)) throw new Error(`Unexpected Loader import: ${specifier}`)
      return modules.get(specifier)
    },
  } as unknown as NonNullable<typeof ctx.loader.internal>
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
  await ctx.loader.await()
  const entries = new Map([...ctx.loader.entries()].map(entry => [entry.options.id, entry]))
  for (const row of configured) await entries.get(row.id)!.fiber!.await()
  const injections: IndexInjection[] = []
  ctx.emit('webserver/index-inject', injections)
  expect(injections).toEqual([
    { kind: 'global', name: '__NEOSIS_DOCUMENT_PREVIEW_CONFIG__', value: clientConfig },
  ])

  const id = SessionId('office-loader')
  const session = ctx.sessions.create(id, { meta: { cwd: directory } })
  const lookup = ctx.typert.lookups.get('workspaceFileScope')!
  const scope = await lookup.resolve(id) as WorkspaceFileScope | undefined
  if (scope === undefined) throw new Error('Expected the Session workspace scope')
  expect(await lookup.resolve(SessionId('missing'))).toBeUndefined()
  const sourcePath = join(directory, 'report.docx')
  await writeFile(sourcePath, 'authorized OOXML')
  const signal = new AbortController().signal
  const version = (await ctx.workspaceFiles.stat(scope, 'report.docx', signal)).version
  const before = session.seq
  const result = await ctx.officeToPdf.render(scope, 'report.docx', 'foreground', signal)
  expect(result).toEqual({ absolutePath: sourcePath, version, offset: 0, eof: true, bytes: pdf.length,
    data: Uint8Array.from(pdf), missingFonts: ['Missing Serif'], generation: ctx.officeToPdf.generation })
  const readAgain = vi.spyOn(ctx.fs, 'readBytes')
  expect(await ctx.officeToPdf.render(scope, 'report.docx', 'foreground', signal)).toEqual(result)
  expect(readAgain).not.toHaveBeenCalled()
  expect(await readFile(sourcePath, 'utf8')).toBe('authorized OOXML')
  expect(session.seq).toBe(before)
  expect(ctx.get('agents')).toBeUndefined()
  expect(systemOffice.create).toHaveBeenCalledWith({ executable: 'soffice', timeoutMs: 60_000 })
  await expect(ctx.officeToPdf.render(scope, 'missing.docx', 'foreground', signal))
    .rejects.toMatchObject({ code: 'workspace-file/not-found' })
  const refusal = new FsError('read refused', 'FS_SANDBOX_DENIED')
  vi.spyOn(ctx.fs, 'stat').mockRejectedValueOnce(refusal)
  await expect(ctx.officeToPdf.render(scope, 'report.docx', 'foreground', signal)).rejects.toBe(refusal)
  if (process.platform !== 'win32') {
    await symlink(sourcePath, join(directory, 'link.docx'))
    await expect(ctx.officeToPdf.render(scope, 'link.docx', 'foreground', signal))
      .rejects.toMatchObject({ code: 'workspace-file/not-regular-file' })
  }
  expect(render).toHaveBeenCalledOnce()
})
