---
description: "Web shortcut reference and editor for searching, recording, resetting, and reviewing client keyboard commands."
kind: "package-reference"
---

# @averqel/neosis-client-ui-shortcuts

English

## Summary

Use this package to expose the Web keyboard-shortcut reference and its local preference editor. Users can search command labels, aliases, and rendered keys, record a new binding, clear or reset a binding, and see reserved or conflicting commands without changing unrelated profiles.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Enable the package with `@averqel/neosis-client-shortcuts`, the locale service, the settings layout, and the settings slot services. The package contributes the keyboard-shortcut settings row and opens a searchable reference dialog from the command catalog.

Recording validates the physical key, ignores modifier-only input, repeats, composition, dead keys, and AltGraph input, and saves only after key release. A failed write keeps the previous effective binding and offers a localized retry. Reset operations use the same revision-checked persistence path as individual edits.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The reference consumes the catalog and configuration snapshots from `neosis-client-shortcuts`. It filters normalized labels, aliases, key names, and accessibility key strings, while fixed commands remain visible but are not editable. The row and dialog use the shared settings slots and locale namespaces; storage, conflict calculation, and native recording are owned by the shortcuts package.

## Model Experience

### Shortcut settings

#### What the model sees

Nothing. This package renders the `ShortcutConfigSnapshot` keyboard settings for a human and does not add prompts, messages, tools, schemas, streams, or Session events to model context.

#### Token effect

None; searching or editing shortcuts does not change model request text or token accounting.

#### KV Cache effect

None; the package does not assemble or send provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The reference lists the command catalog supplied by the active composition; commands from disabled features are not shown.
- Browser recording follows browser reservation rules, so some combinations are unavailable even when their physical keys exist.
- Fixed commands can be reviewed but cannot be edited through this package.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
