/** Prepare plugin-contributed request fields and commit their delivery after HTTP acceptance. */

import { LlmError } from '@averqel/neosis-llm'
import type { AverQelLlmApiExtensionRequest, PreparedAverQelLlmApiExtensions } from '@averqel/neosis-deepseek-llm-api-extensions'
import type { AverQelAdapterOptions } from './types.ts'

/**
 * Merge contributions without replacing Messages fields. Preparation and
 * acceptance failures report REQUEST_EXTENSION.
 * @param body - serialized Messages request before extension fields.
 * @param options - request identity, purpose, and cancellation.
 * @param prepare - contributor registry captured for this adapter.
 * @returns HTTP payload and a commit to invoke only after a successful HTTP response.
 */
export async function prepareRequestExtensions(
  body: AverQelLlmApiExtensionRequest['body'],
  options: Omit<AverQelLlmApiExtensionRequest, 'body'>,
  prepare: AverQelAdapterOptions['prepareExtensions'],
): Promise<{ payload: string; accept(): Promise<void> }> {
  let extensions: PreparedAverQelLlmApiExtensions
  try {
    extensions = await prepare({ body, ...options })
  } catch (error) {
    throw new LlmError('AverQel request extension preparation failed', 'REQUEST_EXTENSION', { cause: error })
  }
  for (const field of Object.keys(extensions.fields)) {
    if (Object.hasOwn(body, field)) {
      throw new LlmError(`AverQel request extension field ${JSON.stringify(field)} collides with the base request`, 'REQUEST_EXTENSION')
    }
  }
  return {
    payload: JSON.stringify({ ...body, ...extensions.fields }),
    async accept() {
      try {
        await extensions.accept()
      } catch (error) {
        throw new LlmError('AverQel request extension acceptance failed', 'REQUEST_EXTENSION', { cause: error })
      }
    },
  }
}
