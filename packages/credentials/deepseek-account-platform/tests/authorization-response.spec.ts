import { expect, it, vi } from 'vitest'
import { AccountUnauthorizedError, requestAccount, requestPlatform } from '../src/protocol.ts'

it('recognizes HTTP 401 as an expired stored account grant', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))
  try {
    await expect(requestAccount('https://platform.deepseek.com', '/auth-api/v0/users/current',
      'fixture-token', new AbortController().signal, {})).rejects.toBeInstanceOf(AccountUnauthorizedError)
  } finally { fetcher.mockRestore() }
})

it('does not expire a stored account grant for an HTTP 403 response', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 403 }))
  try {
    await expect(requestAccount('https://platform.deepseek.com', '/auth-api/v0/users/current',
      'fixture-token', new AbortController().signal, {})).rejects.toMatchObject({ code: 'network' })
  } finally { fetcher.mockRestore() }
})

it('recognizes the Platform authorization business code without requiring account data', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 40003, data: null })))
  try {
    await expect(requestAccount('https://platform.deepseek.com', '/auth-api/v0/users/current',
      'fixture-token', new AbortController().signal, {})).rejects.toBeInstanceOf(AccountUnauthorizedError)
  } finally { fetcher.mockRestore() }
})

it('does not classify an unauthenticated exchange failure as a rejected stored credential', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 40003, data: null })))
  try {
    await expect(requestPlatform('https://platform.deepseek.com', 'auth_exchange', {},
      new AbortController().signal, {})).rejects.toThrow('account: protocol')
  } finally { fetcher.mockRestore() }
})
