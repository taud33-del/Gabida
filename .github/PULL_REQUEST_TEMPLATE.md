## Summary

<!-- A concise description of what this pull request does. -->

---

## Motivation

<!-- Why is this change necessary? What problem does it solve? -->

---

## Scope

<!-- Check all areas affected by this change. -->

- [ ] Documentation
- [ ] Architecture
- [ ] Engine — core pipeline
- [ ] API — provider interface
- [ ] Provider — adapter implementation
- [ ] Memory system
- [ ] Decision module
- [ ] Prompt builder
- [ ] Save system
- [ ] Tests
- [ ] CI / tooling
- [ ] Other

---

## Architectural impact

<!-- Answer each question briefly. If a question does not apply, write "N/A". -->

**Does this change introduce a new responsibility into an existing module?**

**Does it modify module boundaries or the dependency graph?**

**Does it affect deterministic behaviour?**

**Does it affect the purity of any internal function?**

**Does it affect any public data contract defined in `types/`?**

---

## Documentation

<!-- Check all documents updated as part of this pull request. -->

- [ ] `README.md`
- [ ] `QUICKSTART.md`
- [ ] `ARCHITECTURE.md`
- [ ] `DEVELOPER_GUIDE.md`
- [ ] `CONTRIBUTING.md`
- [ ] `ROADMAP.md`
- [ ] `CHANGELOG.md`
- [ ] No documentation changes required

---

## Testing

- [ ] All existing tests pass
- [ ] New tests added for changed or added behaviour
- [ ] No tests required for this change

<!-- Optional: describe what is tested and why. -->

---

## Checklist

- [ ] Module Pattern respected — single responsibility, immutable context, pure sub-functions
- [ ] No hidden side effects — all I/O is named, isolated, and documented
- [ ] No shared mutable state introduced
- [ ] No undocumented public API added
- [ ] JSDoc updated where relevant
- [ ] Constants used in place of magic values
- [ ] Error handling preserved or extended
- [ ] Documentation synchronised with the implementation
- [ ] Ready for review

---

> *Gabida values architectural consistency over implementation speed.*
