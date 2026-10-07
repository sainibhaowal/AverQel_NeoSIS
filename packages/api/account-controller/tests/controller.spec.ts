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
    getUnnotifiedBonuses: vi.fn<AverQelAccount['getUnnotifiedBonuses']>().mockResolvedValue(null),
    ackBonusNotified: vi.fn<AverQelAccount['ackBonusNotified']>().mockResolvedValue(true),
    startSignIn: vi.fn<AverQelAccount['startSignIn']>().mockResolvedValue(state),
    cancelSignIn: vi.fn<AverQelAccount['cancelSignIn']>().mockResolvedValue(state),
    signOut: vi.fn<AverQelAccount['signOut']>().mockResolvedValue(state),
    watch: vi.fn<AverQelAccount['watch']>(),
  }
  ctx.provide('deepseekAccount', provider as never)
  const agents = { list: vi.fn(() => []) }
  ctx.provide('agents', agents as never)
  return { provider, agents, controller: new AccountController(ctx), ctx }
}

it('delegates account operations without coupling profile and balance queries', async () => {
  const { provider, controller } = fixture()
  expect(await controller.getState()).toBe(state)
  expect(await controller.getProfile(client)).toEqual({ status: 'failed' })
  expect(provider.getBalance).not.toHaveBeenCalled()
  expect(await controller.getBalance(client)).toBeNull()
  expect(await controller.getUnnotifiedBonuses(client)).toBeNull()
  expect(provider.getUnnotifiedBonuses).toHaveBeenCalledExactlyOnceWith(client)
  const accountId = 'account' as Parameters<AverQelAccount['ackBonusNotified']>[0]
  const orderId = 'order' as Parameters<AverQelAccount['ackBonusNotified']>[1]
  expect(await controller.ackBonusNotified(accountId, orderId, client)).toBe(true)
  expect(provider.ackBonusNotified).toHaveBeenCalledExactlyOnceWith(accountId, orderId, client)
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

it('reports whether a running account task is present', () => {
  const { agents, controller } = fixture()
  expect(controller.hasRunningAccountTasks()).toBe(false)

  agents.list.mockReturnValueOnce([{
    status: 'waiting',
    session: { requestContext: () => ({ provider: 'deepseek-account' }) },
  }] as never)
  expect(controller.hasRunningAccountTasks()).toBe(false)

  agents.list.mockReturnValueOnce([{
    status: 'running',
    session: { requestContext: () => ({ provider: 'other' }) },
  }] as never)
  expect(controller.hasRunningAccountTasks()).toBe(false)

  agents.list.mockReturnValueOnce([{
    status: 'running',
    session: { requestContext: () => ({ provider: 'deepseek-account' }) },
  }] as never)
  expect(controller.hasRunningAccountTasks()).toBe(true)
})

it('streams expiry events without replaying before subscription and closes on abort', async () => {
  const { controller, ctx } = fixture()
  ctx.emit('deepseek-account/session-expired')
  const lifetime = new AbortController()
  const iterator = controller.watchExpiry(lifetime.signal)[Symbol.asyncIterator]()

  const first = iterator.next()
  ctx.emit('deepseek-account/session-expired')
  await expect(first).resolves.toEqual({ done: false, value: 'session-expired' })

  const second = iterator.next()
  ctx.emit('deepseek-account/session-expired')
  ctx.emit('deepseek-account/session-expired')
  await expect(second).resolves.toEqual({ done: false, value: 'session-expired' })
  await expect(iterator.next()).resolves.toEqual({ done: false, value: 'session-expired' })

  const finished = iterator.next()
  lifetime.abort()
  await expect(finished).resolves.toEqual({ done: true, value: undefined })
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
