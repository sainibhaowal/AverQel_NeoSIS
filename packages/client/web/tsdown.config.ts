import { staticLinked } from '../tsdown.client.ts'

export default staticLinked(
  '@averqel/neosis-client-web',
  ['lib/types/index.js', 'lib/types/apply-injections.js'],
)
