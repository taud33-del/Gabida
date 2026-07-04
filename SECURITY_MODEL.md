# Security Model — Gabida

A predictable system is a more secure system. When every module has a defined responsibility, every data contract is explicit, and every side effect is isolated and named, the attack surface is easier to reason about and easier to audit. Gabida's architectural constraints are also security constraints.

This document describes the security philosophy embedded in the engine's design — not cryptographic implementation, not authentication, and not network security. Those concerns belong to the application layer. What belongs here is the reasoning behind the engine's structural decisions and the guarantees they produce.

---

## Security principles

1. **Modules are isolated.** No module can directly access another module's internal state. Data flows through explicit contracts only.
2. **Side effects are named.** Every operation with external consequences is identified, isolated in a dedicated function, and documented.
3. **Context objects are immutable.** Once constructed, a module's context cannot be modified by any sub-function. Accidental state corruption is structurally prevented.
4. **The public API is the only entry point.** Application code cannot reach internal engine state except through the documented public surface.
5. **Provider communication is isolated.** The engine never exposes raw provider responses to application code without processing them through the defined pipeline.
6. **Session state is versioned.** Every saved session carries version metadata, enabling migration and integrity verification.
7. **No implicit dependencies.** Modules declare their inputs explicitly. Hidden dependencies between modules are structurally impossible.
8. **Errors are typed and bounded.** The engine's error taxonomy is defined and explicit — no raw exceptions from internal sub-functions propagate unhandled to the public surface.

---

## Trust boundaries

| Component | Responsibility within the trust model |
|---|---|
| **Engine** | Trusted core — enforces all architectural guarantees and owns all cognitive logic |
| **Provider** | Untrusted external — receives a prompt and returns text; its output is treated as user content, not as trusted instruction |
| **Adapter** | Boundary layer — translates between the engine and the provider; responsible for isolating provider errors |
| **Application** | Consumer — interacts only through the public API; responsible for its own authentication, authorisation, and data handling |
| **User** | External actor — input is always treated as untrusted data to be analysed, not executed |

---

## What the engine guarantees

1. Module boundaries are enforced — no module accesses another's internals.
2. Context objects cannot be mutated by sub-functions once constructed.
3. All side effects are isolated and documented.
4. Provider responses are processed through the pipeline before reaching application code.
5. Session state is versioned and migration-aware.
6. The public API surface is the only supported interaction point.
7. Error conditions are handled explicitly — no silent failures in documented code paths.
8. Deterministic behaviour — identical inputs produce identical internal states.

---

## What Gabida does NOT guarantee

1. The security of the application built on top of the engine.
2. The confidentiality of data sent to or received from AI providers.
3. The behaviour of third-party storage adapters or provider implementations.
4. Protection against malicious prompt content crafted by the player.
5. Authentication or authorisation of users or sessions.
6. Network security between the engine and any external service.
7. Compliance with data protection regulations in any specific jurisdiction.
8. The trustworthiness of locally hosted models used as providers.

---

## Security mindset

Security in Gabida comes from architectural predictability, not from hidden behaviour. A system that behaves consistently, isolates its side effects, and makes its boundaries explicit is easier to audit, easier to test, and harder to exploit than one that relies on obscurity or implicit conventions. Every architectural rule that enforces isolation also reduces the surface available for unintended interaction.

---

## Closing

Explicit interfaces, isolated modules, and predictable execution are not only architectural virtues — they are security properties. The same boundaries that make the engine testable and maintainable also make it auditable. Gabida's security posture is its architecture.
