# Philosophy — Gabida

This document explains why Gabida exists and the ideas that should guide every decision about how it evolves. It is not a technical reference — it is the reasoning behind the architecture.

---

**1. Software should think before it speaks.**
Generating text is the last step, not the first. A system that reasons about a situation before producing a response creates characters that feel coherent. A system that generates text immediately produces characters that feel hollow.

**2. Narrative is a system, not a prompt.**
A story is not the output of a single LLM call. It is the product of structured decisions made over time — decisions about what a character remembers, how it feels, what it chooses, and how it expresses that choice. A prompt is a tool. Narrative is the system that uses it.

**3. Architecture creates quality.**
Quality in software does not come from effort alone. It comes from structure. An architecture that enforces the right boundaries, the right responsibilities, and the right data flows produces quality as a natural consequence — not as an afterthought.

**4. Every component has a single responsibility.**
A component that does two things is harder to test, harder to change, and harder to reason about than one that does one thing well. The question every component must be able to answer is: *what is the one thing I exist to do?*

**5. Complexity must be hidden behind simple interfaces.**
The internal engine is complex. The experience of using it should not be. Application developers should be able to build rich narrative experiences without understanding cognitive pipelines, module boundaries, or data contracts. Complexity belongs inside the engine, not in front of it.

**6. Documentation is a design tool.**
Writing documentation before writing code forces clarity. If a module's mission cannot be stated in one sentence, the module is not ready to be built. Documentation is not a record of what was done — it is a discipline that improves what gets done.

**7. Good architecture survives changing AI models.**
AI models will change. New providers will emerge. Old ones will be deprecated. An engine whose behaviour depends on a specific model is fragile. An engine whose behaviour is determined by its own architecture, and merely expressed by a model, is durable.

**8. The engine owns the rules. Providers only generate language.**
Decisions about what a character does, feels, and remembers belong to the engine. The AI provider's role is to express those decisions in natural language — nothing more. When a provider is swapped, the character's personality and behaviour must not change.

**9. Long-term coherence is more valuable than rapid feature growth.**
A small, coherent engine that does a few things very well is worth more than a large, fragmented one that does many things inconsistently. Every feature added is a commitment to maintain. Every boundary respected is a foundation to build on.

---

Every future contribution — a new module, a new provider, a new pattern — should reinforce these ideas, not introduce exceptions to them. When a proposal conflicts with one of these pillars, the conflict is worth examining carefully. The pillar may need to evolve. But it should never be quietly ignored.
