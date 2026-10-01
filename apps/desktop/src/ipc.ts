/** Typed preload operations exposed only by the Electron shell. */

import type { IpcMainInvokeEvent } from 'electron'
import type { DesktopBrowserBridge } from '@averqel/neosis-client-ui-sidebar-browser/types'
import type { DesktopKeyboardApi, DesktopShortcutsApi } from '@averqel/neosis-client-shortcuts/protocol'

/** IPC channel names kept private to the desktop application bundle. */
export const DESKTOP_IPC = {
  shortcutsInput: 'neosis-desktop:shortcuts-input',
  shortcutsCloseWindow: 'neosis-desktop:shortcuts-close-window',
  shortcutsGet: 'neosis-desktop:shortcuts-get',
  shortcutsEdit: 'neosis-desktop:shortcuts-edit',
  shortcutsChanged: 'neosis-desktop:shortcuts-changed',
  shortcutsRecording: 'neosis-desktop:shortcuts-recording',
  boot: 'neosis-desktop:boot',
  enterWorkspace: 'neosis-desktop:enter-workspace',
  bootFailed: 'neosis-desktop:boot-failed',
  browserAcquire: 'neosis-desktop:browser-acquire',
  browserRelease: 'neosis-desktop:browser-release',
  browserOpenRequested: 'neosis-desktop:browser-open-requested',
  directoryPick: 'neosis-desktop:directory-pick',
  localeBootstrap: 'neosis-desktop:locale-bootstrap',
  localeChanged: 'neosis-desktop:locale-changed',
  updatesStatus: 'neosis-desktop:updates-status',
  updatesOpen: 'neosis-desktop:updates-open',
  updatesPresentation: 'neosis-desktop:updates-presentation',
  nativeThemeSet: 'neosis-desktop:native-theme-set',
  windowFullscreen: 'neosis-desktop:window-fullscreen',
  windowsAppearance: 'neosis-desktop:windows-appearance',
  windowsMenu: 'neosis-desktop:windows-menu',
} as const

/** Desktop release update state rendered by desktop-owned UI. */
export type DesktopUpdatePreparationFailureKind = 'stop-failed' | 'tasks-changed' | 'tasks-unavailable'

export interface DesktopUpdateState {
  readonly phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'installing' | 'ready' | 'error'
  readonly version?: string
  readonly message?: string
  /** Main-owned diagnostics without subprocess output or credentials; hidden until expanded. */
  readonly technicalDetails?: string
  readonly percent?: number
  readonly failedOperation?: 'check' | 'download' | 'install'
  /** Main-owned preparation cause; UI wording is selected by the active locale. */
  readonly preparationFailure?: DesktopUpdatePreparationFailureKind
}

/** Classified failure copy selected by the Web locale without exposing raw updater diagnostics. */
export type DesktopUpdateFailureKind =
  | 'check'
  | 'check-network'
  | 'download'
  | 'download-network'
  | 'install'
  | 'install-network'
  | 'stop-failed'
  | 'tasks-changed'
  | 'tasks-unavailable'

/** Semantic status content; actions open main-process confirmation dialogs only. */
export interface DesktopUpdatePresentation {
  readonly phase: DesktopUpdateState['phase']
  readonly version?: string
  readonly percent?: number
  readonly failure?: DesktopUpdateFailureKind
}

/** Product documents cannot supply update versions, package URLs, or installation authorization. */
export interface NeosisDesktopProductApi {
  readonly protocolVersion: 1
  readonly browser: DesktopBrowserBridge
  readonly keyboard: DesktopKeyboardApi
  readonly shortcuts: DesktopShortcutsApi
  readonly updates: {
    status(): Promise<DesktopUpdatePresentation>
    open(): Promise<void>
    subscribe(listener: (state: DesktopUpdatePresentation) => void): () => void
  }
}

/** Scheme of Desktop-owned application documents. */
export const SCHEME = 'neosis-app'

/**
 * Reject IPC outside the allowed Desktop document origins.
 * @param event - IPC caller whose frame URL supplies the origin.
 * @param hostnames - Desktop document hosts allowed for this operation.
 */
export function assertDesktopSender(event: IpcMainInvokeEvent, hostnames: readonly string[]): void {
  const senderFrame = event.senderFrame
  if (senderFrame === null) throw new Error('neosis desktop: rejected IPC without a sender frame')
  const url = new URL(senderFrame.url)
  if (url.protocol !== `${SCHEME}:` || !hostnames.includes(url.hostname)) {
    throw new Error('neosis desktop: rejected IPC from an unowned renderer')
  }
}
