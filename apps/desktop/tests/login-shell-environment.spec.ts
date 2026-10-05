import { describe, expect, it } from 'vitest'
import {
  loginShellCandidates,
  mergeLoginShellEnvironment,
  parseLoginShellOutput,
  readDesktopLoginShellEnvironment,
  resolveDesktopLoginShellConfig,
} from '../src/login-shell-environment.ts'

describe('desktop login-shell environment', () => {
  it('validates the configurable probe deadline', () => {
    expect(resolveDesktopLoginShellConfig({})).toEqual({ timeoutMs: 10_000 })
    expect(resolveDesktopLoginShellConfig({ NEOSIS_DESKTOP_LOGIN_SHELL_TIMEOUT_MS: '2500' })).toEqual({ timeoutMs: 2500 })
    expect(() => resolveDesktopLoginShellConfig({ NEOSIS_DESKTOP_LOGIN_SHELL_TIMEOUT_MS: '999' })).toThrow('1000')
  })

  it('parses environment bytes while ignoring shell startup noise', () => {
    expect(parseLoginShellOutput('notice\0_NEOSIS_SHELL_ENV_DELIMITER_\0PATH=/bin\0EMPTY=\0_NEOSIS_SHELL_ENV_DELIMITER_\0done'))
      .toEqual({ PATH: '/bin', EMPTY: '' })
    expect(parseLoginShellOutput('missing delimiter')).toBeUndefined()
  })

  it('preserves launcher-owned and probe-session values during the merge', () => {
    const base = { PATH: '/base', NEOSIS_PROFILE: 'profile', PWD: '/base' }
    expect(mergeLoginShellEnvironment(base, {
      PATH: '/shell', NEOSIS_PROFILE: 'other', PWD: '/shell', EDITOR: 'vim', ELECTRON_RUN_AS_NODE: '1',
    })).toEqual({ PATH: '/shell', NEOSIS_PROFILE: 'profile', PWD: '/base', EDITOR: 'vim' })
    expect(base).toEqual({ PATH: '/base', NEOSIS_PROFILE: 'profile', PWD: '/base' })
  })

  it('does not probe on Windows and reports fallback failures before success', async () => {
    const base = { PATH: process.env.PATH ?? '/usr/bin:/bin', NEOSIS_PROFILE: 'profile' }
    await expect(readDesktopLoginShellEnvironment(base, { timeoutMs: 2_000 }, { platform: 'win32', shells: ['/does-not-exist'] }))
      .resolves.toEqual({ environment: base, failures: [] })

    const result = await readDesktopLoginShellEnvironment(base, { timeoutMs: 2_000 }, {
      platform: 'linux', shells: ['/does-not-exist', '/bin/sh'],
    })
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]?.shell).toBe('/does-not-exist')
    expect(result.environment.PATH).toBeTruthy()
    expect(result.environment.NEOSIS_PROFILE).toBe('profile')
  })

  it('provides distinct POSIX fallback candidates', () => {
    const candidates = loginShellCandidates()
    expect(new Set(candidates).size).toBe(candidates.length)
    expect(candidates).toEqual(expect.arrayContaining(['/bin/zsh', '/bin/bash', '/bin/sh']))
  })
})
