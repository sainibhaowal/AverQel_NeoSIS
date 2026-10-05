# Agent Note: Memory-bounded unit test worker pool

Status: implemented

English

## Problem

The unit lane aggregates about 37,000 tests into the `thread-safe` and `process-bound` projects, and Vitest sizes each fork pool from the host CPU count. That sizing is wrong for this workload: every forked worker holds its own module graph and V8 heap, while the heaviest specs build whole-repository TypeScript programs, real `git` subprocess trees, inflated wheels, and SQLite handles.

On a host with many cores and modest RAM the pool oversubscribes memory and the heaviest specs are starved. They do not fail an assertion — they run past their own declared budget, including one spec that declares `{ timeout: 60_000 }` and still exceeds it. Because the starvation moves between runs, each execution failed a different handful of tests, and the same spec passed in isolation. Measured on a 32-core host with 14 GB RAM: the default pool produced 13 failures in 196 s, and a pool capped at six workers produced zero failures in 320 s.

## Decision

Both projects declare `maxWorkers: 8`. The cap is set identically in each because Vitest rejects sibling projects that share a `sequence.groupOrder` with differing `maxWorkers` values.

The failure mode was never a missing timeout budget: raising `testTimeout` alone let the starved specs run longer and raised the failure count. Correctness came from restoring the memory headroom those specs need, not from extending the time they are allowed to take.

## Consequences

The full unit lane completes with zero failures in roughly four to five minutes on a many-core host, inside the maintenance budget without partitioning or a separate benchmark runner. Hosts with fewer than eight cores are unaffected, because Vitest does not start more workers than it has cores. A larger-memory CI runner now uses eight workers instead of one per core, which trades some peak parallelism for a lane that does not need a retry.