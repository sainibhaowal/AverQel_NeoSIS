/**
 * Registry tests for `@averqel/neosis-shell-env`: built-in facts, contributor
 * ownership and validation, collection ordering, effect-scoped disposal, and
 * the explicit disposer contract.
 */

import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@averqel/cordis'
import { ToolCallId } from '@averqel/neosis-llm'
import type { Agent } from '@averqel/neosis-agent'
import { SESSION_FORMAT_VERSION } from '@averqel/neosis-session'
import type { ToolExecution } from '@averqel/neosis-tools'
import { ShellEnvRegistry } from '@averqel/neosis-shell-env'
import * as BashEnvPlugin from '@averqel/neosis-shell-env'

const testToolSignal = new AbortController().signal

afterEach(() => vi.unstubAllEnvs())

function execution(sessionId?: string): ToolExecution {
  return {
    signal: testToolSignal,
    token: Symbol('bash-env-test') as ToolExecution['token'],
    callId: ToolCallId('bash-env-call'),
    rootCallId: ToolCallId('bash-env-call'),
    name: 'bash',
    arguments: { command: 'true' },
    ...(sessionId === undefined
      ? {}
      : {
        agent: {
          session: {
            header: { version: SESSION_FORMAT_VERSION, id: sessionId, createdAt: 0, isSeeded: false },
          },
        } as unknown as Agent,
      }),
  }
}

