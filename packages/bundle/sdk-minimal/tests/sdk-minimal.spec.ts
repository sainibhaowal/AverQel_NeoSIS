/** The standalone SDK-minimal bundle's complete declared Cordis tree. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@averqel/cordis-plugin-include'

function packageName(specifier: string): string {
  return specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]!
}

describe('neosis-sdk-minimal bundle', () => {
  it('declares one standalone allowlisted tree with every row dependency', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      neosis?: { bundle?: { patch?: string } }
    }
    expect(manifest.neosis?.bundle?.patch).toBe('./cordis.patch.yml')
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.neosis!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{ insert?: Array<{ id?: string; inject?: string[]; name?: string; config?: Record<string, unknown>; disabled?: unknown }> }>
    expect(patches).toHaveLength(1)
    const rows = patches[0]?.insert ?? []
    expect(rows.map(row => [row.id, row.name])).toEqual([
      ['sdk-app-startup', '@averqel/neosis-sdk-app'],
      ['sdk-jsonrpc-server', '@averqel/neosis-sdk-jsonrpc-server'],
      ['deepseek-llm-api-extensions', '@averqel/neosis-deepseek-llm-api-extensions'],
      ['session-log-deepseek', '@averqel/neosis-session-log-deepseek'],
      ['plugin-package-inventory-deepseek', '@averqel/neosis-plugin-package-inventory-deepseek'],
      ['llm-deepseek', '@averqel/neosis-llm-deepseek'],
      ['sandbox', '@averqel/neosis-sandbox-local'],
      ['session-projection', '@averqel/neosis-session-projection'],
      ['sandbox-policy', '@averqel/neosis-sandbox-policy'],
      ['subprocess', '@averqel/neosis-subprocess-local'],
      ['pty', '@averqel/neosis-terminal'],
      ['terminal-bash', '@averqel/neosis-terminal-bash'],
      ['terminal-pwsh', '@averqel/neosis-terminal-bash'],
      ['timer', '@averqel/cordis-plugin-timer'],
      ['llm', '@averqel/neosis-llm'],
      ['session', '@averqel/neosis-session'],
      ['session-title', '@averqel/neosis-session-title'],
      ['system-prompt', '@averqel/neosis-system-prompt'],
      ['tools', '@averqel/neosis-tools'],
      ['mcp-resources', '@averqel/neosis-mcp-resources'],
      ['agent', '@averqel/neosis-agent'],
      ['llm-retry', '@averqel/neosis-llm-retry'],
      ['jobs', '@averqel/neosis-jobs-local'],
      ['invariants', '@averqel/neosis-invariants'],
      ['session-invariant', '@averqel/neosis-session/invariant'],
      ['agent-invariant', '@averqel/neosis-agent/invariant'],
      ['scope-invariant', '@averqel/neosis-scope/invariant'],
      ['agent-loop-invariant', '@averqel/neosis-agent-loop/invariant'],
      ['agent-loop', '@averqel/neosis-agent-loop'],
      ['persistent-bash', '@averqel/neosis-tool-bash-persistent'],
      ['persistent-pwsh', '@averqel/neosis-tool-pwsh-persistent'],
      ['sessions', '@averqel/neosis-session-persistence-jsonl'],
    ])
    expect(rows.find(row => row.id === 'sdk-app-startup')?.config).toEqual({ profile: 'sdk-minimal' })
    expect(rows.find(row => row.id === 'sdk-jsonrpc-server')).toMatchObject({
      inject: ['sdkAppStartup', 'loader'],
      config: { maxTokensAsSuccess: false },
    })
    expect(rows.find(row => row.id === 'llm-deepseek')?.config).toEqual({
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      defaultContextWindow: { __jsExpr: 'Number(process.env.NEOSIS_CONTEXT_WINDOW ?? 1000000)' },
      streamIdleTimeoutMs: 172800000,
    })
    expect(rows.find(row => row.id === 'system-prompt')?.config).toEqual({
      includeHarnessIdentity: false,
      includeRuntimeContext: false,
      personaPrefix: { __jsExpr: "process.env.NEOSIS_SYSTEM_PROMPT ?? 'You are a helpful software engineer assistant.'" },
    })
    expect(rows.find(row => row.id === 'agent-loop')?.config).toEqual({ agents: [] })
    expect(rows.find(row => row.id === 'terminal-bash')).toMatchObject({
      disabled: { __jsExpr: "process.platform === 'win32'" },
    })
    expect(rows.find(row => row.id === 'terminal-pwsh')).toMatchObject({
      disabled: { __jsExpr: "process.platform !== 'win32'" },
      config: { shellDialect: 'pwsh', timeoutMs: 300000 },
    })
    expect(Object.keys(manifest.dependencies ?? {}).sort()).toEqual(
      [...new Set(rows.map(row => row.name).filter((name): name is string => name !== undefined).map(packageName))].sort(),
    )
  })
})
