/** The `agent-loop` settings section layered over the composition entry. */

import { expect, it, onTestFinished } from 'vitest'
import { Context } from '@averqel/cordis'
import LlmRuntime from '@averqel/neosis-llm'
import SessionStore from '@averqel/neosis-session'
import SystemPrompt from '@averqel/neosis-system-prompt'
import ToolRuntime from '@averqel/neosis-tools'
import AgentRegistry from '@averqel/neosis-agent'
import SessionProjectionRegistry from '@averqel/neosis-session-projection'
import { liveConfig } from '../../../settings/settings/tests/live-config.ts'
import AgentLoop from '@averqel/neosis-agent-loop'

async function boot() {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  onTestFinished(() => ctx.fiber.dispose())
  const live = await liveConfig(ctx, AgentLoop, { agents: [], maxParallelToolCalls: 4 })
  return { ctx, live }

}

it('updates future scheduler budgets while preserving composed agents and the running loop', async () => {
  const { ctx, live } = await boot()
  const before = live.fiber
  await live.update({ maxParallelToolCalls: 1 })
  expect(live.entry.fiber === before).toBe(true)
  expect(ctx.agentLoop.config.maxParallelToolCalls.get()).toBe(1)
  expect(ctx.agentLoop.config.agents).toEqual([])
  await expect(live.update({ maxParallelToolCalls: 0 })).rejects.toThrow()
  expect(ctx.agentLoop.config.maxParallelToolCalls.get()).toBe(1)
})
