/** Disk output, resource bounds, and cancellation around system LibreOffice. */
import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Context } from '@averqel/cordis'
import type { SystemOfficeConverter, SystemOfficeConverterOptions } from '../src/system-office.ts'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import OfficeToPdf, { Config, OfficeSourceKey, type OfficeToPdfRequest } from '../src/index.ts'

const systemOffice = vi.hoisted(() => ({ create: vi.fn<(options: SystemOfficeConverterOptions) => Promise<SystemOfficeConverter>>() }))
vi.mock('../src/system-office.ts', async importOriginal => ({
  ...(await importOriginal<typeof import('../src/system-office.ts')>()),
  createSystemOfficeConverter: systemOffice.create,
}))

const pdf = Buffer.from('%PDF-1.7\npreview\n%%EOF\n')
const input = new Uint8Array([80, 75, 3, 4])
const request: OfficeToPdfRequest = { extension: 'docx', priority: 'foreground', source: {
  key: OfficeSourceKey('source'), version: 'v1', bytes: input.length,
  read: async () => ({ bytes: input, version: 'v1' }),
} }
function distinct(index: number): OfficeToPdfRequest {
  return { ...request, source: { ...request.source, key: OfficeSourceKey(`source-${index}`),
    read: async () => ({ bytes: new Uint8Array([80, 75, 3, index]), version: 'v1' }) } }
}
let ctx: Context
let render: ReturnType<typeof vi.fn<SystemOfficeConverter['render']>>
let dispose: ReturnType<typeof vi.fn<SystemOfficeConverter['dispose']>>

beforeEach(() => {
  ctx = new Context()
  render = vi.fn<SystemOfficeConverter['render']>().mockImplementation(async ({ outputPath }) => {
    await writeFile(outputPath, pdf)
    return { backend: 'system', missingFonts: ['Missing Serif'] }
  })
  dispose = vi.fn<SystemOfficeConverter['dispose']>().mockResolvedValue(undefined)
  systemOffice.create.mockReset().mockImplementation(async () => ({ backend: 'system', render, dispose }))
})
afterEach(async () => { await ctx.fiber.dispose() })

async function mount(config: Partial<Config> = {}): Promise<OfficeToPdf> {
  await ctx.plugin(OfficeToPdf, config)
  return ctx.officeToPdf
}

it('uses the system executable and preserves omitted font configuration', async () => {
  const provider = await mount()
  await provider.convert(request)
  expect(systemOffice.create.mock.calls[0]![0]).toEqual({ executable: 'soffice', timeoutMs: 60_000 })
  expect(Config({ fontDirectories: [] }).fontDirectories).toEqual([])
  expect(Config({ fontFallbacks: [] }).fontFallbacks).toEqual([])
  expect(() => Config({ fontDirectories: [''] })).toThrow()
})

it.each([
  [[]],
  [['sans-serif']],
  [['sans-serif', '']],
  [['sans-serif', ' \t\n ']],
])('rejects invalid font preference groups %j before creating a converter', (...fontFallbacks) => {
  expect(() => Config({ fontFallbacks })).toThrow()
  expect(systemOffice.create).not.toHaveBeenCalled()
})

