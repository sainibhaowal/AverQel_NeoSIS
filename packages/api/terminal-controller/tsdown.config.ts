import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@averqel/neosis-api-terminal-controller',
  ['lib/types/index.js'],
  { hostPhase: true },
)
