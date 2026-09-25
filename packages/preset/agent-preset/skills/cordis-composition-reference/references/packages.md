# Loadable Harness plugin packages

This file is GENERATED from workspace manifests (`scripts/gen-plugin-packages.ts`) and verified fresh by `pnpm run verify-plugin-packages` (part of `doc-sync`); do not edit it by hand.

Every package below exports a Cordis plugin that a bundle patch can name in a Loader row. `Config` marks packages whose row accepts a `config` mapping; query `Config.listConfigs` through `cordis_inspect_query` (filter by `name`, then query the `entry` id) for the mounted schema. Packages under `experimental` are pre-stable.

## acp

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-acp` | yes | Automation-only Agent Client Protocol server for driving AverQel NeoSIS agents over JSON-RPC stdio |

## api

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-api-account-controller` | no | Expose safe account operations over authenticated Remote |
| `@averqel/neosis-api-gateway` | yes | Typert Remote Host dispatcher and Client API endpoint |
| `@averqel/neosis-api-job-controller` | yes | Job Remote observation stream and the reference-counted client job-output service |
| `@averqel/neosis-api-remotes` | no | Remote BFF assembly for application-selected Host capabilities |
| `@averqel/neosis-api-session-controller` | yes | Session Remote commands, cold reads, and live control transport |
| `@averqel/neosis-api-settings-controller` | yes | Remote owner for the configuration surfaces over the settings-domain seams |
| `@averqel/neosis-api-terminal-controller` | yes | Session-owned interactive terminals with shell discovery, screen recovery and typed Remote control |
| `@averqel/neosis-api-workspace-controller` | yes | Workspace Remote commands and reconnect-safe state transport |
| `@averqel/neosis-api-workspace-files` | yes | Workspace file service and Client resource provider: bounded reads, directory listing, and live metadata over the workspaceFiles Remote namespace |

## attachment

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-attachment-local` | yes | Private content-addressed NEOSIS_HOME attachment storage |

## boot

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-config-editor` | no | Persist plugin configuration through profile patches and Loader reconciliation |
| `@averqel/neosis-hmr` | yes | Coordinated module and profile configuration hot reload |
| `@averqel/neosis-plugin-manager` | yes | Current-profile plugin and bundle management shared by neosis CLI, Web and agent tools |

## browser-use

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-browser-use` | no | Exclusive named browser-use provider registration |

## bundle

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-acp-app` | no | The neosis ACP profile bundle: automation-only JSON-RPC stdio and process lifecycle over neosis-base |
| `@averqel/neosis-headless` | yes | The neosis one-shot bundle: a direct core Agent/Session runner over neosis-base with no Host, HTTP, or browser layer |
| `@averqel/neosis-sdk-app` | yes | The neosis SDK profile bundle: stdio JSON-RPC serving and process lifecycle over neosis-base |
| `@averqel/neosis-web-app` | yes | The neosis browser-surface bundle: the web patch layer over neosis-base plus the runtime glue plugin (frontend dist serving, web-surface prompt, bash runtime variables, URL line) |

