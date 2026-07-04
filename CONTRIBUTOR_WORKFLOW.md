# Contributor Workflow — Gabida

A consistent contribution workflow is not bureaucracy — it is the mechanism by which architectural quality is preserved across many contributors over time. Without a shared process, each contribution risks introducing inconsistencies that accumulate into structural debt. With one, each contribution reinforces the system rather than straining it.

The workflow described here applies to every contribution, regardless of size. A one-line fix and a new module follow the same sequence — the depth of each step scales with the scope of the change, but no step is skipped.

---

## Workflow

1. **Understand the architecture.** Read `ARCHITECTURE.md`, `DEVELOPER_GUIDE.md`, and the relevant module documentation before writing anything. Changes made without architectural understanding are the most common source of avoidable rework.

2. **Read the documentation.** Identify whether the change you intend to make is already covered by an existing design decision, a known constraint, or a documented pattern. `ARCHITECTURE_DECISIONS.md` and `DESIGN_PRINCIPLES.md` are the first places to look.

3. **Open a Discussion if needed.** If the change involves architectural judgement — a new module, a modified boundary, a new pattern — open a Discussion in the Architecture category before writing code. Consensus before implementation prevents rejected pull requests.

4. **Create an Issue.** Document what will change, why, which module is affected, and what the expected outcome is. An issue is the record of intention; it is kept open until the work is complete.

5. **Implement the change.** Work on a dedicated branch. Follow `MODULE_GUIDELINES.md`, `CODE_STYLE.md`, and `DEPENDENCY_RULES.md`. Keep the scope narrow — one issue, one branch, one concern.

6. **Test the change.** All existing tests must pass. New behaviour requires new tests. Regression tests are mandatory after bug fixes. Refer to `TESTING_GUIDE.md` for the full testing policy.

7. **Open a Pull Request.** Use the Pull Request template. Complete every section — Summary, Motivation, Scope, Architectural Impact, Documentation, Testing, and the Checklist. An incomplete template will be returned before review begins.

8. **Update documentation.** Every change that affects public behaviour, module contracts, or architectural patterns requires documentation updates before the pull request is considered ready. Documentation is part of the deliverable, not a follow-up task.

---

## Rules

1. Read the documentation before contributing — especially `ARCHITECTURE.md` and `DEVELOPER_GUIDE.md`.
2. Discuss architectural changes before implementing them.
3. Keep pull requests focused — one concern per branch.
4. Never submit a pull request with failing tests.
5. Never modify another module's internals without opening an architectural discussion first.
6. Update `CHANGELOG.md` for every change that affects documented behaviour.
7. Treat reviewer feedback as information, not as criticism — engage with it directly.
8. Do not close an issue until all documentation changes associated with it are merged.

---

## Things to avoid

1. **Implementing before discussing** — architectural misalignment discovered after implementation is far more expensive than before.
2. **Large pull requests** — changes that span multiple concerns are harder to review, harder to revert, and more likely to introduce hidden coupling.
3. **Skipping the PR template** — incomplete pull requests cannot be reviewed efficiently and will be returned.
4. **Updating code without updating documentation** — an undocumented change is an invisible change.
5. **Assuming conventions from other projects apply here** — Gabida has its own patterns; verify before applying external habits.
6. **Opening a pull request against the wrong branch** — always verify the target branch before submitting.
7. **Marking a pull request ready for review before tests pass** — CI failures visible at submission signal that local validation was skipped.
8. **Addressing review comments without acknowledging them** — explain what changed and why, so reviewers can verify the intent was understood.

---

## Closing

Every contribution should leave the codebase and the architecture in a better state than it found them. Code that works but introduces hidden coupling, undocumented behaviour, or missed tests is not a complete contribution. The measure of a good contribution is not whether it ships — it is whether the project is stronger for it.
