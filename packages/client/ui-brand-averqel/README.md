---
description: "AverQel NeoSIS brand occupants for the sidebar and UI."
kind: "package-reference"
---

# @averqel/neosis-ui-brand

English

## Summary

This package provides the AverQel NeoSIS brand mark and name in the sidebar. It replaces the official AverQel NeoSIS branding with the AverQel NeoSIS identity. Choose it for deployments branded as AverQel NeoSIS; it has no runtime state and does not affect model requests.

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

Mount this plugin in the browser roster of a deployment branded as AverQel NeoSIS, then build the client.

### Replacing the brand

A deployment with AverQel NeoSIS identity mounts this package to occupy the sidebar slots — `sidebar.brand.mark` and `sidebar.brand.name`. Occupying a slot is the only composition route; there is no brand configuration surface here.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The two occupants install as one declaration-aware registration set: nested `ctx.slots.inject()` calls wait on the sidebar declaration, so the set works whether this row activates before or after the declarer, withdraws both occupants when the declaration collapses, and leaves no partial brand mix during HMR. The browser half is [`src/client/index.ts`](src/client/index.ts); the node half is an empty Loader seat.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the brand surface is not enough. They move from the slots this package occupies to the shell that renders them.

- [ui-sidebar](../ui-sidebar/README.md) — declares `sidebar.brand.mark` and `sidebar.brand.name` and renders their fallbacks.
- [Web client architecture](../../../.agents/notes/implemented/architecture/2026-07-19-gui-web-client-architecture.md) — how browser plugin rows load and register slots.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package contributes browser presentation only; nothing here reaches a model request.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

These limits define how brand presentation is supplied. They are current package constraints, not a brand-design comparison or a task backlog.

- **One occupant set** — alternative presentation belongs in another Cordis package occupying the same slots.
- **The browser title is independent** — `NEOSIS_CLIENT_TITLE` selects title text at build time rather than through a UI slot.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

**Runtime invariant:** No companion is published. The package retains no mutable state, and its two slot occupants install and leave through one transactional effect.