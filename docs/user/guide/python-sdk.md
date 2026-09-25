# Get started with the Python SDK

English | [中文](python-sdk.zh.md)

This tutorial installs the published Python SDK, runs the shipped standalone minimal profile, and shows how to customize the same `neosis` profile from your own program.

## Prerequisites

- Python 3.10 or newer
- Git
- Linux x64, Linux arm64, macOS 14 or newer on arm64, or Windows x64
- A AverQel-compatible API endpoint and credential
- An isolated workspace and an isolated Harness home

## Install the SDK

<div>
<a id="linux-and-macos"></a>
<a id="windows-powershell"></a>
</div>

::: code-group

```sh [Linux/macOS]
git clone https://github.com/sainibhaowal/AverQel_Neosis.git
cd averqel-neosis
python -m venv .venv
. .venv/bin/activate
python -m pip install averqel-neosis-sdk
```

```powershell [Windows PowerShell]
git clone https://github.com/sainibhaowal/AverQel_Neosis.git
Set-Location averqel-neosis
py -3.10 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install averqel-neosis-sdk
```

:::

The installation includes a matching native runtime wheel and the `neosis` command. Normal SDK execution needs no system Node.js. Repository contributors who build the artifacts should use the [Python contributor workflow](../../../python/development.md).

## Run the checked-in example

Export the credential and, when needed, a compatible proxy endpoint:

<div>
<a id="linux-and-macos-1"></a>
<a id="windows-powershell-1"></a>
</div>

::: code-group

```sh [Linux/macOS]
export DEEPSEEK_API_KEY=sk-your-key-here
# export DEEPSEEK_BASE_URL=http://127.0.0.1:8000/v1
```

```powershell [Windows PowerShell]
$env:DEEPSEEK_API_KEY = "sk-your-key-here"
# $env:DEEPSEEK_BASE_URL = "http://127.0.0.1:8000/v1"
```

:::

Run one task with explicit workspace and home paths:

<div>
<a id="linux-and-macos-2"></a>
<a id="windows-powershell-2"></a>
</div>

::: code-group

```sh [Linux/macOS]
python python/sdk/examples/minimal.py \
  --workspace /absolute/path/to/disposable-workspace \
  --neosis-home /absolute/path/to/example-neosis-home \
  --session-id example-001 \
  "Inspect the repository and fix the failing tests."
```

```powershell [Windows PowerShell]
python python/sdk/examples/minimal.py `
  --workspace C:\work\disposable-workspace `
  --neosis-home C:\work\example-neosis-home `
  --session-id example-001 `
  "Inspect the repository and fix the failing tests."
```

:::

The script prints the final assistant response. The selected home receives the generated `sdk-minimal` profile, installed plugins, and uncompressed JSONL session logs under `sessions/`. The example and SDK never silently read `~/.neosis`.

## Use the SDK in your program

```python
from pathlib import Path

from averqel_neosis import AverQelHarness

workspace = Path("/absolute/path/to/disposable-workspace").resolve()
neosis_home = Path("/absolute/path/to/example-neosis-home").resolve()
with AverQelHarness(
    provider="deepseek-official",
    model="deepseek-v4-flash",
    max_tokens=49_152,
    cwd=str(workspace),
    neosis_home=str(neosis_home),
    profile="sdk-minimal",
) as harness:
    result = harness.run(
        "Inspect the repository and fix the failing tests.",
        session_id="example-001",
    )

print(result.final_response)
```

The SDK starts the bundled `neosis --profile sdk-minimal` process lazily and reuses it until context-manager exit. The profile, its persistent patch, the home patch, and any ordered `patches` tuple form the application configuration. There is no separate Python runtime bin or complete-config option.

## Install or define plugins

Use `neosis plugin` for dependencies and bundle layers that should persist in this home:

<div>
<a id="linux-and-macos-3"></a>
<a id="windows-powershell-3"></a>
</div>

::: code-group

```sh [Linux/macOS]
export NEOSIS_HOME=/absolute/path/to/example-neosis-home
neosis --profile sdk-minimal --dump-default-config >/dev/null
neosis plugin --profile sdk-minimal add file:/absolute/path/to/my-plugin-bundle
```

