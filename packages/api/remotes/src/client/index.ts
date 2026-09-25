/** Platform-neutral assembly of generated Host Remote contributions. */

import type { Context } from '@averqel/cordis'
import agentPresetsRemote from '@averqel/neosis-agent-preset-registry/remote'
import commandsRemote from '@averqel/neosis-commands/remote'
import accountRemote from '@averqel/neosis-api-account-controller/remote'
import settingsControllerRemote from '@averqel/neosis-api-settings-controller/remote'
import officeToPdfRemote from '@averqel/neosis-office-to-pdf/remote'
import goalsRemote from '@averqel/neosis-goal/remote'
import llmRemote from '@averqel/neosis-llm/remote'
import dynamicRemote from '@averqel/neosis-cordis-host-runner/remote'
import pluginManagerRemote from '@averqel/neosis-plugin-manager/remote'
import pluginRegistryProbeRemote from '@averqel/neosis-client-ui-plugin-manager/remote'
import pluginInventoryRemote from '@averqel/neosis-host-plugin-inventory/remote'
import messageFeedbackRemote from '@averqel/neosis-message-feedback/remote'
import permissionPresetsRemote from '@averqel/neosis-permission-presets/remote'
import sessionFeedbackRemote from '@averqel/neosis-command-feedback/remote'
import fileUploadsRemote from '@averqel/neosis-client-file-upload/remote'
import sessionReferencesRemote from '@averqel/neosis-session-reference/remote'
import subagentsRemote from '@averqel/neosis-subagent/remote'
import sessionRemote from '@averqel/neosis-api-session-controller/remote'
import jobRemote from '@averqel/neosis-api-job-controller/remote'
import workspaceRemote from '@averqel/neosis-api-workspace-controller/remote'
import terminalRemote from '@averqel/neosis-api-terminal-controller/remote'
import workspaceFilesRemote from '@averqel/neosis-api-workspace-files/remote'
import type { ClientRemote } from '@averqel/neosis-api-gateway/client'

export type { ClientRemote } from '@averqel/neosis-api-gateway/client'
export type {
  BundleInfo, BundleRowInfo, ChangeResult, InspectOptions, InstallBundleOptions, InstallSpecKind, ManagementError, PackageResult,
  PluginChange, PluginEntryId, PluginInfo, PluginInspectProblem, PluginInstallCancellation, PluginInstallFailureKind,
  PluginInstallLogChunk, PluginInstallProgress, PluginInstallRequestId, PluginRegistries, PluginSpecInspection, ReadOnlyReason, Registry,
} from '@averqel/neosis-plugin-manager/types'
export type {} from '@averqel/neosis-plugin-manager/remote'
export type {} from '@averqel/neosis-client-ui-plugin-manager/remote'
export type { PluginInventorySnapshot } from '@averqel/neosis-host-plugin-inventory/types'
export type {} from '@averqel/neosis-agent-preset-registry/remote'
export type {} from '@averqel/neosis-commands/remote'
export type {} from '@averqel/neosis-api-settings-controller/remote'
export type {} from '@averqel/neosis-api-account-controller/remote'
export type {} from '@averqel/neosis-goal/remote'
export type {} from '@averqel/neosis-office-to-pdf/remote'
export type {} from '@averqel/neosis-llm/remote'
export type {} from '@averqel/neosis-host-plugin-inventory/remote'
export type {} from '@averqel/neosis-message-feedback/remote'
export type {} from '@averqel/neosis-permission-presets/remote'
export type {} from '@averqel/neosis-command-feedback/remote'
export type {} from '@averqel/neosis-client-file-upload/remote'
export type {} from '@averqel/neosis-session-reference/remote'
export type {} from '@averqel/neosis-subagent/remote'
export type * from '@averqel/neosis-subagent/client'
export type {} from '@averqel/neosis-api-session-controller/remote'
export type * from '@averqel/neosis-api-session-controller/types'
export type {} from '@averqel/neosis-api-job-controller/remote'
export type * from '@averqel/neosis-api-job-controller/types'
export type {} from '@averqel/neosis-api-workspace-controller/remote'
export type * from '@averqel/neosis-api-workspace-controller/types'
export type {} from '@averqel/neosis-api-workspace-files/remote'
export type * from '@averqel/neosis-api-workspace-files/types'
export type {} from '@averqel/neosis-api-terminal-controller/remote'
export type * from '@averqel/neosis-api-terminal-controller/types'
// The forwarded-event allowlist's selection seat: without it in the consumer's
// compilation face `TypertRemoteEvent` is `never` and every `$on` call fails.
export type { ApiRemoteForwardedEvent } from '../types.ts'
// The owner packages' client-safe `./types` exports supply the `Events`
// signatures `$on` hands to a listener, so a consumer reads the very
// declaration the Host emits rather than a flattened restatement of it.
export type {} from '@averqel/neosis-commands/types'
export type {} from '@averqel/neosis-cordis-host-runner/types'
export type {} from '@averqel/neosis-credentials/types'
export type {} from '@averqel/neosis-llm/types'
export type {} from '@averqel/neosis-agent-preset-registry/types'
export type {} from '@averqel/neosis-permission-presets/types'
export type {} from '@averqel/neosis-settings/types'
export type {} from '@averqel/neosis-user-approval/types'
export type {} from '@averqel/neosis-user-questions/types'
export type {} from '@averqel/neosis-api-session-controller/types'

