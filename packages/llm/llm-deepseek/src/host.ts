/** Shared Host registration for alternate NeoSIS DeepSeek credential routes. */
import type { Context } from '@averqel/cordis'
import type {} from '@averqel/neosis-settings'
import type {} from '@averqel/cordis-plugin-loader'
import { resolveImageAttachmentAccess } from '@averqel/neosis-llm'
import { getOrCreateAnonymousUserId, type AnonymousUserId } from '@averqel/neosis-anonymous-user-id'
import { AverQelAdapter } from './adapter.ts'
import type { AverQelAdapterOptions, AverQelConnectionOptions, AverQelRequestAuth } from './types.ts'

/**
 * Register an adapter route whose credential package supplies request headers.
 * @typeParam C - The credential-specific connection options.
 * @param ctx - Host context that owns the adapter registration.
 * @param provider - Provider key exposed to the model registry.
 * @param dependencies - Credential route callbacks and provider metadata.
 */
export function registerDeepSeekProvider<C extends AverQelConnectionOptions>(
  ctx: Context,
  provider: string,
  dependencies: Pick<{
    options: () => C
    resolveAuth: (connection: C) => Promise<AverQelRequestAuth>
    providerName: string
    discoverModels: (provider: string) => Promise<readonly ReturnType<typeof import('./model-info.ts').catalogModelInfo>[]>
  }, 'options' | 'resolveAuth' | 'providerName' | 'discoverModels'>,
): void {
  let userId: AnonymousUserId | undefined
  const options = (): AverQelConnectionOptions => dependencies.options()
  const resolveAuth = async (connection: AverQelConnectionOptions): Promise<AverQelRequestAuth> => dependencies.resolveAuth(connection as C)
  const adapterOptions: AverQelAdapterOptions = {
    providerName: dependencies.providerName,
    options,
    resolveAuth,
    resolveApiKey: async connection => (await resolveAuth(connection)).headers['x-api-key'] ?? '',
    resolveUserId: () => userId ??= getOrCreateAnonymousUserId(),
    resolveAttachments: () => ctx.get('attachments'),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(
      attachments, hostPath => ctx.get('fs')?.processPathFromHostPath(hostPath), ref,
    ),
    prepareExtensions: request => ctx.get('deepseekLlmApiExtensions')?.prepare(request)
      ?? Promise.resolve({ fields: {}, accept: () => Promise.resolve() }),
  }
  const registration = ctx.llm.registerAdapter([provider], new AverQelAdapter(adapterOptions))
  ctx.on('loader/volatile-update', () => { registration.replace([provider]) })
}
