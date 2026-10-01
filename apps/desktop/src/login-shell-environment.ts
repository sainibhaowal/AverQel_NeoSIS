/** Login-shell environment for POSIX Desktop launches that inherit only the session manager's environment. */

import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { homedir, userInfo } from 'node:os'
import type { Readable } from 'node:stream'
import { resolveDurationMs } from './duration-env.ts'

const DELIMITER = '_NEOSIS_SHELL_ENV_DELIMITER_'
const MARKER = Buffer.from(`\0${DELIMITER}\0`)
const DUMP = `printf '\\0%s\\0' '${DELIMITER}'; command env -0 || exit; printf '\\0%s\\0' '${DELIMITER}'; exit`
const FALLBACK_SHELLS = ['/bin/zsh', '/bin/bash', '/bin/sh'] as const
/** Keep oh-my-zsh update prompts and tmux autostart plugins from blocking a non-terminal read. */
const PROBE_ENVIRONMENT = { DISABLE_AUTO_UPDATE: 'true', ZSH_TMUX_AUTOSTARTED: 'true', ZSH_TMUX_AUTOSTART: 'false' } as const
/** Variables that describe the probe shell process rather than the user's configuration. */
const SHELL_SESSION_KEYS = new Set(['PWD', 'OLDPWD', 'SHLVL', '_', ...Object.keys(PROBE_ENVIRONMENT)])
/** Desktop resolves paths such as `NEOSIS_HOME` before the read, so the Host keeps the same inherited values. */
const LAUNCHER_OWNED_PREFIXES = ['NEOSIS_', 'ELECTRON_'] as const

/** Validated login-shell read settings. */
export interface DesktopLoginShellConfig {
  /** Deadline for each candidate shell, in milliseconds. */
  readonly timeoutMs: number
}

/** One candidate shell that did not produce an environment. */
export interface DesktopLoginShellFailure {
  readonly shell: string
  /** `exit <code>`, terminating signal name, spawn error, `timeout`, `aborted`, or `unparsed`. */
  readonly reason: string
}

/** Environment for the Host and the candidate failures that preceded it. */
export interface DesktopLoginShellResult {
  /** `base` merged with the first successful shell's variables, or `base` itself when none succeeded. */
  readonly environment: NodeJS.ProcessEnv
  readonly failures: readonly DesktopLoginShellFailure[]
}

/** Inputs of {@link readDesktopLoginShellEnvironment} that callers other than tests leave unset. */
export interface DesktopLoginShellReadOptions {
  /** Operating system running Desktop; defaults to `process.platform`. */
  readonly platform?: NodeJS.Platform
  /** Candidates in trial order; defaults to {@link loginShellCandidates}. */
  readonly shells?: readonly string[]
  /** Aborting kills the running candidate's process group and skips remaining candidates. */
  readonly signal?: AbortSignal
}

/**
 * Resolve login-shell read settings.
 * @param env - Desktop process environment.
 * @returns Validated per-candidate deadline; `NEOSIS_DESKTOP_LOGIN_SHELL_TIMEOUT_MS` defaults to 10000.
 */
export function resolveDesktopLoginShellConfig(env: NodeJS.ProcessEnv): DesktopLoginShellConfig {
  return { timeoutMs: resolveDurationMs(env, 'NEOSIS_DESKTOP_LOGIN_SHELL_TIMEOUT_MS', 10_000) }
}

/**
 * Candidate shells in order: the account record's login shell, then fixed system shells.
 * @returns Distinct absolute candidates; only fixed shells when the account record is unreadable or empty.
 */
export function loginShellCandidates(): readonly string[] {
  let account: string | null = null
  try { account = userInfo().shell } catch (_error) { /* No account record for this uid: fixed candidates only. */ }
  return [...new Set([...account === null || account === '' ? [] : [account], ...FALLBACK_SHELLS])]
}

/**
 * Extract variables printed between the two delimiters of the shell dump.
 * @param stdout - Probe output, including anything rc files printed around the dump.
 * @returns Variables, or undefined when both delimiters are not present.
 */
