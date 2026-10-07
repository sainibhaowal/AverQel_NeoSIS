import { writeFileSync } from 'node:fs'
import { afterEach, expect, it, vi } from 'vitest'
import { packageTarget, parseDesktopPackageInvocation } from '../scripts/package-target.ts'
import { packageMacOSArtifacts } from '../scripts/package-macos.ts'
import { withWindowsSigningStage } from '../scripts/windows-signing-stage.mjs'
import { prepareWindowsSignatureCacheDirectory } from '../scripts/windows-signature-cache-directory.mjs'

const macOSProxy = vi.hoisted(() => ({
  loaded: false,
  withProxy: vi.fn(async (_proxy: string | undefined, action: () => Promise<void>) => action()),
}))

vi.mock('../scripts/macos-notarization-proxy.ts', () => {
  macOSProxy.loaded = true
  return { withMacOSNotarizationProxy: macOSProxy.withProxy }
})
vi.mock('../scripts/notarize-macos.mjs', () => ({ notarizeMacOS: vi.fn(async () => {}) }))
vi.mock('../scripts/package-macos.ts', () => ({ packageMacOSArtifacts: vi.fn(async () => {}) }))

vi.mock('../scripts/windows-signing-stage.mjs', () => ({
  withWindowsSigningStage: vi.fn(async (_options: object, operation: () => Promise<void>) => operation()),
}))
vi.mock('../scripts/windows-signature-cache-directory.mjs', () => ({
  prepareWindowsSignatureCacheDirectory: vi.fn(async () => {}),
  resolveWindowsSignatureCacheDirectory: vi.fn(() => 'C:\\fixture-cache'),
}))

// Keep the real orchestration and manifest reads; this suite owns no release directories or subprocesses.
vi.mock('node:fs', async importOriginal => ({
  ...await importOriginal<typeof import('node:fs')>(),
  rmSync: vi.fn(), mkdirSync: vi.fn(), writeFileSync: vi.fn(), renameSync: vi.fn(),
}))

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

const environment = { NEOSIS_DESKTOP_APP_ID: 'com.example.test', NEOSIS_DESKTOP_AUTO_UPDATE_ENV: 'test',
  DOWNLOAD_TEST_ORIGIN: 'https://updates.example.com', DOWNLOAD_TEST_RELEASE_ID: '0123456789abcdef0123456789abcdef',
  NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN: 'fixture-pin', NEOSIS_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY: '2' }

function supervisor(failure?: string) {
  vi.stubEnv('npm_execpath', 'fixture-pnpm.cjs')
  const stages: string[] = []
  const run = { directory: 'fixture-record', finish: vi.fn(),
    run: vi.fn(async (stage: string, _executable: string, _args: readonly string[], _options: { env: NodeJS.ProcessEnv }) => {
      stages.push(stage)
      if (stage === failure) throw new Error('stage refused')
    }) }
  return { run, stages }
}

it('keeps the macOS notarization proxy unloaded during Linux and Windows preparation', async () => {
  expect(macOSProxy.loaded).toBe(false)
  for (const [name, platform, arch] of [
    ['linux-x64', 'linux', 'x64'],
    ['win-x64', 'win32', 'x64'],
  ] as const) {
    const { run } = supervisor()
    await packageTarget(parseDesktopPackageInvocation([name, '--prepare-only'], platform, arch), environment, run)
  }
  expect(macOSProxy.loaded).toBe(false)
})

