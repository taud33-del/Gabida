# Versioning — Gabida

Versioning is a contract with developers. It communicates what changed, how significant the change is, and whether existing code will continue to work. Without a clear versioning policy, every release is a risk. With one, releases become predictable events rather than sources of uncertainty.

Gabida follows [Semantic Versioning](https://semver.org). The version number is not an arbitrary label — it carries a specific meaning that both maintainers and developers can rely on.

---

## Version format

```
MAJOR . MINOR . PATCH
```

**MAJOR** — incremented when a breaking change is introduced to the public API or documented behaviour.
**MINOR** — incremented when new, backward-compatible functionality is added.
**PATCH** — incremented when a backward-compatible bug fix is applied.

---

## Compatibility policy

- **Public API is stable within a major version.** `Gabida`, `Session`, and `Response` — and their documented methods — do not change in a breaking way without a major version increment.
- **Internal modules may evolve freely between minor versions.** Module internals, private functions, and context shapes are not part of the public contract.
- **Documentation stays synchronised with the version it describes.** Every release updates `CHANGELOG.md` and any affected documents.
- **`ARCHITECTURE_DECISIONS.md` records architectural changes.** Structural decisions that affect future development are documented there, not only in commit messages.

---

## Stability levels

| Level | Meaning |
|---|---|
| **Stable** | Part of the public API — versioned, documented, and covered by the compatibility guarantee |
| **Experimental** | Available but not yet stable — may change in a minor version, clearly marked in documentation |
| **Internal** | Not exported or supported — may change at any time without notice |

---

## Breaking changes

A breaking change is acceptable when:

1. The current behaviour violates an architectural invariant that cannot be preserved without compromise.
2. The public API has a documented design flaw that creates meaningful risk for application developers.
3. Security requires an immediate correction that cannot be made in a backward-compatible way.
4. The change is preceded by a full deprecation cycle in the previous minor version.
5. The change is documented in `ARCHITECTURE_DECISIONS.md` with full reasoning before the major version is released.

Breaking changes are never introduced silently.

---

## Deprecation policy

**Introduce** — a new capability or replacement is made available and documented.
**Deprecate** — the old capability is marked deprecated with a clear migration path; it continues to function.
**Remove** — the deprecated capability is removed in the next major version, with a note in `CHANGELOG.md`.

No capability is removed without passing through the full deprecation cycle.

---

## Closing

Gabida values predictable evolution over rapid change. A version number should tell developers exactly what to expect. The goal is not to release often — it is to release reliably, with clear communication and unbroken guarantees for every application built on the engine.
