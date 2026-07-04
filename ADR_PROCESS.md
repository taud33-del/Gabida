# ADR Process — Gabida

Architecture built on implicit assumptions is architecture that cannot be explained, cannot be defended, and cannot be safely changed. When the reasoning behind a decision is not recorded, the decision itself becomes invisible — and invisible decisions are remade, poorly, by contributors who had no way of knowing they were repeating a question that had already been answered.

Architecture Decision Records (ADRs) exist to make architectural reasoning explicit, permanent, and accessible. They are not bureaucratic overhead — they are the memory of the system. Every structural decision recorded in an ADR is a decision that does not have to be reconstructed from commit history, pull request comments, or the recollections of contributors who may no longer be active.

---

## Decision lifecycle

1. **Identify** — a structural question is raised that cannot be resolved by reading existing documentation.
2. **Discuss** — the question is explored in GitHub Discussions, Architecture category, following the standard discussion structure.
3. **Draft** — a proposed decision is written in plain language: current situation, problem, constraints, alternatives, trade-offs, and recommendation.
4. **Review** — the draft is shared for feedback; alternatives are considered and trade-offs are challenged.
5. **Decide** — consensus is reached or maintainer authority is exercised; the decision is finalised.
6. **Record** — the decision is added to `ARCHITECTURE_DECISIONS.md` with its full reasoning before implementation begins.
7. **Implement** — the code change is made in accordance with the recorded decision.
8. **Archive** — if a future decision supersedes this one, the original is marked superseded and linked to its replacement.

---

## When an ADR is required

| Situation | ADR required? |
|---|---|
| New public API surface or change to existing | Yes |
| New dependency on an external module or service | Yes |
| Breaking change to any documented contract | Yes |
| Change to module boundaries or pipeline order | Yes |
| Refactoring that moves responsibility between modules | Yes |
| Performance optimisation that alters control flow | Yes |
| Internal cleanup with no external impact | No |
| Bug fix with no architectural consequence | No |
| Documentation update with no structural change | No |

---

## Decision principles

1. **Decisions are recorded before implementation.** An ADR written after the fact justifies rather than explains.
2. **Alternatives must be listed.** A decision with no alternatives considered is a preference, not a decision.
3. **Trade-offs must be named.** Every architectural choice gains something and loses something — both must be stated.
4. **Constraints must be explicit.** What the decision must not violate is as important as what it achieves.
5. **Decisions reference existing invariants.** An ADR that contradicts an existing invariant must address that conflict directly.
6. **Decisions are permanent records.** An ADR is never deleted — it is either active or marked superseded.
7. **Superseded decisions link to their replacement.** The history of how the architecture evolved is preserved, not erased.
8. **Decisions are written for future contributors.** The reader has no context from the original discussion — the ADR must be self-contained.

---

## Things to avoid

1. **Recording decisions after implementation** — the reasoning is shaped by what was built, not by what was considered.
2. **Omitting alternatives** — a decision without alternatives is an assertion, not a reasoned choice.
3. **Using ADRs to document implementation details** — ADRs record structural choices, not technical how-tos.
4. **Leaving ADRs in draft state indefinitely** — an unresolved architectural question is an open risk.
5. **Making structural changes without an ADR** — undocumented changes accumulate into invisible architecture.
6. **Overriding a previous decision without acknowledging it** — every superseded ADR must be explicitly linked.
7. **Writing ADRs that require prior context to understand** — each record must stand alone.
8. **Treating ADR review as a formality** — the review stage is where weak reasoning is identified and corrected.

---

## Long-term philosophy

Decisions preserve knowledge across contributors and across time. A project whose architectural reasoning is documented survives the departure of its original contributors, withstands the pressure of rapid change, and remains legible to developers who arrive years after the decisions were made. The ADR is the mechanism by which architectural intelligence becomes institutional rather than personal.

---

## Closing

Architecture evolves through documented decisions, not memory. The contributors who built Gabida will not always be present to explain why things are the way they are. The ADRs they leave behind will be.
