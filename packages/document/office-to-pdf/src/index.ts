/** Host system-LibreOffice provider with reusable conversion and private disk input/output. */
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { extname, isAbsolute, join } from 'node:path'
import { tmpdir } from 'node:os'
import { Context } from '@averqel/cordis'
import z from '@averqel/schemastery'
import type { WorkspaceFileScope, WorkspaceFileStat } from '@averqel/neosis-api-workspace-files'
import type {} from '@averqel/neosis-fs'
import { brandString } from '@averqel/neosis-brand'
import { Remote, RemoteError, TypertRemoteService } from '@averqel/neosis-typert-protocol'
import { OfficeToPdfError } from './errors.ts'
import { OfficeToPdfGeneration, type OfficeSourceKey } from './identity.ts'
import type { OfficeExtension, OfficeToPdfErrorCode, OfficeToPdfRequest, OfficeToPdfResult, OfficeToPdfPriority, RenderedDocumentBytes } from './types.ts'
import { createSystemOfficeConverter, writeOfficeInput, type SystemOfficeConverterOptions } from './system-office.ts'
import { resolveOfficeExecutable } from './executable.ts'
import { readPdf } from './output.ts'
import { ConversionQueue } from './queue.ts'

export * from './errors.ts'
export * from './identity.ts'
export * from './system-office.ts'
export * from './executable.ts'
export * from './types.ts'

declare module '@averqel/cordis' {
  interface Context {
    /** Shared Office conversion and authorized workspace-file rendering. */
    officeToPdf: OfficeToPdf
  }
}

/** Provider concurrency and system LibreOffice configuration. */
export interface Config {
  /** Maximum simultaneous conversions; queued callers remain cancellable. */
  maxConcurrentConversions: number
  /** Maximum metadata-only jobs awaiting source admission. */
  maxQueuedJobs: number
  /** Maximum outstanding conversion readers. */
  maxReaders: number
  /** Maximum reserved bytes across admitted source reads and conversions. */
  maxSourceBytes: number
  /** Maximum concurrent background jobs; zero refuses speculative work. */
  maxBackgroundConversions: number
  /** Maximum retained content-addressed PDFs. */
  maxCachedEntries: number
  /** Maximum retained PDF bytes. */
  maxCachedBytes: number
  /** Maximum retained source-version aliases to cached content. */
  maxSourceEntries: number
  /** System LibreOffice executable name or absolute path. */
  executable: string
  /** Conversion deadline in milliseconds; excludes the NeoSIS queue. */
  timeoutMs: number
  /** Maximum authorized source bytes. */
  maxInputBytes: number
  /** Maximum complete PDF bytes. */
  maxOutputBytes: number
  /** Retained for configuration compatibility; system LibreOffice controls rasterization. */
  maxImageResolution: number
  /** Maximum OOXML ZIP entries. */
  maxArchiveEntries: number
  /** Maximum total declared uncompressed OOXML bytes. */
  maxUncompressedBytes: number
  /** Absolute font roots exposed to system LibreOffice through SAL_FONTPATH. */
  fontDirectories?: string[]
  /** Retained for configuration compatibility; system LibreOffice resolves fallback families. */
  fontFallbacks?: string[][]
  /** Maximum physical font files indexed by each converter. */
  maxFontFiles: number
  /** Maximum individual font-file bytes. */
  maxFontFileBytes: number
  /** Maximum original font bytes loaded for a conversion. */
  maxLoadedFontBytes: number
}

/** Deployment defaults resolved before provider construction. */
export const Config: z<Partial<Config>, Config> = z.object({
  maxConcurrentConversions: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(2),
  maxQueuedJobs: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(8),
  maxReaders: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(32),
  maxSourceBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(104857600),
  maxBackgroundConversions: z.natural().min(0).max(Number.MAX_SAFE_INTEGER).default(1),
  maxCachedEntries: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(8),
  maxCachedBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(134217728),
  maxSourceEntries: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(64),
  executable: z.string().min(1).default(resolveOfficeExecutable()),
  timeoutMs: z.natural().min(1).max(2_147_483_647).default(60_000),
  maxInputBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER - 1).default(50 * 1024 * 1024),
  maxOutputBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER - 1).default(100 * 1024 * 1024),
  maxImageResolution: z.natural().min(1).max(2_147_483_647).default(192),
  maxArchiveEntries: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(10_000),
  maxUncompressedBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(250 * 1024 * 1024),
  fontDirectories: z.array(z.string().min(1)).extra('default', undefined),
  fontFallbacks: z.array(z.array(z.string().pattern(/\S/)).min(2)).extra('default', undefined),
  maxFontFiles: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(20_000),
  maxFontFileBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(256 * 1024 * 1024),
  maxLoadedFontBytes: z.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(512 * 1024 * 1024),
})

