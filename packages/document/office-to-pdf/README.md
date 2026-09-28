---
description: "Host Office conversion through NeoSIS's verified LibreOffice runtime."
kind: "package-reference"
---

# @averqel/neosis-office-to-pdf

English | [中文](README.zh.md)

## Summary

Convert LibreOffice-supported word-processing, spreadsheet, and presentation documents to PDFs on the Host computer through the configured LibreOffice executable. The provider accepts common binary Office, OOXML, OpenDocument, Flat XML, RTF, and legacy spreadsheet and presentation extensions. Desktop builds use the verified LibreOffice payload shipped in the installer; Web/Host deployments may set `executable` explicitly. Conversion reports no missing-font names for binary inputs.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The [Web bundle](../../bundle/web-app/README.md) mounts this provider as `office-to-pdf`. Independent compositions mount `@averqel/neosis-office-to-pdf` as a `cordis.yml` row.

Callers submit authorized source identity, version, optional byte size, a deferred bounded read, Office extension, and scheduling priority through `ctx.officeToPdf.convert()`. A changed source version rejects conversion. Results contain caller-owned PDF bytes, missing fonts, a cache key, and a conversion generation that changes on configuration replacement. Cancellation rejects with its reason; conversion failures use `OfficeToPdfError`.

The provider starts one isolated LibreOffice child process per admitted conversion. In Desktop, the host resolves `NEOSIS_OFFICE_BUNDLE_ROOT` to the installer-owned payload and fails closed when that payload is missing. Development and standalone Host deployments default to `soffice` unless `executable` or `NEOSIS_OFFICE_EXECUTABLE` selects another path. NeoSIS does not require an npm LibreOffice package.

Browsers request PDFs through the `officeToPdf.render` Remote method with a Session identity, Office path, and priority. This entry uses `workspaceFiles` for authorization and source versions, then reads raw bytes through `fs.readBytes` within the conversion reservation. In-process `convert()` does not require those services. Responses retain the source path and version and carry native PDF bytes through the binary Remote multipart transport, plus missing fonts and conversion generation. The `officeToPdf.generation` Remote method returns the current provider generation; `api/remotes` mounts the generated Client descriptor.

| Field | Default | Meaning |
|---|---|---|
| `maxConcurrentConversions` | `2` | Maximum active converters; queued calls remain cancellable. |
| `timeoutMs` | `60000` | Conversion deadline after a converter is acquired. |
| `maxInputBytes` | `52428800` | Maximum source bytes. |
| `maxOutputBytes` | `104857600` | Maximum complete PDF bytes. |
| `executable` | Desktop bundle or `soffice` | LibreOffice executable name or absolute path. |
| `fontFallbacks` | System defaults | Accepted for compatibility; system LibreOffice selects fallback families. |

The [configuration catalog](../../../docs/config-catalog.md#averqelneosis-office-to-pdf) owns the full font, archive, and image settings. `fontDirectories` accepts absolute directories and is passed to LibreOffice through `SAL_FONTPATH`; omission uses the bundle's or host's font configuration. `fontFallbacks` remains accepted for configuration compatibility, but LibreOffice selects fallback families. Rasterization and font metrics follow the pinned Desktop LibreOffice version or the configured standalone Host version.

The [bounded conversion decision](../../../.agents/notes/implemented/architecture/2026-09-15-bounded-office-conversion.md) explains queue admission, cache limits, and shared cancellation.

The provider retains successful PDFs by converter generation, Office extension, and SHA-256 of the exact source bytes. A bounded source-version index avoids rereading known content after an authorized stat; content identity also shares conversion across different source paths. Least-recently-used PDFs leave at either retention limit, together with their aliases. Failures and oversized cache entries are not retained. Every result has independent PDF/font buffers. Ready alias hits consume no reader slot; active source locators are released when their last reader leaves. Reopening a source after its final reader cancels rereads its bytes before sharing by digest, even if another source kept the conversion alive or its PDF is ready.

Admission bounds queued metadata, outstanding readers, active source-byte reservations, and conversions before invoking a source read. Unknown source sizes reserve `maxInputBytes`; known sizes reserve their stat size. Reads receive that capacity and may read one overflow sentinel byte. `maxSourceBytes` must cover `maxInputBytes`. The final reader allowance is reserved for foreground work. Setting `maxBackgroundConversions` to zero rejects background joins to queued and running work; completed alias hits remain available. Background jobs wait while any foreground job is queued, including when it awaits source capacity. Foreground joins promote queued prewarming; when its last foreground reader leaves, the queued job returns to background priority and eligible work can start immediately. Foreground admission can evict queued speculation. Background concurrency leaves a foreground slot when total concurrency exceeds one. A running prewarm keeps its background admission slot until settlement, even after promotion. The final reader cancels shared work. Removing a queued foreground blocker immediately admits other eligible work; active reservations remain held until actual read/conversion cleanup settles.

The defaults retain 8 PDFs/128 MiB and 64 source aliases, admit 32 readers and 8 queued jobs, reserve at most 100 MiB of source bytes, and allow one background conversion. These limits bound owned requests and binary payloads, not engine RSS, multipart framing, caller-retained results, or PDF.js page rendering.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Missing executables and conversion errors reject the request instead of switching to another engine. The adapter gives each conversion a private LibreOffice profile and passes no harness secrets to the child environment.

The provider writes authorized input into a private temporary directory, starts LibreOffice with an isolated profile, reads a bounded regular PDF, and removes the directory before settling. Canceling an admitted reader terminates the child process through the shared signal and does not block later queued work. Reader cancellation releases only that reader; the final reader and provider disposal cancel shared work. No runtime invariant companion is published because active operations and scratch cleanup have one lifetime owner.

Remote file reads recheck content authorization and source version before consulting the conversion cache. Deferred reads run after conversion admission and verify the source version after reading. Source-read failures pass through; conversion failures return `document-render/failed` with a classified reason and no engine diagnostics. Unload cancels and joins authorization reads, Remote requests, and conversion work.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Office to PDF](../../../docs/subsystems/office-to-pdf.md) — composition and input/result ownership.
- [Workspace Files](../../api/workspace-files/README.md) — Session file authorization and bounded reads.

-----

<a id="model-experience"></a>
## Model Experience

None, as this package converts bytes without model-facing tools, messages, or Session events.

#### KV Cache effect

None; conversion does not construct or modify model requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Conversion fidelity and available filters belong to the LibreOffice version and fonts in use. Desktop releases pin and package one official payload per target; standalone Host deployments still require a compatible LibreOffice installation.
- Queue waiting time is not bounded by `timeoutMs`, which starts when the LibreOffice child process is started.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
