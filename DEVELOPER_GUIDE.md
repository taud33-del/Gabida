# Developer Guide — Gabida Engine

> The official reference for contributors and engineers working on the Gabida engine.

---

## What this guide is

This guide is for developers who want to **modify, extend, or contribute to the Gabida engine itself** — not for developers who want to use Gabida in their applications.

| Document | Audience |
|---|---|
| `README.md` | Anyone discovering the project |
| `QUICKSTART.md` | Developers using Gabida in their application |
| `ARCHITECTURE.md` | Anyone who needs to understand the system's structure |
| `DEVELOPER_GUIDE.md` | **Engineers working on the engine itself** |

If you want to add a new module, modify an existing one, register a new provider, or contribute a bug fix, this is your starting point.

The Gabida engine has a strong, intentional architecture. Understanding it before writing a single line of code is not optional — it is the prerequisite.

---

## The Golden Rules

These rules are non-negotiable. They apply to every module, every function, every pull request.

**One responsibility per module.**
Every module answers exactly one question. If you cannot state the question in a single sentence, the module has too many responsibilities.

**One stable public interface.**
A module exposes a small, stable set of public functions. Internal helpers are never exported.

**Immutable context.**
Every module builds its own private context object and never mutates it. The context is constructed once, frozen, and passed down.

**Pure internal functions.**
All sub-functions inside a module are pure: given the same inputs, they always return the same outputs. No side effects, no globals, no I/O.

**Single assembly point.**
Each module has exactly one place where all sub-function results are assembled into the final output. There is no scattered construction logic.

**No undocumented side effects.**
If a function performs I/O, an HTTP call, or any operation with external consequences, this must be explicitly documented, isolated, and justified.

**No magic strings.**
Every named value used in logic belongs in `constants/`. If you find yourself writing a string literal in a condition, it is a constant that has not been declared yet.

**Centralised constants.**
All official enumerations live in `constants/`. No module defines its own string values for shared concepts.

**Documented types.**
Every data contract is defined in `types/`. No module invents its own undocumented shape for shared data.

**Mandatory tests.**
Every module ships with its own test file. A module without tests is not complete.

---

## The Module Pattern

All Gabida modules follow the same internal pattern. This is not a suggestion — it is the architecture.

```
  Public function called by core/
          ↓
  Build the private context (ctx)
          ↓
  Call independent sub-functions
  each receiving only ctx or a subset
          ↓
  Assemble results
          ↓
  Return the official output type
```

**Why this pattern exists.**

It enforces a clean boundary between the public interface and the internal implementation. The public function is a thin orchestrator — it knows the order of operations, but it does not contain logic. Each sub-function contains exactly one piece of logic and knows nothing about the others. The assembly step is predictable and auditable.

This means that any sub-function can be tested in complete isolation, any sub-function can be replaced without touching others, and the public function always stays stable even as internals evolve.

**Example shape of a module:**

```javascript
// Public interface — the only export consumers should use
export async function processStep(input, etat) {
  const ctx    = buildContext(input, etat)  // build once, never mutate
  const partA  = computeA(ctx)
  const partB  = computeB(ctx, partA)
  const result = assemble(ctx, partA, partB)
  return result
}

// Private — never exported
function buildContext(input, etat) { ... }
function computeA(ctx)             { ... }
function computeB(ctx, partA)      { ... }
function assemble(ctx, partA, partB) { ... }
```

---

## Context Objects

Every module builds a private context object (`ctx`) at the start of its public function. This object holds everything the module needs for the duration of one invocation.

**Why a dedicated context?**

Without a context, sub-functions need many individual parameters. As the module grows, function signatures become unwieldy and dependencies become unclear. A context makes the data flow explicit and keeps sub-function signatures clean.

**Why immutability?**

A mutable context is a hidden shared state. If sub-function A modifies the context and sub-function B reads from it later, you have an invisible dependency between A and B that is not expressed in their signatures. This is the beginning of the end for testability and predictability.

Use `Object.freeze` on contexts. A frozen context cannot be accidentally mutated. If a sub-function needs to produce a derived value, it returns a new object — it never writes back to `ctx`.

**Why no sharing between modules?**

A context is private to one invocation of one module. It is never passed to another module, stored globally, or reused across turns. Each turn, each module, builds a fresh context from scratch.

---

## Pure Functions

A pure function has two properties:

1. **Deterministic** — given the same inputs, it always returns the same output.
2. **No side effects** — it does not read from or write to anything outside its parameters.

