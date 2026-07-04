# Release Process — Gabida

A release is not the moment code is published — it is the moment the project certifies that the code, the architecture, and the documentation are consistent with each other. A release without that consistency is not a milestone; it is a risk.

Every Gabida release represents a stable architectural state. Features may be incomplete. The roadmap may continue. But everything that ships in a release must be coherent, documented, and tested. Partial or experimental work belongs on a branch, not in a release.

---

## Release checklist

- [ ] All documentation updated to reflect the current state of the engine
- [ ] `ARCHITECTURE_DECISIONS.md` synchronised with any structural changes made since the last release
- [ ] Public API reviewed — no undocumented changes to `Gabida`, `Session`, or `Response`
- [ ] Full test suite passing in a clean environment with no skipped tests
- [ ] All breaking changes documented in `CHANGELOG.md` with a migration path
- [ ] `CHANGELOG.md` updated with a complete entry for this release
- [ ] Version number updated in accordance with the versioning policy
- [ ] CI pipeline successful with no warnings suppressed

---

## Release philosophy

1. **A release certifies consistency, not completeness.** Not all planned features need to be present — all present features need to be correct.
2. **Documentation ships with code.** A feature that is implemented but undocumented is not ready for release.
3. **Tests are non-negotiable.** A release with failing or missing tests does not happen.
4. **Breaking changes are rare and deliberate.** They require a full deprecation cycle and a documented migration path.
5. **Small, frequent releases are preferred over large, infrequent ones.** Smaller releases are easier to verify and easier to roll back.
6. **The public API is the release contract.** Any change to it is the most scrutinised part of the release process.
7. **Releases are not deadlines.** A release delayed by an architectural concern is the correct outcome.
8. **Every release is permanent.** Published versions are never silently modified — corrections become new releases.

---

## What is NOT a release blocker

- Experimental features marked as such that are not yet complete
- Documentation improvements planned for a future minor version
- Performance optimisations that do not affect correctness or API stability
- Missing provider adapters not included in the release scope
- Open Discussions that have not yet reached consensus

---

## What IS a release blocker

- Any failing test in the full suite
- Any undocumented change to the public API
- Any breaking change without a documented migration path
- Any architectural invariant known to be violated in the current codebase
- Any inconsistency between the code and its documentation
- `CHANGELOG.md` not updated for this release
- `ARCHITECTURE_DECISIONS.md` not reflecting structural changes made since the last release
- Any suppressed CI warning related to correctness or security

---

## After a release

1. **Tag the release** in version control with the exact version number.
2. **Announce** the release in the Announcements category on GitHub Discussions with a link to the changelog entry.
3. **Close resolved issues** that were addressed in this release.
4. **Open the next milestone** and begin triaging the backlog for the following release.
5. **Review** any open ADRs or architectural discussions that the release may have resolved or invalidated.

---

## Closing

A release is a statement of confidence — in the architecture, in the tests, and in the documentation. It tells developers that what ships is what was designed, and that what was designed is what is described. Feature quantity is never the measure of a good release. Architectural consistency always is.
