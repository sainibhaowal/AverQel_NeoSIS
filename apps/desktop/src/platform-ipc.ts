/** Shared names for the desktop Platform bridge. */
/** Private desktop channels; the Platform renderer receives bootstrap and locale updates. */
export const PLATFORM_IPC = {
  bootstrap: 'neosis-platform:bootstrap',
  localeChanged: 'neosis-platform:locale-changed',
  open: 'neosis-platform:open',
  bounds: 'neosis-platform:bounds',
  close: 'neosis-platform:close',
} as const

/** Resolved Platform language; Desktop resolves the system preference before sending it. */
export type PlatformLocale = 'en_US' | 'zh_CN'