In Gabida, all internal sub-functions must be pure. This is what makes modules independently testable without mocking, reliable under any call order, and safe to reason about in isolation.

**What counts as a side effect?**

- Reading from the filesystem
- Writing to the filesystem
- Making an HTTP request
- Accessing a global variable
- Mutating a parameter
- Using `Date.now()` or `Math.random()` without injecting them

**What is permitted?**

Side effects are permitted only in two modules: `api/` (LLM calls) and `sauvegarde/` (persistence). In those modules, side effects must be isolated in dedicated, named functions — never scattered across helpers.

If you need a timestamp inside a pure function, inject it as a parameter. If you need randomness, inject a seed or a generator. Keep the function testable.

---

## Module Independence

No module knows what comes before or after it in the pipeline. This is enforced by design, not by convention.

```
analyse/    — does not know that influences/ exists
influences/ — does not know that ressenti/ exists
ressenti/   — does not know that decision/ exists
decision/   — does not know that prompt/ exists
prompt/     — does not know that api/ exists
api/        — does not know that memoire/ exists
memoire/    — does not know that sauvegarde/ exists
```

Each module receives its inputs, produces its outputs, and stops there. It never imports another business module. It never calls another module's public function. It communicates exclusively through data — via the types defined in `types/`.

`core/` is the only module that knows the full pipeline. Its sole responsibility is to call each module in order and pass the outputs of one as the inputs of the next.

**Why does this matter?**

Independence means you can replace any module without touching any other. You can test any module without running the full pipeline. You can reason about any module without understanding the whole system. These properties are only possible if modules truly do not know each other.

---

## Official Folder Structure

```
constants/     All official enumerations and named values.
               No logic. No functions. Constants only.
               Every business string in the engine traces back here.

types/         All shared data contracts (JSDoc typedefs).
               No logic. No functions. Type definitions only.
               Every data shape used across modules is defined here.

core/          The pipeline orchestrator.
               Calls each module in order. Assembles the turn result.
               Contains no business logic of its own.

analyse/       Qualifies the player message as a structured event.
influences/    Computes all active influences on the character.
ressenti/      Calculates the character's emotional state.
decision/      Determines the character's decision and attitude.
prompt/        Builds the final prompt for the AI provider.
api/           Abstract interface to LLM providers.
memoire/       Manages lived memory — retention and forgetting.
conversation/  Maintains the short-term exchange history.
sauvegarde/    Persists and restores the complete session state.

lecture/       Loads and validates character and world data files.
axiomes/       The 20 universal architectural axioms of Gabida.
```

The dependency direction is always downward. A module may import from `types/` and `constants/`. It may never import from another business module.

---

## Adding a New Module

Before writing any code, complete the following steps in order. Every step is mandatory.

**1. Define the mission.**
What is the single responsibility of this module? Write it in one sentence. If you cannot, stop and reconsider whether the module is needed, or whether it overlaps with an existing one.

**2. State the question.**
Every module answers exactly one question. Write the question. Example: *"What does the player mean?"* or *"What should the character remember from this turn?"*

**3. Define the public interface.**
What functions will this module export? How many? What are their signatures? Write this before implementing anything.

**4. Define the context.**
What data does this module need to do its job? What goes into `ctx`? What is its shape?

**5. Design the pipeline.**
What are the sub-steps? In what order? Which sub-function produces what? Draw the flow before writing it.

**6. Define the data contracts.**
What types does this module consume? What type does it produce? Add them to `types/` before writing implementation code.

**7. Write tests first.**
Define what the module must do and what it must not do. Write the tests. Then implement until they pass.

**8. Write the documentation.**
The module's header comment must include: mission, question, pipeline, data contracts, dependencies, and a conformity checklist.

---

## Coding Conventions

**Naming.**
Function names describe the action they perform. Use verb prefixes that signal the nature of the operation:

| Prefix | Meaning |
|---|---|
| `construire` | builds a structured object |
| `calculer` | performs a computation and returns a value |
| `assembler` | combines multiple results into a final output |
| `determiner` | makes a choice between options |
| `valider` | checks a contract and throws if violated |
| `serialiser` / `deserialiser` | converts between formats |
| `resoudre` | looks up a dependency (adapter, provider, etc.) |

**No mutation.**
Functions receive data. They return new data. They never modify what they received. If you need to update an object, create a new one with the updated values.

