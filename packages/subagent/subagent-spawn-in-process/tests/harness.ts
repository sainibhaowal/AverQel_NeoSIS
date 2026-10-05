import { Context } from '@averqel/cordis'
import type { Agent } from '@averqel/neosis-agent'
import AgentLoop from '@averqel/neosis-agent-loop'
import { mountAgentLoopTestDependencies } from '@averqel/neosis-agent-loop-testkit'
import { LocalBashExecutor } from '@averqel/neosis-bash-local'
import * as BashEnvPlugin from '@averqel/neosis-shell-env'
import LocalSubprocessRuntime from '@averqel/neosis-subprocess-local'
import * as ToolBash from '@averqel/neosis-tool-bash'
import * as LlmAverQel from '@averqel/neosis-llm-deepseek'
import SubagentRuntime from '@averqel/neosis-subagent'
import * as Spawn from '../src/index.ts'
import * as ToolSubagent from '@averqel/neosis-tool-subagent'

/**
 * Shared harness for the spawn-backend e2e: the full real stack (AverQel
 * adapter + real bash tool + the subagent tool bound to the spawn backend), so
 * a real parent agent can delegate to a real in-process child that does real
 * work (writes a file). Lives outside the *.e2e.ts pattern so importing it never
 * re-registers another file's tests.
 */
export async function spawnHarness(workdir: string): Promise<Context> {
  const ctx = new Context()
  // This harness installs only the global default persona, so both parent and
  // spawned children render it. It stays neutral for both roles; the
  // delegation nudge lives in the e2e's user prompt and the subagent tool's
  // own description.
  await mountAgentLoopTestDependencies(ctx, {
    systemPrompt: { personaPrefix: 'You are a coding agent. Report only when the requested work is done.' },
  })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(LlmAverQel)
  await ctx.plugin(LocalSubprocessRuntime)
  await ctx.plugin(BashEnvPlugin)
  await ctx.plugin(LocalBashExecutor, { cwd: workdir, timeoutMs: 30_000 })
  await ctx.plugin(ToolBash)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(Spawn, { providerName: 'spawn' })
  // The model-facing subagent tool, bound to the spawn backend.
  await ctx.plugin(ToolSubagent, { provider: 'spawn' })
  return ctx
}

export function waitForIdle(ctx: Context, agent: Agent): Promise<void> {
  return new Promise((resolve) => {
    const dispose = ctx.on('agent/status', ({ agent: subject, status }) => {
      if (subject === agent && status === 'idle') {
        dispose()
        resolve()
      }
    })
  })
}
