---
description: "Official DeepSeek API-key authentication, endpoint resolution, and model discovery for the API-key provider."
kind: "package-reference"
---

# @averqel/neosis-llm-deepseek-api-key

English

## Summary

Use this package to expose the `deepseek-official` provider, which authenticates requests with the configured DeepSeek API key and discovers the configured DeepSeek models. The key is resolved from the trusted launch environment when a request is sent and is never part of model context.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the package beside `neosis-llm`, `neosis-llm-deepseek`, the launch-environment service, the credentials service, and the Loader. The provider id is `deepseek-official`, while its settings display name is **DeepSeek**.

The provider resolves the configured API-key environment name through the launch-environment and credential services, then sends the key in the `x-api-key` header. Model discovery uses the shared DeepSeek connection options and returns the configured catalog entries.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The package reuses the protocol adapter's validated configuration, endpoint resolution, authentication transport, and model catalog mapping. It registers the provider through the LLM service and resolves credentials at request time, so the key does not become part of provider configuration or persisted model context.

## Model Experience

### DeepSeek API request

#### What the model sees

The selected `deepseek-official` model receives the request assembled by the shared DeepSeek adapter. This package contributes API-key authentication only; it does not add prompts, tools, schemas, or Session context.

#### Token effect

None beyond the request content selected by the agent and shared adapter; the API key is an HTTP authentication header, not model input.

#### KV Cache effect

The provider's normal DeepSeek cache behavior applies to the request. API-key authentication does not alter the cacheable request content.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The provider requires a valid API key in the configured launch environment or credentials source.
- The package does not create or validate keys with DeepSeek; rejected credentials surface as provider authentication failures.
- A provider can advertise a model before the remote gateway accepts that model id, so the request may still fail with a provider request error.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
