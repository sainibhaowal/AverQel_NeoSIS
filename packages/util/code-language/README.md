---
description: "Shared file-extension to syntax-highlighting language selection for NeoSIS code surfaces and filesystem read cards."
kind: "package-reference"
---

# neosis-util-code-language

English

## Summary

This browser-safe utility keeps the file-extension table shared by document previews, diff review, and filesystem read metadata. `languageForPath` returns canonical highlighter ids, `CODE_HIGHLIGHT_EXTENSIONS` lists recognized suffixes, and `readLangHintForPath` returns the short ids stored in session-backed read cards. Unknown extensions, extensionless names, and unlisted dotfiles return `undefined`.

The table is adapted from DeepSeek Harness `dsh-v0.2.0-rc.2`; NeoSIS keeps its own package namespace, Apache-2.0 package metadata, and brand assets.

## Table of Contents

- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Model Experience](#model-experience)
- [Dev Note](#dev-note)

## Model Experience

### Language selection

#### What the model sees

Nothing directly. This utility returns syntax-language hints through `languageForPath`; client consumers decide whether any related file content enters a model request.

#### Token effect

None in this package; language selection does not add prompt text or change token accounting.

#### KV Cache effect

None in this package; it does not assemble or send provider requests.

## Known Limitations and Deferred Work

- Matching is extension-only; names such as `Dockerfile` and `Makefile` without a suffix are not inferred.
- The utility does not inspect file contents or guarantee that a client grammar has been loaded.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

**Runtime invariant:** No companion is published. This utility owns no mutable runtime relationship.
