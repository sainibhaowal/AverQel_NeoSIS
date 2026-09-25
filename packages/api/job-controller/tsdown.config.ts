import { clientBundle } from '../../client/tsdown.client.ts'

export default clientBundle(
  '@averqel/neosis-api-job-controller',
  ['lib/types/index.js'],
  { hostPhase: true },
)
