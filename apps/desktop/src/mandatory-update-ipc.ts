/** Dependency-free IPC names shared with the sandboxed mandatory-update preload. */
export const MANDATORY_IPC = {
  status: 'neosis-desktop:mandatory-status', state: 'neosis-desktop:mandatory-state', action: 'neosis-desktop:mandatory-action',
} as const
