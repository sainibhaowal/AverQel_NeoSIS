/** Profile patch edits and credential updates reach the next real adapter request. */

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@averqel/cordis'
import Loader from '@averqel/cordis-plugin-loader'
import Include from '@averqel/cordis-plugin-include'
import LlmRuntime from '@averqel/neosis-llm'
import AgentRegistry from '@averqel/neosis-agent'
import SessionStore, { SessionId } from '@averqel/neosis-session'
import { credentialRef } from '@averqel/neosis-credentials'
import LocalCredentialProvider from '@averqel/neosis-credentials-local'
import { profileComposition } from '../../../settings/settings/tests/profile-composition.ts'
import { getOrCreateAnonymousUserId } from '@averqel/neosis-anonymous-user-id'
import AverQelLlmApiExtensionRegistry from '@averqel/neosis-deepseek-llm-api-extensions'
import * as SessionLogAverQel from '@averqel/neosis-session-log-deepseek'
import * as AverQelPluginPackageInventory from '@averqel/neosis-plugin-package-inventory-deepseek'
import * as LlmAverQel from '@averqel/neosis-llm-deepseek'
import { assemble } from './assemble.ts'
import { closeMockServers, mockServer, textEvents } from './mock-server.ts'
import { sourceModuleLoader } from './helpers.ts'

const NS = 'llm-deepseek'
const KEY_REF = credentialRef('DEEPSEEK_API_KEY')

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
  await closeMockServers()
  vi.unstubAllEnvs()
})

async function loadComposition(
  options: { withDynamic: boolean; baseURL: string; reuseRoot?: string; enableSessionLog?: boolean },
): Promise<{ ctx: Context; settingsPath: string; credentialsPath: string }> {
  // A reused root is the restart case: the same harness home, its documents
  // exactly as the previous process left them.
  const fresh = options.reuseRoot === undefined
  root = options.reuseRoot ?? await mkdtemp(join(tmpdir(), 'neosis-llm-composition-'))
  vi.stubEnv('NEOSIS_HOME', root)
  const settingsPath = join(root, 'profile', 'cordis.patch.yml')
  const credentialsPath = join(root, '.credentials.yaml')
  if (options.withDynamic && fresh) {
    await writeFile(credentialsPath, 'version: 1\nrefs:\n  DEEPSEEK_API_KEY: boot-key\n', { mode: 0o600 })
  }

  const configPath = join(root, 'cordis.yml')
  await writeFile(configPath, [
    '- id: llm',
    "  name: '@averqel/neosis-llm'",
    '- id: session',
    "  name: '@averqel/neosis-session'",
    '- id: agents',
    "  name: '@averqel/neosis-agent'",
    '- id: deepseek-llm-api-extensions',
    "  name: '@averqel/neosis-deepseek-llm-api-extensions'",
    '- id: session-log-deepseek',
    "  name: '@averqel/neosis-session-log-deepseek'",
    ...options.enableSessionLog !== undefined
      ? ['  config:', `    enabled: ${String(options.enableSessionLog)}`]
      : [],
    '- id: plugin-package-inventory-deepseek',
    "  name: '@averqel/neosis-plugin-package-inventory-deepseek'",
    ...options.withDynamic
      ? [
        '- id: credentials',
        "  name: '@averqel/neosis-credentials-local'",
        '  config:',
        `    path: ${JSON.stringify(credentialsPath)}`,
        '    debounceMs: 10',
      ]
      : [],
    '- id: llm-deepseek',
    "  name: '@averqel/neosis-llm-deepseek'",
    '  config:',
    `    baseURL: ${JSON.stringify(options.baseURL)}`,
    '',
  ].join('\n'))

  const ctx = new Context()
  context = ctx
  ctx.baseUrl = pathToFileURL(root).href + '/'
  await ctx.plugin(Loader)
  ctx.loader.builtins.include = Include
  const modules = new Map<string, unknown>([
    ['@averqel/neosis-llm', LlmRuntime],
    ['@averqel/neosis-session', SessionStore],
    ['@averqel/neosis-agent', AgentRegistry],
    ['@averqel/neosis-deepseek-llm-api-extensions', AverQelLlmApiExtensionRegistry],
    ['@averqel/neosis-session-log-deepseek', SessionLogAverQel],
    ['@averqel/neosis-plugin-package-inventory-deepseek', AverQelPluginPackageInventory],
    ['@averqel/neosis-credentials-local', LocalCredentialProvider],
    ['@averqel/neosis-llm-deepseek', LlmAverQel],
  ])
  // The custom importer bypasses Node resolution; mirror the package manifests
  // a deployed cordis.yml has beside its declared dependencies.
  await Promise.all([...modules.keys()].map(async (packageName) => {
    const packageDir = join(root!, 'node_modules', ...packageName.split('/'))
    await mkdir(packageDir, { recursive: true })
    await writeFile(join(packageDir, 'package.json'), `${JSON.stringify({
      name: packageName,
      version: '0.1.0-rc.8',
      type: 'module',
    })}\n`)
  }))
  ctx.loader.internal = sourceModuleLoader(async (specifier) => {
    if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
    return modules.get(specifier)
  })
  if (options.withDynamic) {
    return { ctx, settingsPath: await profileComposition(ctx, root, configPath), credentialsPath }
  }
  await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
  await ctx.loader.await()
  return { ctx, settingsPath, credentialsPath }
}


