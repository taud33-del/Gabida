# Module Guidelines — Gabida

Modules are the foundation of Gabida's architecture. Each module is a self-contained unit of reasoning with a defined input, a defined output, and a single responsibility. The quality of the system as a whole depends directly on the discipline applied to each individual module.

A well-designed module can be understood in isolation, tested without its neighbours, and replaced without affecting the rest of the pipeline. These properties are not accidental — they are the result of applying consistent rules at the module level. This document defines those rules.

---

## Module responsibilities

1. **Answer exactly one question.** Every module exists to answer a single, clearly stated question. If a module cannot be described in one sentence, it is doing too much.
2. **Receive only what is needed.** A module is given only the inputs required to do its job — never more, never less.
3. **Return a single, typed output.** Every module produces one result, with a shape defined in `types/`.
4. **Build a private context at the start of every invocation.** All data the module needs is assembled once, frozen, and passed to sub-functions.
5. **Delegate logic to pure sub-functions.** The public function orchestrates; the sub-functions compute. No logic lives in the orchestrator itself.
6. **Assemble the result in one place.** A single assembly step combines sub-function results into the final output.
7. **Document its mission, question, and pipeline.** Every module's header states what it does, what question it answers, and how it processes its inputs.
8. **Ship with tests.** A module without tests is not complete.

---

## Required properties

| Property | Description |
|---|---|
| **Single responsibility** | The module answers one question and performs one transformation |
| **Explicit inputs** | All required data is passed as parameters — nothing is read from global state |
| **Explicit outputs** | The return type is defined in `types/` and documented in the module header |
| **Deterministic behaviour** | Identical inputs always produce identical outputs |
| **Immutable data** | Received data is never modified; new objects are returned instead |
| **No hidden state** | No data is stored between invocations at the module level |
| **Small public API** | Only the functions application code or the pipeline needs are exported |
| **Documented contracts** | Input types, output type, and error conditions are stated before the implementation |

---

## Module boundaries

1. **Modules do not import each other.** A module never imports from another business module directly.
2. **Communication happens through data.** Modules exchange typed data objects, not function calls between each other.
3. **Only `core/` knows the full pipeline.** Individual modules are unaware of what comes before or after them.
4. **Types are the shared language.** All inter-module data shapes are defined in `types/` and imported from there.
5. **Constants are the shared vocabulary.** All named values come from `constants/` — never from a module's private definitions.
6. **Dependencies flow in one direction.** No module imports from a module that follows it in the pipeline.
7. **Errors do not cross module boundaries unhandled.** A module catches its own errors and wraps them in typed error objects before returning.
8. **Side effects belong to designated modules only.** Only `api/` and `sauvegarde/` are permitted to perform I/O.

---

## Anti-patterns

1. **Importing from another business module** — modules communicate through data, not direct calls.
2. **Modifying received data** — inputs are immutable; always return new objects.
3. **Reading from global or shared state** — every invocation is self-contained.
4. **Storing data between invocations** — modules have no memory of previous calls.
5. **Making decisions outside the `decision/` module** — character decisions belong in one place.
6. **Performing I/O outside `api/` or `sauvegarde/`** — side effects are not distributed across the pipeline.
7. **Exporting internal sub-functions** — the public API is minimal and deliberate.
8. **Leaving contracts implicit** — if a data shape is not defined in `types/`, it does not exist as a contract.

---

## Long-term evolution

Modules may be refactored, optimised, and extended internally at any time, provided their public contracts — input types, output type, exported function signatures — remain unchanged. Internal changes that preserve the public contract are transparent to the rest of the system. Changes that affect the public contract require a documented architectural decision and a version increment.

---

## Closing

Architecture is built from small, predictable, composable modules. A system whose individual modules are coherent, well-bounded, and independently testable is a system that can grow without becoming fragile. Every module added to Gabida should make the system easier to understand — not harder.