## client

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-client-connection` | yes | Authenticated RPC transport and generation lifecycle |
| `@averqel/neosis-client-file-upload` | no | Agent-scoped browser file upload, streaming intake, and staged receipt service |
| `@averqel/neosis-client-hmr` | yes | Web client graph synchronization and rebuilt-bundle reload transport |
| `@averqel/neosis-client-locale` | no | Locale plugin: Host-backed preference, extensible language catalog, browser fallback, and typed built-in dictionaries |
| `@averqel/neosis-client-modules` | no | Client module system, dual-face: node half composes the __NEOSIS_BOOT__ entry graph (incremental neosis.client scan, bundle route, index tap, webPlugins service); browser half is the lazy-CJS module table the vendored cordis Loader consumes as its internal seam |
| `@averqel/neosis-client-resources` | no | Unified client resource model: protocol-registered providers turn URL addresses into live values, consumed through the useResource global standard hook |
| `@averqel/neosis-client-ui-agent-preset` | no | Agent-preset surfaces: the default for later sessions, this session's seat, and the composition editor |
| `@averqel/neosis-client-ui-approval` | no | Approval composer takeover over the scoped Remote Event waterfall |
| `@averqel/neosis-client-ui-attachment` | no | Dynamic attachment presentation plugin for conversation input, message-image, and trajectory image slots |
| `@averqel/neosis-client-ui-brand-official` | no | Official AverQel NeoSIS brand occupants for the Web client's sidebar slots |
| `@averqel/neosis-client-ui-chat` | no | Chat Conversation target, node definitions, renderers, and details surface |
| `@averqel/neosis-client-ui-commands` | no | Client command surface: global directory cache, '/' source, three command UI kinds, popupSelect registry |
| `@averqel/neosis-client-ui-conversation` | no | Target-neutral Conversation assembly, shell, composer, queue, and view navigation |
| `@averqel/neosis-client-ui-deliverables` | no | Changed-files card with per-file comparison tabs, delivery cards, and clickable final-response file references for Web |
| `@averqel/neosis-client-ui-directory-picker-browse` | no | In-app directory browsing surface: the workspace directory-flow owner rendering the host's listing and creation primitives |
| `@averqel/neosis-client-ui-directory-picker-native` | no | Native directory-picker surface: the renderless workspace directory-flow occupant driving the local Desktop or Host OS chooser |
| `@averqel/neosis-client-ui-goal` | no | Session goal surface: GoalBar docked above the composer, read from the goal session projection |
| `@averqel/neosis-client-ui-input-trigger` | no | Input trigger pipeline: '/' and '@' detection, candidate menu, pick routing to registered sources |
| `@averqel/neosis-client-ui-jobs` | no | Session-header background-job list with on-demand streaming record panels |
| `@averqel/neosis-client-ui-layout` | no | Shell plugin: three-column AppFrame with drag handles, ctx.layout viewing-state service (navigation + panels) |
| `@averqel/neosis-client-ui-message-feedback` | no | The Web feedback surface: per-message Like/Dislike in the assistant-message action strip and the feedback dialog behind both ratings and /feedback, backed by the messageFeedback and sessionFeedback Host Remotes |
| `@averqel/neosis-client-ui-model-selection` | no | Model selection over the shared model catalog, Session projection, and session.selectModel |
| `@averqel/neosis-client-ui-open-in-app` | no | Web "Open In..." controls: the Session-header split button opening the workspace directory in an installed application, and the document preview's default-application controls for one file |
| `@averqel/neosis-client-ui-permission-presets` | no | Permission surfaces: a new-session default in General settings and a current-session /permission popup over the permissions projection |
| `@averqel/neosis-client-ui-plan` | no | Plan mode controls, persistent transcript plan cards, and sidebar Markdown previews |
| `@averqel/neosis-client-ui-plugin-manager` | yes | Plugin management for the neosis web client: the sidebar Plugins panel installs, enables, disables, retries, and composes installed plugin packages |
| `@averqel/neosis-client-ui-reference` | no | Unified Web @file and @session reference source |
| `@averqel/neosis-client-ui-renderer` | no | Browser UI renderer: React slot bindings, ctx.uiRenderer, and the assembled application root |
| `@averqel/neosis-client-ui-schedule` | no | Read-only active Schedule catalog in the Web Session header |
| `@averqel/neosis-client-ui-session` | no | Session Controller adapter for React and session-scoped slots |
| `@averqel/neosis-client-ui-settings` | no | Settings domain base plugin: shared configuration forms and the canonical settings slot-type contract |
| `@averqel/neosis-client-ui-settings-account` | yes | Manage AverQel login and open Platform billing pages |
| `@averqel/neosis-client-ui-settings-agent-loop` | no | Settings page of the agent loop on the neosis web client's Plugins page: the parallel tool-call cap of the agent-loop namespace |
| `@averqel/neosis-client-ui-settings-general` | no | Settings ownerless-copy and product onboarding plugin: the General section, shell trigger/header chrome content, settings dictionaries, and the versioned welcome notice |
| `@averqel/neosis-client-ui-settings-models` | yes | Models settings and shared product-onboarding dialogs over existing settings and credential joins |
| `@averqel/neosis-client-ui-settings-plugin-inventory` | no | Read-only Cordis Loader inventory tab in Web Plugins settings |
| `@averqel/neosis-client-ui-settings-plugins` | no | Built-in plugins settings section for the neosis web client: the Settings navigation entry and the tab chrome feature-owned tabs register into |
| `@averqel/neosis-client-ui-settings-shell` | no | Settings page of the shell executor on the neosis web client's Plugins page: the command timeout and the per-stream output cap of the shell namespace |
| `@averqel/neosis-client-ui-settings-subagent` | no | Settings page of Subagent delegation on the neosis web client's Plugins page: recursion depth, parallel capacity, and the models agents may choose for subagents |
| `@averqel/neosis-client-ui-settings-web-search` | no | Settings page of the AverQel web-search provider on the neosis web client's Plugins page: its API key, endpoint, and per-request search budget |
| `@averqel/neosis-client-ui-sidebar` | no | Sidebar plugin: session multi-level tree, search, grouping, state dots |
| `@averqel/neosis-client-ui-sidebar-browser` | no | Sandboxed Web browser tabs for the right Sidebar |
| `@averqel/neosis-client-ui-sidebar-documentpreview` | yes | Extensible Sidebar previews for Office documents, spreadsheets, Markdown, code, images, PDF, HTML, and plain text |
| `@averqel/neosis-client-ui-sidebar-files` | no | Workspace file tree tab type for the right Sidebar: lazy directory listing over the workspaceFiles Remote namespace, opening files into the Sidebar |
| `@averqel/neosis-client-ui-sidebar-right` | no | Right Sidebar: the docking surface's session-bound state, its panel and header expand control, and the navigation service over it |
| `@averqel/neosis-client-ui-sidebar-terminal` | no | Interactive shell tabs for the right Sidebar |
| `@averqel/neosis-client-ui-skill` | no | Web skill references and the dedicated skill tool row |
| `@averqel/neosis-client-ui-subagent` | no | Subagent conversation catalog, continuation routing UI, and '@' reference source |
| `@averqel/neosis-client-ui-theme` | yes | Theme plugin: Host bootstrap for the pre-plugin palette; DOM-free ThemeRuntime for light/dark/system state; --dsw-* token styles and Appearance settings row |
| `@averqel/neosis-client-ui-tool` | no | Client Tool call-tree renderer and keyed per-tool presentation slot |
| `@averqel/neosis-client-ui-trajectory` | no | Trajectory event ledger with an interactive timing overview: pure-consumer plugin registering into the conversation ViewMap (no service) |
| `@averqel/neosis-client-ui-user-questions` | no | Web ask_user_question composer takeover and plan-review presentation UI |
| `@averqel/neosis-client-ui-workflow-run` | no | Durable workflow-run Conversation Node and nested member disclosure for neosis web |
| `@averqel/neosis-client-ui-workspace` | no | Workspace picker plugin: one WorkspacePicker registered into the sidebar and empty-state workspace slots |

## compaction

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-command-compact` | no | Human-facing slash command for explicit session compaction |
| `@averqel/neosis-compaction-basic` | yes | Token-meter-driven compaction policy and LLM summarization backend for the AverQel NeoSIS |
| `@averqel/neosis-compaction-image-offload` | no | Durable image offload for image-capable routes: replace over-budget request images with placeholders and retry |
| `@averqel/neosis-compaction-tool-result-pruner` | yes | Replay-safe model-free head/middle/tail pruning for tool-result surface nodes |