const officeErrorCodes = new Set<OfficeToPdfErrorCode>([
  'input-too-large', 'output-too-large', 'invalid-document', 'unsupported-format', 'invalid-output',
  'timeout', 'unavailable', 'failed', 'busy', 'source-changed',
])

/** A provider lifetime owns all converters, queued calls, and temporary files. */
export class OfficeToPdf extends TypertRemoteService {
  static Config = Config
  /** Changes whenever engine, font, or conversion configuration is replaced. */
  readonly generation: OfficeToPdfGeneration = OfficeToPdfGeneration(randomUUID())
  private readonly remoteLifetime = new AbortController()
  private readonly remoteRequests = new Set<Promise<RenderedDocumentBytes>>()
  private readonly queue: ConversionQueue
  private readonly config: Config
  private readonly converterOptions: SystemOfficeConverterOptions

  /**
   * @param ctx - owning Host context.
   * @param config - resolved rendering, font, and concurrency limits.
   */
  constructor(ctx: Context, config: Config) {
    super(ctx, 'officeToPdf')
    this.config = config
    if (config.fontDirectories?.some(path => !isAbsolute(path))) throw new Error('fontDirectories must contain absolute paths.')
    if (config.maxSourceBytes < config.maxInputBytes) throw new Error('maxSourceBytes must be at least maxInputBytes.')
    this.converterOptions = {
      executable: config.executable,
      timeoutMs: config.timeoutMs,
      ...(config.fontDirectories === undefined ? {} : { fontDirectories: config.fontDirectories }),
    }
    this.queue = new ConversionQueue(config, this.generation, (bytes, extension, signal) => this.convertBytes(bytes, extension, signal))
    ctx.effect(() => async () => {
      this.remoteLifetime.abort()
      await this.queue.dispose()
      await Promise.allSettled(this.remoteRequests)
    })
  }

  /**
   * Convert Office bytes without modifying the source or writing Session events.
   * @param request - authorized metadata and deferred bounded source read.
   * @param signal - caller cancellation; provider disposal also stops active work.
   * @returns caller-owned PDF bytes after conversion and scratch cleanup settle; canceled readers reject independently.
   * @throws {OfficeToPdfError} Invalid input, unusable output, or engine failure; cancellation rejects with its reason.
   */
  convert(request: OfficeToPdfRequest, signal?: AbortSignal): Promise<OfficeToPdfResult> {
    return this.queue.read(request, signal)
  }

  /**
   * Read and convert one Office file using the Session's ordinary filesystem authorization.
   * @param workspaceFileScope - Session header lookup shared with workspaceFiles.
   * @param path - absolute or workspace-relative Office path.
   * @param priority - foreground preview or speculative background work.
   * @param signal - Remote cancellation; disposal also cancels outstanding reads and conversions.
   * @returns complete PDF bytes with original source identity and missing font families.
   */
  @Remote
  async render(
    workspaceFileScope: WorkspaceFileScope, path: string, priority: OfficeToPdfPriority, signal: AbortSignal,
  ): Promise<RenderedDocumentBytes> {
    const upstream = AbortSignal.any([signal, this.remoteLifetime.signal])
    const operation = this.renderFile(workspaceFileScope, path, priority, upstream)
    this.remoteRequests.add(operation)
    try { return await operation } finally { this.remoteRequests.delete(operation) }
  }

  /**
   * Read the current rendering generation before reusing a Client PDF.
   * @param signal - Remote caller cancellation.
   * @returns provider lifetime, replaced with rendering, font, or engine configuration.
   */
  @Remote('generation')
  getGeneration(signal: AbortSignal): OfficeToPdfGeneration { signal.throwIfAborted(); return this.generation }