it('passes system settings and removes all scratch files', async () => {
  const config = Config({ maxConcurrentConversions: 1, maxInputBytes: 4, maxOutputBytes: pdf.length,
    maxImageResolution: 144, maxArchiveEntries: 32, maxUncompressedBytes: 4096,
    timeoutMs: 321, fontDirectories: [], fontFallbacks: [['sans-serif', 'Arial'], ['serif', 'Times New Roman']],
    maxFontFiles: 12, maxFontFileBytes: 4096, maxLoadedFontBytes: 8192 })
  const provider = await mount(config)
  let scratch = ''
  render.mockImplementation(async ({ inputPath, outputPath }) => {
    scratch = dirname(inputPath)
    expect(await readFile(inputPath)).toEqual(Buffer.from(input))
    if (process.platform !== 'win32') {
      expect((await stat(scratch)).mode & 0o777).toBe(0o700)
      expect((await stat(inputPath)).mode & 0o777).toBe(0o600)
    }
    await writeFile(outputPath, pdf)
    return { backend: 'system', missingFonts: ['Missing Serif'] }
  })
  const result = await provider.convert(request)
  expect(result).toMatchObject({ pdf: Uint8Array.from(pdf), missingFonts: ['Missing Serif'] })
  await expect(access(scratch)).rejects.toMatchObject({ code: 'ENOENT' })
  await provider.convert(request)
  expect(systemOffice.create).toHaveBeenCalledExactlyOnceWith({ executable: 'soffice', timeoutMs: 321, fontDirectories: [] })
  await ctx.fiber.dispose()
  expect(dispose).toHaveBeenCalledOnce()
  expect(result.pdf).toEqual(Uint8Array.from(pdf))
})

it('refuses an oversized input before allocating a converter', async () => {
  const provider = await mount({ maxInputBytes: 3 })
  await expect(provider.convert(request)).rejects.toMatchObject({ code: 'input-too-large' })
  expect(systemOffice.create).not.toHaveBeenCalled()
})

it.each(['missing', 'directory', 'not-pdf', 'incomplete', 'too-large'] as const)('rejects %s output and removes its directory', async (kind) => {
  const provider = await mount({ maxOutputBytes: pdf.length })
  let scratch = ''
  render.mockImplementation(async ({ inputPath, outputPath }) => {
    scratch = dirname(inputPath)
    if (kind === 'directory') await mkdir(outputPath)
    else if (kind === 'not-pdf') await writeFile(outputPath, 'engine diagnostic')
    else if (kind === 'incomplete') await writeFile(outputPath, '%PDF-1.7\n')
    else if (kind === 'too-large') await writeFile(outputPath, Buffer.concat([pdf, pdf]))
    return { backend: 'system', missingFonts: [] }
  })
  await expect(provider.convert(request)).rejects.toMatchObject({ code: kind === 'too-large' ? 'output-too-large' : 'invalid-output' })
  await expect(access(scratch)).rejects.toMatchObject({ code: 'ENOENT' })
})

it('retries initialization after a failed adapter factory and reports unclassified errors', async () => {
  const provider = await mount()
  systemOffice.create.mockRejectedValueOnce(Object.assign(new Error('absent executable'), { code: 'unavailable' }))
  await expect(provider.convert(request)).rejects.toMatchObject({ code: 'unavailable' })
  expect(await provider.convert(request)).toMatchObject({ pdf: Uint8Array.from(pdf), missingFonts: ['Missing Serif'] })
  expect(systemOffice.create).toHaveBeenCalledTimes(2)
  render.mockRejectedValueOnce(new Error('unexpected engine failure'))
  await expect(provider.convert(distinct(9))).rejects.toMatchObject({ code: 'failed' })
})

it.each([
  'input-too-large', 'output-too-large', 'invalid-document', 'unsupported-format', 'invalid-output', 'timeout', 'unavailable',
] as const)('preserves the adapter %s failure for the document consumer', async (code) => {
  const provider = await mount()
  const cause = Object.assign(new Error('conversion failed'), { code })
  render.mockRejectedValueOnce(cause)
  await expect(provider.convert(request)).rejects.toMatchObject({ code, cause })
})