describe('ShellEnvRegistry', () => {
  it('collects unconditional shell facts and the current agent session id', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { neosisHome: './test-neosis-home' })

    expect(registry.collect(execution())).toEqual({
      NEOSIS_HOME: resolve('./test-neosis-home'),
      NEOSIS_SHELL: '1',
    })
    expect(registry.collect(execution('session-a'))).toEqual({
      NEOSIS_HOME: resolve('./test-neosis-home'),
      NEOSIS_SESSION_ID: 'session-a',
      NEOSIS_SHELL: '1',
    })
  })

  it('collects the launcher-provided profile name and directory when a profile context exists', () => {
    const ctx = new Context()
    ctx.provide('profileContext', {
      name: 'web', dir: '/profiles/web', patchPath: '/profiles/web/cordis.patch.yml', installAnchor: '/neosis/package.json',
      cwd: '/work', home: '/home', startedBundles: [], overlays: [], telemetryDisabledEnv: undefined,
    })
    const registry = new ShellEnvRegistry(ctx, { neosisHome: './test-neosis-home' })
    expect(registry.collect(execution())).toMatchObject({ NEOSIS_PROFILE: 'web', NEOSIS_PROFILE_DIR: '/profiles/web' })
    expect(() => registry.register({
      name: 'profile-claimer',
      variables: { NEOSIS_PROFILE: { description: 'Reserved key.' } },
      resolve: () => ({}),
    })).toThrow(/reserved key "NEOSIS_PROFILE"/)
  })

  it('resolves NEOSIS_HOME from the ambient override or the user-home default', () => {
    vi.stubEnv('NEOSIS_HOME', './ambient-neosis-home')
    const fromEnvironment = new ShellEnvRegistry(new Context())
    expect(fromEnvironment.collect(execution()).NEOSIS_HOME).toBe(resolve('./ambient-neosis-home'))

    vi.stubEnv('NEOSIS_HOME', undefined)
    const fromDefault = new ShellEnvRegistry(new Context())
    expect(fromDefault.collect(execution()).NEOSIS_HOME).toBe(join(homedir(), '.neosis'))
  })

  it('collects declared contributor variables and omits unavailable values', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { neosisHome: './test-neosis-home' })
    registry.register({
      name: 'optional-session-fact',
      variables: {
        NEOSIS_SESSION_OPTIONAL: { description: 'Optional session-scoped test fact.' },
      },
      resolve: exec => exec.agent === undefined ? {} : { NEOSIS_SESSION_OPTIONAL: exec.agent.session.header.id },
    })
    registry.register({
      name: 'always-available-fact',
      variables: {
        NEOSIS_ALWAYS_AVAILABLE: { description: 'Always-available test fact.' },
      },
      resolve: () => ({ NEOSIS_ALWAYS_AVAILABLE: 'yes' }),
    })

    expect(registry.collect(execution())).not.toHaveProperty('NEOSIS_SESSION_OPTIONAL')
    expect(registry.collect(execution()).NEOSIS_ALWAYS_AVAILABLE).toBe('yes')
    expect(registry.collect(execution('session-b')).NEOSIS_SESSION_OPTIONAL).toBe('session-b')
    expect(registry.list()).toEqual([
      {
        contributor: 'always-available-fact',
        description: 'Always-available test fact.',
        key: 'NEOSIS_ALWAYS_AVAILABLE',
      },
      {
        contributor: 'optional-session-fact',
        description: 'Optional session-scoped test fact.',
        key: 'NEOSIS_SESSION_OPTIONAL',
      },
    ])
  })

  it('rejects duplicate variable ownership at registration time', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { neosisHome: './test-neosis-home' })
    registry.register({
      name: 'first',
      variables: { NEOSIS_SHARED: { description: 'First owner.' } },
      resolve: () => ({ NEOSIS_SHARED: 'first' }),
    })

    expect(() => registry.register({
      name: 'second',
      variables: { NEOSIS_SHARED: { description: 'Second owner.' } },
      resolve: () => ({ NEOSIS_SHARED: 'second' }),
    })).toThrow(/NEOSIS_SHARED.*first.*second|NEOSIS_SHARED.*second.*first/)
  })

  it('rejects duplicate contributor names and malformed declarations', () => {
    const registry = new ShellEnvRegistry(new Context(), { neosisHome: './test-neosis-home' })
    registry.register({
      name: 'declared',
      variables: { NEOSIS_DECLARED: { description: 'Declared fact.' } },
      resolve: () => ({}),
    })

    expect(() => registry.register({
      name: 'declared',
      variables: { NEOSIS_ANOTHER: { description: 'Another fact.' } },
      resolve: () => ({}),
    })).toThrow(/already registered/)
    expect(() => registry.register({
      name: ' ',
      variables: { NEOSIS_BLANK_NAME: { description: 'Blank owner.' } },
      resolve: () => ({}),
    })).toThrow(/name must be non-empty/)
    expect(() => registry.register({
      name: 'invalid-key',
      variables: { neosis_invalid: { description: 'Invalid key.' } } as unknown as Record<'NEOSIS_INVALID', { description: string }>,
      resolve: () => ({}),
    })).toThrow(/invalid key/)
    expect(() => registry.register({
      name: 'reserved-key',
      variables: { NEOSIS_HOME: { description: 'Reserved key.' } },
      resolve: () => ({}),
    })).toThrow(/reserved key/)
    expect(() => registry.register({
      name: 'blank-description',
      variables: { NEOSIS_BLANK_DESCRIPTION: { description: ' ' } },
      resolve: () => ({}),
    })).toThrow(/must describe/)
  })

  it('rejects undeclared variables returned by a contributor', () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { neosisHome: './test-neosis-home' })
    registry.register({
      name: 'drifted-provider',
      variables: { NEOSIS_DECLARED: { description: 'Declared fact.' } },
      resolve: () => ({ NEOSIS_UNDECLARED: 'bad' }),
    })

    expect(() => registry.collect(execution())).toThrow(/drifted-provider.*NEOSIS_UNDECLARED/)
  })

  it('rejects non-string values returned by a contributor', () => {
    const registry = new ShellEnvRegistry(new Context(), { neosisHome: './test-neosis-home' })
    registry.register({
      name: 'wrong-value-type',
      variables: { NEOSIS_STRING: { description: 'String fact.' } },
      resolve: () => ({ NEOSIS_STRING: 42 }) as unknown as Record<'NEOSIS_STRING', string>,
    })

    expect(() => registry.collect(execution())).toThrow(/wrong-value-type.*non-string.*NEOSIS_STRING/)
  })

  it('removes an effect-scoped contributor when its plugin is disposed', async () => {
    const ctx = new Context()
    const registry = new ShellEnvRegistry(ctx, { neosisHome: './test-neosis-home' })
    const fiber = await ctx.plugin({
      inject: ['shellEnv'],
      apply(inner: Context) {
        inner.shellEnv.register({
          name: 'temporary',
          variables: { NEOSIS_TEMPORARY: { description: 'Temporary fact.' } },
          resolve: () => ({ NEOSIS_TEMPORARY: 'present' }),
        })
      },
    })

    expect(registry.collect(execution()).NEOSIS_TEMPORARY).toBe('present')
    await fiber.dispose()
    expect(registry.collect(execution())).not.toHaveProperty('NEOSIS_TEMPORARY')
  })

  it('returns an explicit contributor disposer', () => {
    const registry = new ShellEnvRegistry(new Context(), { neosisHome: './test-neosis-home' })
    const dispose = registry.register({
      name: 'explicit-disposal',
      variables: { NEOSIS_EXPLICIT_DISPOSAL: { description: 'Explicitly disposed fact.' } },
      resolve: () => ({ NEOSIS_EXPLICIT_DISPOSAL: 'present' }),
    })

    expect(registry.collect(execution()).NEOSIS_EXPLICIT_DISPOSAL).toBe('present')
    dispose()
    expect(registry.collect(execution())).not.toHaveProperty('NEOSIS_EXPLICIT_DISPOSAL')
  })

  it('the plugin registers the service with no contributors on load', async () => {
    const ctx = new Context()
    await ctx.plugin(BashEnvPlugin)
    expect(ctx.shellEnv).toBeInstanceOf(ShellEnvRegistry)
    expect(ctx.shellEnv.list()).toEqual([])
  })
})
