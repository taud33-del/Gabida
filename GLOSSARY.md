# Glossary — Gabida

Core vocabulary for contributors, developers, and designers working with Gabida.

---

**Narrative Operating System**
A platform that manages the full inner life of a character — cognition, memory, decision — independently of the AI model used to generate dialogue. Gabida is a Narrative Operating System.

**Engine**
The Gabida engine itself: the deterministic system that orchestrates all cognitive modules and produces a character's response to each player message.

**Provider**
An external AI service (LLM) used to generate dialogue text. The provider receives a structured prompt from the engine and returns a text response. It has no role in character cognition or decision-making.

**Character**
A narrative entity with a defined personality, values, history, and relationships. Character data is supplied by the application — the engine brings it to life.

**World**
The narrative context in which a character exists — setting, rules, relationships, and current situation. World data shapes how the character perceives and responds to events.

**Memory**
The engine's structured record of what a character has experienced, decided, and committed to. Memory persists across turns and sessions, independent of the LLM context window.

**Session**
A single continuous conversation between a player and a character. A session holds the full state — memory, emotional history, turn count — and can be saved and restored.

**Response**
The output of a single turn: the character's dialogue text, emotional state, actions taken, and associated metadata. Responses are read-only.

**Cognition**
The internal reasoning process the engine performs before generating a prompt: analysing the player's message, computing influences, calculating emotion, and reaching a decision.

**Narrative Decision**
The explicit choice a character makes in response to a situation — determined by the engine from structured psychological data, not improvised by the LLM.

**Context**
A private, immutable data object constructed at the start of each module invocation. It holds everything the module needs and is never shared or mutated.

**Adapter**
A plug-in implementation of a standard interface — for storage backends or AI providers — that allows the engine to work with different technologies without internal changes.

**Module**
A self-contained unit of the engine responsible for answering exactly one question. Modules communicate exclusively through official data types and never import each other directly.

**Public API**
The three documented, versioned objects exposed to application developers: `Gabida`, `Session`, and `Response`. Everything else is internal.

**SDK**
The developer-facing layer of Gabida — the libraries, interfaces, and patterns that application developers use to build with the engine without touching its internals.

**Pure Function**
A function that always returns the same output for the same inputs and produces no side effects. All internal module sub-functions in Gabida are pure.

**Immutable Object**
An object that cannot be modified after creation. Module contexts are immutable — they are constructed once, frozen, and passed down without alteration.

**Pipeline**
The ordered sequence of cognitive modules that processes each player message: Analyse → Influences → Ressenti → Decision → Prompt → API → Memory → Save.

**Architecture**
The set of structural rules, module boundaries, data contracts, and invariants that define how Gabida is built and how it may evolve. The architecture takes precedence over any individual implementation.

**Determinism**
The property that identical inputs always produce identical outputs. Gabida's cognitive pipeline is deterministic — character behaviour is predictable, testable, and reproducible.

---

Use these terms consistently across all documentation, discussions, and pull requests. Shared vocabulary reduces misunderstanding and makes architectural conversations more precise.
