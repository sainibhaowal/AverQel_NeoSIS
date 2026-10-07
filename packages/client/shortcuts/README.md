---
description: "Keyboard command registration, physical-key routing, and durable per-device shortcut preferences for NeoSIS clients."
kind: "package-reference"
---

# @averqel/neosis-client-shortcuts

English

## Summary

Use this package to register application keyboard commands, route physical-key input, and persist user-selected bindings in the Web client or Desktop preload. It validates profiles for Web and Desktop on macOS, Windows, and Linux, reports reserved or unsupported bindings, and keeps fixed commands separate from editable preferences.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the package in a client composition and register commands through the injected `ctx.shortcuts` service. A command supplies an id, localized label, aliases, per-runtime and per-platform defaults, and an action resolver. Fixed commands reserve their bindings and cannot be edited.

The Host `stopSequenceMs` setting controls the interval between independent Escape presses used to stop a reply; its default is 500 milliseconds. Web preferences use browser storage. Desktop preferences use the native shortcut bridge and do not fall back to browser storage when that bridge is unavailable.

Shortcut documents preserve dormant command overrides, support schema versions 1 and 2, and reject malformed or future documents without replacing the last accepted state. Edits use a revision check, serialize writes, and report stale, unreadable, conflict, or write-failed outcomes to the caller.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The browser registry validates defaults for every runtime and platform before registering a command. It normalizes physical codes, expands the platform's primary modifier, rejects reserved combinations, and computes conflicts without relying on registration order. The DOM dispatcher tracks composition, dead keys, editable regions, and the active modal before invoking a command.

`ShortcutPersistence` is the single-writer coordinator for localStorage and the Desktop adapter. It publishes accepted snapshots with a revision and sequence number, retains accepted state when a read or write fails, and lets the owning UI decide how to present the classified result.

## Model Experience

### Keyboard preferences

#### What the model sees

Nothing. This package registers human keyboard commands through `ctx.shortcuts` and preference state; it does not add prompts, messages, tools, schemas, streams, or Session events to model context.

#### Token effect

None; keyboard handling does not change model request text or token accounting.

#### KV Cache effect

None; the package does not assemble or send provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

No runtime invariant companion is published because this adapter exposes no independent event stream or state snapshot to compare; command registration and preference behavior are covered by its package tests.

- Browser support depends on the platform's allowed physical-key combinations and browser reservation rules.
- Desktop native behavior requires the product's keyboard bridge; the package intentionally does not emulate that bridge in the browser.
- Binding conflicts remain visible in the catalog and are not silently resolved by choosing a winner.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
