# `@averqel/neosis`

English

The `neosis` command is the sole supported Node application launcher: profiles are ordered stacks of plugin-bundle patch layers under the user's own overrides. SDK and ACP are profiles, not separate public bins. The Python runtime wheel packages this same command; the SDK defaults to `sdk`, and the minimal example selects `sdk-minimal`. [`src/args.ts`](src/args.ts) owns the command grammar, and [`src/bin.ts`](src/bin.ts) loads only the selected runner. Invalid commands, options from another mode, and fatal configuration or boot failures exit nonzero.

## Entry modes

| Command | Purpose |
|---|---|
| `neosis <name>` / `neosis --profile <name>` | Boot the named profile under `$NEOSIS_HOME/profiles/<name>`. |
| `neosis --profile <name> --from-default-profile <template>` | Create a new custom profile from a shipped template, then boot it. |
| `neosis --profile acp` | Serve automation clients over ACP stdio until disconnect. |
| `neosis --profile headless "job"` | Run one fresh persisted session, print the final answer, and exit. |
| `neosis --profile sdk` | Serve SDK clients over JSON-RPC stdio until shutdown or disconnect. |
| `neosis --profile sdk-minimal` | Serve SDK clients with the standalone minimal agent tree. |
| `neosis web` | Boot the Web profile. |
| `neosis plugin --profile <name> <pnpm args>` | Manage a profile's plugins by forwarding to pnpm in the profile directory. |

The invoking directory is the default workspace root. The `web`, `headless`, `sdk`, `sdk-minimal`, and `acp` profiles auto-initialize on first use from shipped templates. Create another profile at an unused, non-shipped name with `--from-default-profile`, or initialize a base-backed profile through `neosis plugin`. The `desktop` name is reserved for the Electron-owned profile, so the CLI rejects boot, config-dump, and plugin-management requests for it.

## App arguments

The launcher parses only its own flags and hands everything after them to the booted profile, where any injected app plugin may parse the shared immutable snapshot ([`neosis-cmdline`](../../packages/boot/cmdline/README.md)). The first token the launcher does not recognize starts the app's arguments:

```sh
neosis --profile web --port 8080       # --port belongs to the web app
neosis --profile tui --resume <id>     # example, assuming the tui profile is installed; --resume belongs to the terminal app
neosis --profile headless "run the tests"
neosis --profile web --help            # the web app's flags, not the launcher's
neosis --help                          # the launcher's own help
```

<a id="profiles"></a>
## Profiles

A profile directory holds a `package.json` (out-of-tree plugin dependencies plus the profile manifest `neosis.profile` with its ordered `bundles` list) and a `cordis.patch.yml` (the user's own patch layer). `neosis-hmr`, when enabled in YAML, watches the profile manifest and both profile and home patch files, then recomposes all layers through one serialized reload. Without HMR, changes apply on restart. Edits arriving during watcher registration use the same nonfatal reload reporting as later edits. [Plugin Manager](../../packages/boot/plugin-manager/README.md) shares package operations and the profile write lock with `neosis plugin`; package updates retain disabled bundle selections. CLI package commands inherit authentication variables and terminal descriptors, including interactive build approval; service calls retain their scrubbed environment and captured diagnostics.

The tree composes over an empty root:
- each bundle's patch in `neosis.profile.bundles` order
- then the profile's `cordis.patch.yml`, then the home-level `$NEOSIS_HOME/cordis.patch.yml`
- then `--patch` overlays

Bundles named in `neosis.profile.bundles` resolve from the neosis installation first (`@averqel/neosis-base`, `@averqel/neosis-web-app`, `@averqel/neosis-headless`, `@averqel/neosis-sdk-app`, `@averqel/neosis-sdk-minimal`, `@averqel/neosis-acp-app`), then from the profile's own `node_modules`, where pnpm installs out-of-tree plugins.

Use `--dump-default-config` and `--dump-config` to inspect the composed tree without booting it. `--dump-config-schema` imports the composed tree's declared plugin schemas and prints JSON Schema for entries and patches instead of configuration values; read the [schema-dump safety and scope](reference/README.md#config-schema-dump) before inspecting untrusted plugins.

The [CLI behavior reference](reference/README.md) owns exact layer precedence, flags, shutdown behavior, deployment defaults, and source execution. The [startup and reload failure table](../../packages/boot/app-boot/README.md#startup-and-reload-failures) compares optional and required plugin failures with configuration HMR.

## Optional overlays

`config/examples/` ships opt-in overlays for GitHub review webhooks, session-local Schedule, memory MCP servers, and runtime Cordis tools. They are never part of a default profile; the [user guides](../../docs/user/guide/index.md) and [developer practice guides](../../docs/user/develop/practice/index.md) own setup and safety instructions.

## Development

Production runs require built package and frontend artifacts. From the repository root, run `pnpm run build` separately, then use `pnpm neosis <args...>` to run the TypeScript entry and forward every argument; the [source-execution reference](reference/README.md#source-execution) owns the module-resolution contract.

The `@averqel/neosis/profile-boot` export provides the shared profile lifecycle to the Desktop host. A resolved application profile supplies its own installation anchor for runtime package resolution while retaining the Harness home patch, proxy environment, telemetry switch, patch reload, and bounded shutdown.

The [Web failure matrix](tests/profiles/web/tests/web-failure-matrix.expected.e2e.ts) runs the built CLI through startup failures and native configuration HMR with `awaitWriteFinish` enabled in `test:expected`. It verifies authenticated HTTP responses, diagnostics, recovery, process exits, and disposal without model API calls; the [startup acceptance](tests/profiles/web/tests/web-best-effort-startup.expected.e2e.ts) also covers the shipped required Web dependencies and port conflicts.
