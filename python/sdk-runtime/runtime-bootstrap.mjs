#!/usr/bin/env node
/** Private entry owned by the Python single-file runtime packaging. */
import { dirname, join } from 'node:path'
import { isSea } from 'node:sea'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const selectorName = 'NEOSIS_SUBPROCESS_RUNNER'
const selection = process.env[selectorName]
const aclRunner = process.platform === 'win32'
  ? require.resolve('@averqel/neosis-sandbox-windows-acl/runner')
  : undefined

if (aclRunner !== undefined && process.argv[2] === aclRunner) {
  process.argv.splice(1, 1)
  await import('@averqel/neosis-sandbox-windows-acl/runner')
} else if (process.env.NEOSIS_PTC_RUNTIME_NODE === '1') {
  Reflect.deleteProperty(process.env, 'NEOSIS_PTC_RUNTIME_NODE')
  await import('@averqel/neosis-ptc-runtime-node/process')
} else if (selection === undefined) {
  if (isSea()) {
    // Carrier default stays separate so process/home environment and profile patches can override it.
    const platform = process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'win' : process.platform
    process.env.NEOSIS_BUNDLED_PRIMARY_RUNTIME = join(dirname(process.execPath), `${platform}-${process.arch}`, 'primary-runtime')
  }
  const { runCli } = await import('@averqel/neosis/lib/bin.js')
  await runCli()
} else {
  Reflect.deleteProperty(process.env, selectorName)
  const { runSelectedSubprocessRunner } = await import('@averqel/neosis-subprocess-local/runner')
  await runSelectedSubprocessRunner(selection)
}
