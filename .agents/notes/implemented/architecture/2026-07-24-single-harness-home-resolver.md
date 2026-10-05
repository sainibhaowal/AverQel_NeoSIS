# Agent Note: One harness home resolver

Status: implemented

English

## Problem

The harness had two inconsistent conventions for "where does AverQel NeoSIS user data live":

- `@averqel/neosis-home` resolved `configured ?? $NEOSIS_HOME ?? ~/.neosis`.
- `@averqel/neosis-home-paths` shipped a **second** `resolveNeosisHome` with the same precedence plus tilde expansion — a near-duplicate of `neosis-home` that no gate flagged because the two lived in different packages and had already drifted (only one expanded tildes).

Two resolvers for the same cross-cutting fact meant there was no single home policy.

## Decision

One resolver owns the harness home, in `@averqel/neosis-home-paths`, single-root:

```
explicit configured path  >  $NEOSIS_HOME  >  ~/.neosis
```

An empty or whitespace-only `$NEOSIS_HOME` is treated as unset; otherwise `resolve('')` would silently place the home at the current working directory. The harness keeps all user data under one root; there is no XDG config/data/cache split. `neosisHomePath(...segments)` joins deployment-owned children onto that root, and `neosis-app-boot` exposes it to Loader `!!js` config expressions before mounting entries, so shipped compositions derive `sessions` and `storages` without copying the resolver. `neosisHomeDisplay()` names a resolved root symbolically for user-facing paths — `~/.neosis` for the default home, `$NEOSIS_HOME` for any configured home — so the user-global `AGENTS.md` label never leaks an absolute machine path. It replaces agent-instructions's bespoke default-vs-`$NEOSIS_HOME` check.

`neosisCachePath(...segments)` derives paths below the resolved home's `cache` directory. An initial `{ neosisHome }` option preserves a provider's explicit home override. It resolves paths without creating directories; callers own directory creation. `attachment-local` uses this helper for regenerable request-image variants while retaining durable attachment objects in their versioned storage tree, so clearing the cache cannot remove Session attachments. Existing request-image cache entries are left in place and are not read or copied; a cache miss regenerates the variant from its durable attachment.

`@averqel/neosis-home` is deleted. Home-owning providers and boot packages import `resolveNeosisHome` from `neosis-home-paths`; composition bundles contain only the resolved configuration rows.

`neosis-telemetry` and its separate home policy are absent under the [SDK project toolchain removal](../../archived/simplification/2026-08-11-remove-sdk-project-toolchain.md), leaving this resolver as the sole home policy.

## Alternatives considered

**Leave the two `resolveNeosisHome` copies in place.** They had already drifted (one expands tildes, one didn't) and encode the same cross-cutting fact twice. Consolidation is the point of the `util/` layer; a duplicate resolver is a latent divergence bug.

**Adopt XDG (honor `$XDG_CONFIG_HOME`, or split config/data/cache into separate trees).** Considered and dropped in favor of one obvious root. A single `$NEOSIS_HOME || ~/.neosis` ground truth matches `~/.claude` / `~/.aws`, needs no per-kind reclassification of every `~/.neosis` consumer, and leaves no resolver asymmetry to reconcile.

## Consequences

- One home fact, one resolver. `neosis-home-paths` is the sole owner; the `util/` group loses the `home` package.
