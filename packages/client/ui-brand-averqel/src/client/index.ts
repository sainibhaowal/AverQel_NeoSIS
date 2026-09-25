/** AverQel NeoSIS brand occupants for the generic browser-brand slots. */
import type { Context as ClientContext } from '@averqel/cordis'
import type {} from '@averqel/neosis-client-ui-renderer/client'
import type {} from '@averqel/neosis-client-ui-sidebar/client'
import { AverQelBrandMark, AverQelBrandName } from './Brand.tsx'

/** Required service: the UI slot registry. */
export const inject = ['slots']

/**
 * Fill the sidebar brand slots as one declaration-aware registration set.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', function* () {
      yield ctx.slots.register({ name: 'sidebar.brand.mark' }, AverQelBrandMark)
      yield ctx.slots.register({ name: 'sidebar.brand.name' }, AverQelBrandName)
    }))
}