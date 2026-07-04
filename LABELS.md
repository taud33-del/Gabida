# Label Taxonomy — Gabida

This document is the single source of truth for all GitHub labels used in the Gabida repository.

Labels exist to organise work, improve searchability, keep the backlog readable, and help contributors quickly understand the nature and status of any issue or pull request. Consistent labelling is a small discipline with a large return over the lifetime of a project.

---

## Type

Every issue and pull request must carry at least one Type label.

| Label | Description |
|---|---|
| `bug` | Something is not working as documented or expected |
| `feature` | A new capability or behaviour is proposed |
| `documentation` | Concerns the written documentation only, no source changes |
| `refactor` | Restructuring of existing code without changing behaviour |
| `question` | A specific, answerable question about the engine or its usage |
| `discussion` | An open-ended topic that does not yet have a clear resolution |

---

## Architecture

Architecture labels identify which part of the engine's design is involved. Multiple architecture labels may be applied to a single issue.

| Label | Description |
|---|---|
| `architecture` | Concerns module boundaries, pipeline structure, or invariants |
| `module` | Concerns the design or behaviour of one specific module |
| `pipeline` | Concerns the sequence and data flow of the cognitive pipeline |
| `memory` | Concerns the lived memory system — retention, forgetting, or retrieval |
| `decision` | Concerns the decision engine — how characters decide and what drives it |
| `planning` | Concerns long-term narrative planning or session continuity |
| `provider` | Concerns an AI provider integration or the adapter interface |
| `save-system` | Concerns session persistence, versioning, or migration |
| `api` | Concerns the public-facing API surface of the engine |
| `engine` | Concerns the core orchestration or the turn cycle |

---

## Priority

Exactly one Priority label per issue. Apply it only when the priority is clear.

| Label | Description |
|---|---|
| `priority:low` | Can wait — no immediate impact on functionality or architecture |
| `priority:medium` | Should be addressed in a reasonable timeframe |
| `priority:high` | Blocking meaningful progress or affecting documented behaviour |
| `priority:critical` | Requires immediate attention — data loss, security, or breaking regression |

---

## Difficulty

Indicates the estimated complexity of addressing the issue. Useful for helping contributors choose where to start.

| Label | Description |
|---|---|
| `good first issue` | Suitable for a contributor new to the project |
| `easy` | Straightforward change, well-defined scope |
| `medium` | Requires familiarity with the affected module |
| `hard` | Requires deep understanding of the architecture |
| `expert` | Reserved for issues requiring full architectural knowledge |

---

## Status

Status labels reflect the current state of an issue or pull request.

| Label | Description |
|---|---|
| `blocked` | Progress is blocked by an external dependency or another issue |
| `needs review` | Awaiting review from a maintainer or contributor |
| `in progress` | Actively being worked on |
| `ready` | Implementation complete, awaiting final merge or release |
| `duplicate` | This issue has already been reported or addressed elsewhere |
| `invalid` | Does not meet the criteria for a valid issue |
| `wontfix` | Acknowledged but will not be addressed — reason should be stated |

---

## Version

Indicates which version of Gabida the issue or pull request targets. Apply only one Version label.

| Label | Description |
|---|---|
| `v1.0` | Targets the current stable release |
| `v1.1` | Scheduled for the Developer Experience release |
| `v2.0` | Scheduled for the Narrative Operating System release |
| `future` | No specific version assigned — explored for a future milestone |

---

## Community

Community labels help contributors and maintainers coordinate around participation and contribution type.

| Label | Description |
|---|---|
| `help wanted` | Maintainers are actively looking for a contributor to take this on |
| `mentor needed` | The contributor working on this issue would benefit from guidance |
| `design` | Involves narrative design, cognitive model thinking, or UX decisions |
| `research` | Requires investigation or exploration before a solution can be proposed |

---

## Color philosophy

Labels are grouped by semantic meaning. The following color intentions apply across all categories. Exact hex values are set when labels are created in GitHub — what matters here is the intent.

| Color | Intended for |
|---|---|
| Red | Bugs and critical issues |
| Green | New features and enhancements |
| Blue | Architecture and engine internals |
| Purple | Documentation |
| Orange | Priority levels |
| Gray | Status labels — neutral, process-oriented |

---

## Labelling rules

- **Every issue must carry at least one Type label.** An unlabelled issue is an unclassified issue.
- **Apply only one Priority label.** Competing priorities are not priorities.
- **Apply only one Version label.** If the version is unclear, use `future`.
- **Multiple Architecture labels are allowed.** An issue may legitimately affect several parts of the engine.
- **Avoid applying more than six labels to a single issue.** If more seem necessary, consider splitting the issue.

---

## Closing

Consistent labelling is not administrative overhead — it is a contribution to the long-term health of the project. A well-labelled backlog is scannable, searchable, and legible to a contributor discovering the project for the first time. It reflects the same discipline that the engine's architecture demands of its code: clarity, intention, and structure over time.