describe('llm-deepseek real dynamic composition', () => {
  it('keeps package inventory on when the Loader composition disables session upload', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'entry-key')
    const server = await mockServer([{ kind: 'sse', events: textEvents }])
    const { ctx } = await loadComposition({ withDynamic: false, baseURL: server.url, enableSessionLog: false })
    const session = ctx.sessions.create(SessionId('extension-composition'))
    session.append('turn/start', { turn: 1 })

    await assemble(ctx, { model: 'deepseek-v4-flash', messages: [], sessionId: session.id })
    const request = server.requests[0] as { neosis_plugin_packages: { version: number; packages: unknown[] } }
    expect(request).not.toHaveProperty('neosis_session_log')
    expect(request.neosis_plugin_packages.packages).toEqual(expect.arrayContaining([
      { name: '@averqel/neosis-deepseek-llm-api-extensions', version: '0.1.0-rc.8' },
      { name: '@averqel/neosis-llm-deepseek', version: '0.1.0-rc.8' },
      { name: '@averqel/neosis-session-log-deepseek', version: '0.1.0-rc.8' },
    ]))
    expect(request.neosis_plugin_packages.version).toBe(1)
    expect(SessionLogAverQel.acceptedThrough(session)).toBe(-1)
  })

  it('sends the canonical session suffix by default through Loader composition', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'entry-key')
    const server = await mockServer([{ kind: 'sse', events: textEvents }])
    const { ctx } = await loadComposition({
      withDynamic: false,
      baseURL: server.url,
    })
    const session = ctx.sessions.create(SessionId('extension-composition-enabled'))
    session.append('turn/start', { turn: 1 })

    await assemble(ctx, { model: 'deepseek-v4-flash', messages: [], sessionId: session.id })
    const request = server.requests[0] as {
      neosis_session_log?: {
        version: number
        session: { id: string }
        afterSeq: number
        throughSeq: number
        events: Array<{ type: string; seq: number }>
      }
    }
    expect(request.neosis_session_log).toMatchObject({
      version: 1,
      session: { id: 'extension-composition-enabled' },
      afterSeq: -1,
      throughSeq: 0,
      events: [{ type: 'turn/start', seq: 0 }],
    })
    expect(SessionLogAverQel.acceptedThrough(session)).toBe(0)
  })

  it('boots from cordis.yml and routes the next request after external settings and credential edits', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', '')
    const serverA = await mockServer([{ kind: 'sse', events: textEvents }])
    const serverB = await mockServer([{ kind: 'sse', events: textEvents }])
    const { ctx, settingsPath, credentialsPath } = await loadComposition({ withDynamic: true, baseURL: serverA.url })

    expect(ctx.settings.describe().map(entry => entry.ns)).toContain(NS)
    await assemble(ctx, { model: 'deepseek-v4-flash', messages: [] })
    expect(serverA.headers[0]?.['x-api-key']).toBe('boot-key')
    expect(serverA.headers[0]?.['x-averqel-neosis-user-id']).toBe(getOrCreateAnonymousUserId())

    // External edits, exactly as a user or the web UI would leave them on disk.
    await writeFile(settingsPath, JSON.stringify([{ id: NS, config: { baseURL: serverB.url } }]))
    await vi.waitFor(() => {
      expect((ctx.settings.describe().find(row => row.ns === NS)!.value as { baseURL?: string }).baseURL).toBe(serverB.url)
    }, { timeout: 5000 })
    await writeFile(credentialsPath, 'version: 1\nrefs:\n  DEEPSEEK_API_KEY: rotated-key\n', { mode: 0o600 })
    await vi.waitFor(async () => {
      expect(await ctx.get('credentials')!.resolve(KEY_REF)).toEqual({ value: 'rotated-key', source: 'file' })
    }, { timeout: 5000 })

    await assemble(ctx, { model: 'deepseek-v4-flash', messages: [] })
    expect(serverA.requests).toHaveLength(1)
    expect(serverB.headers[0]?.['x-api-key']).toBe('rotated-key')
  })

  it('keeps a stored key writable and rotatable across a real restart', async () => {
    // No ambient DEEPSEEK_API_KEY: the shipped surfaces do not hoist
    // the credentials document into process.env, so a stored key must stay file-sourced.
    vi.stubEnv('DEEPSEEK_API_KEY', '')
    const first = await mockServer([{ kind: 'sse', events: textEvents }])
    const second = await mockServer([{ kind: 'sse', events: textEvents }])
    const boot = await loadComposition({ withDynamic: true, baseURL: first.url })
    const home = root!
    await boot.ctx.get('credentials')!.set(KEY_REF, 'stored-by-ui')
    expect(await boot.ctx.get('credentials')!.describe(KEY_REF))
      .toEqual({ configured: true, source: 'file', writable: true })
    await assemble(boot.ctx, { model: 'deepseek-v4-flash', messages: [] })
    expect(first.headers[0]?.['x-api-key']).toBe('stored-by-ui')
    await boot.ctx.fiber.dispose()
    context = undefined

    // Restart over the same harness home.
    const restarted = await loadComposition({ withDynamic: true, baseURL: second.url, reuseRoot: home })
    const credentials = restarted.ctx.get('credentials')!
    // The stored key is still the provider's own writable file entry — not a
    // read-only launch override, which is what hoisting it would have made it.
    expect(await credentials.resolve(KEY_REF)).toEqual({ value: 'stored-by-ui', source: 'file' })
    expect(await credentials.describe(KEY_REF)).toEqual({ configured: true, source: 'file', writable: true })
    // Rotation still works after the restart, and the next request uses it.
    await credentials.set(KEY_REF, 'rotated-after-restart')
    await assemble(restarted.ctx, { model: 'deepseek-v4-flash', messages: [] })
    expect(second.headers[0]?.['x-api-key']).toBe('rotated-after-restart')
  })

  it('boots the same adapter on entry config alone, resolving the reference from the environment', async () => {
    // No settings and no credentials provider: configuration carries only the
    // reference, so the environment is the whole credential plane here.
    vi.stubEnv('DEEPSEEK_API_KEY', 'entry-key')
    const server = await mockServer([{ kind: 'sse', events: textEvents }])
    const { ctx } = await loadComposition({ withDynamic: false, baseURL: server.url })

    expect(ctx.get('settings')).toBeUndefined()
    expect(ctx.get('credentials')).toBeUndefined()
    await assemble(ctx, { model: 'deepseek-v4-flash', messages: [] })
    expect(server.headers[0]?.['x-api-key']).toBe('entry-key')
  })
})
