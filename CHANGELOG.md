# Changelog

All notable changes to Gabida are documented in this file.

This project adheres to [Semantic Versioning](https://semver.org) and the [Keep a Changelog](https://keepachangelog.com) format. Only published releases appear here.

---

## [1.0.0] — Initial Release

### Added

- **Cognitive pipeline** — sequential, deterministic processing of every player message through a series of independent modules
- **Decision engine** — character decisions are computed by the engine from structured psychological data, not improvised by the LLM
- **Feeling engine** — emotional state calculation driven by influences, relationships, and the current narrative moment
- **Memory system** — lived memory with structured retention and forgetting across turns and sessions
- **Prompt builder** — construction of fully contextualised prompts carrying the character's psychological state to the AI provider
- **Provider API** — provider-agnostic abstraction layer supporting multiple LLM backends through a standard adapter interface
- **Save system** — complete session persistence with versioned JSON format, storage adapter registry, and migration infrastructure
- **Official type system** — all shared data contracts defined and documented in `types/`
- **Official constants** — all named values centralised in `constants/`, eliminating magic strings across the codebase

### Architecture

- Modular cognitive pipeline with strict unidirectional data flow
- Pure internal functions — deterministic, side-effect-free, independently testable
- Immutable context objects within every module
- Minimal coupling — modules communicate exclusively through official types
- Two isolated impure modules (`api/`, `sauvegarde/`) with all side effects explicitly named and documented
- Versioned save format with `FORMAT_VERSION` and `ENGINE_VERSION` as independent constants

### Documentation

- `README.md` — project overview and positioning
- `MANIFESTO.md` — founding vision and philosophy
- `ARCHITECTURE.md` — full architectural contract, principles, pipeline, and invariants
- `QUICKSTART.md` — getting started guide for application developers
- `DEVELOPER_GUIDE.md` — reference for engine contributors
- `CONTRIBUTING.md` — contribution standards and workflow
- `ROADMAP.md` — long-term vision and maturity levels

### Testing

- All implemented modules covered by dedicated unit test suites
- Tests are fully isolated — no filesystem access, no network calls, no cross-module dependencies
- Side effects replaced by in-memory adapters in all test environments
- Deterministic test behaviour guaranteed by the pure-function architecture

---

## Future releases

All future versions will follow [Semantic Versioning](https://semver.org): patch releases for bug fixes, minor releases for backward-compatible additions, and major releases for breaking changes.
