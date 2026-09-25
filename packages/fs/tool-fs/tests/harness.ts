import { Context } from '@averqel/cordis'
import type { Agent } from '@averqel/neosis-agent'
import AgentLoop from '@averqel/neosis-agent-loop'
import { mountAgentLoopTestDependencies } from '@averqel/neosis-agent-loop-testkit'
import LocalFileSystem from '@averqel/neosis-fs-local'
import * as FsPolicy from '@averqel/neosis-fs-observation-policy'
import * as ToolFs from '@averqel/neosis-tool-fs'
import * as LlmAverQel from '@averqel/neosis-llm-deepseek'

/**
 * Build the real fs-tool stack for with-key e2e tests. Agents have no session
 * cwd, so `fsCwd` is their workspace; `persona` configures the deployment prompt.
 * This helper lives outside the e2e glob so imports do not register tests.
 */
export async function fsHarness(fsCwd: string, persona = ''): Promise<Context> {
  const ctx = new Context()
  await mountAgentLoopTestDependencies(ctx, { systemPrompt: { personaPrefix: persona } })
  await ctx.plugin(AgentLoop, { agents: [] })
  await ctx.plugin(LlmAverQel)
  await ctx.plugin(LocalFileSystem, { cwd: fsCwd })
  await ctx.plugin(FsPolicy)
  await ctx.plugin(ToolFs)
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
