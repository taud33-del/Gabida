# Contributing to the Architecture — Gabida

Every contribution to Gabida is also a contribution to its architecture. Code changes that introduce coupling, blur module boundaries, or bypass documented contracts are not neutral — they degrade the system, even when the immediate functionality they add is correct. Architectural coherence is not a secondary concern that follows from good intentions; it requires explicit, prior thought.

Before proposing any change, a contributor must understand the structural context of what they are modifying. A module's mission, its place in the pipeline, its inputs and outputs, and the invariants it must respect are all constraints on what changes are acceptable. Understanding these constraints before writing code is the first architectural responsibility of every contributor.

---

## Core principles

1. **Architecture comes before implementation.** A change that conflicts with the architecture is not a valid change until the architecture is formally updated.
2. **Module boundaries are not suggestions.** Importing across module boundaries without an ADR is a violation, not a shortcut.
3. **Contracts define behaviour.** If a change requires a contract to behave differently, the contract change is the real change and must be documented first.
4. **Determinism is non-negotiable.** A change that introduces non-deterministic behaviour into the cognitive pipeline will not be accepted.
5. **Provider independence is preserved.** No change may couple the engine's behaviour to a specific provider.
6. **New responsibilities require new modules.** Adding a responsibility to an existing module instead of creating a new one violates single responsibility.
7. **Every structural decision is recorded.** A change that moves a boundary, adds a dependency, or modifies a public contract requires an ADR.
8. **Documentation is architectural evidence.** A change that cannot be described clearly in documentation is a change whose design is not yet clear.

---

## Before contributing

1. Read `ARCHITECTURE.md` and identify which part of the pipeline your change affects.
2. Read the mission statement and public contract of every module you intend to modify.
3. Verify that your change does not violate any of the invariants listed in `ARCHITECTURE.md`.
4. Determine whether your change requires an ADR — consult `ADR_PROCESS.md` for the criteria.
5. Open a Discussion in the Architecture category if the change involves module boundaries, new dependencies, or contract modifications.
6. Confirm that the change preserves provider independence — no module may behave differently based on which provider is active.
7. Identify all documentation that must be updated before the pull request can be considered complete.
8. Verify that the change can be fully tested without network access, filesystem access, or real provider calls.

---

## Architectural review

| Review question | Why it matters |
|---|---|
| Does it preserve existing module boundaries? | Boundary violations create hidden coupling that compounds over time |
| Does it affect the public API? | Public API changes require a major version increment and migration documentation |
| Does it introduce coupling between previously independent modules? | Coupling makes modules impossible to change or test in isolation |
| Does it require an ADR? | Structural changes without a decision record become invisible architecture |
| Does it require documentation updates? | An undocumented change does not exist for the contributors who follow |
| Is the resulting behaviour deterministic? | Non-determinism in the pipeline violates a foundational engine guarantee |
| Is it maintainable without prior context? | A change only its author understands is a future maintenance burden |
| Is it provider-independent? | Provider coupling defeats the adapter architecture and breaks interchangeability |

---

## Things to avoid

1. **Modifying a module to serve two responsibilities** — split the module instead.
2. **Importing from a module that follows later in the pipeline** — dependency direction must flow forward only.
3. **Adding provider-specific logic inside the engine** — that belongs in an adapter.
4. **Making structural changes without an ADR** — undocumented structural changes are invisible to future contributors.
5. **Hardcoding values that belong in `constants/`** — magic values in modules are a documentation failure.
6. **Expanding the public API without review** — the public surface is the stability contract; additions are permanent commitments.
7. **Combining a bug fix with a refactor in one pull request** — each change should be independently reviewable.
8. **Assuming a pattern from another project applies here** — Gabida's conventions exist for specific architectural reasons; verify before adopting external habits.

---

## Long-term philosophy

Contributors maintain Gabida's architecture, not only its code. The engine's value comes from structural coherence accumulated over many contributions. Each contributor who respects the boundaries, documents the decisions, and preserves the invariants adds to that coherence. Each contributor who does not subtracts from it — often in ways that are not visible until much later.

---

## Closing

Every accepted contribution should leave the architecture clearer than before — better documented, better tested, better bounded. A contribution that adds a feature but obscures a boundary has not improved the system. The measure of a good contribution is not what it adds, but what it leaves behind.
