/** Convert one Office file through a system-installed LibreOffice executable. */
import { spawn } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { delimiter, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { OfficeExtension } from './types.ts'
import { OfficeToPdfError } from './errors.ts'

/** Options passed to the system LibreOffice adapter. */
export interface SystemOfficeConverterOptions {
  /** Executable name or absolute path resolved by the host operating system. */
  readonly executable: string
  /** Maximum time allowed for one LibreOffice child process. */
  readonly timeoutMs: number
  /** Optional directories containing fonts available to LibreOffice. */
  readonly fontDirectories?: string[]
}

/** Paths used by one isolated LibreOffice conversion. */
export interface OfficeConversionPaths {
  readonly inputPath: string
  readonly outputPath: string
}

/** Metadata reported by one completed system conversion. */
export interface SystemOfficeRenderResult {
  readonly backend: 'system'
  readonly missingFonts: string[]
}

/** Conversion engine interface used by the provider and its deterministic tests. */
export interface SystemOfficeConverter {
  readonly backend: 'system'
  render(paths: OfficeConversionPaths, signal?: AbortSignal): Promise<SystemOfficeRenderResult>
  dispose(): Promise<void>
}

interface ProcessResult {
  readonly code: number | null
  readonly signal: NodeJS.Signals | null
  readonly spawnError?: Error
  readonly timedOut: boolean
}

const scrubbedEnvironment = (): NodeJS.ProcessEnv => Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/(?:KEY|SECRET|TOKEN|PASSWORD)/iu.test(name)),
)

const runProcess = (
  executable: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number }, signal: AbortSignal,
): Promise<ProcessResult> => {
  signal.throwIfAborted()
  return new Promise((resolve) => {
    const child = spawn(executable, args, { cwd: options.cwd, env: options.env, stdio: ['ignore', 'ignore', 'ignore'] })
    let settled = false
    let timedOut = false
    let spawnError: Error | undefined
    const timer = setTimeout(() => { timedOut = true; terminate() }, options.timeoutMs)
    const finish = (code: number | null, childSignal: NodeJS.Signals | null): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      resolve({ code, signal: childSignal, timedOut, ...(spawnError === undefined ? {} : { spawnError }) })
    }
    const terminate = (): void => {
      if (!child.killed) child.kill()
    }
    const abort = (): void => { terminate() }
    child.once('error', (cause) => {
      spawnError = cause
      finish(null, null)
    })
    child.once('close', (code, childSignal) => { finish(code, childSignal) })
    signal.addEventListener('abort', abort, { once: true })
  })
}

/** Adapter that runs LibreOffice without downloading or bundling another engine. */
export class SystemOfficeConverterImpl implements SystemOfficeConverter {
  readonly backend = 'system' as const

  /**
   * @param options - executable and child-process settings.
   */
  constructor(private readonly options: SystemOfficeConverterOptions) {}

  /**
   * @param paths - provider-owned input and expected PDF paths.
   * @param signal - conversion cancellation signal.
   * @returns when LibreOffice exits successfully and writes the expected output.
   * @throws {OfficeToPdfError} when the executable cannot start, times out, or exits unsuccessfully.
   */
  async render(paths: OfficeConversionPaths, signal?: AbortSignal): Promise<SystemOfficeRenderResult> {
    const upstream = signal ?? new AbortController().signal
    const root = dirname(paths.inputPath)
    const profile = join(root, 'profile')
    await mkdir(profile)
    try {
      const environment = scrubbedEnvironment()
      if (this.options.fontDirectories !== undefined && this.options.fontDirectories.length > 0) {
        environment.SAL_FONTPATH = this.options.fontDirectories.join(delimiter)
      }
      const result = await runProcess(this.options.executable, [
        '--headless', '--nologo', '--nodefault', '--nofirststartwizard', '--nolockcheck',
        `-env:UserInstallation=${pathToFileURL(profile).href}`,
        '--convert-to', 'pdf', '--outdir', dirname(paths.outputPath), paths.inputPath,
      ], { cwd: root, env: environment, timeoutMs: this.options.timeoutMs }, upstream)
      upstream.throwIfAborted()
      if (result.spawnError !== undefined) {
        throw new OfficeToPdfError('unavailable', `Unable to start LibreOffice executable ${JSON.stringify(this.options.executable)}.`, { cause: result.spawnError })
      }
      if (result.timedOut) throw new OfficeToPdfError('timeout', 'LibreOffice exceeded the conversion deadline.')
      if (result.code !== 0) {
        throw new OfficeToPdfError('failed', `LibreOffice exited with code ${String(result.code)}${result.signal === null ? '' : ` after ${result.signal}`}.`)
      }
      return { backend: 'system', missingFonts: [] }
    } finally {
      await rm(profile, { recursive: true, force: true })
    }
  }

  /**
   * Dispose the stateless adapter.
   * @returns a settled promise for the provider lifecycle.
   */
  dispose(): Promise<void> { return Promise.resolve() }
}

/**
 * Create an adapter for one provider conversion.
 * @param options - Executable, timeout, and optional font-directory settings.
 * @returns A stateless converter that owns each conversion's private profile.
 */
export function createSystemOfficeConverter(options: SystemOfficeConverterOptions): Promise<SystemOfficeConverter> {
  return Promise.resolve(new SystemOfficeConverterImpl(options))
}

/**
 * Write an input document with owner-only permissions before conversion.
 * @param path - Private conversion directory.
 * @param bytes - Complete source document bytes.
 * @param extension - Source document extension used for LibreOffice filter selection.
 * @returns Input and expected PDF paths in the conversion directory.
 */
export async function writeOfficeInput(path: string, bytes: Uint8Array, extension: OfficeExtension): Promise<OfficeConversionPaths> {
  const inputPath = join(path, `document.${extension}`)
  const outputPath = join(path, 'document.pdf')
  await writeFile(inputPath, bytes, { mode: 0o600, flag: 'wx' })
  return { inputPath, outputPath }
}
