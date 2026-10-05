/** Account Remote delegation preserves provider results, failures, and stream lifetime. */
import { Context } from '@averqel/cordis'
import type { AverQelAccount } from '@averqel/neosis-deepseek-account'
import type { AccountView, SignInAttemptId } from '../src/types.ts'
import { afterEach, expect, it, vi } from 'vitest'
import AccountController from '../src/index.ts'

const roots: Context[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map(ctx => ctx.fiber.dispose())) })
const state: AccountView = { status: 'signed-out', links: { usageUrl: 'https://platform.example/usage', topUpUrl: 'https://platform.example/top_up' }, attempt: null }
const client = { version: 'test-version', locale: 'zh-CN', timezoneOffsetSeconds: 0 }

function fixture() {
  const ctx = new Context()
  roots.push(ctx)
  const provider = {
    getState: vi.fn<AverQelAccount['getState']>().mockResolvedValue(state),
    getProfile: vi.fn<AverQelAccount['getProfile']>().mockResolvedValue({ status: 'failed' }),
    getBalance: vi.fn<AverQelAccount['getBalance']>().mockResolvedValue(null),
    startSignIn: vi.fn<AverQelAccount['startSignIn']>().mockResolvedValue(state),
    cancelSignIn: vi.fn<AverQelAccount['cancelSignIn']>().mockResolvedValue(state),
    signOut: vi.fn<AverQelAccount['signOut']>().mockResolvedValue(state),
    watch: vi.fn<AverQelAccount['watch']>(),
  }
  ctx.provide('deepseekAccount', provider as never)
  return { provider, controller: new AccountController(ctx) }
}

it('delegates account operations without coupling profile and balance queries', async () => {
  const { provider, controller } = fixture()
  expect(await controller.getState()).toBe(state)
  expect(await controller.getProfile(client)).toEqual({ status: 'failed' })
  expect(provider.getBalance).not.toHaveBeenCalled()
  expect(await controller.getBalance(client)).toBeNull()
  expect(await controller.startSignIn(client, 'http://127.0.0.1:8080', 'desktop')).toBe(state)
  expect(provider.startSignIn).toHaveBeenCalledExactlyOnceWith(client, 'http://127.0.0.1:8080', 'desktop')
  const id = 'attempt' as SignInAttemptId
  expect(await controller.cancelSignIn(id)).toBe(state)
  expect(provider.cancelSignIn).toHaveBeenCalledExactlyOnceWith(id)
  expect(await controller.signOut(client)).toBe(state)
  expect(provider.signOut).toHaveBeenCalledExactlyOnceWith(client)
  const failure = new Error('storage unavailable')
  provider.signOut.mockRejectedValueOnce(failure)
  await expect(controller.signOut(client)).rejects.toBe(failure)
})

it('passes the subscriber lifetime to the provider and returns its state stream', async () => {
  const { provider, controller } = fixture()
  const lifetime = new AbortController()
  const stream: AsyncIterable<AccountView> = { async *[Symbol.asyncIterator]() { yield state } }
  provider.watch.mockReturnValue(stream)
  expect(controller.watch(lifetime.signal)).toBe(stream)
  expect(provider.watch).toHaveBeenCalledExactlyOnceWith(lifetime.signal)
  const received: AccountView[] = []
  for await (const value of stream) received.push(value)
  expect(received).toEqual([state])
})