## computer-use

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-computer-use` | no | Exclusive named computer-use provider registration |

## context

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-agent-instructions` | yes | Workspace context loader for AGENTS.md/CLAUDE.md instruction files |
| `@averqel/neosis-file-reference-local` | yes | Local-filesystem ctx.fileReferences provider with bounded fuzzy indexes |
| `@averqel/neosis-session-reference` | yes | Cross-session snapshot references and durable untrusted model context (ctx.sessionReferenceResolver) |
| `@averqel/neosis-time-context` | yes | Opt-in durable per-step context with the current time and elapsed time |
| `@averqel/neosis-tmux-context` | yes | Opt-in durable per-step context with this agent's tmux pane and window location |

## core

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-agent` | no | Agent interface, registry, initiator scope, and event vocabulary for the AverQel NeoSIS |
| `@averqel/neosis-agent-default-model` | yes | Default model selection shared by Agent entry points |
| `@averqel/neosis-agent-loop` | yes | The concrete agent loop plugin for the AverQel NeoSIS |
| `@averqel/neosis-agent-tool-presentation` | yes | Agent-plane presentation selector: composes one agent's tools as PTC mode, native, or both |
| `@averqel/neosis-session` | no | Event-sourced session store for the AverQel NeoSIS |
| `@averqel/neosis-system-prompt` | yes | System prompt assembly registry for the AverQel NeoSIS |
| `@averqel/neosis-tools` | yes | Tool registry and execution pipeline for the AverQel NeoSIS |

## credentials

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-authorization` | no | Authorization seam (ctx.authorization): plugin-owned flows that obtain a credential through a conversation with the human |
| `@averqel/neosis-credentials-local` | yes | File-backed credentials provider ($NEOSIS_HOME/.env under the live process environment) for the AverQel NeoSIS |
| `@averqel/neosis-deepseek-account-platform` | yes | Authorize AverQel accounts through browser PKCE |

