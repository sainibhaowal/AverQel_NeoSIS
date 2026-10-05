/** The SDK app bundle's declared profile patch. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'
import { entryListSchema } from '@averqel/cordis-plugin-include'

describe('neosis-sdk-app bundle', () => {
  it('declares startup-gated JSON-RPC serving without overriding base HMR policy', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      neosis?: { bundle?: { patch?: string } }
    }
    expect(manifest.neosis?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(manifest.dependencies).toHaveProperty('@averqel/neosis-sdk-jsonrpc-server')
    const patches = yaml.load(
      readFileSync(resolve(root, manifest.neosis!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    ) as Array<{ id?: string; disabled?: boolean; insert?: Array<{ id?: string; inject?: string[]; name?: string }> }>
    expect(patches.find(patch => patch.id === 'hmr')).toMatchObject({ disabled: true })
    expect(patches.find(patch => patch.id === 'session-title-llm')).toMatchObject({ disabled: true })
    const rows = patches.flatMap(patch => patch.insert ?? [])
    expect(rows.find(row => row.id === 'sdk-app-startup')?.name).toBe('@averqel/neosis-sdk-app')
    expect(rows.find(row => row.id === 'sdk-jsonrpc-server')?.inject).toEqual(['sdkAppStartup', 'loader'])
  })
})
