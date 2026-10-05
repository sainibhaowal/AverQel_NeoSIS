/**
 * Virtual root of the worker host's in-memory filesystem. Kept
 * in one module so the process shim, the path/os shims, and the VFS image
 * collector cannot drift apart.
 */

/** Virtual filesystem root; `process.cwd()` and every absolute path start here. */
export const NEOSIS_ROOT = '/neosis'

/** `$NEOSIS_HOME`: durable-state directory inside the image. */
export const NEOSIS_HOME = `${NEOSIS_ROOT}/home`

/** Flat, symlink-free package tree resolved by the worker module loader. */
export const NEOSIS_NODE_MODULES = `${NEOSIS_ROOT}/node_modules`

/** Directory holding the composed cordis.yml. */
export const NEOSIS_CONFIG = `${NEOSIS_ROOT}/config`

/** Default (empty) workspace directory. */
export const NEOSIS_WORKSPACE = `${NEOSIS_ROOT}/workspace`

/** Temporary directory reported by `os.tmpdir()`. */
export const NEOSIS_TMP = `${NEOSIS_ROOT}/tmp`
