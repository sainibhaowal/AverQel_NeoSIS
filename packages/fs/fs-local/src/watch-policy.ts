/** Chokidar options needed when a missing target must be observed reliably. */
export function missingTargetWatchOptions(platform: NodeJS.Platform, targetExists: boolean): { usePolling: true } | {} {
  // macOS FSEvents can miss a target created by atomic rename after the parent
  // watch is ready. Poll only for that initially missing target.
  return platform === 'darwin' && !targetExists ? { usePolling: true } : {}
}
