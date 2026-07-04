# Documentation Policy — Gabida

Documentation is not a record of what was built — it is part of the architecture itself. A module whose mission cannot be stated clearly in writing is a module whose design is not yet clear. A public API that is not documented does not exist for its users. Writing documentation is not a separate activity from building the system; it is a discipline that improves what gets built.

In Gabida, documentation and code share equal status. A change that is implemented but not documented is an incomplete change. A decision that is made but not recorded is a decision that will be made again. Every contributor is responsible for the accuracy of the documentation affected by their work — not as a courtesy, but as a requirement.

---

## Core principles

1. **Every document has a single responsibility.** A document that covers multiple concerns should be split until each part can be accurately titled.
2. **Documentation is written for its reader, not its author.** The measure of good documentation is how quickly a new contributor reaches a correct understanding.
3. **One source of truth.** If information appears in two documents, one is the source and the other links to it — never duplicates it.
4. **Documentation precedes or accompanies implementation.** Writing documentation after the fact produces documentation that justifies decisions rather than explaining them.
5. **Outdated documentation is a defect.** A document that no longer reflects the system it describes misleads contributors and erodes trust.
6. **Architecture documents are the highest authority.** When code and documentation conflict, the documentation describes the intent — the code contains the error.
7. **Language is precise and stable.** Terms defined in `GLOSSARY.md` are used consistently across all documents. New vocabulary is added to the glossary before being used.
8. **Documentation changes are reviewed with the same rigour as code changes.** A pull request that introduces documentation with structural errors, incorrect references, or missing sections is returned for revision.

---

## Documentation hierarchy

| Document type | Purpose |
|---|---|
| **README** | Entry point — orients new visitors and links to deeper resources |
| **Architecture** | Structural contract — defines module boundaries, pipeline, and invariants |
| **ADR** | Decision record — captures why structural choices were made and what alternatives were considered |
| **Developer Guide** | Contributor reference — describes patterns, conventions, and rules for working on the engine |
| **API** | Public surface — documents every method, property, and type available to application developers |
| **SDK** | Application guide — describes how to build with Gabida from a developer perspective |
| **Community** | Governance and process — contribution workflow, code of conduct, labelling, discussions |
| **Reference** | Factual catalogue — glossary, error taxonomy, supported configurations |

---

## Documentation rules

1. Update the relevant document in the same pull request as the code change — never after.
2. Every new module ships with a documented mission statement and public contract.
3. Every public function carries a JSDoc annotation that describes its inputs, outputs, and error conditions.
4. Every architectural decision is recorded in `ARCHITECTURE_DECISIONS.md` before implementation begins.
5. `CHANGELOG.md` is updated for every user-facing change before the pull request is marked ready.
6. Cross-references between documents use relative links — never hardcoded URLs that break on rename.
7. New vocabulary introduced in any document is added to `GLOSSARY.md` in the same pull request.
8. Documentation removed or significantly restructured is mentioned in `CHANGELOG.md`.

---

## Things to avoid

1. **Documenting implementation rather than behaviour** — readers need to know what a thing does, not how it works internally.
2. **Duplicating content across documents** — duplication creates two sources of truth and guarantees eventual inconsistency.
3. **Writing documentation as justification** — documentation explains decisions; it does not defend them after they are questioned.
4. **Leaving placeholder sections** — a section marked "TODO" in merged documentation is an acknowledged defect.
5. **Using undefined terminology** — every technical term used in a document must be defined in `GLOSSARY.md` or linked to its source.
6. **Writing for the current reader only** — documentation must remain legible to a contributor with no prior context two years from now.
7. **Treating documentation updates as optional follow-up tasks** — they are part of the deliverable, not subsequent work.
8. **Mixing abstraction levels in a single document** — a high-level philosophy document should not contain implementation details; a reference document should not contain narrative.

---

## Long-term philosophy

Documentation must evolve together with the architecture. As modules are refined, as boundaries are adjusted, as decisions are revisited, the documents that describe them must be updated in the same motion. A repository where the code has moved forward and the documentation has stayed behind is a repository that has accumulated a debt that only grows more expensive with time.

---

## Closing

Outdated documentation is a defect — not a minor inconvenience, and not acceptable technical debt. It misleads contributors, undermines trust, and makes architectural decisions invisible to the people who most need to understand them. Keeping documentation accurate is not optional. It is a condition of every contribution being considered complete.