```powershell [Windows PowerShell]
$env:NEOSIS_HOME = "C:\work\example-neosis-home"
neosis --profile sdk-minimal --dump-default-config | Out-Null
neosis plugin --profile sdk-minimal add file:C:/work/my-plugin-bundle
```

:::

The first command initializes the shipped standalone profile. The second forwards package management to `pnpm`, then records any installed package that exports a `neosis.bundle` layer. Install `pnpm` only for this management command; launching the installed SDK does not need it. Edit `$NEOSIS_HOME/profiles/sdk-minimal/cordis.patch.yml` for persistent row changes, or pass patch files from Python for per-launch changes.

Another `profile` is valid when it includes `@averqel/neosis-sdk-app` or another JSON-RPC server row. Missing server rows, unresolved plugins, and invalid patches fail during startup instead of falling back to another composition.

<a id="opt-in-to-str_replace_editor"></a>
### Opt in to `str_replace_editor`

The bundled runtime includes `str_replace_editor`, but `sdk-minimal` omits it from the default Cordis tree. To use it, save this configuration as `editor.patch.yml`; `insert` adds both the editor and the filesystem provider that the minimal profile lacks:

```yaml
- insert:
    - id: fs-local
      name: '@averqel/neosis-fs-local'
      config:
        cwd: !!js process.cwd()
    - id: tool-str-replace-editor
      name: '@averqel/neosis-tool-str-replace-editor'
```

Pass `patches=("/absolute/path/to/editor.patch.yml",)` when constructing `AverQelHarness(profile="sdk-minimal", ...)`, or put the patch in `$NEOSIS_HOME/profiles/sdk-minimal/cordis.patch.yml` for persistent configuration. On the next runtime launch, model requests include `str_replace_editor` beside the persistent shell. The local filesystem provider uses the runtime working directory for relative paths; like the minimal shell, it does not confine access to that directory. For the standard `sdk` profile, insert only the editor row so it uses the existing filesystem provider and policies.

## Understand the minimal profile

| Property | Value |
|---|---|
| System prompt | `NEOSIS_SYSTEM_PROMPT`, falling back to `You are a helpful software engineer assistant.` |
| Model in `minimal.py` | `--model`, then `NEOSIS_MODEL`, then `deepseek-v4-flash` |
| Model-facing tool | Persistent `bash` on Linux/macOS or `pwsh` on Windows |
| Shell timeout | 300 seconds |
| Runtime context and compaction | Absent |
| Session persistence | Uncompressed JSONL under `<neosis_home>/sessions` |

The profile's sole bundle inserts the complete tree over an empty root and does not include `neosis-base`; later base-profile tools therefore cannot appear implicitly. It contains the SDK protocol, one environment-configured AverQel adapter, local execution, and persistence, while filesystem tools, settings, managed credentials, OTel telemetry, Web tools, subagents, local instruction discovery, and compaction are absent. The [AverQel session-log contributor](../../../packages/session/session-log-deepseek/README.md) uploads complete unaccepted log suffixes with AverQel requests by default; set `session-log-deepseek.enabled: false` in a profile patch to disable it. It pins `danger-full-access`, so the platform-selected persistent shell can modify any path visible to the runtime; use a disposable checkout or container.

The installed wheel still packages the full `web` profile and frontend assets. Run `neosis web` against an explicit `NEOSIS_HOME` when a Python SDK deployment also needs the browser application; `web` is a separate CLI application and cannot serve a Python SDK client.

Use a fresh home when profiles, plugins, credentials, settings, and sessions must be isolated. Use a fresh session id for independent work; reuse a harness, home, and id only to continue the same durable conversation and session-owned resources.

The [bundle reference](../../../packages/bundle/sdk-minimal/README.md) owns the exact tree, and the [example reference](../../../python/sdk/examples/README.md) owns the runnable program. The [Python SDK reference](../../../python/sdk/README.md) covers lifecycle, results, notifications, and low-level behavior; the [neosis CLI reference](../../../apps/cli/reference/README.md) covers profile layering.