export function parseLoginShellOutput(stdout: string): Record<string, string> | undefined {
  const parts = stdout.split('\0')
  const first = parts.indexOf(DELIMITER)
  const last = parts.lastIndexOf(DELIMITER)
  if (first === -1 || first === last) return undefined
  const variables: Record<string, string> = {}
  for (const entry of parts.slice(first + 1, last)) {
    const separator = entry.indexOf('=')
    if (separator > 0) variables[entry.slice(0, separator)] = entry.slice(separator + 1)
  }
  return variables
}

/**
 * Overlay login-shell variables on the inherited environment; shell values win except for
 * probe-session variables and launcher-owned `NEOSIS_*` / `ELECTRON_*` names.
 * @param base - Environment Desktop inherited.
 * @param shell - Variables printed by the login shell.
 * @returns A new environment; neither argument is modified.
 */
export function mergeLoginShellEnvironment(base: NodeJS.ProcessEnv, shell: Readonly<Record<string, string>>): NodeJS.ProcessEnv {
  const merged = { ...base }
  for (const [key, value] of Object.entries(shell)) {
    if (SHELL_SESSION_KEYS.has(key) || LAUNCHER_OWNED_PREFIXES.some(prefix => key.startsWith(prefix))) continue
    merged[key] = value
  }
  return merged
}

function readShell(
  shell: string, base: NodeJS.ProcessEnv, cwd: string, timeoutMs: number, signal: AbortSignal | undefined,
): Promise<Record<string, string> | string> {
  return new Promise((resolve) => {
    if (signal?.aborted === true) { resolve('aborted'); return }
    let child: ChildProcessByStdio<null, Readable, null>
    try {
      child = spawn(shell, ['-ilc', DUMP], {
        cwd, env: { ...base, ...PROBE_ENVIRONMENT }, stdio: ['ignore', 'pipe', 'ignore'], detached: true,
      })
    } catch (error) {
      resolve(String(error))
      return
    }
    const chunks: Buffer[] = []
    let tail = Buffer.alloc(0)
    let markers = 0
    const output = (): Record<string, string> | string => parseLoginShellOutput(Buffer.concat(chunks).toString('utf8')) ?? 'unparsed'
    const onData = (chunk: Buffer): void => {
      chunks.push(chunk)
      const window = Buffer.concat([tail, chunk])
      for (let index = window.indexOf(MARKER); index !== -1; index = window.indexOf(MARKER, index + MARKER.length)) markers++
      tail = window.subarray(Math.max(0, window.length - MARKER.length + 1))
      if (markers >= 2) finish(output())
    }
    const killGroup = (): void => {
      const pid = child.pid
      if (pid === undefined) return
      try { process.kill(-pid, 'SIGKILL') } catch (_error) { /* The group already exited. */ }
    }
    const stop = (reason: 'timeout' | 'aborted'): void => { finish(reason); killGroup() }
    const onAbort = (): void => { stop('aborted') }
    const timer = setTimeout(() => { stop('timeout') }, timeoutMs)
    function finish(result: Record<string, string> | string): void {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      child.stdout.off('data', onData)
      child.stdout.resume()
      resolve(result)
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    child.stdout.on('data', onData)
    child.on('error', (error) => { finish(error.message) })
    child.on('close', (code, closeSignal) => {
      if (code !== 0) { finish(closeSignal ?? `exit ${String(code)}`); return }
      finish(output())
    })
  })
}

/**
 * Read the user's login-shell environment once. Windows returns `base` unchanged.
 * Candidate failures are recorded and never reject startup; `base` is returned when all candidates fail.
 * @param base - Environment Desktop inherited.
 * @param config - Validated read settings.
 * @param options - Platform, candidates, and cancellation.
 * @returns Host environment and candidate failures.
 */
export async function readDesktopLoginShellEnvironment(
  base: NodeJS.ProcessEnv, config: DesktopLoginShellConfig, options: DesktopLoginShellReadOptions = {},
): Promise<DesktopLoginShellResult> {
  const { platform = process.platform, shells = loginShellCandidates(), signal } = options
  if (platform === 'win32') return { environment: base, failures: [] }
  const failures: DesktopLoginShellFailure[] = []
  for (const shell of shells) {
    const result = await readShell(shell, base, homedir(), config.timeoutMs, signal)
    if (typeof result !== 'string') return { environment: mergeLoginShellEnvironment(base, result), failures }
    failures.push({ shell, reason: result })
    if (result === 'aborted') break
  }
  return { environment: base, failures }
}
