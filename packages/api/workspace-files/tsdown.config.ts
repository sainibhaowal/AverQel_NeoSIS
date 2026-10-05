import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@averqel/neosis-api-workspace-files',
  ['lib/types/index.js'],
  { hostPhase: true },
)
