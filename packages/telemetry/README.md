---
description: "The telemetry package group: independent OpenTelemetry channels for product events and authorized Session-log export."
kind: "package-group"
---

# telemetry/ — OpenTelemetry channels

English

## Summary

The telemetry group provides transport primitives for events that leave the NeoSIS process. The `otel` package creates independent ordinary-event and byte-bounded Session-log reporters; product analytics and Session telemetry packages decide which records are authorized, redacted, and delivered. Mounting the transport service alone does not collect data or open a network connection.

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

| Package | Role | ctx key |
|---|---|---|
| [`otel/`](otel/README.md) | Creates independent ordinary-event and Session-log OTLP reporters; consumers own authorization and shutdown | `ctx.otel` |

<a id="related-documentation"></a>
## Related documentation

- [Product telemetry subsystem](../../docs/subsystems/product-telemetry.md) — product-event collection policy and Host delivery.
- [Session telemetry subsystem](../../docs/subsystems/session-telemetry.md) — Session-event capture, redaction, and delivery modes.
- [Capability seams](../../docs/capability-seams.md) — generated service ownership and consumer graph.

<a id="dev-note"></a>
## Dev Note

None.
