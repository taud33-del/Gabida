# Design Principles — Gabida

These principles describe how we think about Gabida — not how we implement it. They are the reasoning behind every architectural decision and the lens through which new proposals are evaluated.

---

**1. Architecture before implementation.**
The structure of the system is designed before any code is written. An implementation that fits a well-designed architecture is always preferable to a fast implementation that requires the architecture to bend around it.

**2. Narrative before language.**
A character's inner state — what it feels, what it decides, what it intends — is fully determined before any text is generated. Language is the final step, not the first.

**3. Engine before provider.**
The engine is the product. The AI provider is a dependency. Character behaviour must not change when the provider changes. The engine owns cognition; the provider owns vocabulary.

**4. Determinism before optimisation.**
A system that behaves predictably is worth more than one that behaves quickly. Optimisation is welcome when it preserves deterministic behaviour. When the two conflict, determinism wins.

**5. Immutable data whenever possible.**
Data that cannot be modified cannot be corrupted by accident. Modules receive data, transform it, and return new data. Nothing is mutated in place unless there is no alternative.

**6. Small, independent modules.**
Each module answers exactly one question. Modules do not know each other. They communicate through data contracts. Small modules are easier to test, easier to replace, and easier to reason about independently.

**7. Public API first.**
The interface that application developers use is designed before the internals that implement it. A stable, minimal public surface is more valuable than a complete but volatile one.

**8. Documentation is part of the architecture.**
A decision that is not documented is a decision that will be made again, poorly. Every module, every invariant, every architectural decision is documented before it is considered complete.

**9. Consistency over cleverness.**
A straightforward solution that every contributor can understand is worth more than an elegant one that requires expertise to maintain. Readability is a feature.

**10. Long-term maintainability over short-term speed.**
Every decision is made with the next contributor in mind — the one who arrives in two years with no context. Code and documentation that are easy to understand and modify are the most valuable deliverables.

---

When a future technical decision conflicts with one of these principles, the conflict should be named explicitly and resolved deliberately — not ignored. These principles are not constraints on progress; they are the conditions under which progress remains sustainable.
