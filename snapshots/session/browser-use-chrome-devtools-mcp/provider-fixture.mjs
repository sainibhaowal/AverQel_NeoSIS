/** Replace only the external MCP executable; retain the shipped provider and browser runtime. */
import Module from 'node:module'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const name = 'browser-provider-fixture'
export const inject = ['browserUse', 'agents', 'tools']

export async function apply(ctx) {
  let replaced = false
  const originalResolveFilename = Module._resolveFilename
  const target = 'chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js'
  ctx.effect(() => {
    const resolveFilename = function (specifier, ...args) {
      if (specifier === target) {
        replaced = true
        return resolve('cli.js')
      }
      return originalResolveFilename.call(this, specifier, ...args)
    }
    Module._resolveFilename = resolveFilename
    return () => {
      if (Module._resolveFilename === resolveFilename) Module._resolveFilename = originalResolveFilename
    }
  }, 'browser-fixture.executable')
  const provider = await import('@averqel/neosis-experimental-browser-use-chrome-devtools-mcp')
  await ctx.plugin(provider, { mode: 'launch' })
  if (!replaced) throw new Error('Chrome DevTools snapshot did not replace the upstream executable')
  ctx.on('agent/pre-step', async (_payload, next) => {
    if (await readFile(resolve('.neosis/browser-fixture.started'), 'utf8') !== 'chrome-devtools-mcp\n') {
      throw new Error('Chrome DevTools snapshot did not start its fixture process')
    }
    return next()
  })
}
