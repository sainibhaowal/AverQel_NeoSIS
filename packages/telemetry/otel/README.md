---
description: "Independent OpenTelemetry channels for ordinary product events and byte-bounded, authorized NeoSIS Session-log export."
kind: "package-reference"
---

# @averqel/neosis-otel

English

## Summary

Use this package to create independent OpenTelemetry log channels for product events and Session-log records. The ordinary event reporter uses SDK batching, while the Session-log reporter enforces a 4,000,000-byte uncompressed request ceiling, rejects oversized records without truncation, and lets its consumer own authorization, redaction, shutdown, and failure handling.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the `OTel` service and call `ctx.otel.createEventReporter` or `ctx.otel.createSessionLogReporter` with an explicit OTLP destination, resource attributes, scope, queue settings, and failure callback. Mounting the service creates no queue, identity, or network connection; each reporter owns its own transport and must be shut down by its consumer.

The Session-log reporter accepts a lower `maxRequestBytes` value but never permits a value above `4,000,000`. It measures each serialized record before enqueueing, keeps one export request in flight, and reports queue, serialization, size, timeout, and transport failures without including record content in diagnostics.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The ordinary event channel wraps the OpenTelemetry SDK batch processor and exports caller-selected scalar attributes. The Session-log channel uses a separate byte-aware processor and JSON OTLP exporter; its event envelope includes the caller-provided redacted Session event and separately assigned Session identity. Transport options use explicit endpoint and headers rather than inheriting another collector's credentials.

## Model Experience

### Telemetry export

#### What the model sees

Nothing. This package exports `SessionLogRecord` telemetry after the owning consumer has selected and authorized records; it does not add prompts, messages, tools, schemas, streams, or Session context to model requests.

#### Token effect

None; telemetry export does not change model request text or token accounting.

#### KV Cache effect

None; the package does not assemble or send provider inference requests.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

No runtime invariant companion is published because reporter lifecycle is consumer-owned and collector acceptance is not observable locally, so no independent delivery state can be checked.

- Export is best-effort and has no durable outbox or collector-acceptance guarantee.
- The consumer must perform authorization and redaction before reporting Session events.
- A single serialized Session-log record larger than the configured byte limit is rejected rather than truncated.
- Each reporter owns its own shutdown; mounting `OTel` does not automatically drain channels created by consumers.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
