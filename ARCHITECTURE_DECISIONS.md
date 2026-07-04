# Architecture Decision Records — Gabida

This document records the major architectural decisions that shape the Gabida engine. Each entry explains what was decided, why, and what consequences follow. These decisions are long-term commitments — they are not revisited lightly.

---

## ADR-1 — Character cognition is separated from language generation

**Decision:** The engine handles all reasoning — analysis, emotion, decision — before the AI provider is involved. The provider generates dialogue text only.

**Why:** Delegating cognition to the LLM produces inconsistent, unpredictable characters. Separating the two responsibilities makes character behaviour deterministic, testable, and independent of any specific model.

**Consequence:** The engine must fully determine what a character thinks and decides before constructing the prompt. The LLM expresses a decision — it does not make one.

---

## ADR-2 — Immutable context objects

**Decision:** Every module constructs a private context object at the start of each invocation. That object is frozen and never mutated.

**Why:** Mutable shared state creates hidden dependencies between sub-functions, making behaviour unpredictable and tests unreliable.

**Consequence:** Sub-functions receive context as input and return new values as output. State changes are always explicit and traceable.

---

## ADR-3 — Pure functions whenever possible

**Decision:** All internal sub-functions are pure — deterministic, side-effect-free, and independently testable. Side effects are isolated in named, documented functions in `api/` and `sauvegarde/` only.

**Why:** Pure functions are the smallest testable unit. They make the engine's behaviour auditable and reproducible.

**Consequence:** Testing does not require mocking, network access, or filesystem access in business modules. Side effects are always visible by design.

---

## ADR-4 — Provider independence

**Decision:** The engine communicates with AI providers through a standard adapter interface. No module is coupled to a specific provider.

**Why:** Tying the engine to a single provider would make every provider change a breaking refactor. The adapter pattern isolates this variability.

**Consequence:** Any provider — cloud or local — can be connected without modifying the engine. Provider selection is configuration, not architecture.

---

## ADR-5 — Narrative before language

**Decision:** The full narrative state — what the character feels, what it decides, what it intends to say — is determined before the prompt is constructed.

**Why:** Language generation informed by a complete psychological state produces more coherent, more consistent, and more explainable character behaviour.

**Consequence:** The prompt is a consequence of the narrative state, not a driver of it. The engine is the author; the LLM is the voice.

---

## ADR-6 — Memory belongs to the engine

**Decision:** The engine manages what characters remember, how long they remember it, and what they forget. Memory is not delegated to the LLM context window.

**Why:** LLM context windows are finite, unstructured, and ephemeral. Engine-managed memory is durable, queryable, and architecturally explicit.

**Consequence:** Characters maintain coherent memory across sessions, independent of the LLM used or the length of the conversation.

---

## ADR-7 — The public API remains stable

**Decision:** The three public objects — `Gabida`, `Session`, `Response` — and their documented methods do not change without a major version increment and a migration path.

**Why:** Applications built on Gabida must not break when the engine evolves internally. Stability of the public surface is a contract with developers.

**Consequence:** Internal modules may be restructured freely. The public API is the boundary that must be preserved.

---

Future architectural decisions should be recorded here, not scattered across commit messages, pull requests, or discussion threads. A decision that cannot be found is a decision that will be made again.
