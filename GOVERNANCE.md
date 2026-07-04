# Governance — Gabida

Gabida prioritises architectural quality over implementation speed. Every decision — large or small — is evaluated against the project's principles before it is accepted. Moving slowly in the right direction is preferable to moving quickly in the wrong one.

This document explains how decisions are made, how conflicts are resolved, and what is expected of everyone who participates in the project. Governance exists to protect the architecture, not to create process for its own sake.

---

## Decision hierarchy

**Vision** defines the long-term direction of the project — what Gabida is trying to become and what it will never be. Vision decisions are documented in `MANIFESTO.md` and `PHILOSOPHY.md`. They change rarely and only through broad consensus.

**Architecture** defines the structural rules — module boundaries, data contracts, invariants, and pipeline order. Architectural decisions are documented in `ARCHITECTURE.md` and `ARCHITECTURE_DECISIONS.md`. They are stable by design and changed deliberately.

**Documentation** reflects both vision and architecture accurately. Documentation decisions ensure that the written record matches the actual system. A documented decision that contradicts the code is a defect.

**Implementation** translates architectural decisions into working code. Implementation choices are made within the constraints set by the architecture. They are the most frequent decisions and the most freely revisited.

---

## Decision process

**Question** — a problem, ambiguity, or improvement opportunity is identified and stated clearly.
**Discussion** — the question is explored in GitHub Discussions with arguments grounded in the project's principles.
**ADR** — when consensus is reached, the decision is recorded in `ARCHITECTURE_DECISIONS.md` with its reasoning.
**Implementation** — the decision is translated into code following the established patterns.
**Documentation** — all affected documents are updated before the change is considered complete.

---

## When consensus is not possible

1. Decisions are argued from principles — `MANIFESTO.md`, `PHILOSOPHY.md`, and `ARCHITECTURE.md` — not from personal preference.
2. A proposal that cannot be reconciled with an existing architectural invariant does not proceed until the invariant is formally revised.
3. Performance improvements that require breaking module independence are declined until an architecture-compatible approach is found.
4. When two valid approaches exist, the one that better preserves long-term maintainability takes precedence over the one with short-term advantages.
5. Maintainers hold final decision authority on architectural matters, and they exercise it with documented reasoning — not by assertion.

---

## Contributor expectations

1. Read the documentation before proposing changes — particularly `ARCHITECTURE.md` and `DEVELOPER_GUIDE.md`.
2. Ground proposals in the project's principles, not in personal taste or external conventions.
3. Document the reasoning behind a change, not just the change itself.
4. Accept that a technically correct implementation may be declined for architectural reasons.
5. Treat architectural feedback as information, not as rejection.
6. Update documentation as part of every contribution — not as a follow-up task.
7. Write tests before considering an implementation complete.
8. Respect decisions that were made before you arrived — if you believe one should be revisited, open a Discussion with evidence.

---

## Long-term philosophy

A project that accumulates features without maintaining architectural coherence becomes progressively harder to understand, harder to extend, and harder to trust. Gabida is designed to be useful years from now — not just today. This requires accepting slower growth in exchange for lasting quality. Every boundary respected, every invariant maintained, every decision documented is an investment in the engine's future contributors, who will inherit what we build now.

---

## Closing

Governance exists to protect the architecture, not to create bureaucracy. Every rule in this document serves a purpose: ensuring that Gabida remains coherent, maintainable, and trustworthy as it grows. When a governance rule stops serving that purpose, it should be revised — through the same deliberate, documented process it describes.
