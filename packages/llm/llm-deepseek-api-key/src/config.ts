/** API-key provider configuration shares the protocol resolver with the default route. */
import type { LaunchEnvironmentSnapshot } from '@averqel/neosis-launch-environment'
import { Config as ProtocolConfig, plainOptions as protocolOptions, resolveAdapterOptions as resolveProtocolOptions } from '@averqel/neosis-llm-deepseek'
import type { Options as ProtocolOptions, DeepSeekConnectionOptions } from '@averqel/neosis-llm-deepseek'

/** Messages configuration for the API-key route. */
export type Config = ProtocolConfig
/** Validated schema shared with the protocol provider. */
export const Config = ProtocolConfig
/** Plain deployment inputs for the API-key provider. */
export type Options = ProtocolOptions
/** Endpoint facts resolved from one configuration generation. */
export type ResolvedDeepSeekOptions = DeepSeekConnectionOptions

/**
 * Read one validated provider configuration.
 * @param config - Validated API-key provider configuration.
 * @returns Plain protocol options for the provider.
 */
export function plainOptions(config: Config): Options { return protocolOptions(config) }
/**
 * Resolve protocol settings against the trusted launch environment.
 * @param config - Plain provider options.
 * @param environment - Trusted launch-environment values, when supplied.
 * @returns Resolved endpoint and credential settings for one configuration generation.
 */
export function resolveAdapterOptions(config: Options, environment?: LaunchEnvironmentSnapshot): ResolvedDeepSeekOptions {
  return resolveProtocolOptions(config, environment)
}
