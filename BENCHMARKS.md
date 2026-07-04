# Benchmarks — Gabida

Performance matters, but it is not the primary measure of a good engine. Gabida is designed first for correctness, determinism, and architectural coherence. Benchmarks exist to verify that the architecture does not introduce unnecessary cost — not to drive optimisation at the expense of clarity.

This document defines how Gabida performance should be measured and interpreted. It does not contain benchmark results. Results change with every release and belong in the release notes or a dedicated benchmark report, not in this document.

---

## What should be measured

- **Startup time** — how long the engine takes to initialise from a cold start before accepting a session.
- **Memory usage** — the baseline memory footprint of a running engine instance across a sustained session.
- **Narrative execution** — the time required to process a complete turn through the full cognitive pipeline, excluding provider latency.
- **Context creation** — the overhead of building and freezing module context objects per turn.
- **Save and load** — the time required to serialise and deserialise a complete session state.
- **Provider latency (isolated)** — the time spent waiting for an AI provider response, measured independently so it does not obscure engine performance.

---

## What should NOT influence benchmarks

- Network conditions or AI provider response times mixed into engine timing
- Filesystem performance when an in-memory adapter is the correct substitute
- JIT warm-up effects on the first run of a benchmark suite
- Test environment variability — benchmarks must run in a controlled, reproducible environment
- Implementation details that do not correspond to real usage patterns
- Artificial workloads that do not reflect typical session or turn structures

---

## Benchmark principles

1. **Isolate what you measure.** Provider latency, filesystem I/O, and engine computation are measured separately.
2. **Use realistic inputs.** Benchmark data should reflect actual session structures, not minimal or maximal edge cases.
3. **Repeat for stability.** A single run is not a benchmark. Results are averaged across multiple runs in the same environment.
4. **Control the environment.** Benchmarks run on consistent hardware with consistent dependencies — not on developer laptops mid-session.
5. **Benchmark before optimising.** No performance change is made without a benchmark demonstrating the problem first.
6. **Do not optimise at the cost of clarity.** A measurable performance gain that reduces code readability requires explicit justification.
7. **Track regression, not just improvement.** A benchmark suite that only celebrates wins is not a safety net.
8. **Document methodology alongside results.** A result without its methodology is not reproducible and therefore not useful.

---

## Comparing versions

Benchmark comparisons between versions are only valid when run in identical environments — same hardware, same Node.js version, same adapter configuration, same input data. A result that cannot be reproduced under the same conditions does not constitute evidence of regression or improvement. Before concluding that a version is faster or slower, verify that the comparison is fair.

---

## Reporting results

1. Always state the environment — OS, Node.js version, hardware profile.
2. Always state the methodology — number of runs, warm-up strategy, input shape.
3. Report ranges, not single values — variance is as informative as the mean.
4. Separate engine time from provider time in every report.
5. Link results to the specific version and commit they describe.

---

## Closing

Benchmarks exist to validate that the architecture performs acceptably — not to drive premature optimisation. If a benchmark reveals a genuine performance problem, the solution must remain within the architectural constraints. A fast engine that violates module independence is not an improvement.
