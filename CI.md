# Continuous Integration — Gabida

This document is the official source of truth for Gabida's CI philosophy and quality gates. GitHub workflows will implement these rules — this document defines them.

Continuous Integration exists to:
- protect architectural integrity across every contribution
- detect regressions before they reach the main branch
- keep the engine's behaviour deterministic and predictable
- maintain long-term code and documentation quality

---

## CI Philosophy

**Every commit should be releasable.**
The main branch is always in a state that could be published. Incomplete work belongs on a branch, not on main.

**Small changes are preferred.**
A focused pull request is easier to review, easier to test, and easier to revert if something goes wrong. Large changes accumulate risk.

**Automation validates rules. Humans review architecture.**
CI enforces objective criteria — tests pass, lint is clean, coverage thresholds are met. Architectural judgement — whether a module boundary is respected, whether a responsibility has been split correctly — belongs to human reviewers. Automation and review are complementary, not interchangeable.

**CI protects the repository, not contributors.**
A failing CI pipeline is not a judgement. It is information. The goal is to surface problems early, when they are cheap to fix, not to block progress arbitrarily.

---

## Quality gates

Every pull request must pass all of the following gates before it is eligible for merge.

| Gate | Purpose |
|---|---|
| **Lint** | Enforces code style and formatting consistency across the codebase |
| **Formatting** | Verifies that files conform to the project's formatting standards |
| **Unit tests** | Confirms that all existing behaviour is preserved and new behaviour is covered |
| **Coverage** | Ensures that new code does not reduce the overall test coverage below the project threshold |
| **Documentation** | Verifies that documentation has been updated where required |
| **JSDoc** | Confirms that public functions and types carry valid JSDoc annotations |
| **Build** | Validates that the project builds without errors in a clean environment |
| **Architecture review** | Human review confirming that module boundaries, invariants, and patterns are respected |

Architecture review is the only gate that cannot be automated. It is also the most important.

---

## Testing policy

- **Every module must have a dedicated test file.** A module without tests is not complete and will not be merged.
- **Pure functions are the preferred unit of test.** Given the same inputs, they always produce the same outputs. This makes tests deterministic, fast, and side-effect-free.
- **Edge cases are mandatory.** Happy paths alone are insufficient. Tests must cover invalid inputs, boundary conditions, and documented error cases.
- **Regression tests are required after every bug fix.** The fix is not complete until a test exists that would have caught the bug before it was introduced.
- **In-memory adapters are preferred over filesystem or network access.** Tests must pass in a clean, offline environment. Any I/O must be replaced by a stub or in-memory equivalent in the test suite.

---

## Documentation validation

Documentation is part of every deliverable. The following rules apply:

- `README.md` must be updated if any publicly visible behaviour changes.
- `CHANGELOG.md` must be updated for every change that ships in a release.
- JSDoc annotations must be updated whenever a function signature, parameter, or return type changes.
- `DEVELOPER_GUIDE.md` must be updated if a new pattern, convention, or restriction is introduced.
- `ARCHITECTURE.md` must be updated if module boundaries, the pipeline order, or any architectural invariant is affected.

A pull request that introduces a change without updating the corresponding documentation will be returned for revision before review begins.

---

## Pull request requirements

Before a pull request is eligible for merge, all of the following must be true.

- [ ] All existing tests pass in a clean environment
- [ ] No lint or formatting errors
- [ ] Documentation updated where required
- [ ] No architectural rules violated — module boundaries, dependency direction, immutability
- [ ] No unnecessary dependencies introduced
- [ ] Deterministic behaviour preserved — pure functions remain pure, contexts remain immutable
- [ ] Coverage not reduced below the project threshold
- [ ] JSDoc annotations up to date

---

## Future automation

The following workflows are planned and will be implemented in a future release. They are not yet active.

| Workflow | Description |
|---|---|
| **Lint** | Automated style and formatting check on every push and pull request |
| **Tests** | Full test suite executed in a clean Node.js environment |
| **Coverage** | Coverage report generated and compared against the project threshold |
| **Documentation validation** | Checks that required documents have been modified alongside code changes |
| **Dead link checker** | Verifies that all internal and external links in documentation are reachable |
| **Dependency audit** | Scans for known vulnerabilities in project dependencies |
| **Release pipeline** | Automated versioning, changelog generation, and package publication |
| **Benchmark validation** | Verifies that performance-sensitive operations remain within acceptable bounds |

These workflows will implement the quality gates defined in this document. This document takes precedence — if a workflow and this document conflict, this document is correct.

---

## Local development

Contributors should run the following commands before opening a pull request. Local validation reduces CI failures and speeds up the review cycle.

```bash
# Run the full test suite
npm test

# Check for lint errors
npm run lint

# Verify the build
npm run build
```

A pull request that fails CI on the first push suggests that local validation was skipped. Maintainers may ask contributors to run local checks before resubmitting.

---

## Failure policy

- **A pull request with a failing CI gate is not merged.** No exceptions for non-maintainers.
- **Failures must be corrected by the author.** A failing gate is the author's responsibility to investigate and fix.
- **No bypass.** CI gates may only be bypassed by repository maintainers in documented exceptional circumstances, such as a time-critical security patch.
- **Architecture violations are treated as CI failures.** A pull request that passes all automated gates but violates module boundaries or architectural invariants will not be merged until the violation is corrected. Human review is part of the CI process.

---

## Long-term vision

As the project matures, CI should evolve beyond code quality into architectural consistency verification. Future tooling may include automated checks for:

- **Module boundary enforcement** — detecting imports that violate the official dependency graph
- **Dependency direction rules** — verifying that no module imports from a module that follows it in the pipeline
- **Documentation synchronisation** — detecting when source changes are not reflected in the corresponding documentation
- **Contract validation** — verifying that data shapes produced by one module match the types expected by the next

These checks do not yet exist. They represent the direction of travel. The goal is a CI pipeline that can detect architectural drift automatically — making human review faster, more focused, and more reliable.

---

## Closing

CI is the automated guardian of Gabida's architecture. It cannot replace architectural judgement, but it can enforce the objective rules that make architectural judgement possible — consistent code, reliable tests, and documentation that reflects reality. Every gate in this pipeline exists to protect not the current state of the engine, but its ability to remain coherent as it grows.
