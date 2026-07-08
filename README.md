# Gabida — Narrative Operating System

> **Build characters that think before they speak.**

---

## What is Gabida?

Most dialogue systems work the same way: receive a message, send it to an LLM, return the response. The character has no inner life. It has no memory, no psychology, no coherent decision-making process. It just generates text.

**Gabida is different.**

Gabida is a **narrative operating system** — an engine that builds a character's internal state before producing a single word of dialogue. It separates cognition from language. The character *thinks* before it *speaks*.

When a player sends a message, Gabida does not immediately call an LLM. It first analyses the event, evaluates its emotional influences, calculates how the character *feels*, determines what decision the character *makes*, and only then constructs the prompt — with full psychological context — and sends it to the AI provider.

The result is a character that is **coherent**, **explicable**, and **consistent over time**.

---

## Why Gabida exists

Traditional dialogue frameworks suffer from the same fundamental problem: the AI is responsible for everything — personality, memory, decision-making, and language generation — all at once. The result is inconsistent characters whose behaviour cannot be predicted, explained, or debugged.

Gabida was created to solve this problem by enforcing a strict separation of concerns:

- **Cognition** is handled by the engine.
- **Language** is handled by the LLM.

The engine never writes narrative text. The LLM never makes character decisions. Each has a single, well-defined responsibility.

---

## Founding principles

**Separation of cognition and language**
The engine builds the character's internal state. The LLM expresses it. Neither crosses the other's boundary.

**Durable memory**
Every session maintains a lived memory — a curated record of significant events, decisions, and promises that persists across turns.

**Independent psychology**
Character behaviour is driven by structured personality data, not by LLM improvisation. The engine is the psychologist. The LLM is the voice.

**Explainable decisions**
Every decision the character makes is traceable. The engine records what happened, why, and what changed — making characters auditable by design.

**Provider independence**
Gabida does not depend on any specific LLM. OpenAI, Anthropic, Mistral, local models — all are supported through a simple adapter interface.

**Modular architecture**
Each stage of the pipeline is a self-contained, independently testable module. Adding a new capability never requires modifying existing modules.

---

## How it works — the cognitive pipeline

Every player message triggers a deterministic, sequential pipeline.

```
  Player Message
        ↓
    ┌────────┐
    │Analyse │  What does the player mean?
    └────────┘
        ↓
    ┌───────────┐
    │Influences │  What affects the character right now?
    └───────────┘
        ↓
    ┌─────────┐
    │Ressenti │  How does the character feel?
    └─────────┘
        ↓
    ┌──────────┐
    │Decision  │  What does the character decide?
    └──────────┘
        ↓
    ┌────────┐
    │ Prompt │  How should this be expressed?
    └────────┘
        ↓
    ┌─────┐
    │ API │  Send to the AI provider.
    └─────┘
        ↓
    ┌─────────┐
    │Memoire  │  What should be remembered?
    └─────────┘
        ↓
    ┌────────────┐
    │Sauvegarde  │  Persist the full session state.
    └────────────┘
        ↓
  Updated State → Next turn
```

Each module answers exactly one question. No module knows what happens before or after it.

---

## Why Gabida, not a chatbot?

| | Chatbot | Gabida |
|---|---|---|
| Decision-making | LLM improvises | Engine decides |
| Memory | Context window only | Persistent, structured |
| Consistency | Varies by prompt | Enforced by architecture |
| Explainability | None | Full trace |
| Provider | Tightly coupled | Swappable |
| Psychology | None | Defined by data |
| Testability | Near impossible | Full unit tests |

A chatbot generates text.
**Gabida builds a character, then generates text.**

---

## Architecture

```
Moteur/
│
├── core/          Orchestrates the full turn cycle.
│
├── analyse/       Qualifies the player message as a narrative event.
├── influences/    Computes all active influences on the character.
├── ressenti/      Calculates the character's emotional state.
├── decision/      Determines the character's decision and attitude.
├── prompt/        Builds the final prompt for the AI provider.
├── api/           Abstract interface to any LLM. Provider-agnostic.
├── memoire/       Manages lived memory — retention and forgetting.
├── conversation/  Maintains the short-term exchange history.
├── sauvegarde/    Persists and restores the complete session state.
│
├── types/         Shared data contracts between all modules.
├── constants/     Official enumerations. No logic. No magic strings.
├── lecture/       Loads and validates character and world data files.
│
└── axiomes/       The 20 universal architectural axioms of Gabida.
```

Every module has a single responsibility. Every module is independently testable. Every module communicates exclusively through official types.

---

## Documentation

| Document | Description |
|---|---|
| `README.md` | Project overview. Start here. |
| `MANIFESTO.md` | The vision and philosophy behind Gabida. |
| `ARCHITECTURE.md` | Full architectural contract — principles, pipeline, invariants. |
| `QUICKSTART.md` | Get up and running in minutes. |
| `DEVELOPER_GUIDE.md` | Everything you need to contribute or extend Gabida. |
| `ROADMAP.md` | What is coming next. |
| `CONTRIBUTING.md` | How to contribute to the project. |
| `LICENSE` | Licence terms. |

---

## Current status

```
Gabida Engine — v1.0
─────────────────────────────────
✓  Architecture locked
✓  Cognitive pipeline complete
✓  All modules implemented
✓  Full test suite passing
◎  Documentation in progress
```

---

## Roadmap

**v1.0 — Narrative Engine** *(current)*
Core engine. Full cognitive pipeline. Provider-agnostic API. Session persistence.

**v1.1 — Developer Experience**
SDK. CLI. Project templates. Visual builder for character data files.

**v2.0 — Ecosystem**
Narrative Compiler. Interactive Playground. Plugin ecosystem. Community modules.

---

## Contributing

Gabida is an opinionated project. Its architecture is intentional and documented.

Before contributing, please read:

1. [`MANIFESTO.md`](./MANIFESTO.md) — understand the vision
2. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — understand the rules
3. [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) — understand the process

Pull requests that break architectural invariants will not be merged, regardless of their functional value. The architecture is the product.

---

## Licence

This project is released under the **MIT Licence**.
See [`LICENSE`](./LICENSE) for full terms.

---

*Gabida does not write stories. Characters do.*