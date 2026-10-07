/** Replace only the external MCP executable; retain the shipped provider and browser runtime. */
import Module from 'node:module'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const name = 'browser-provider-fixture'
export const inject = ['browserUse', 'agents', 'tools']

export async function apply(ctx) {
  let replaced = false
  const originalResolveFilename = Module._resolveFilename
  const target = '@playwright/mcp/package.json'
  ctx.effect(() => {
    const resolveFilename = function (specifier, ...args) {
      if (specifier === target) {
        replaced = true
        return resolve('package.json')
      }
      return originalResolveFilename.call(this, specifier, ...args)
    }
    Module._resolveFilename = resolveFilename
    return () => {
      if (Module._resolveFilename === resolveFilename) Module._resolveFilename = originalResolveFilename
    }
  }, 'browser-fixture.executable')
  const provider = await import('@averqel/neosis-experimental-browser-use-playwright-mcp')
  await ctx.plugin(provider, { mode: 'launch' })
  if (!replaced) throw new Error('Playwright snapshot did not replace the upstream executable')
  ctx.on('agent/pre-step', async (_payload, next) => {
    if (await readFile(resolve('.neosis/browser-fixture.started'), 'utf8') !== 'playwright-mcp\n') {
      throw new Error('Playwright snapshot did not start its fixture process')
    }
    return next()
  })
}
