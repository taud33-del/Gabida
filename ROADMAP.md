# Roadmap — Gabida

---

## Vision

Gabida was not designed as a chatbot framework. It was designed as a foundation.

The goal is not to make it easier to prompt an LLM. The goal is to build a system in which characters have genuine inner lives — structured psychology, durable memory, coherent decisions — and the LLM is simply the voice that gives those inner lives language.

This distinction drives every architectural decision, and it drives the roadmap.

Each version of Gabida represents a level of architectural maturity, not a set of features. The engine grows by deepening what it already does well, not by accumulating capabilities at the expense of coherence.

The long-term destination is a **Narrative Operating System** — a platform on which fully autonomous, psychologically coherent, narratively consistent characters can exist across sessions, worlds, and stories, independent of any specific AI provider or deployment context.

---

## Current status — v1.0

**Narrative Engine**

The foundation is in place.

- Modular cognitive pipeline — each stage of reasoning is a separate, independent module
- Deterministic architecture — given the same inputs, the engine always produces the same internal state
- Independent reasoning modules — analysis, influence computation, emotional state, decision-making, prompt construction
- Narrative memory — lived memory with retention and structured forgetting
- Decision engine — character decisions are made by the engine, not improvised by the LLM
- Prompt generation — prompts carry full psychological context before reaching the AI provider
- Multi-provider abstraction — any LLM can be connected through a standard adapter interface
- Session persistence — complete session state is saved, versioned, and restorable
- Documentation suite — architecture, developer guide, contribution standards, quick start

The engine is production-ready for single-character, single-session narrative experiences.

---

## v1.1 — Developer Experience

**Making Gabida easy to adopt.**

The engine works. The next step is making it accessible.

v1.1 focuses entirely on the experience of the developer building with Gabida — not on adding new cognitive capabilities, but on making the existing ones easier to understand, configure, and extend.

This means better ergonomics in the SDK surface, richer diagnostics that show what the engine decided and why, more built-in templates and examples covering common narrative patterns, CLI utilities for scaffolding new projects and inspecting session state, and a broader set of storage adapters and AI provider integrations.

It also means stronger testing infrastructure — benchmarks, test helpers, and tools that let engine contributors verify that a change does not alter the cognitive behaviour of existing sessions.

The character of this version is clarity. A developer who discovers Gabida at v1.1 should be able to build a working prototype in an afternoon and understand what the engine is doing at every step.

---

## v2.0 — Narrative Operating System

**Characters that live a story.**

v2.0 is where Gabida becomes something genuinely new.

A single character having a single conversation is the simplest case. Real narratives involve characters who plan across time, whose relationships with each other evolve, who share a world that changes because of what they do.

v2.0 addresses this by extending the cognitive model beyond the single turn and the single character.

Long-term narrative planning gives characters the ability to pursue goals across multiple sessions — to remember what they wanted, to adapt when circumstances change, and to act with continuity of intent rather than turn-by-turn improvisation.

Advanced character cognition deepens the psychological model — richer emotional states, more nuanced decision-making, the ability to hold contradictory beliefs and resolve them over time.

Multi-character orchestration allows multiple characters to coexist in the same narrative world, each with their own psychology, each aware of the others in ways that are structured and explicit rather than implicit in a shared prompt.

A plugin ecosystem allows the community to extend the engine's capabilities — new memory strategies, new decision models, new prompt architectures — without modifying the core.

The character of this version is ambition. v2.0 is where Gabida stops being a narrative engine and becomes a narrative platform.

---

## Future directions

Beyond v2.0, several directions are worth exploring. These are not commitments — they are territories.

**Multiplayer narratives.** Multiple human players interacting within the same narrative world, with characters who respond coherently to the collective history of events.

**Distributed narrative worlds.** Session state and world state shared across instances, enabling persistent living worlds that evolve independently of any single session.

**Visual authoring tools.** A graphical interface for creating and editing character data, world definitions, and narrative structures — without writing JSON or YAML by hand.

**Local inference.** First-class support for locally-hosted models, enabling Gabida to run entirely offline — useful for privacy-sensitive applications, embedded systems, and latency-critical environments.

**Community plugins.** A formal plugin architecture with a registry, versioning, and compatibility guarantees — allowing the community to contribute and share extensions without forking the core engine.

**AI-assisted authoring.** Tools that use AI to assist in the creation of character data and world definitions — not to generate narrative content, but to help authors describe characters and worlds more precisely and consistently.

These directions will be pursued only if they can be integrated without compromising the architectural principles that make Gabida coherent. Ambition without discipline is scope creep.

---

## Guiding principles

Every version, every feature, every change will be evaluated against the same criteria.

**Modularity.** New capabilities are added as new modules or extensions, not as modifications to existing ones. The pipeline grows; it does not mutate.

**Determinism.** The cognitive behaviour of the engine remains predictable and testable. Nondeterminism is always explicit and always isolated.

**Testability.** Any new capability can be verified in isolation, without running the full pipeline, without network access, without filesystem access.

**Maintainability.** The codebase remains comprehensible to a new contributor. Cleverness is not a virtue here.

**Documentation.** No capability ships without its documentation. The documentation is part of the deliverable, not a post-release obligation.

**Backward compatibility.** Existing sessions, adapters, and integrations should continue to work across minor versions. Breaking changes are versioned, documented, and justified.

---

## What will never change

Some things are not on the roadmap because they are not negotiable. They are the foundation on which everything else is built.

**One responsibility per module.** Every module answers exactly one question. This does not get relaxed as the engine grows. It gets more important.

**Architecture before features.** A feature that cannot be implemented without breaking the module boundaries does not get implemented until the architecture can accommodate it cleanly.

**Documentation as part of development.** A module that ships without its documentation is not finished. A change that is not reflected in the documentation did not happen.

**Deterministic behaviour.** The engine's cognitive pipeline is not allowed to produce different results for identical inputs. Ever.

**Explicit data contracts.** Every data shape that crosses a module boundary is defined, named, and documented. No implicit shapes, no undocumented objects.

**Minimal coupling.** Modules communicate through data. They do not import each other. They do not call each other. They do not know each other exists.

---

## Closing

The roadmap is not a promise of features.

It is a commitment to architectural maturity.

Gabida will grow by becoming more of what it already is — coherent, explicable, and durable — not by becoming something else.

---

*Build characters that think before they speak. Build a world they can live in.*
