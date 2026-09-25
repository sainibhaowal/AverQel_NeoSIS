import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@averqel/neosis-api-remotes',
  ['lib/types/index.js'],
  { hostPhase: true },
)