  private async renderFile(
    scope: WorkspaceFileScope, path: string, priority: OfficeToPdfPriority, signal: AbortSignal,
  ): Promise<RenderedDocumentBytes> {
    try {
      signal.throwIfAborted()
      const extension = extname(path).slice(1).toLowerCase()
      const supported = new Set<OfficeExtension>([
        'doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'odt', 'ott', 'fodt', 'rtf',
        'xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'ods', 'ots', 'fods',
        'ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'pps', 'ppsx', 'ppsm', 'odp', 'otp', 'fodp',
      ])
      if (!supported.has(extension as OfficeExtension)) {
        throw new OfficeToPdfError('unsupported-format', 'The path does not use a supported LibreOffice document extension.')
      }
      const officeExtension = extension as OfficeExtension
      const files = this.ctx.get('workspaceFiles')
      const fs = this.ctx.get('fs')
      if (files === undefined || fs === undefined) throw new OfficeToPdfError('unavailable', 'Office file rendering requires workspaceFiles and fs.')
      const authorized = await files.readBytes(scope, path, { range: { offset: 0, length: 1 } }, signal)
      const source = await files.stat(scope, path, signal)
      const assertUnchanged = (current: WorkspaceFileStat): void => {
        if (current.absolutePath !== source.absolutePath || current.version !== source.version) {
          throw new OfficeToPdfError('source-changed', 'The source changed.')
        }
      }
      assertUnchanged(authorized)
      signal.throwIfAborted()
      const result = await this.convert({ extension: officeExtension, priority, source: {
        key: brandString<OfficeSourceKey>(JSON.stringify([scope.sessionId, scope.workspaceRoot, source.absolutePath])),
        version: source.version, ...(source.bytes === undefined ? {} : { bytes: source.bytes }),
        read: async (upstream, maxBytes) => {
          const target = await fs.resolve(source.absolutePath, { signal: upstream })
          const info = await fs.stat(target, upstream)
          if (info === undefined || info.type !== 'file') throw new OfficeToPdfError('source-changed', 'The source changed.')
          assertUnchanged({ absolutePath: fs.processPath(target), version: info.version })
          const bytes = await fs.readBytes(target, upstream, maxBytes).catch(async (cause: unknown) => {
            if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'FS_TOO_LARGE') {
              assertUnchanged(await files.stat(scope, path, upstream))
              throw new OfficeToPdfError('input-too-large', 'The source exceeds the reserved byte capacity.', { cause })
            }
            throw cause
          })
          upstream.throwIfAborted()
          const after = await files.stat(scope, path, upstream)
          assertUnchanged(after)
          return { bytes, version: source.version }
        },
      } }, signal)
      signal.throwIfAborted()
      return { absolutePath: source.absolutePath, version: source.version,
        offset: 0, eof: true, bytes: result.pdf.byteLength, data: result.pdf,
        missingFonts: result.missingFonts, generation: result.generation }
    } catch (cause) {
      if (signal.aborted) throw new RemoteError('gateway/cancelled', 'The document preview was cancelled.', {}, { cause })
      if (cause instanceof OfficeToPdfError) {
        throw new RemoteError('document-render/failed', 'Office conversion failed.', { reason: cause.code }, { cause })
      }
      throw cause
    }
  }

  private async convertBytes(bytes: Uint8Array, extension: OfficeExtension, signal: AbortSignal): Promise<Pick<OfficeToPdfResult, 'pdf' | 'missingFonts'>> {
    signal.throwIfAborted()
    const directory = await mkdtemp(join(tmpdir(), 'neosis-office-to-pdf-'))
    let converter: Awaited<ReturnType<typeof createSystemOfficeConverter>> | undefined
    try {
      const paths = await writeOfficeInput(directory, bytes, extension)
      converter = await createSystemOfficeConverter(this.converterOptions)
      const rendered = await converter.render(paths, signal)
      const pdf = await readPdf(paths.outputPath, this.config.maxOutputBytes, signal)
      return { pdf, missingFonts: rendered.missingFonts }
    } catch (cause) {
      if (cause instanceof OfficeToPdfError) throw cause
      if (typeof cause === 'object' && cause !== null && 'code' in cause
        && typeof cause.code === 'string' && officeErrorCodes.has(cause.code as OfficeToPdfErrorCode)) {
        throw new OfficeToPdfError(cause.code as OfficeToPdfErrorCode, 'LibreOffice conversion failed.', { cause })
      }
      if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === 'ENOENT') {
        throw new OfficeToPdfError('invalid-output', 'LibreOffice did not produce the expected PDF.', { cause })
      }
      throw new OfficeToPdfError('failed', 'LibreOffice conversion failed.', { cause })
    } finally {
      if (converter !== undefined) await converter.dispose()
      await rm(directory, { recursive: true, force: true })
    }
  }
}

export default OfficeToPdf
