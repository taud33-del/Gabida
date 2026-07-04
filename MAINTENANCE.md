# Maintenance — Gabida

Maintenance is not the activity that happens between features — it is an ongoing architectural responsibility. Every change made to a running system, however small, has the potential to reinforce or erode the structural decisions that were made deliberately. Treating maintenance as mere bug fixing misses the point: maintenance is how architecture survives over time.

The same principles that guide new development apply to maintenance. Boundaries must be respected. Contracts must be preserved. Documentation must reflect reality. A maintenance change that fixes a bug by breaking a module boundary has not improved the system — it has traded one problem for another that is harder to see.

---

## Maintenance principles

1. **Understand before changing.** Read the relevant documentation, module mission, and associated tests before modifying anything.
2. **Fix the root cause, not the symptom.** A patch that suppresses a failure without addressing its origin will resurface later with more context obscured.
3. **Preserve contracts.** Any change that modifies a module's public inputs or outputs is a breaking change, regardless of how small it appears.
4. **One concern per change.** Maintenance tasks are kept narrow — a bug fix does not simultaneously refactor the module that contains it.
5. **Document what changed and why.** `CHANGELOG.md` is updated for every user-facing change; `ARCHITECTURE_DECISIONS.md` is updated for every structural change.
6. **Tests accompany every fix.** A bug fix without a regression test has not eliminated the bug — it has hidden it.
7. **Dependencies are updated deliberately.** Dependency updates are evaluated for compatibility and breaking changes before being applied.
8. **Architecture violations discovered during maintenance are reported.** If a maintenance task reveals a structural problem, it is documented as an issue before or alongside the fix.

---

## Types of maintenance

| Type | Purpose |
|---|---|
| **Corrective** | Fix defects in documented behaviour — the most urgent category |
| **Preventive** | Address fragility or technical debt before it produces failures |
| **Adaptive** | Update the engine to remain compatible with evolving dependencies or environments |
| **Documentation** | Synchronise written documentation with the current state of the system |
| **Refactoring** | Improve internal structure without changing observable behaviour |
| **Performance** | Reduce unnecessary cost while preserving correctness and architecture |
| **Dependency updates** | Keep dependencies current, secure, and compatible |
| **Testing** | Improve coverage, remove brittle tests, add missing regression tests |

---

## Before making a change

- [ ] The module's mission and documented contract have been read
- [ ] The root cause of the problem has been identified, not just the symptom
- [ ] No architectural boundary is crossed by the proposed fix
- [ ] Existing tests have been run and their results understood
- [ ] The change is narrow enough to be described in one sentence
- [ ] The documentation that needs updating after the change has been identified
- [ ] A regression test for the defect being fixed has been planned
- [ ] The change does not introduce a new dependency without justification

---

## Things to avoid

1. **Fixing symptoms** — addressing the observable failure without identifying what caused it.
2. **Expanding scope mid-task** — a maintenance task that grows into a refactor mid-execution should be split into two separate changes.
3. **Removing tests to make a fix pass** — tests that fail reveal problems; removing them conceals them.
4. **Updating documentation after the fact** — documentation is updated as part of the same change, not as a follow-up.
5. **Applying external conventions without verification** — patterns from other projects may conflict with Gabida's architecture.
6. **Accumulating small hacks** — each tolerated shortcut increases the cost of every future change.
7. **Updating dependencies without testing** — compatibility is verified before a dependency update is merged.
8. **Leaving architecture violations in place** — a discovered violation is either fixed immediately or recorded as an open issue; it is never silently accepted.

---

## Long-term philosophy

Maintaining architecture is more important than accumulating features. An engine with ten well-maintained, coherent modules is more valuable than one with twenty modules where the boundaries have eroded and the contracts are no longer trustworthy. Every maintenance task is an opportunity to strengthen the system — or to weaken it. The choice is made in how the task is approached.

---

## Closing

Every maintenance task should leave the project in a better state than it found it — not just in terms of the specific defect addressed, but in terms of clarity, coverage, and structural integrity. A maintenance contribution that fixes a bug, adds a regression test, and updates the relevant documentation has done three things right. That is the standard.