## deliverables

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-tool-present` | yes | Explicit workspace file delivery declarations for the AverQel NeoSIS |
| `@averqel/neosis-workspace-changes` | yes | Per-turn workspace file changes recorded from git working-tree snapshots and whole-file captures, with per-file comparisons, for the AverQel NeoSIS |

## document

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-office-to-pdf` | yes | Shared Office-to-PDF conversion with bounded queues and caching |

## experimental

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-experimental-agent-team` | yes | Implicit-root Agent Teams roster, durable peer mailbox, and shared task DAG |
| `@averqel/neosis-experimental-api-speech-to-text` | yes | Authenticated experimental speech transcription for browser clients |
| `@averqel/neosis-experimental-auto-review` | no | Per-tool LLM authorization review for the AverQel NeoSIS Auto permission preset |
| `@averqel/neosis-experimental-browser-use-chrome-devtools-mcp` | yes | Experimental per-Session Chromium browser tools through chrome-devtools-mcp |
| `@averqel/neosis-experimental-browser-use-playwright-mcp` | yes | Experimental per-Session Chromium browser tools through @playwright/mcp |
| `@averqel/neosis-experimental-browser-use-stagehand-native` | yes | Experimental Stagehand browser tools with separately configured native models |
| `@averqel/neosis-experimental-client-ui-agent-team` | no | Web Agent Teams roster, task board, and teammate navigation |
| `@averqel/neosis-experimental-client-ui-voice-input` | no | Record speech and insert editable text into the conversation draft |
| `@averqel/neosis-experimental-computer-use-cua-driver-mcp` | yes | Experimental computer use through an installed Cua Driver MCP executable |
| `@averqel/neosis-experimental-computer-use-cua-driver-native` | no | Experimental computer-use provider embedding the Cua Driver native npm SDK |
| `@averqel/neosis-experimental-inspector` | yes | Experimental cross-realm CDP hub for Host debugging and Client Runtime inspection |
| `@averqel/neosis-experimental-ptc-runtime-python` | yes | CPython subprocess implementation of the AverQel NeoSIS PTC execution seam |
| `@averqel/neosis-experimental-speech-to-text` | yes | Experimental speech recognition with independently selectable providers |
| `@averqel/neosis-experimental-speech-to-text-sensevoice` | yes | Local SenseVoice ONNX transcription with a managed sherpa-onnx process |
| `@averqel/neosis-experimental-tool-agent-team` | yes | Scoped model-facing Agent Teams tools over ctx.agentTeams |

## extensions

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-client-ui-cordis` | no | Cordis dynamic-plugin definition card: the keyed cordis_define tool row with its run/stop switch |
| `@averqel/neosis-cordis-client-runner` | no | Browser half of dynamic dual-half plugin packages: event subscription, closure evaluation, guard facade, and loader entries |
| `@averqel/neosis-cordis-host-runner` | yes | Dynamic package definition registry, host-half sandbox lifecycle, and invoke handler table for model-mounted dual-half packages |
| `@averqel/neosis-tool-cordis` | no | Read-only runtime API inspection for Harness plugin development |