it('cancels a queued caller without starting or stopping another conversion', async () => {
  const provider = await mount({ maxConcurrentConversions: 1 })
  const entered = Promise.withResolvers<AbortSignal>()
  const release = Promise.withResolvers<undefined>()
  render.mockImplementationOnce(async ({ outputPath }, signal) => {
    entered.resolve(signal!)
    await release.promise
    await writeFile(outputPath, pdf)
    return { backend: 'system', missingFonts: [] }
  })
  const first = provider.convert(request)
  try {
    const activeSignal = await entered.promise
    const controller = new AbortController()
    const second = provider.convert(request, controller.signal)
    const rejected = expect(second).rejects.toMatchObject({ name: 'AbortError' })
    await Promise.resolve(undefined)
    controller.abort()
    await rejected
    expect(render).toHaveBeenCalledOnce()
    expect(activeSignal.aborted).toBe(false)
  } finally { release.resolve(undefined); await first }
  expect(await provider.convert(request)).toHaveProperty('pdf')
})

it('bounds active converters and resumes queued work when a slot becomes free', async () => {
  const provider = await mount({ maxConcurrentConversions: 2 })
  const both = Promise.withResolvers<undefined>()
  const release = Promise.withResolvers<undefined>()
  let calls = 0
  render.mockImplementation(async ({ outputPath }) => {
    if (++calls === 2) both.resolve(undefined)
    await release.promise
    await writeFile(outputPath, pdf)
    return { backend: 'system', missingFonts: [] }
  })
  const work = [provider.convert(distinct(1)), provider.convert(distinct(2)), provider.convert(distinct(3))]
  try {
    await both.promise
    expect(systemOffice.create).toHaveBeenCalledTimes(2)
    expect(render).toHaveBeenCalledTimes(2)
  } finally { release.resolve(undefined); await Promise.all(work) }
  expect(render).toHaveBeenCalledTimes(3)
  expect(systemOffice.create).toHaveBeenCalledTimes(3)
})

it.each(['caller', 'provider'] as const)('joins late adapter completion and scratch cleanup after %s cancellation', async (owner) => {
  const provider = await mount()
  const entered = Promise.withResolvers<{ signal: AbortSignal; scratch: string }>()
  const release = Promise.withResolvers<undefined>()
  render.mockImplementation(async ({ inputPath, outputPath }, signal) => {
    entered.resolve({ signal: signal!, scratch: dirname(inputPath) })
    await release.promise
    await writeFile(outputPath, pdf)
    return { backend: 'system', missingFonts: [] }
  })
  const caller = new AbortController()
  const work = provider.convert(request, caller.signal)
  const rejected = expect(work).rejects.toMatchObject(owner === 'caller' ? { name: 'AbortError' } : { code: 'unavailable' })
  const { signal, scratch } = await entered.promise
  let settled = false
  const observed = work.then(() => { settled = true }, () => { settled = true })
  let closing: Promise<void> | undefined
  try {
    if (owner === 'caller') caller.abort()
    else closing = ctx.fiber.dispose()
    await vi.waitFor(() => { expect(signal.aborted).toBe(true) })
    await rejected
    await observed
    expect(settled).toBe(true)
    await access(scratch)
  } finally { release.resolve(undefined); await rejected; await observed; await closing; await ctx.fiber.dispose() }
  await expect(access(scratch)).rejects.toMatchObject({ code: 'ENOENT' })
  if (owner === 'provider') expect(dispose).toHaveBeenCalledOnce()
})

it('rejects caller cancellation before allocating any conversion resources', async () => {
  const provider = await mount()
  const reason = new Error('caller cancelled')
  await expect(provider.convert(request, AbortSignal.abort(reason))).rejects.toBe(reason)
  expect(systemOffice.create).not.toHaveBeenCalled()
})

it('rejects relative font directories during provider configuration', async () => {
  expect(() => new OfficeToPdf(ctx, Config({ fontDirectories: ['relative/fonts'] })))
    .toThrow('fontDirectories must contain absolute paths')
})

it('rejects source capacity below one permitted input before allocating a converter', () => {
  expect(() => new OfficeToPdf(ctx, Config({ maxInputBytes: 4, maxSourceBytes: 3 })))
    .toThrow('maxSourceBytes must be at least maxInputBytes')
  expect(systemOffice.create).not.toHaveBeenCalled()
})
