---
description: "Typed Desktop product-event reporting with live collection policy and OpenTelemetry delivery."
kind: "package-reference"
---

# @averqel/neosis-client-product-analytics

English

## Summary

This package owns NeoSIS Desktop product-event types, the renderer callback, and the Host reporter that forwards approved events to the configured product telemetry endpoint. Web profiles keep the contribution disabled. Events contain only the declared event fields; the Host adds anonymous account identity and application version when collection is enabled.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Enable the package in the Desktop profile with `NEOSIS_CLIENT_VERSION` and an optional `NEOSIS_PRODUCT_ANALYTICS_OTLP_URL`. The browser callback accepts only the typed `ProductEventMap`; the Host policy decides whether an event is collected. Policy changes are observed without restarting telemetry.

Events do not contain prompts, credentials, message contents, or arbitrary renderer fields. Delivery failures are logged and do not interrupt the Desktop workflow.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`src/events.ts` defines the event names and attribute records. The browser-facing service performs the enabled-policy check before invoking Host reporting. The Host reporter attaches product version and anonymous account identity, then delegates delivery to the OpenTelemetry service. Disposal stops observers and flushes owned telemetry resources.

No runtime invariant companion is published: the package owns one policy observer and one reporter lifecycle, with no independent projection that can diverge.

</details>

-----

<a id="model-experience"></a>
## Model Experience

### Product-event reporting

#### What the model sees

Nothing. Product analytics reports approved `ProductEventMap` events and never adds prompts, responses, tool arguments, credentials, or Session transcript content to model context.

#### Token effect

None; product-event reporting does not change model request text or token accounting.

#### KV Cache effect

None; this package does not assemble or send provider requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Collection depends on a configured Desktop telemetry endpoint and can be unavailable without affecting product use.
- This package does not provide an end-user analytics viewer or event replay UI.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