it('requires one signing preflight before building, then records only the complete release', async () => {
  const { run, stages } = supervisor()
  await packageTarget(parseDesktopPackageInvocation(['win-x64'], 'win32', 'x64'), environment, run)
  expect(stages.slice(0, 2)).toEqual(['preflight:windows-signing', 'run build:official'])
  expect(stages.filter(stage => stage === 'preflight:windows-signing')).toHaveLength(1)
  expect(vi.mocked(withWindowsSigningStage).mock.calls.map(([options]) => options.stage))
    .toEqual(['preflight', 'artifacts'])
  expect(run.run.mock.calls[0]![3]).toMatchObject({ env: { NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN: 'fixture-pin' }, timeoutMs: 60_000 })
  expect(run.run.mock.calls[1]![3].env).not.toHaveProperty('NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN')
  expect(stages.indexOf('run sign:primary-runtime --neosis')).toBeGreaterThan(stages.indexOf('run prepare:neosis --defer-runtime-smoke'))
  expect(stages.at(-1)).toBe('exec tsx scripts/smoke-packaged-runtime.ts')
  for (const call of run.run.mock.calls) {
    if (call[0].startsWith('run prepare:') || call[0].includes('smoke-packaged-runtime')) {
      expect(call[3].env).not.toHaveProperty('NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN')
      expect(call[3].env).not.toHaveProperty('NEOSIS_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY')
    }
    if (call[0].startsWith('run sign:primary-runtime')) {
      expect(call[3].env).toHaveProperty('NEOSIS_DESKTOP_WINDOWS_SIGNATURE_CACHE_CONCURRENCY', '2')
    }
  }
  expect(writeFileSync).toHaveBeenCalledOnce()
  const record = JSON.parse(vi.mocked(writeFileSync).mock.calls[0]![1] as string) as { publicUrl: string }
  expect(record.publicUrl).toBe('https://updates.example.com/neosis-desk/0123456789abcdef0123456789abcdef/feeds/win-x64/')
})

it('initializes shared storage only after acquiring the preflight stage lock', async () => {
  const { run } = supervisor()
  vi.mocked(withWindowsSigningStage).mockImplementationOnce(async (_options, operation) => {
    expect(prepareWindowsSignatureCacheDirectory).not.toHaveBeenCalled()
    await operation()
    expect(prepareWindowsSignatureCacheDirectory).toHaveBeenCalledOnce()
  })
  await packageTarget(parseDesktopPackageInvocation(['win-x64'], 'win32', 'x64'), environment, run)
})

it.each(['preflight:windows-signing', 'run build:official', 'run sign:primary-runtime', 'run prepare:neosis --defer-runtime-smoke', 'run sign:primary-runtime --neosis',
  'exec tsx scripts/smoke-packaged-runtime.ts',
  'exec electron-builder --config electron-builder.config.mjs --win --x64 --publish never'])
('never continues or records a release after %s fails', async (failure) => {
  const { run, stages } = supervisor(failure)
  await expect(packageTarget(parseDesktopPackageInvocation(['win-x64'], 'win32', 'x64'), environment, run)).rejects.toThrow('stage refused')
  expect(stages.at(-1)).toBe(failure)
  expect(stages.filter(stage => stage === failure)).toHaveLength(1)
  expect(writeFileSync).not.toHaveBeenCalled()
})

it.each(['--unsigned', '--prepare-only'])('keeps %s hardware-free and creates no release record', async (mode) => {
  const { run, stages } = supervisor()
  await packageTarget(parseDesktopPackageInvocation(['win-x64', mode], 'win32', 'x64'), environment, run)
  expect(stages[0]).toBe('run build:official')
  expect(stages).not.toContain('preflight:windows-signing')
  expect(stages).not.toContain('run sign:primary-runtime')
  expect(stages).not.toContain('run sign:primary-runtime --neosis')
  expect(withWindowsSigningStage).not.toHaveBeenCalled()
  for (const call of run.run.mock.calls) expect(call[3].env).not.toHaveProperty('NEOSIS_DESKTOP_WINDOWS_TOKEN_PIN')
  expect(writeFileSync).not.toHaveBeenCalled()
  expect(stages.includes('exec tsx scripts/smoke-packaged-runtime.ts --unsigned')).toBe(mode === '--unsigned')
})

it('checks the assembled macOS runtime before notarizing and recording the release', async () => {
  const { run, stages } = supervisor()
  vi.mocked(packageMacOSArtifacts).mockImplementationOnce(async () => {
    expect(stages.at(-1)).toBe('exec tsx scripts/smoke-packaged-runtime.ts')
    expect(writeFileSync).not.toHaveBeenCalled()
  })
  await packageTarget(parseDesktopPackageInvocation(['mac-arm64'], 'darwin', 'arm64'), environment, run)
  expect(packageMacOSArtifacts).toHaveBeenCalledOnce()
  expect(writeFileSync).toHaveBeenCalledOnce()
})

