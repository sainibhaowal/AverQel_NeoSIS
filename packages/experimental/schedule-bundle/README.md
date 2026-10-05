---
description: "Add Schedule, its reminder catalog, and the Automation tasks page from the NeoSIS plugin manager."
kind: "package-bundle"
---

# neosis-experimental-schedule-bundle

English

## Summary

This optional bundle enables the existing `time-context`, `schedule`, and `ui-schedule` rows as one safe feature. It is shipped disabled, so existing profiles and stored tasks are unchanged until the user enables **Automation tasks** in Plugins.

When enabled, root Agents receive schedule tools, sessions expose reminder state, and the Web sidebar provides the task page. Disabling the bundle leaves stored tasks intact and restores the prior composition.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Enable the bundle from the NeoSIS plugin manager. It composes the Host schedule services, schedule tool contributions, and Web task-management surface as one optional feature. Existing schedules remain stored when the bundle is disabled.

## Implementation

The package is configuration-only. `cordis.patch.yml` inserts the Host time and Schedule services and enables the Web Schedule row. Its package dependencies make every patched row resolvable from the bundle. No brand assets or DeepSeek product identity are introduced.

**Runtime invariant:** No companion is published. This package owns no mutable runtime relationship.

## Model Experience

### Schedule tools

#### What the model sees

The bundle enables the `schedule` tools supplied by the Schedule package. It does not add a second prompt section or duplicate the tool schemas; the Schedule package owns the model-facing schedule behavior.

#### Token effect

The enabled Schedule tools and their results can affect requests when the agent uses them. This bundle adds no separate prompt text or token policy.

#### KV Cache effect

The shared Schedule package determines cache behavior for any resulting request. Enabling the bundle does not independently rewrite cached model context.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The bundle does not provide a migration for schedules created by older incompatible package generations.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
