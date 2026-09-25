import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@averqel/cordis'
import Loader from '@averqel/cordis-plugin-loader'
import Include from '@averqel/cordis-plugin-include'
import SessionProjectionRegistry from '@averqel/neosis-session-projection'
import TokenMeter from '@averqel/neosis-token-meter'
import ToolResultPruner from '@averqel/neosis-compaction-tool-result-pruner'

let root: string | undefined
let context: Context | undefined

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
})

describe('compaction-tool-result-pruner real Loader composition', () => {
  it('loads and resolves the flat YAML plugin shape', async () => {
    root = await mkdtemp(join(tmpdir(), 'neosis-compact-tool-result-prune-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@averqel/neosis-session-projection'",
      "- name: '@averqel/neosis-token-meter'",
      "- name: '@averqel/neosis-compaction-tool-result-pruner'",
      '  config:',
      '    thresholdChars: 100',
      '    headChars: 20',
      '    tailChars: 10',
      '',
    ].join('\n'))

    context = new Context()
    context.baseUrl = pathToFileURL(root).href + '/'
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    context.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (specifier === '@averqel/neosis-session-projection') return SessionProjectionRegistry
        if (specifier === '@averqel/neosis-token-meter') return TokenMeter
        if (specifier === '@averqel/neosis-compaction-tool-result-pruner') return ToolResultPruner
        throw new Error(`unexpected Loader import: ${specifier}`)
      },
    } as unknown as NonNullable<typeof context.loader.internal>
    await context.loader.create({
      name: 'cordis:include',
      config: { path: pathToFileURL(configPath).href },
    })
    await context.loader.await()

    expect(context.get('toolResultPruner')).toBeInstanceOf(ToolResultPruner)
    expect(context.toolResultPruner.config).toEqual({
      thresholdChars: 100,
      headChars: 20,
      tailChars: 10,
    })
  })

  it('rejects stale config after plugin schema normalization', async () => {
    context = new Context()
    // Satisfy the declared injections first: config normalization runs in the
    // service constructor, which a pending fiber never reaches.
    await context.plugin(SessionProjectionRegistry)
    await context.plugin(TokenMeter)
    await expect(context.plugin(ToolResultPruner, {
      maxChars: 100,
    } as never)).rejects.toThrow(/unknown key "maxChars"/)
  })
})
