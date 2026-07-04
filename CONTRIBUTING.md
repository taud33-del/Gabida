# Contributing to Gabida

Thank you for taking the time to contribute.

Gabida is an opinionated project. Every architectural decision is intentional and documented. The engine prioritises structural quality over feature quantity — a smaller, coherent codebase is worth more than a large, fragmented one.

Contributions of any kind are welcome: bug reports, documentation improvements, new adapters, new providers, or architectural discussions. What matters is not the size of the contribution, but its alignment with the project's principles.

---

## Before contributing

Please read the following documents before opening any issue or pull request. This is not a formality — each document answers a different question that will directly affect your contribution.

| Document | What it answers |
|---|---|
| [`README.md`](./README.md) | What is Gabida and why does it exist? |
| [`QUICKSTART.md`](./QUICKSTART.md) | What does the public API look like from the outside? |
| [`MANIFESTO.md`](./MANIFESTO.md) | What are the founding values of the project? |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | What are the rules, invariants, and boundaries? |
| [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) | How do I write code that fits the engine? |

Pull requests that demonstrate unfamiliarity with these documents are likely to be returned for revision before review begins.

---

## Development philosophy

Gabida is built around a small number of principles that take precedence over individual preferences.

**Architecture before features.**
A new feature that breaks the module boundaries is not an improvement. An architectural discussion that delays a feature by one sprint is always worth it.

**One responsibility per module.**
If you cannot state what a module does in a single sentence, it is doing too much.

**Deterministic behaviour.**
Business modules are pure. Given the same inputs, they always produce the same outputs. This is not a constraint — it is what makes the engine testable, auditable, and trustworthy.

**Documentation first.**
Every new module begins with its mission, question, and pipeline written out in prose. The implementation follows the documentation, not the other way around.

**Tests before merge.**
No code without tests. No exceptions.

**Readability over cleverness.**
A clear function that a new contributor can understand in ten seconds is worth more than an optimised one that requires ten minutes of archaeology.

---

## Contribution workflow

**1. Fork the repository.**
Create your own fork on GitHub.

**2. Create a branch.**
Use a descriptive branch name that reflects the nature of the change.

```bash
git checkout -b fix/sauvegarde-migration-chain
git checkout -b feat/anthropic-provider
git checkout -b docs/developer-guide-context-section
```

**3. Develop your change.**
Follow the Module Pattern and all conventions described in [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md). Keep the change focused. One concern per pull request.

**4. Write tests.**
Every new behaviour must be covered. Every new error class must have at least one test. The test suite must pass in full, including all pre-existing tests.

```bash
npm test
```

**5. Update documentation.**
If your change affects the public API, the architecture, or the developer experience, update the relevant documents. See the [Documentation](#documentation) section below.

**6. Verify everything.**
Run the full test suite one final time. Check the pull request checklist below before submitting.

**7. Open a pull request.**
Write a clear description: what changed, why, and what was considered and rejected. Link to any relevant issues or discussions.

---

## Pull request checklist

Before submitting, confirm each of the following.

- [ ] Architecture respected — no forbidden imports, no inverted dependencies
- [ ] No hidden side effects — all I/O is named, isolated, and documented
- [ ] No additional coupling between modules
- [ ] Documentation updated where relevant
- [ ] Tests added for all new behaviour
- [ ] All constants centralised in `constants/`
- [ ] All new types documented in `types/`
- [ ] No compiler or linter warnings introduced
- [ ] No dead files or unused exports added
- [ ] Commit history is clean and readable

---

## Coding standards

The full standards are in [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md). As a reminder:

- Internal functions are **pure** — no side effects, no globals
- Contexts are **immutable** — built once, frozen, never mutated
- No magic strings — every named value lives in `constants/`
- No global mutable state in business modules
- No business singletons
- Dependencies are minimal and always flow in the official direction

When in doubt, ask yourself: *can this function be tested in complete isolation, with no mocking, no filesystem, no network?* If the answer is no, reconsider the design.

---

## Documentation

Every significant change must be reflected in the relevant documents.

| Document | Update when… |
|---|---|
| `README.md` | The change affects what Gabida does for end users |
| `ARCHITECTURE.md` | The change modifies module boundaries, pipeline order, or invariants |
| `DEVELOPER_GUIDE.md` | The change introduces new patterns, conventions, or restrictions |
| `QUICKSTART.md` | The change affects the public API or session lifecycle |
| `CHANGELOG.md` | Any change that ships in a release |

Documentation is not supplementary — it is part of the deliverable. A pull request that introduces a new module without updating the module documentation will not be merged.

---

## Reporting bugs

When reporting a bug, please include the following.

- **Gabida version** — `npm list gabida`
- **Provider** — OpenAI, Anthropic, Mistral, or other
- **Platform** — OS, Node.js version
- **Description** — a clear, concise summary of the problem
- **Steps to reproduce** — the minimum sequence of operations that triggers the bug
- **Expected result** — what should have happened
- **Actual result** — what happened instead
- **Logs** — any error messages, stack traces, or relevant output

The more precise the report, the faster it can be investigated. Vague reports will be asked for clarification before any investigation begins.

---

## Suggesting features

A feature proposal should address the following questions.

- **What problem does this solve?** Describe the use case, not the solution.
- **Why is the current architecture insufficient?** What is missing or limited?
- **What is the impact on existing modules?** Which module boundaries are affected?
- **What are the compatibility implications?** Existing sessions, adapters, types.
- **What does the alternative look like?** If multiple approaches exist, describe them and your reasoning for the preferred one.

Feature proposals that do not address these questions will be returned for clarification. A well-written proposal significantly increases the chance of acceptance and a smooth implementation.

---

## Discussions

Architectural discussions are actively encouraged. The Gabida engine is designed to be stable and coherent over the long term. This requires deliberate decisions, not fast ones.

A few guidelines for productive discussions:

- **Argue from principles.** Reference the manifesto, the architecture, or specific invariants.
- **Performance alone does not justify a rupture.** A change that breaks module independence for a 5% speed gain is not a good trade. Correctness and clarity come first.
- **Proposals are not commitments.** Opening a discussion does not mean a change will be accepted. It means the team will consider it seriously.
- **Dissent is valuable.** If you believe an existing decision is wrong, explain why. The architecture evolves through argument, not through silence.

---

## Code reviews

Reviews in this project focus primarily on:

- **Architecture** — does the change respect module boundaries and the dependency graph?
- **Readability** — can a new contributor understand this in a reasonable amount of time?
- **Maintainability** — will this be easy to modify or extend six months from now?
- **Tests** — are the right things tested? Are unhappy paths covered?
- **Documentation** — is the intent clear from the comments and documentation alone?

A review is not a pass/fail judgement on whether the code *works*. Working code that violates the architecture will not be merged. Elegant code that is well-tested and well-documented will receive a thorough and respectful review.

Reviewers will always explain their concerns. Authors are encouraged to respond, ask questions, and push back if they disagree — but the final decision on architectural matters rests with the maintainers.

---

## Thank you

Building a robust, maintainable, and durable narrative engine is a long-term project. It requires patience, discipline, and a shared commitment to doing things properly.

Every bug report, documentation fix, new adapter, and thoughtful discussion makes the engine better. Contributions of every size matter — a one-line clarification in the developer guide is as valuable as a new feature if it helps the next contributor find their footing faster.

The goal is to build something that lasts.

---

*Gabida does not write stories. Characters do. Let's build the engine that makes that possible.*