it.each([false, true])('refuses macOS notarization and release records after an assembled-runtime failure (directory=%s)', async (directory) => {
  const { run } = supervisor('exec tsx scripts/smoke-packaged-runtime.ts')
  await expect(packageTarget(parseDesktopPackageInvocation(['mac-arm64', ...(directory ? ['--dir'] : [])], 'darwin', 'arm64'), environment, run))
    .rejects.toThrow('stage refused')
  expect(macOSProxy.withProxy).not.toHaveBeenCalled()
  expect(packageMacOSArtifacts).not.toHaveBeenCalled()
  expect(writeFileSync).not.toHaveBeenCalled()
})

it('checks macOS directory packages without writing a release record', async () => {
  const { run, stages } = supervisor()
  await packageTarget(parseDesktopPackageInvocation(['mac-arm64', '--dir'], 'darwin', 'arm64'), { ...environment, APPLE_KEYCHAIN_PROFILE: 'fixture' }, run)
  expect(stages.at(-1)).toBe('exec tsx scripts/smoke-packaged-runtime.ts')
  expect(packageMacOSArtifacts).not.toHaveBeenCalled()
  expect(writeFileSync).not.toHaveBeenCalled()
})

it.each([undefined, '2'])('passes macOS pack concurrency %s only to workspace packing and download routing only to download stages', async (concurrency) => {
  const { run } = supervisor()
  await packageTarget(parseDesktopPackageInvocation(['mac-arm64', '--prepare-only'], 'darwin', 'arm64'), {
    ...environment, NEOSIS_DESKTOP_MACOS_PACK_CONCURRENCY: concurrency,
    NEOSIS_DESKTOP_MACOS_DOWNLOAD_PROXY: 'http://downloads.example:8080',
    NEOSIS_DESKTOP_MACOS_NOTARIZATION_PROXY: 'http://apple.example:8081',
  }, run)
  const calls = run.run.mock.calls
  const packs = calls.filter(call => call[0].startsWith('run release:pack'))
  expect(packs).toHaveLength(2)
  for (const call of packs) expect(call[2].slice(-2)).toEqual(['--concurrency', concurrency ?? '4'])
  for (const call of calls) {
    expect(call[3].env.HTTP_PROXY).toBe(/^run prepare:(?:runtime|neosis)$/u.test(call[0]) ? 'http://downloads.example:8080' : undefined)
  }
  expect(macOSProxy.withProxy).not.toHaveBeenCalled()
})

it.each([false, true])('scopes the Apple proxy around notarization (directory=%s)', async (directory) => {
  const { run } = supervisor()
  await packageTarget(parseDesktopPackageInvocation(['mac-arm64', ...(directory ? ['--dir'] : [])], 'darwin', 'arm64'), {
    ...environment, APPLE_KEYCHAIN_PROFILE: 'fixture', NEOSIS_DESKTOP_MACOS_NOTARIZATION_PROXY: 'http://apple.example:8081',
  }, run)
  expect(macOSProxy.withProxy).toHaveBeenCalledExactlyOnceWith('http://apple.example:8081', expect.any(Function), undefined, undefined, expect.any(Function))
  expect(packageMacOSArtifacts).toHaveBeenCalledTimes(directory ? 0 : 1)
  if (!directory) {
    const signing = run.run.mock.calls.findIndex(call => call[0].includes('--config.mac.notarize=false'))
    expect(signing).toBeGreaterThan(-1)
    expect(run.run.mock.invocationCallOrder[signing]).toBeLessThan(macOSProxy.withProxy.mock.invocationCallOrder[0]!)
  }
})

it('does not write a release completion record when Apple proxy cleanup fails', async () => {
  const { run } = supervisor()
  macOSProxy.withProxy.mockRejectedValueOnce(new Error('proxy restoration failed'))
  await expect(packageTarget(parseDesktopPackageInvocation(['mac-arm64'], 'darwin', 'arm64'), environment, run))
    .rejects.toThrow('proxy restoration failed')
  expect(writeFileSync).not.toHaveBeenCalled()
})
