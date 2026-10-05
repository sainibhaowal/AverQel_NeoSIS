import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@averqel/neosis-api-workspace-controller',
  ['lib/types/index.js'],
  { hostPhase: true },
)