/**
 * The carrier's Client-facing types, re-exported so a business package names one
 * assembly package instead of both this facade and the Connection plugin. Type-only:
 * the carrier's runtime values stay behind their own module edge.
 */
export type {
  ConnectionHandle, ConnectionSinks, ContentBlock,
  MessageId,
  RpcId, RpcRequest, RpcResponse, RpcResult, SessionId,
  StreamChunk,
} from '@averqel/neosis-client-connection/client'
export type {} from '@averqel/neosis-api-gateway/client'
export type {} from '@averqel/neosis-cordis-host-runner/remote'

// The payload vocabulary of the selected namespaces, re-exported so a Client
// contribution can name what it sends and receives without importing a Host
// package: this assembly is the one place both planes legitimately meet.
export type {
  ApprovalRequestId,
  CordisHalfState,
  CordisDynamicPackageId,
  CordisDynamicPluginId,
  CordisDynamicPluginRunId,
  CordisDynamicRunMode,
  CordisInspectMethodManifest,
  CordisInspectPlatform,
  CordisInspectProviderManifest,
  CordisInspectProviderView,
  CordisInspectQueryRequest,
  CordisInspectQueryResolution,
  CordisInspectQueryResolved,
  CordisInspectRequestId,
  CordisInspectResolveAck,
  CordisRunDiagnostic,
  CordisRunStatus,
  DynamicCordisClientSource,
  DynamicCordisHostHalfResult,
  DynamicCordisInventoryRow,
  DynamicCordisInvokeResult,
  DynamicCordisPackage,
  DynamicCordisRequestResolved,
  DynamicCordisResolveAck,
  DynamicCordisRetracted,
  DynamicCordisRunRequest,
  DynamicCordisRunResolution,
  DynamicCordisRunAttempt,
  DynamicCordisRunResponse,
  DynamicCordisStopResponse,
  DynamicCordisUndefineReceipt,
  RequestRunOutcome,
} from '@averqel/neosis-cordis-host-runner/types'
// Credential state vocabulary for the credentials namespace (values never ride it).
export type { CredentialInfo } from '@averqel/neosis-credentials/types'
// Redacted namespace vocabulary for the settings namespace (secrets never ride
// it). It travels with its seam, whose `./types` the Client face already reads.
export type {
  SettingsDescribeValue, SettingsNamespaceView, SettingsPathOpView, SettingsSecretView,
} from '@averqel/neosis-settings/types'
// Provider registry and discovery vocabulary for the llm namespace.
export type {
  LlmConfigurableProvider, LlmDiscoveredModel,
  LlmModelDiscoveryRequest, LlmProviderInfo,
} from '@averqel/neosis-llm/types'
// Reference-discovery result vocabulary for the fileReferences and
// sessionReferenceResolver namespaces.
export type { FileReferenceCandidate } from '@averqel/neosis-file-reference/types'
export type { SessionReferenceMentionCandidate } from '@averqel/neosis-session-reference/types'

// The Remote failure vocabulary, re-exported so business packages keep naming
// this assembly alone. Types only: a value export would make spec imports load
// this module's owner /remote artifacts; specs take RemoteError from
// neosis-client-test-runtime instead.
export type {
  RemoteErrorCode, RemoteErrorDetailsMap, RemoteFailure, RemoteResult,
} from '@averqel/neosis-typert-protocol'
export type { RemoteHostFacts } from '@averqel/neosis-api-gateway/client'

declare module '@averqel/cordis' {
  interface Context {
    /** Generated Remote namespaces selected by this Client assembly. */
    remote: ClientRemote
  }
}

/** Required service: the typed Client Remote contribution mount. */
export const inject = ['remote']

/**
 * Mount the Host capabilities explicitly selected for this Client assembly.
 * @param ctx - Client Cordis root carrying the typed API service.
 * @returns disposer after every selected Remote namespace is ready.
 */
export async function apply(ctx: Context): Promise<() => Promise<void>> {
  const disposers: Array<() => Promise<void>> = []
  try {
    for (const contribution of [
      agentPresetsRemote, commandsRemote, settingsControllerRemote, accountRemote, goalsRemote, llmRemote, dynamicRemote,
      pluginInventoryRemote, pluginManagerRemote, pluginRegistryProbeRemote, messageFeedbackRemote, sessionFeedbackRemote,
      fileUploadsRemote, sessionReferencesRemote,
      permissionPresetsRemote, subagentsRemote, sessionRemote, jobRemote, workspaceRemote, workspaceFilesRemote, terminalRemote,
      officeToPdfRemote,
    ]) {
      disposers.push(await ctx.remote.$mount(contribution))
    }
  } catch (error) {
    for (const dispose of disposers.reverse()) await dispose()
    throw error
  }
  // Unwound in reverse mount order, so a namespace never outlives one mounted
  // after it.
  return async () => {
    for (const dispose of disposers.reverse()) await dispose()
  }
}
