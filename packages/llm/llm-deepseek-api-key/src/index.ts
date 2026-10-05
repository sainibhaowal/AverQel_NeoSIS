/** API-key authentication and discovery for the official DeepSeek route. */
import type { Context } from '@averqel/cordis'
import type {} from '@averqel/cordis-plugin-loader'
import { launchEnvironmentOf } from '@averqel/neosis-launch-environment'
import { registerDeepSeekProvider, catalogModelInfo, resolveDeepSeekApiKey } from '@averqel/neosis-llm-deepseek'
import { Config, plainOptions, resolveAdapterOptions } from './config.ts'
import type { ResolvedDeepSeekOptions } from './config.ts'

export { Config, plainOptions, resolveAdapterOptions } from './config.ts'
export type { Options, ResolvedDeepSeekOptions } from './config.ts'
export const name = 'llm-deepseek-api-key'
export const inject = ['llm']

const PROVIDER = 'deepseek-official'

export function apply(ctx: Context, config: Config): void {
  const options = () => resolveAdapterOptions(plainOptions(config), launchEnvironmentOf(ctx))
  options()
  const resolveApiKey = async (connection: ResolvedDeepSeekOptions): Promise<string> =>
    resolveDeepSeekApiKey(ctx, connection.apiKeyEnv)
  ctx.llm.registerConfigurableProviders([
    { provider: PROVIDER, displayName: 'DeepSeek', settingsNs: ctx.fiber.entry?.options.id ?? name, settingsPath: [] },
  ])
  registerDeepSeekProvider(ctx, PROVIDER, {
    options, providerName: 'DeepSeek',
    resolveAuth: async connection => ({ headers: { 'x-api-key': await resolveApiKey(connection) } }),
    discoverModels: (provider) => {
      const connection = options()
      return Promise.resolve(connection.models.map(model => catalogModelInfo(provider, model)))
    },
  })
}
