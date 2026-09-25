import { clientBundle } from '../tsdown.client.ts'

export default clientBundle(
  '@averqel/neosis-client-modules',
  ['lib/types/index.js', 'lib/types/invariant.js'],
)
