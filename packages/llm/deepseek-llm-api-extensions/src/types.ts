/** Provider-specific JSON and contribution types for AverQel request extensions. */

/** Lossless JSON value accepted by the AverQel request body. */
export type AverQelLlmApiJson =
  | null
  | boolean
  | number
  | string
  | AverQelLlmApiJson[]
  | { [key: string]: AverQelLlmApiJson }

/**
 * Merge-extensible table of top-level AverQel request extension fields.
 * Contributor packages declaration-merge the field they own.
 */
export interface AverQelLlmApiExtensionMap {}

/** Exact serialized request facts visible to extension providers. */
export interface AverQelLlmApiExtensionRequest {
  /** Base AverQel request body before extension fields are merged. */
  readonly body: Readonly<Record<string, AverQelLlmApiJson>>
  /** Session identity carried by the model request, when present. */
  readonly sessionId?: string
  /** Auxiliary request classification, when present. */
  readonly purpose?: 'compaction' | 'session-title'
  /** Cancellation for request preparation; providers must stop promptly after abort. */
  readonly signal: AbortSignal
}

/** One prepared field value and its optional post-2xx commit. */
export interface PreparedAverQelLlmApiExtension<T extends AverQelLlmApiJson> {
  /** Detached value merged under the provider's registered field. */
  readonly value: T
  /** Commit state that depends on confirmed provider acceptance. */
  accept?(): void | Promise<void>
}

/** Provider registered under one key of {@link AverQelLlmApiExtensionMap}. */
export interface AverQelLlmApiExtensionProvider<T extends AverQelLlmApiJson> {
  /**
   * Prepare one field for an exact serialized request.
   * @param request - immutable base request facts.
   * @returns the prepared field, or `undefined` when this request has no value for it.
   */
  prepare(
    request: AverQelLlmApiExtensionRequest,
  ): PreparedAverQelLlmApiExtension<T> | undefined | Promise<PreparedAverQelLlmApiExtension<T> | undefined>
}

/** All fields prepared for one request plus their joint acceptance transaction. */
export interface PreparedAverQelLlmApiExtensions {
  /** Detached top-level fields to merge into the base request. */
  readonly fields: Readonly<Partial<AverQelLlmApiExtensionMap>>
  /**
   * Commit every captured provider after HTTP 2xx. Repeated calls join the same settlement.
   * @returns fulfillment after every commit succeeds.
   */
  accept(): Promise<void>
}
