import { fileURLToPath } from 'node:url'
import { agentEvents, type Agent } from '@averqel/neosis-agent'
import { ToolCallId } from '@averqel/neosis-llm'
import { boot, loadOverlayPatches } from '@averqel/neosis-app-boot'
import { SessionId } from '@averqel/neosis-session'
import type {} from '@averqel/neosis-skill'
import type {} from '@averqel/neosis-tools'
import { unsupportedInbox } from '@averqel/neosis-agent-loop-testkit'

const overlayPath = process.argv[2]
if (overlayPath === undefined) throw new Error('neosis-badge snapshot requires an overlay path')
const rootConfigPath = fileURLToPath(new URL('../../../../../packages/bundle/base/tests/fixtures/root.cordis.yml', import.meta.url))
const basePatchPath = fileURLToPath(new URL('../../../../../packages/bundle/base/cordis.patch.yml', import.meta.url))
const ctx = await boot('neosis-badge-snapshot', rootConfigPath, [
  ...loadOverlayPatches('neosis-badge-snapshot', basePatchPath),
  ...loadOverlayPatches('neosis-badge-snapshot', overlayPath),
])

try {
  const agentId = SessionId('neosis-badge-snapshot')
  const session = ctx.sessions.create(agentId, { meta: { cwd: process.cwd() } })
  const agent: Agent = {
    ctx,
    id: agentId,
    options: {},
    session,
    inbox: unsupportedInbox(),
    status: 'idle',
    send: () => {},
    followup: () => {},
    steer: () => {},
    inject: () => { throw new Error('neosis-badge snapshot must receive the catalog at the step boundary') },
    cancel: () => {},
    runMaintenance: job => job(new AbortController().signal),
    whenIdle: () => Promise.resolve(),
  }
  const decision = await agentEvents(ctx, agent).waterfall(
    'agent/pre-step',
    { messages: [], turn: 1, step: 1, signal: new AbortController().signal },
    () => Promise.resolve({ kind: 'enter' as const, messages: [] }),
  )
  const catalog = decision.kind === 'enter'
    ? decision.messages.find(message => message.role === 'user'
      && message.source.kind === 'skill-catalog')?.content
    : undefined
  const summary = (await ctx.skills.list()).find(skill => skill.name === 'neosis-badge')
  const result = await ctx.tools.execute({
    callId: ToolCallId('neosis-badge-snapshot'),
    name: 'skill',
    arguments: { name: 'neosis-badge' },
    signal: new AbortController().signal,
  })
  process.stdout.write(`${JSON.stringify({ catalog: catalog ?? null, summary: summary ?? null, result })}\n`)
} finally {
  await ctx.fiber.dispose()
}
