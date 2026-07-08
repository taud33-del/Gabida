# Project Structure — Gabida

This document explains how the Gabida repository is organised and where to look depending on what you want to do. It is a navigation guide, not an implementation reference.

---

## Root documentation

| Document | Purpose |
|---|---|
| `README.md` | Project overview and positioning |
| `QUICKSTART.md` | Get up and running in minutes |
| `MANIFESTO.md` | The vision and philosophy behind Gabida |
| `ARCHITECTURE.md` | Architectural contract — principles, pipeline, invariants |
| `ARCHITECTURE_DECISIONS.md` | Record of major architectural decisions (ADRs) |
| `DEVELOPER_GUIDE.md` | Reference for engineers working on the engine |
| `CONTRIBUTING.md` | Contribution workflow and standards |
| `PUBLIC_API.md` | The public API surface — what application developers may use |
| `SDK_GUIDE.md` | How to build applications with Gabida |
| `FAQ.md` | Common questions for new developers |
| `GLOSSARY.md` | Core vocabulary definitions |
| `ROADMAP.md` | Long-term vision and maturity levels |
| `CHANGELOG.md` | History of published releases |
| `CI.md` | Continuous integration philosophy and quality gates |
| `DISCUSSIONS.md` | How GitHub Discussions are organised |
| `LABELS.md` | GitHub label taxonomy |
| `SECURITY.md` | How to report security vulnerabilities |
| `CODE_OF_CONDUCT.md` | Community behaviour standards |

---

## Main folders

| Folder | Responsibility |
|---|---|
| `core/` | Pipeline orchestration — the only module that sees the full turn cycle |
| `analyse/` | Qualifies the player's message as a structured narrative event |
| `influences/` | Computes all active influences on the character |
| `ressenti/` | Calculates the character's emotional state |
| `decision/` | Determines what the character decides to do |
| `prompt/` | Builds the contextualised prompt for the AI provider |
| `api/` | Abstract interface to AI providers |
| `memoire/` | Manages lived memory across turns and sessions |
| `conversation/` | Maintains the short-term exchange history |
| `sauvegarde/` | Persists and restores complete session state |
| `types/` | Shared data contracts between all modules |
| `constants/` | Official named values — no logic, no magic strings |
| `lecture/` | Loads and validates character and world data files |
| `axiomes/` | The universal architectural axioms of Gabida |
| `legacy/` | Archived, non-official code kept for architectural history (excluded from build and tests) — see `legacy/README.md` |
| `.github/` | Issue templates, PR template, and community health files |

---

## Which document should I read?

| If I want to… | Read… |
|---|---|
| Understand what Gabida is | `README.md` |
| Build an application with Gabida | `QUICKSTART.md` → `SDK_GUIDE.md` |
| Use the public API | `PUBLIC_API.md` |
| Contribute to the engine | `CONTRIBUTING.md` → `DEVELOPER_GUIDE.md` |
| Understand the architecture | `ARCHITECTURE.md` |
| Understand why a decision was made | `ARCHITECTURE_DECISIONS.md` |
| Learn Gabida's vocabulary | `GLOSSARY.md` |
| Understand future plans | `ROADMAP.md` |
| Report a bug | `CONTRIBUTING.md` → GitHub Issues |
| Ask a question | `FAQ.md` → GitHub Discussions |

---

## Philosophy

Documentation in this repository is organised by purpose, not by implementation. Each document has a single audience and a single goal. The source code and the documentation are equally important — a change that is not reflected in the documentation is not complete.

---

## Closing

Whenever the architecture evolves, the documentation must evolve with it. `ARCHITECTURE.md`, `DEVELOPER_GUIDE.md`, and `ARCHITECTURE_DECISIONS.md` are the first files to update when a structural decision is made. Keeping them current is every contributor's responsibility.
