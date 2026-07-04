# Error Handling — Gabida

Errors are not exceptional events — they are expected outcomes that require the same architectural discipline as any other part of the system. A failure that is named, typed, and handled predictably is a failure that can be reasoned about, tested, and recovered from. A failure that is swallowed, obscured, or propagated without context is a defect waiting to surface at the worst moment.

In a deterministic system, error handling must also be deterministic. The same input that produces an error must always produce the same error, at the same boundary, with the same type. Predictable failures are not a sign of a fragile system — they are a sign of an honest one.

---

## Core principles

1. **Errors are typed.** Every documented failure condition has a named error type. Raw, untyped exceptions do not cross module boundaries.
2. **Errors are caught at the boundary where they occur.** A module that encounters an error wraps it and returns it — it does not allow raw failures to propagate into neighbouring modules.
3. **Errors are part of the contract.** Every module's documented interface includes the error conditions it may produce, alongside its inputs and outputs.
4. **Silent recovery is forbidden.** If a failure is handled internally, it is either logged or surfaced — never silently ignored.
5. **Errors do not carry internal implementation details.** The message and structure of an error is designed for its consumer, not for debugging the module's internals.
6. **Provider errors are always isolated.** Failures from external providers are caught at the adapter boundary and translated before reaching the engine.
7. **Validation errors occur early.** Input validation happens as close to the entry point as possible — not deep within the processing pipeline.
8. **Error taxonomy is centralised.** Error types are defined and documented alongside the module responsible for producing them.

---

## Error categories

| Category | Responsibility |
|---|---|
| **User input** | Validated at the public API boundary before entering the pipeline |
| **Provider** | Caught at the adapter boundary and translated into engine error types |
| **Adapter** | Produced by the adapter layer when an integration fails to fulfil its contract |
| **Engine** | Produced when the pipeline encounters an internal inconsistency |
| **Internal module** | Produced when a module receives input that violates its documented contract |
| **Configuration** | Detected at initialisation time before any session or turn begins |
| **Runtime** | Unexpected failures during execution — always typed and surfaced, never swallowed |
| **Unexpected failure** | Any unrecognised error is caught at the top level and returned as a typed unknown failure |

---

## Error propagation rules

1. **Errors travel upward through the call stack, not sideways.** A module does not pass its errors to a sibling module.
2. **Each layer re-wraps errors with its own context.** An adapter wraps provider errors; the engine wraps adapter errors; the public API wraps engine errors.
3. **The public API is the final error boundary.** Application code receives typed, consumer-appropriate errors — never raw internal failures.
4. **Errors do not mutate session state.** A failure during a turn leaves the session in its last valid state.
5. **Partial failures are not valid outputs.** A module either succeeds and returns its output type, or fails and returns an error — never a partial result.
6. **Error context is additive, not destructive.** Re-wrapping an error preserves the original cause — it is never discarded.
7. **Synchronous and asynchronous errors follow the same rules.** Async failures are typed and propagated identically to synchronous ones.
8. **Errors from `api/` and `sauvegarde/` are always explicitly handled.** I/O failures are never allowed to propagate as unhandled rejections.

---

## Things to avoid

1. **Swallowing errors** — catching a failure and returning a default value without surfacing the problem.
2. **Leaking internal error types** — returning stack traces, internal function names, or raw exceptions to the public API.
3. **Hiding errors in return values** — returning `null` or an empty object to signal a failure instead of a typed error.
4. **Catching errors too broadly** — a catch-all that handles every failure the same way prevents accurate diagnosis.
5. **Producing errors in the wrong layer** — a provider error being thrown by the engine, or a user input error being produced deep in the pipeline.
6. **Conflating different failure modes** — a single error type used for both configuration failures and provider failures loses diagnostic value.
7. **Recovering without logging** — internally handling a failure without any observable signal makes debugging impossible.
8. **Treating validation and runtime errors identically** — the two have different causes, different consumers, and different recovery strategies.

---

## Long-term philosophy

Explicit failures are always preferable to hidden recovery. A system that fails loudly and clearly at the right boundary is easier to debug, easier to test, and easier to trust than one that silently compensates for problems. When something goes wrong, the right response is to surface it — not to absorb it.

---

## Closing

Predictable failures are a property of reliable architecture. An error that occurs at a known boundary, with a known type, and with a clear cause is not a weakness — it is evidence that the system understands its own limits. Designing for failure with the same care applied to success is what separates architecture from optimism.
