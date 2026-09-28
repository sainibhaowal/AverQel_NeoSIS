# averqel-neosis-runtime-bin

English | [中文](README.zh.md)

Platform runtime wheel for the AverQel NeoSIS Python SDK. It packages the normal `neosis` CLI and its closed Node dependency tree into a native executable, so SDK use requires no system Node.js. This package publishes wheels only.

## Installed commands and artifacts

The wheel installs a `neosis` console command and the `averqel_neosis_runtime` Python module. `neosis` forwards its arguments to the bundled executable and requires a non-empty `NEOSIS_HOME`; it never falls back to `~/.neosis`.

Production executables are named `averqel-neosis-sdk-runtime-<platform>-<arch>` under the module's `runtime/` directory; Windows uses the `.exe` suffix. Linux and macOS wheels include a target-native `-rg` sidecar, Windows includes `-rg.exe`, and macOS also includes `-spawn-helper` for `node-pty`. Published targets are Linux x64, Linux arm64, macOS arm64, macOS x64, and Windows x64. The wheel tag and payload must match exactly; no Windows arm64 wheel is published.

Office conversion uses the system-installed LibreOffice executable available to the target machine. The runtime wheel does not bundle an Office engine or download one. Install LibreOffice and ensure `soffice` is on `PATH`, or configure the NeoSIS Office provider with an absolute executable path.

Each wheel also includes `<platform>-<arch>/primary-runtime/` (CPython and the locked Office Python libraries) and sibling `office-skills/` (three default workflows and their shared checker). These are ordinary relocatable files, not bytes embedded in the executable. The shared builder selects target-native archives for all five wheel targets and executes its smoke on the native build host. Packaging and installed-runtime lookup reject missing resources, wrong-platform metadata, and lost Python executable permissions. The short platform directory avoids repeating the executable name in Python DLL paths on Windows.

The packaged bootstrap supplies `NEOSIS_BUNDLED_PRIMARY_RUNTIME` as a carrier default. The `sdk` profile uses it when `NEOSIS_PRIMARY_RUNTIME` is unset; an explicit path overrides it, and an empty string disables the query and Office provider. External payloads retain the `primary-runtime/` plus sibling `office-skills/` layout. The SDK reads Python in place without copying it into `NEOSIS_HOME`. Source and dev-only Node carriers have no bundled default; they use an explicit `NEOSIS_PRIMARY_RUNTIME`.

Skill selection is independent of delivery: project, custom-directory, and user filesystem skills override same-name bundled skills. An SDK patch can disable only the Office provider while retaining the Python query:

```yaml
- id: skill-office
  disabled: true
```

To replace the three Office workflows and shared checker as a set, patch `skill-office.config.assetRoot` to another absolute resource directory. Use the filesystem skill provider for arbitrary skill collections. Configuration patches apply at process startup; changing skills does not require rebuilding the runtime wheel or Python environment.

Repository builds also materialize a dev-only `runtime/node/` carrier. It runs `node runtime/node/node_modules/@averqel/neosis/lib/bin.js` on system Node 22.19 or newer. It is never selected automatically and is excluded from wheels and sdists.

Both carriers execute the same `neosis` grammar and shipped profiles, including the standalone `sdk-minimal` tree and the full `web` profile with its frontend assets. The private `neosis-python-runtime-closure` manifest defines the packaged dependency closure; there is no Python-specific Node application or checked-in default `cordis.yml`.

## Python module API

- `bundled_package_dir() -> Path` returns the installed module-data root and verifies its release metadata.
- `bundled_runtime_path() -> Path` returns the current platform executable and verifies the required ripgrep and authoring resources.
- `resolve_bundled_launch_args(mode=None) -> tuple[str, ...]` returns the executable argv by default. Explicit `mode="node"` or `NEOSIS_RUNTIME_MODE=node` selects the repo-only Node carrier.
- `main()` implements the installed `neosis` console command and rejects an absent or blank `NEOSIS_HOME`. On Windows it waits for the bundled process with inherited standard streams and forwards its exit status; on POSIX it replaces the Python process.

Unsupported platforms and missing executables or resources raise `FileNotFoundError` with the build and installation routes. Unknown runtime modes raise `ValueError`.

## Packaged profile resolution

`neosis` initializes shipped profiles under the explicit home, composes their bundle patches, and loads bundled plugins from the executable's virtual filesystem. Runtime resolution uses an in-memory generation instead of disk symlinks or proxy packages. Fallback imports use recorded declaring-package paths, including paths inside the executable's virtual filesystem, so built-in rows and external plugin peers share the bundled Cordis/module instance. Native shared libraries and Windows ConPTY addons are packaged with native addons, while ripgrep and the macOS PTY helper remain executable sidecars.

The Python runtime uses the system LibreOffice executable through the NeoSIS Office provider. The runtime wheel adds no Office download, engine packaging, or compilation.

External profile management uses `neosis plugin --profile <name> ...`. That command requires `pnpm` on `PATH`; ordinary SDK/profile execution does not.

## Build and distribution

Production deployment permits unused workspace patches for packages outside the runtime closure; patches for included packages must still apply successfully. This exception is confined to the deploy command; repository installation still rejects unused patches.

From the repository root, `pnpm exec tsx scripts/build-exe-for-python-sdk.ts` verifies the closure, builds packages, deploys a symlink-free tree, packages the selected target, and syncs the executable and ripgrep/PTY sidecars into this module. `scripts/build-python-release.py` stages release-shaped wheels at the root repository version and pins `averqel-neosis-sdk` to the exact runtime version.

The installed-wheel smoke creates a clean virtual environment outside the checkout, proves the installed distribution and executable identities, then exercises default and customized SDK profiles, external plugins, MCP, native tools, direct JSON-RPC, committed snapshots, and the real provider on trusted runs. Its Office scenario relocates the target payload and converts DOCX through the system LibreOffice executable. See the [Python contributor workflow](../development.md) and [installed-wheel testing decision](../../.agents/notes/implemented/testing/2026-08-23-installed-python-wheel-black-box-ci.md).
