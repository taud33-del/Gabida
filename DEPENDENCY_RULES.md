# Dependency Rules — Gabida

Dependencies are the connective tissue of a system. Uncontrolled dependencies create invisible coupling — changes in one module propagate unexpectedly to others, tests become difficult to isolate, and the system gradually becomes impossible to reason about as a whole. In Gabida, dependency direction is an architectural rule, not a convention.

Controlling dependencies means defining who may know about whom. A module that knows nothing about its neighbours can be changed, replaced, or tested without affecting them. A module that imports freely from across the system carries the weight of everything it imports. Dependency discipline is how architectural boundaries remain real rather than theoretical.

---

## Core principles

1. **Dependencies flow downward only.** Modules depend on what comes before them in the data contract hierarchy — never on what follows.
2. **Business modules never import each other.** A module may import from `types/` and `constants/` only — never from another pipeline module.
3. **`core/` is the only module that knows the full pipeline.** All other modules are unaware of what precedes or follows them.
4. **Adapters depend on interfaces, not implementations.** An adapter implements a contract; it never imports from the module it serves.
5. **Applications depend on the public API only.** No application code imports from internal engine modules.
6. **`types/` and `constants/` have no dependencies.** They are pure declarations — no logic, no imports from the rest of the system.
7. **Circular dependencies are forbidden without exception.** If A imports B and B imports A, the architecture is broken.
8. **New dependencies require explicit justification.** Adding a dependency between previously unconnected modules is an architectural decision, not an implementation detail.

---

## Allowed dependency directions

| Layer | May depend on |
|---|---|
| **Application** | Public API (`Gabida`, `Session`, `Response`) only |
| **Public API** | Engine internals through `core/` only |
| **Engine (`core/`)** | All pipeline modules, `types/`, `constants/` |
| **Pipeline modules** | `types/`, `constants/` only — never each other |
| **Adapters** | Their declared interface contract — never engine internals |
| **Providers** | Nothing within Gabida — they are external services |

---

## Forbidden dependencies

1. A pipeline module importing from another pipeline module.
2. A module importing from `core/` — only `core/` imports from modules, never the reverse.
3. An adapter importing from a pipeline module it is not contracted to serve.
4. An application importing from any internal engine module other than the public API.
5. `types/` importing from any module — it must remain a pure declaration layer.
6. `constants/` importing from any module — it must remain a pure declaration layer.
7. Any module importing from a module that appears later in the pipeline order.
8. Any module creating a runtime dependency that is not expressed in its declared imports.

---

## Dependency review checklist

- [ ] No new import from one pipeline module to another
- [ ] No new import into `types/` or `constants/`
- [ ] No application code importing internal engine modules
- [ ] No adapter importing from pipeline modules outside its contract
- [ ] No circular dependency introduced
- [ ] Dependency direction follows the official pipeline order
- [ ] New dependency documented if it crosses a previously uncrossed boundary
- [ ] `core/` remains the only module with visibility of the full pipeline

---

## Evolution policy

Dependencies may only change when the architectural boundaries they cross remain intact. Adding a dependency from one layer to another that was previously independent is an architectural decision — it must be documented in `ARCHITECTURE_DECISIONS.md` before it is implemented. Removing a dependency is always permitted if the module continues to fulfil its contract without it.

---

## Closing

Dependency direction is the mechanism that keeps architectural boundaries real. Without it, modules that appear separate on a diagram are effectively coupled at the code level. Enforcing dependency rules consistently — in every review, every pull request, every new module — is what prevents a well-designed system from becoming an entangled one over time.
