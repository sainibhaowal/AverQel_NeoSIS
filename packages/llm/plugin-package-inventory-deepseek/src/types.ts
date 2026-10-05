/** Wire types for the active AverQel plugin package inventory. */

/** One exact active plugin package version. */
export interface AverQelPluginPackageIdentity {
  readonly name: string
  readonly version: string
}

/** Versioned full package inventory carried by each official AverQel request. */
export interface AverQelPluginPackageInventoryExtension {
  readonly version: 1
  readonly packages: readonly AverQelPluginPackageIdentity[]
}

declare module '@averqel/neosis-deepseek-llm-api-extensions/types' {
  interface AverQelLlmApiExtensionMap {
    neosis_plugin_packages: AverQelPluginPackageInventoryExtension
  }
}
