# Testing Guide — Gabida

Tests and architecture evolve together. A module without tests is not finished. A test that couples too tightly to implementation becomes a maintenance burden rather than a safety net. The goal is a test suite that verifies behaviour, not one that mirrors code structure.

In Gabida, determinism is a design property — not something to hope for. Tests make that property provable. If the same input does not produce the same output every time, the architecture has a problem. Tests are how that problem is detected before it reaches production.

---

## Testing pyramid

**Unit tests** verify that a single module, function, or data contract behaves correctly in isolation — no filesystem, no network, no other modules.

**Integration tests** verify that two or more modules produce the correct output when composed — using real data shapes and official types.

**End-to-end tests** verify the full session lifecycle — from initialisation through save and reload — using in-memory adapters to avoid external dependencies.

---

## What should always be tested

- **Public API** — every method on `Gabida`, `Session`, and `Response` must have documented, verified behaviour.
- **Module contracts** — every module must verify its input types and output shape independently of the pipeline.
- **Context objects** — immutability must be verified; no sub-function should be able to write back to the context.
- **Narrative determinism** — identical inputs must produce identical outputs on every run.
- **Save and load** — session state must survive a full serialisation and deserialisation cycle without loss.
- **Provider adapters** — all adapters must be verified against the official adapter interface using in-memory stubs.

---

## What should NOT be tested

- Internal function names or private implementation details that may change freely between versions.
- The exact structure of context objects beyond what is required by the public contract.
- Behaviour specific to a real AI provider — providers are replaced by stubs in all tests.
- Code paths that only exist for historical reasons and are no longer reachable.
- Formatting or whitespace of internal serialisation unless it is part of a documented contract.

---

## Good testing principles

1. **One assertion per concern.** A test that fails should identify a single, clear problem.
2. **Tests are documentation.** A well-named test explains expected behaviour without reading the implementation.
3. **Prefer real data over mocks.** Use actual types and actual data shapes; mock only external systems.
4. **Tests must be deterministic.** A test that sometimes passes and sometimes fails is not a test — it is noise.
5. **Tests must be fast.** No test should require network access, filesystem access, or a running process.
6. **Edge cases are mandatory.** Invalid inputs, boundary values, and documented error conditions must be covered.
7. **Regression tests are permanent.** A test written to catch a bug is never removed after the bug is fixed.
8. **Test behaviour, not structure.** If refactoring breaks a test without changing behaviour, the test was wrong.

---

## Before opening a Pull Request

- [ ] All existing tests pass in a clean environment
- [ ] New behaviour is covered by at least one test
- [ ] Error conditions are tested — not only happy paths
- [ ] Tests use in-memory adapters — no filesystem or network access
- [ ] Test names describe the expected behaviour, not the implementation
- [ ] No test has been deleted or weakened to make the suite pass
- [ ] Determinism is verified — tests produce identical results on repeated runs
- [ ] Coverage has not decreased below the project threshold

---

## Closing

Reliable architecture is impossible without reliable tests. The engine's guarantees — determinism, module independence, contract integrity — are only as strong as the tests that verify them. Writing tests is not a separate activity from building the engine. It is part of the same work.
