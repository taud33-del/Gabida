# Code Style — Gabida

Consistent code is not about personal preference — it is about reducing the cognitive load for every contributor who reads it. A codebase where every file follows the same conventions is a codebase where attention can be focused on logic, not on deciphering style. Style consistency is a form of respect for future contributors.

In Gabida, code style serves the architecture. Every convention in this document exists to reinforce the structural principles of the engine — single responsibility, explicit data flow, immutable context, and minimal coupling. Style that contradicts the architecture is not style; it is technical debt.

---

## General principles

1. **Clarity over brevity.** A longer, readable expression is preferable to a compact one that requires interpretation.
2. **Explicitness over inference.** Make dependencies, inputs, and outputs visible in the code structure — do not rely on implicit behaviour.
3. **One thing per function.** Functions that do more than one thing should be split until each one can be named accurately in a single verb phrase.
4. **Names describe intent.** Names should communicate what a thing does or represents, not how it is implemented.
5. **Consistency within a module.** Every function inside a module follows the same structural pattern — context, sub-functions, assembly, return.
6. **No clever shortcuts.** A solution that requires a comment to explain its cleverness is a solution that should be rewritten to be obvious.
7. **Errors are explicit.** Every error condition is named, typed, and handled deliberately — no silent failures, no swallowed exceptions.
8. **Public before private.** Exported functions appear at the top of the file; internal helpers follow.

---

## Naming conventions

| Element | Rule |
|---|---|
| **Modules** | Named for their single responsibility — a verb or noun that answers their question |
| **Interfaces** | Named for the contract they describe — clear, stable, and independent of implementation |
| **Functions** | Begin with an action verb reflecting their purpose (`construire`, `calculer`, `assembler`, `valider`) |
| **Classes** | Named for what they represent, not how they are used — singular nouns |
| **Constants** | All uppercase with underscores — immutable, centralised in `constants/` |
| **Types** | PascalCase — defined in `types/`, named for the data shape they describe |
| **Files** | Named for the single concept they contain — no generic names like `utils` or `helpers` |
| **Folders** | Named for the module or layer they represent — lowercase, no abbreviations |

---

## Code organisation

1. **Imports at the top.** All import statements appear before any other code in the file.
2. **Public exports precede private helpers.** The public interface is visible first; implementation details follow.
3. **Context construction is the first step.** Every module's public function builds and freezes its context before calling any sub-function.
4. **One assembly point per module.** All sub-function results converge in a single, clearly identified assembly step.
5. **Error classes are co-located.** Error types specific to a module are defined in the same file, near the top.
6. **Types are not defined inline.** Shared data shapes belong in `types/`; inline type definitions are reserved for truly private, non-exported shapes.
7. **Constants are not defined inline.** Named values belong in `constants/`; inline literals are only acceptable for structural code with no business meaning.
8. **One concept per file.** A file that contains two unrelated concepts should be split into two files.

---

## Things to avoid

1. **Magic strings and magic numbers** — every named value used in logic belongs in `constants/`.
2. **Functions that do two things** — if a function needs the word "and" to describe what it does, it should be split.
3. **Deep nesting** — more than two or three levels of nesting signal that logic should be extracted into named sub-functions.
4. **Abbreviated names** — `ctx` is acceptable for context; `r`, `x`, or `tmp` are not acceptable in production code.
5. **Commented-out code** — dead code belongs in version history, not in the file.
6. **Implicit returns from side effects** — a function that performs I/O and also returns a business value mixes responsibilities.
7. **Re-exported internals** — exporting a private helper because it is convenient for a test is a contract being created unintentionally.
8. **Inconsistent abstraction levels** — a function should operate at one level of abstraction; mixing high-level orchestration with low-level detail in the same function makes both harder to understand.

---

## Long-term consistency

Readability always takes precedence over cleverness. Code that a new contributor can understand within minutes is more valuable than code that impresses experienced developers and slows everyone else down. The measure of good style is not elegance — it is how quickly and accurately a reader can form a correct mental model of what the code does.

---

## Closing

Code style exists to support architecture and maintainability, not to enforce uniformity for its own sake. Every convention in this document serves a structural purpose. When style and pragmatism conflict on minor matters, pragmatism may prevail. When style and architecture conflict, the architecture wins.
