---
description: "Web General-settings controls for enabling or disabling Session-log upload when the official DeepSeek API route is used."
kind: "package-reference"
---

# @averqel/neosis-client-ui-settings-session-log

English

## Summary

Use this package to add the Session-log upload preference to the Web General settings page. The row displays the current preference, persists an accepted change through the Host settings form, and shows a localized notice when an upload setting change is pending or fails.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Enable the package in the Web client composition together with the Host configuration form that owns the `session-log-deepseek` namespace. The package contributes a General-settings row and a shell overlay for the upload notice; it does not choose the collector, alter provider credentials, or send records itself.

The setting is a boolean `enabled` value. The row reports the effective state supplied by the configuration store and keeps the control disabled while a write is in flight or when the Host reports the setting as unavailable.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The browser entry registers the `settings.sessionLog` locale namespace, reads the typed `session-log-deepseek` form, and contributes the General-settings item at order 90. The overlay uses the same form state to show a transient localized success or failure notice. The Host owns persistence and the provider-specific upload policy.

## Model Experience

### Upload preference

#### What the model sees

Nothing. This package presents the `session-log-deepseek` user preference and does not add prompts, messages, tools, schemas, streams, or Session events to model context.

#### Token effect

None; changing the preference does not change model request text or token accounting.

#### KV Cache effect

None; the package does not assemble or send provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

No runtime invariant companion is published because this client package renders settings owned by the Host and exposes no independent event stream or state snapshot.

- The row is useful only when the Host exposes the matching configuration form.
- The package does not verify collector acceptance and cannot display delivery details owned by the Host telemetry channel.
- The package controls the DeepSeek Session-log preference surface; other telemetry channels have separate owners and settings.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