**No business singletons.**
Global mutable state is forbidden in business modules. A module may maintain a private registry (such as an adapter registry) only when the registry itself is the explicit responsibility of that module.

**No global state.**
Each turn is self-contained. No data flows invisibly between turns via globals. Everything a module needs is passed explicitly.

**Constants, not literals.**
Never write `'user'` in a condition. Write `ROLES_MESSAGE.JOUEUR`. Never write `'fr'` as a logic value. Define it.

---

## Testing Philosophy

**Each module owns its tests.**
A module's test file lives alongside its implementation. Tests are part of the module, not an afterthought.

**Tests are independent.**
A module's tests never depend on another module's implementation. If module A needs data shaped like module B's output, the test constructs that data directly — it does not call module B.

**Side effects are isolated.**
In modules with side effects (`api/`, `sauvegarde/`), tests use in-memory adapters or stubs. No test ever makes a real HTTP call or writes to the filesystem. The test suite must pass offline.

**Tests cover contracts, not internals.**
Test the public interface and the observable behaviour. Do not test private sub-functions directly. If a sub-function needs its own test, consider whether it should be a public utility instead.

**Errors are first-class.**
Every documented error class must have at least one test that verifies it is thrown in the correct circumstances. Unhappy paths are not optional.

---

## Common Mistakes

These patterns are explicitly forbidden. They are listed here because they are the most common ways a well-intentioned change breaks the architecture.

**Importing a business module from another business module.**
`decision/` importing from `analyse/` is forbidden. Modules communicate via data, not via direct calls.

**Mutating a received object.**
If a function receives `etat` and adds a property to it, that is a mutation. Return a new object instead.

**Sharing or reusing a context across turns.**
A context is created per invocation. It dies at the end of the function call. Never store it, cache it, or pass it to the next turn.

**Creating a circular dependency.**
If module A imports from module B and module B imports from module A, the architecture is broken. Dependency direction is always downward.

**Using a string literal where a constant should be.**
`if (intention === 'curiosity')` is a magic string. `if (intention === INTENTIONS.CURIOSITE)` is correct.

**Computing the same value twice.**
If a value is computed in `ressenti/`, it is not recomputed in `decision/`. Data flows forward. It is never recalculated downstream.

**Making a narrative decision inside `prompt/`.**
`prompt/` builds language. It does not decide what the character does. Decisions are made in `decision/` and passed to `prompt/` as data.

**Calling a provider from `core/`.**
`core/` orchestrates. It calls `api/`, which calls the provider. `core/` never makes external calls directly.

**Persisting a calculable value.**
If a value can be recomputed from other persisted data, it must not be saved. Only irreducible state is persisted. This is Invariant 2 of the architecture.

---

## Documentation Standards

Every module's main file must open with a JSDoc block covering the following, in order:

```
Mission
  One sentence. What does this module do?

Question
  The single question this module answers.

Pipeline
  The sequence of internal steps, as a diagram.

Data contracts
  What types come in. What type goes out.

Producers / consumers
  Who produces the input types. Who consumes the output type.

Dependencies
  Which constants and types are imported.

Conformity checklist
  ✓ Single responsibility
  ✓ Immutable context
  ✓ Pure sub-functions
  ✓ No forbidden imports
  ✓ No magic strings
  ✓ Official types only
  ✓ Tests provided
```

If a module's documentation cannot be completed, the module is not ready to be merged.

---

## Before Opening a Pull Request

Run through this checklist before submitting.

- **Architecture respected** — no forbidden imports, no inverted dependencies, no magic strings
- **Single responsibility** — the module still answers exactly one question
- **Tests green** — the full test suite passes with no new failures
- **New behaviour tested** — every new code path has a corresponding test
- **Documentation updated** — module header, types, and constants are up to date
- **Types documented** — any new data shape is defined in `types/`
- **Constants centralised** — any new named value is defined in `constants/`
- **No regression** — existing modules are not affected by the change
- **Context immutable** — no `ctx` mutation anywhere in the change
- **Side effects isolated** — any new I/O is named, documented, and isolated

A pull request that fails any of these criteria will not be merged. This is not bureaucracy — it is the only way a system like this stays coherent over time.

---

## Further reading

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the full architectural contract, principles, and invariants
- [`MANIFESTO.md`](./MANIFESTO.md) — the vision and philosophy that motivate every architectural decision
- [`QUICKSTART.md`](./QUICKSTART.md) — if you need a reminder of what the engine looks like from the outside

---

*The architecture is the product. Everything else is implementation.*
