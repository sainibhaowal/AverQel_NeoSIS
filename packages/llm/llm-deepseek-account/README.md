---
description: "DeepSeek account-token authentication, quota classification, and model discovery for the account provider."
kind: "package-reference"
---

# @averqel/neosis-llm-deepseek-account

English

## Summary

Use this package to expose the `deepseek-account` provider, which authenticates requests with a signed-in DeepSeek account token and discovers the configured DeepSeek models. It reports missing sign-in, invalid account tokens, and account quota exhaustion as distinct LLM failures.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Mount the package beside `neosis-llm`, `neosis-llm-deepseek`, the launch-environment service, the DeepSeek account service, and the Loader. The provider id is `deepseek-account`, while its settings display name is **DeepSeek Account**.

The provider resolves the account token for the configured request destination and sends it in the `x-dsh-auth-token` header. Model discovery returns no models while sign-in is absent. A 401 invalidates the stored token through the account service and returns `ACCOUNT_TOKEN_INVALID`; account quota failures are classified separately from ordinary provider quota failures.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

The package shares DeepSeek endpoint, model, and request-option resolution with the protocol adapter. Authentication is resolved at request time rather than copied into provider configuration. The account service owns token storage and rejection; this package owns provider registration and error classification.

## Model Experience

### DeepSeek account request

#### What the model sees

The selected `deepseek-account` model receives the request assembled by the shared DeepSeek adapter. This package contributes account authentication only; it does not add prompts, tools, schemas, or Session context.

#### Token effect

None beyond the request content selected by the agent and shared adapter; the account token is an HTTP authentication header, not model input.

#### KV Cache effect

The provider's normal DeepSeek cache behavior applies to the request. Account authentication does not alter the cacheable request content.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

No runtime invariant companion is published because this provider applies account authentication per request; identity, Session, and token lifecycle state remain owned by the account service.

- The account route requires a signed-in account and a request destination that allows account authentication.
- The package does not provide the sign-in UI or token storage; those belong to the account service and client settings packages.
- A provider can advertise a model before the remote gateway accepts that model id, so the request may still fail with a provider request error.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
