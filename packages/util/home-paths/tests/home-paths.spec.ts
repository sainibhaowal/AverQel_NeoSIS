import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_NEOSIS_HOME_DISPLAY,
  NEOSIS_HOME_DIR_NAME,
  canonicalizeWatchPath,
  defaultNeosisHome,
  neosisCachePath,
  neosisHomeDisplay,
  neosisHomePath,
  expandHomePath,
  resolveNeosisHome,
} from '@averqel/neosis-home-paths'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('neosis path helpers', () => {
  it('owns the shared default NEOSIS home directory name', () => {
    expect(NEOSIS_HOME_DIR_NAME).toBe('.neosis')
    expect(DEFAULT_NEOSIS_HOME_DISPLAY).toBe('~/.neosis')
    expect(defaultNeosisHome()).toBe(join(homedir(), '.neosis'))
  })

  it('expands tilde paths without changing non-tilde paths', () => {
    expect(expandHomePath('~')).toBe(homedir())
    expect(expandHomePath('~/.neosis')).toBe(join(homedir(), '.neosis'))
    expect(expandHomePath('~\\.neosis')).toBe(join(homedir(), '.neosis'))
    expect(expandHomePath('/tmp/.neosis')).toBe('/tmp/.neosis')
    expect(expandHomePath('~other/.neosis')).toBe('~other/.neosis')
  })

  it('resolves explicit path before NEOSIS_HOME and the default', () => {
    const envHome = join(homedir(), 'env-neosis')

    expect(resolveNeosisHome('/tmp/explicit-neosis', { NEOSIS_HOME: '~/env-neosis' })).toBe(resolve('/tmp/explicit-neosis'))
    expect(resolveNeosisHome(undefined, { NEOSIS_HOME: '~/env-neosis' })).toBe(envHome)
    expect(resolveNeosisHome(undefined, {})).toBe(defaultNeosisHome())
  })

  it('treats an empty or whitespace-only NEOSIS_HOME as unset', () => {
    expect(resolveNeosisHome(undefined, { NEOSIS_HOME: '' })).toBe(defaultNeosisHome())
    expect(resolveNeosisHome(undefined, { NEOSIS_HOME: '   ' })).toBe(defaultNeosisHome())
  })

  it('joins child segments onto the resolved NEOSIS_HOME', () => {
    vi.stubEnv('NEOSIS_HOME', '~/env-neosis')
    expect(neosisHomePath()).toBe(join(homedir(), 'env-neosis'))
    expect(neosisHomePath('storages', 'cache')).toBe(join(homedir(), 'env-neosis', 'storages', 'cache'))
  })

  it('labels a resolved home by whether it is the default root', () => {
    expect(neosisHomeDisplay(resolve(defaultNeosisHome()))).toBe('~/.neosis')
    expect(neosisHomeDisplay('/some/other/root')).toBe('$NEOSIS_HOME')
  })

  it.each([
    [undefined, join(homedir(), '.neosis')],
    ['', join(homedir(), '.neosis')],
    ['   ', join(homedir(), '.neosis')],
    ['~/env-neosis', join(homedir(), 'env-neosis')],
    ['./relative-neosis', resolve('./relative-neosis')],
  ] as const)('resolves cache paths with NEOSIS_HOME=%j', (home, expectedHome) => {
    vi.stubEnv('NEOSIS_HOME', home)
    try {
      expect(neosisCachePath()).toBe(join(expectedHome, 'cache'))
      expect(neosisCachePath('models', 'index.json')).toBe(join(expectedHome, 'cache', 'models', 'index.json'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('resolves configured cache homes before the environment', () => {
    vi.stubEnv('NEOSIS_HOME', '~/env-neosis')
    try {
      expect(neosisCachePath({ neosisHome: '~/explicit-neosis' })).toBe(join(homedir(), 'explicit-neosis', 'cache'))
      expect(neosisCachePath({ neosisHome: './explicit-neosis' }, 'attachments', 'request-images'))
        .toBe(resolve('./explicit-neosis/cache/attachments/request-images'))
      expect(neosisCachePath({}, 'attachments')).toBe(join(homedir(), 'env-neosis', 'cache', 'attachments'))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('canonicalizes a watcher ancestor while preserving a missing suffix', async () => {
    const root = await mkdtemp(join(tmpdir(), 'neosis-watch-path-'))
    const target = join(root, 'target')
    const alias = join(root, 'alias')
    try {
      await mkdir(target)
      await symlink(target, alias, process.platform === 'win32' ? 'junction' : 'dir')
      await expect(canonicalizeWatchPath(alias)).resolves.toBe(await realpath(target))
      await expect(canonicalizeWatchPath(join(alias, 'later', 'config.yml'))).resolves.toBe(
        join(await realpath(target), 'later', 'config.yml'),
      )
      const file = join(root, 'file')
      await writeFile(file, 'not a directory')
      await expect(canonicalizeWatchPath(join(file, 'child'))).rejects.toMatchObject({ code: 'ENOTDIR' })
    } finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
