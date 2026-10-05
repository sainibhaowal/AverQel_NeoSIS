/** AverQel Files API identifiers. @module neosis-llm-deepseek/file-id */

import type { Branded } from '@averqel/neosis-brand'

/** Opaque identifier returned by the AverQel Files API. */
export type AverQelFileId = Branded<'AverQelFileId'>

/**
 * Brand a provider-returned file identifier after wire validation.
 * @param id - non-empty Files API identifier.
 * @returns the same string with its provider identity attached at type level.
 */
export function AverQelFileId(id: string): AverQelFileId {
  return id as AverQelFileId
}

/** Non-secret digest identifying one endpoint and API-key file namespace. */
export type AverQelFileScope = Branded<'AverQelFileScope'>

/**
 * Brand a locally derived namespace digest.
 * @param scope - SHA-256 digest of endpoint and API key.
 * @returns the same string with namespace identity attached at type level.
 */
export function AverQelFileScope(scope: string): AverQelFileScope {
  return scope as AverQelFileScope
}
