/** Assembled keyless snapshot for the default `neosis web` browser handoff. */

import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'
import { afterEach, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const builtBin = join(repoRoot, 'apps/cli/lib/bin.js')
const frontendIndex = join(repoRoot, 'apps/web/dist/index.html')
const openerHook = new URL('./fixtures/web-browser-open/register.mjs', import.meta.url).href
const openingMessage = 'neosis web: opening the default browser; pass --no-open to disable'
const tempRoots: string[] = []
const builtArtifactsExist = existsSync(builtBin) && existsSync(frontendIndex)

if (process.env.NEOSIS_EXAMPLE_MODE === 'lib' && !builtArtifactsExist) {
  throw new Error('neosis web browser-open snapshot requires built CLI and Web artifacts in lib mode')
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

interface BrowserOpenRecord {
  url: string
  status: number
  bootManifest: boolean
  apiKeyPresent: boolean
  neosisHomePresent: boolean
}

function normalizeLocalUrl(url: string): string {
  return url
    .replace(/:\d+/u, ':{{port}}')
    .replace(/token=[^&]+/u, 'token={{token}}')
}

describe.skipIf(!builtArtifactsExist)('neosis web browser-open assembled snapshot', () => {
  it('hands the reachable page to the default browser after the shipped tree settles', async () => {
    const root = mkdtempSync(join(tmpdir(), 'neosis-web-browser-open-snapshot-'))
    tempRoots.push(root)
    const result = await execa(process.execPath, [
      '--import', openerHook,
      builtBin,
      'web',
      '--port', '0',
    ], {
      cwd: root,
      env: {
        ...process.env,
        DEEPSEEK_API_KEY: 'keyless-browser-open-no-call',
        NEOSIS_AGENTS_HOME: join(root, '.agents'),
        NEOSIS_HOME: join(root, '.neosis'),
        NEOSIS_TELEMETRY_DISABLED: '1',
        NODE_NO_WARNINGS: '1',
        SSH_CONNECTION: '',
        SSH_TTY: '',
      },
      input: '',
      timeout: 30_000,
      killSignal: 'SIGKILL',
      reject: false,
    })
    const readyUrl = /neosis web: (http:\/\/[^\s]+)/u.exec(result.stdout)?.[1]
    const openLine = result.stdout.split('\n').find(line => line.startsWith('neosis browser-open: '))
    const opening = result.stdout.includes(openingMessage)
    if (readyUrl === undefined || openLine === undefined || !opening) {
      throw new Error(`neosis web browser-open evidence missing\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
    }
    const opened = JSON.parse(openLine.slice('neosis browser-open: '.length)) as BrowserOpenRecord

    expect({
      exitCode: result.exitCode,
      opening,
      readyUrl: normalizeLocalUrl(readyUrl),
      openedUrl: normalizeLocalUrl(opened.url),
      status: opened.status,
      bootManifest: opened.bootManifest,
      apiKeyPresent: opened.apiKeyPresent,
      neosisHomePresent: opened.neosisHomePresent,
      stderr: result.stderr,
    }).toMatchInlineSnapshot(`
      {
        "apiKeyPresent": false,
        "bootManifest": true,
        "neosisHomePresent": false,
        "exitCode": 0,
        "openedUrl": "http://127.0.0.1:{{port}}/?token={{token}}",
        "opening": true,
        "readyUrl": "http://127.0.0.1:{{port}}/?token={{token}}",
        "status": 200,
        "stderr": "",
      }
    `)
  })

  it('prints the launcher reason and manual URL after the Web app is ready', async () => {
    const root = mkdtempSync(join(tmpdir(), 'neosis-web-browser-open-failure-snapshot-'))
    tempRoots.push(root)
    const result = await execa(process.execPath, [
      '--import', openerHook,
      builtBin,
      'web',
      '--port', '0',
    ], {
      cwd: root,
      env: {
        ...process.env,
        BROWSER_OPEN_TEST_FAILURE: 'fixture desktop unavailable',
        DEEPSEEK_API_KEY: 'keyless-browser-open-no-call',
        NEOSIS_AGENTS_HOME: join(root, '.agents'),
        NEOSIS_BROWSER_OPEN_TEST_EXIT_ON_FAILURE: '1',
        NEOSIS_HOME: join(root, '.neosis'),
        NEOSIS_TELEMETRY_DISABLED: '1',
        NODE_NO_WARNINGS: '1',
        SSH_CONNECTION: '',
        SSH_TTY: '',
      },
      input: '',
      timeout: 30_000,
      killSignal: 'SIGKILL',
      reject: false,
    })
    const readyUrl = /neosis web: (http:\/\/[^\s]+)/u.exec(result.stdout)?.[1]
    const diagnostic = result.stderr.split(/\r?\n/u)
      .find(line => line.startsWith('web-app: could not open the default browser because '))

    expect({
      diagnostic,
      exitCode: result.exitCode,
      opened: result.stdout.includes('neosis browser-open: '),
      opening: result.stdout.includes(openingMessage),
      readyUrl: readyUrl === undefined ? undefined : normalizeLocalUrl(readyUrl),
    }).toMatchInlineSnapshot(`
      {
        "diagnostic": "web-app: could not open the default browser because fixture desktop unavailable; use the neosis web URL printed at startup",
        "exitCode": 0,
        "opened": false,
        "opening": true,
        "readyUrl": "http://127.0.0.1:{{port}}/?token={{token}}",
      }
    `)
  })

  it('prints the host URL without launching a browser in a VS Code Remote SSH session', async () => {
    const root = mkdtempSync(join(tmpdir(), 'neosis-web-browser-open-ssh-snapshot-'))
    tempRoots.push(root)
    const result = await execa(process.execPath, [
      '--import', openerHook,
      builtBin,
      'web',
      '--port', '0',
    ], {
      cwd: root,
      env: {
        ...process.env,
        DEEPSEEK_API_KEY: 'keyless-browser-open-no-call',
        NEOSIS_AGENTS_HOME: join(root, '.agents'),
        NEOSIS_BROWSER_OPEN_TEST_EXIT_ON_READY: '1',
        NEOSIS_HOME: join(root, '.neosis'),
        NEOSIS_TELEMETRY_DISABLED: '1',
        NODE_NO_WARNINGS: '1',
        SSH_CONNECTION: '10.0.0.2 55000 10.0.0.9 22',
        SSH_TTY: '',
        VSCODE_IPC_HOOK_CLI: '/tmp/vscode-ipc',
      },
      input: '',
      timeout: 30_000,
      killSignal: 'SIGKILL',
      reject: false,
    })
    const readyUrl = /neosis web: (http:\/\/[^\s]+)/u.exec(result.stdout)?.[1]

    expect({
      exitCode: result.exitCode,
      opening: result.stdout.includes(openingMessage),
      readyUrl: readyUrl === undefined ? undefined : normalizeLocalUrl(readyUrl),
      opened: result.stdout.includes('neosis browser-open: '),
      stderr: result.stderr,
    }).toMatchInlineSnapshot(`
      {
        "exitCode": 0,
        "opened": false,
        "opening": false,
        "readyUrl": "http://127.0.0.1:{{port}}/?token={{token}}",
        "stderr": "",
      }
    `)
  })

  it('rejects a project browser command before starting the Web app', async () => {
    const root = mkdtempSync(join(tmpdir(), 'neosis-web-browser-open-env-snapshot-'))
    tempRoots.push(root)
    writeFileSync(join(root, '.env'), 'BROWSER=./project-browser\n')
    const result = await execa(process.execPath, [
      '--import', openerHook,
      builtBin,
      'web',
      '--port', '0',
    ], {
      cwd: root,
      env: {
        ...process.env,
        DEEPSEEK_API_KEY: 'keyless-browser-open-no-call',
        NEOSIS_AGENTS_HOME: join(root, '.agents'),
        NEOSIS_HOME: join(root, '.neosis'),
        NEOSIS_TELEMETRY_DISABLED: '1',
        NODE_NO_WARNINGS: '1',
        SSH_CONNECTION: '',
        SSH_TTY: '',
      },
      input: '',
      timeout: 30_000,
      killSignal: 'SIGKILL',
      reject: false,
    })

    const diagnostic = result.stderr.split(/\r?\n/u)
      .find(line => line.startsWith('Error: neosis: '))
      ?.replace(/^Error: neosis: .*[/\\]\.env/u, 'neosis: {{root}}/.env')

    expect({
      diagnostic,
      exitCode: result.exitCode,
      opening: result.stdout.includes(openingMessage),
      opened: result.stdout.includes('neosis browser-open: '),
      ready: result.stdout.includes('neosis web: '),
    }).toMatchInlineSnapshot(`
      {
        "diagnostic": "neosis: {{root}}/.env sets "BROWSER", which only the launching environment may set (it decides how this process starts, where its code and instructions load from, or how it reaches the network); export BROWSER instead of putting it in a .env file",
        "exitCode": 1,
        "opened": false,
        "opening": false,
        "ready": false,
      }
    `)
  })
})
