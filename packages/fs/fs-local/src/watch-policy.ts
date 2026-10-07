/**
 * Return the Chokidar polling option for a missing target on macOS.
 * @param platform The current Node.js platform.
 * @param targetExists Whether the target existed before the watcher started.
 * @returns The polling option for the macOS missing-target case, or no options otherwise.
 */
export function missingTargetWatchOptions(platform: NodeJS.Platform, targetExists: boolean): { usePolling: true } | {} {
  // macOS FSEvents can miss a target created by atomic rename after the parent
  // watch is ready. Poll only for that initially missing target.
  return platform === 'darwin' && !targetExists ? { usePolling: true } : {}
}