## feedback

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-command-feedback` | no | Log-only session feedback: the record event, the sessionFeedback Host Remote, and the human-facing slash command |
| `@averqel/neosis-message-feedback` | yes | Canonical Session-log ratings and notes for finalized assistant messages |

## fs

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-fs-local` | yes | Local-filesystem implementation of the AverQel NeoSIS filesystem seam (ctx.fs) |
| `@averqel/neosis-fs-observation-policy` | no | File-context policy plugin for the AverQel NeoSIS — observed-state, read-before-edit, and version-guarded write/edit added over the ctx.fs provider seam through the fs/* event gate (no service API) |
| `@averqel/neosis-fs-sandbox` | yes | Sandbox-enforcing implementation of the AverQel NeoSIS filesystem seam: fences write/edit by the per-call sandbox mode (read-only denies mutation, workspace-write contains it to the workspace + temp roots) while reads pass through |
| `@averqel/neosis-tool-fs` | yes | Model-facing filesystem tools (read, write, edit) over the AverQel NeoSIS filesystem seam (ctx.fs) |
| `@averqel/neosis-tool-fs-search` | yes | Model-facing filesystem discovery tools (glob, grep) backed by the packaged ripgrep binary (@vscode/ripgrep) |
| `@averqel/neosis-tool-str-replace-editor` | yes | Model-facing view, create, literal replace, and line insert tool over the Harness filesystem service |

## goal

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-command-goal` | no | Human-facing slash command for persisted same-session goals |
| `@averqel/neosis-goal` | yes | Event-sourced same-session goal state and lifecycle service for the AverQel NeoSIS |
| `@averqel/neosis-goal-round-driver` | no | Race-fenced same-session goal-round driver |
| `@averqel/neosis-tool-goal` | yes | Model-facing same-session goal tools with execution-time authority checks |

## guard

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-repeat-tool-reminder` | yes | Repeat-tool-call guard plugin: advisory reminders when an agent loops on identical tool calls |
| `@averqel/neosis-tool-call-timeout-policy` | no | Tool-call timeout policy: a tools/execute wrapper that arms a per-tool deadline on exec.signal and returns TOOL_TIMEOUT when it wins |

## hooks

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-hooks-claude-code` | yes | Bridge plugin: run a Claude Code hooks.json / settings hook config on the AverQel NeoSIS interception seams |
| `@averqel/neosis-hooks-codex` | yes | Bridge plugin: run a Codex hooks.json hook config on the AverQel NeoSIS interception seams |

## host

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-host-directory-picker-auto` | no | Adaptive chooser of the directory-picker seam: resolves the host situation at boot and mounts the native or browse backend for the AverQel NeoSIS web GUI host |
| `@averqel/neosis-host-directory-picker-browse` | yes | In-app browsing backend of the directory-picker seam (listing/creation primitives over the host filesystem) |
| `@averqel/neosis-host-directory-picker-native` | no | Native-OS-chooser backend of the directory-picker seam for the AverQel NeoSIS web GUI host |
| `@averqel/neosis-host-frontend-static` | yes | SPA dist server for the Web shell: owns the webserver fallback seat, serving explicit index entries and static assets with traversal rejection and 404 misses |
| `@averqel/neosis-host-open-in-app` | yes | Host half of open-in-app: resolved application catalog, icons, and the launch endpoint as three webServer routes |
| `@averqel/neosis-host-plugin-inventory` | no | Read-only Remote projection of current Cordis Loader plugin state |
| `@averqel/neosis-host-product-telemetry-otel` | yes | Explicit product usage events exported through OpenTelemetry HTTP logs |
| `@averqel/neosis-host-webserver` | yes | Web route-registration plugin: HTTP and upgrade routes, index transform taps, and static dist fallback; knows no harness concepts |

## interaction

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-commands` | no | Plugin-owned human command registry for AverQel NeoSIS UIs |
| `@averqel/neosis-permission-presets` | yes | User-facing permission presets (ctx.permissionPresets) for the AverQel NeoSIS: one product-level Permissions select bundling the sandbox-mode and approval-policy knobs, written through to their own session events |
| `@averqel/neosis-tool-ask-user` | no | Model-facing ask_user_question tool over the ctx.userQuestions seam |
| `@averqel/neosis-user-approval` | yes | User-approval seam (ctx.approval) for the AverQel NeoSIS: one-shot permission decisions dispatched to composed answerers over the approval/request waterfall, fail-closed by default |
| `@averqel/neosis-user-questions` | no | Abstract user-questions seam (ctx.userQuestions) for asking the human during agent runs |

## jobs

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-jobs-local` | yes | Process-local implementation of the AverQel NeoSIS background job registry seam |
| `@averqel/neosis-tool-jobs` | yes | Model-facing background job control tools (job_output, job_list, job_kill) over the ctx.jobs registry |

## llm

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-deepseek-llm-api-extensions` | no | Additive request-field registry for the official AverQel LLM API adapter |
| `@averqel/neosis-llm` | no | Provider-neutral LLM service interface for the AverQel NeoSIS |
| `@averqel/neosis-llm-deepseek` | yes | AverQel Messages adapter |
| `@averqel/neosis-llm-pi-ai` | yes | pi-ai-backed AverQel adapter for the AverQel NeoSIS LLM seam (design-verification twin of neosis-llm-deepseek) |
| `@averqel/neosis-llm-retry` | yes | Provider-routed LLM request retry policy for the AverQel NeoSIS |
| `@averqel/neosis-plugin-package-inventory-deepseek` | yes | Active Loader-backed plugin package inventory for official AverQel LLM API requests |
| `@averqel/neosis-token-meter` | yes | Replay-aware token measurement service (ctx.tokenMeter) for the AverQel NeoSIS |

## lsp

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-lsp` | no | Abstract LSP capability seam (ctx.lsp) for the AverQel NeoSIS — language-server provider registry keyed by branded id and extension mapping, order-independent per-query selection, normalized definition/references/implementation/hover requests and results, and the LspError taxonomy |
| `@averqel/neosis-lsp-stdio` | yes | Generic stdio language-server provider for the AverQel NeoSIS LSP capability seam (ctx.lsp) — spawns configured servers, translates JSON-RPC, and serves transient-open goToDefinition/findReferences/goToImplementation/hover queries in the host filesystem namespace |
| `@averqel/neosis-tool-lsp` | yes | Model-facing lsp tool over the AverQel NeoSIS LSP capability seam (ctx.lsp) — one read-only tool with goToDefinition/findReferences/goToImplementation/hover operations, one-based UTF-16 cursor coordinates, bounded location rendering, and hover normalization |

## mcp

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-mcp-client` | yes | MCP client bridge: connects to MCP servers and registers their tools on ctx.tools |
| `@averqel/neosis-mcp-resources` | no | Scoped MCP resource discovery and reading through shared model tools |

## plan

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-plan-mode` | yes | Logged per-agent plan mode with deployment guidance, a direct slash command, and a user-reviewed exit |

## preset

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-agent-preset` | yes | Declare an Agent capability composition in Cordis YAML |
| `@averqel/neosis-agent-preset-registry` | yes | Declarative Agent preset registry and profile-backed editing |
| `@averqel/neosis-persona` | yes | Composition-authored deployment persona section for the AverQel NeoSIS |

## ptc-runtime

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-ptc-runtime-node` | yes | Sandboxed Node process implementation of the AverQel NeoSIS PTC execution capability |

## runtime-diagnostics

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-invariants` | yes | Registry service for package-owned AverQel NeoSIS runtime invariants |

## sandbox

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-sandbox-local` | yes | Local process-sandbox backends for the AverQel NeoSIS sandbox seam: bwrap, the npm-distributed landlock-run launcher, macOS Seatbelt, or the Windows ACL restricted-token runner — functionally probed, fail-closed |
| `@averqel/neosis-sandbox-policy` | yes | Per-call sandbox policy resolver and current model context: deployment fallbacks plus each session's mode and workspace root, shared by every enforcing capability family |

## schedule

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-schedule` | no | Agent-scoped durable after, at, and fixed-rate reminders over the session event log |

## sdk

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-sdk-jsonrpc-server` | yes | Stdio JSON-RPC server plugin for out-of-process AverQel NeoSIS SDK clients |

## session

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-session-checkpoint-policy` | no | Semantic session durability checkpoints before model requests and tool side effects |
| `@averqel/neosis-session-log-deepseek` | yes | Incremental lossless session-log request extension for the official AverQel LLM API |
| `@averqel/neosis-session-persistence-jsonl` | yes | JSONL durable session persistence backend for the AverQel NeoSIS |
| `@averqel/neosis-session-projection` | no | Session-projection seam: the merge-extensible projection type table, the provider contract, and the ctx.sessionProjections registry serving whole current values of log-derived per-session state |
| `@averqel/neosis-session-projection-cache` | yes | Persisted projection cache (ctx.sessionProjectionCache): durable per-session checkpoint records on the session_projcache storage domain (per-record layout), throttled write-behind, and the cached listing read |
| `@averqel/neosis-session-stats` | no | Whole-log conversation counts and wall times projection (sessionStats) for the AverQel NeoSIS |
| `@averqel/neosis-session-telemetry-otel` | yes | OpenTelemetry backend for the AverQel NeoSIS telemetry seam: hands captured session records to the OTel JS SDK's log pipeline |
| `@averqel/neosis-session-title` | yes | Log-backed session title service and provider registry for the AverQel NeoSIS |
| `@averqel/neosis-session-title-all-prompts-llm` | yes | All-user-messages LLM provider plugin for AverQel NeoSIS session titles |
| `@averqel/neosis-session-title-first-prompt-llm` | yes | First-message LLM provider plugin for AverQel NeoSIS session titles |
| `@averqel/neosis-session-turn-outline` | no | Whole-log turn outline projection (turnOutline) for the AverQel NeoSIS |

## session-query

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-session-log-export` | yes | Web Session-log export command and shared download dialog |
| `@averqel/neosis-session-query-sqlite` | yes | Concrete ctx.sessionQuery backend with SQLite FTS5 search |
| `@averqel/neosis-tool-session-query` | yes | Workspace-authorized model-facing session history search, trace, and event read tools |

## settings

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-settings` | no | Abstract user-settings seam (ctx.settings) for the AverQel NeoSIS |

## shell

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-bash-local` | yes | Local-subprocess implementation of the AverQel NeoSIS bash executor seam |
| `@averqel/neosis-bash-sandbox` | yes | Sandbox-consuming implementation of the AverQel NeoSIS bash executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@averqel/neosis-pwsh-local` | yes | Local PowerShell implementation of the AverQel NeoSIS bash executor seam |
| `@averqel/neosis-pwsh-sandbox` | yes | Sandbox-consuming implementation of the AverQel NeoSIS PowerShell executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@averqel/neosis-shell-env` | yes | Tool-independent managed NEOSIS_* shell environment registry |
| `@averqel/neosis-tool-bash` | yes | Model-facing bash tool with optional generic background-job and sandbox-escalation support |
| `@averqel/neosis-tool-bash-persistent` | yes | Model-facing owner-scoped persistent Bash tool backed by the Harness PTY service |
| `@averqel/neosis-tool-pwsh` | yes | Model-facing pwsh tool over the bash executor seam |
| `@averqel/neosis-tool-pwsh-persistent` | yes | Model-facing owner-scoped persistent PowerShell tool backed by the Harness PTY service |

## skill

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-skill` | yes | Agent skill provider registry for the AverQel NeoSIS |
| `@averqel/neosis-skill-badge` | no | Bundled neosis badge skill provider for AverQel NeoSIS |
| `@averqel/neosis-skill-filesystem` | yes | Local filesystem skill provider for the AverQel NeoSIS |
| `@averqel/neosis-skill-office` | yes | Bundled Word, PowerPoint, and Excel workflows and structural checks |
| `@averqel/neosis-tool-skill` | yes | Model-facing skill loading tool for the AverQel NeoSIS |
| `@averqel/neosis-tool-workspace-dependencies` | yes | The load_workspace_dependencies tool: absolute paths into a bundled Python, Node.js, and pnpm payload |

## spill

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-spill-local` | yes | Local-filesystem implementation of the AverQel NeoSIS spill storage seam (private session-scoped files) |
| `@averqel/neosis-spill-policy` | yes | Token-budgeted tool-result retention with recoverable text and image paths |

## ssh

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-fs-ssh` | no | Filesystem provider over the shared POSIX SSH helper |
| `@averqel/neosis-sandbox-ssh` | no | Remote POSIX sandbox argv provider over the shared SSH helper |
| `@averqel/neosis-ssh` | yes | Shared OpenSSH connection and versioned POSIX remote helper |
| `@averqel/neosis-subprocess-ssh` | no | Subprocess and terminal provider over the shared POSIX SSH helper |

## storage

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-storage` | no | Storage hub (ctx.storage): named backend registry plus mounted data-form facilities for the AverQel NeoSIS |
| `@averqel/neosis-storage-domain` | yes | Domain data form (ctx.storage.domain): schema-validated, event-emitting KV domains over storage backends for the AverQel NeoSIS |
| `@averqel/neosis-storage-json` | yes | JSON file KV storage backend for the AverQel NeoSIS storage hub |
| `@averqel/neosis-storage-sqlite` | yes | SQLite storage backend (kv facet) for the AverQel NeoSIS storage hub |

## subagent

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-subagent` | yes | Abstract subagent seam (ctx.subagents): named-provider registry for delegating to child agents |
| `@averqel/neosis-subagent-acp` | yes | Out-of-process ACP subagent backend: drives a child agent in a spawned subprocess over the Agent Client Protocol |
| `@averqel/neosis-subagent-claude-code` | yes | One-shot Claude Code subagent provider over the official Agent SDK |
| `@averqel/neosis-subagent-codex` | yes | One-shot Codex subagent provider over the official app-server protocol |
| `@averqel/neosis-subagent-neosis-sdk` | yes | Out-of-process SDK subagent backend: drives a child AverQel NeoSIS runtime subprocess over stdio JSON-RPC through the TypeScript SDK client |
| `@averqel/neosis-subagent-fork-in-process` | yes | In-process fork subagent backend: runs a child agent seeded with a prefix of the parent's log |
| `@averqel/neosis-subagent-spawn-in-process` | yes | In-process spawn subagent backend: runs a fresh child agent on ctx.agents |
| `@averqel/neosis-tool-subagent` | yes | Model-facing subagent delegation tool over the ctx.subagents seam |
| `@averqel/neosis-tool-subagent-control` | no | Globally named send_message, interrupt_agent, and list_agents tools over ctx.subagents continuations |

## subprocess

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-subprocess-local` | no | Local-subprocess implementation of the AverQel NeoSIS subprocess seam |

## terminal

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-terminal` | no | Persistent PTY session seam for the AverQel NeoSIS — owner-scoped ids, backend registry, interactive sends, reads, signals, and awaited cleanup |
| `@averqel/neosis-terminal-bash` | yes | Persistent shell PTY backend over the AverQel NeoSIS subprocess terminal primitive |
| `@averqel/neosis-tool-terminal` | yes | Six model-facing persistent PTY tools with owner isolation and generic background-job integration |

## test-support

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-llm-replay` | yes | Replay LLM plugin: short-circuits llm/stream with model chunks reconstructed from a recorded session JSONL (keyless snapshot tests) |

## todo

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-tool-todo` | yes | Model-facing todo_write tool over the AverQel NeoSIS event-sourced session log |

## typert

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-typert-loader` | yes | Loader integration for generated Typert package contributions |

## web

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-tool-web` | yes | Model-facing web tools (web_search, web_fetch) over the AverQel NeoSIS web capability seam (ctx.web) |
| `@averqel/neosis-web` | yes | Abstract web access capability seam (ctx.web) for the AverQel NeoSIS — search/fetch provider registry, registration-order-independent selection, request/result vocabulary, and the WebError taxonomy |
| `@averqel/neosis-web-fetch-http` | yes | Anonymous public HTTP(S) fetch provider for the AverQel NeoSIS web capability seam (ctx.web) |
| `@averqel/neosis-web-search-deepseek` | yes | AverQel-backed search provider (native web_search via the Anthropic-compatible API) for the AverQel NeoSIS web capability seam (ctx.web) |
| `@averqel/neosis-web-search-exa` | yes | Exa-backed search provider for the AverQel NeoSIS web capability seam (ctx.web) |
| `@averqel/neosis-web-search-perplexity` | yes | Perplexity-backed search provider for the AverQel NeoSIS web capability seam (ctx.web) |

## webhook

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-webhook` | no | Fire-and-forget webhook rule runtime that creates Workspace-backed AverQel NeoSIS Sessions |
| `@averqel/neosis-webhook-github` | yes | Signed GitHub HTTP webhook adapter for the AverQel NeoSIS webhook runtime |

## workflow

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-tool-ralph` | yes | Model-facing fresh-agent Ralph loop over the workflow and subagent seams |
| `@averqel/neosis-tool-workflow` | yes | Model-facing workflow tool: run a JavaScript orchestration script over ctx.workflowEngine |
| `@averqel/neosis-workflow-ptc` | yes | Workflow orchestration in the shared sandboxed Node PTC runtime |

## workspace

| Package | Config | Description |
|---|---|---|
| `@averqel/neosis-workspace` | no | Workspace entity registry (ctx.workspaceRegistry): durable workspace records with validated session attachment over the domain data form for the AverQel NeoSIS |
