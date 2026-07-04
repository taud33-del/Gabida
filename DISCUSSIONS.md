# GitHub Discussions — Gabida

> **Architecture belongs in Discussions. Work belongs in Issues.**

GitHub Discussions is where architectural thinking happens before implementation begins. It is the space where ideas are explored, designs are debated, questions are answered, and consensus is reached — before a single line of code is written or a single issue is opened.

Discussions exist to:
- explore ideas that are not yet ready to become issues
- debate architectural decisions with full context
- answer questions from contributors and users
- collect knowledge and reasoning for future reference
- reach consensus before committing to an implementation direction

---

## Why Discussions exist

Not every conversation belongs in an issue or a pull request. Using the right channel keeps the project's backlog clean and ensures that design thinking is preserved separately from implementation tracking.

| | Discussion | Issue | Pull Request |
|---|---|---|---|
| **Purpose** | Explore, debate, decide | Track, assign, resolve | Propose, review, merge |
| **Stage** | Before implementation | During planning or execution | During or after implementation |
| **Outcome** | Consensus, documentation | Closed task | Merged change |
| **Format** | Open-ended conversation | Defined scope | Concrete code change |
| **Closing criterion** | Decision reached or idea shelved | Work completed | Change accepted or rejected |

When in doubt: if it requires a decision before work can start, it belongs in a Discussion. If the decision has already been made, it belongs in an Issue or Pull Request.

---

## Discussion categories

| Category | Purpose |
|---|---|
| **General** | General project conversations that do not fit a specific category |
| **Architecture** | Major architectural decisions — module boundaries, pipeline changes, invariants |
| **Narrative Design** | Narrative systems, character cognition, memory models, planning and storytelling |
| **Ideas** | Early-stage feature proposals not yet ready to become issues |
| **Questions** | Community support — how to use Gabida, clarifications, guidance |
| **Research** | Academic papers, AI research, experiments, and external references relevant to the engine |
| **Show and Tell** | Community projects, integrations, and experiences built with Gabida |
| **Announcements** | Official project news, release notes, and maintainer communications |

---

## Choosing the right place

| Situation | Where it belongs |
|---|---|
| I found a bug | Issue — `bug_report` template |
| I have a vague idea | Discussion — **Ideas** |
| I want to redesign a module | Discussion — **Architecture** |
| I want to compare two architectural approaches | Discussion — **Architecture** |
| I want to discuss how memory should work | Discussion — **Narrative Design** |
| I don't understand how the API works | Discussion — **Questions** |
| I've read a paper relevant to the engine | Discussion — **Research** |
| I've built something with Gabida | Discussion — **Show and Tell** |
| A decision has been made and work can start | Issue |
| The implementation is ready | Pull Request |

---

## Architecture discussions

Architecture discussions are the most consequential conversations in the project. They shape the engine for years. Every architecture discussion should be structured to make its reasoning legible long after the conversation ends.

A well-structured architecture discussion includes the following sections:

**Current situation**
What exists today? Describe the module, behaviour, or structure being examined.

**Problem**
What is wrong, insufficient, or ambiguous about the current situation?

**Constraints**
What does any solution need to respect? Consider: module independence, determinism, backward compatibility, testability, and the project's invariants.

**Alternatives**
What are the possible approaches? List each one, even those you do not favour.

**Trade-offs**
What does each alternative gain and lose? Be explicit — every architectural decision involves trade-offs.

**Recommendation**
If you have a preferred direction, state it and explain your reasoning. If you are genuinely uncertain, say so.

**Open questions**
What remains unresolved? What would change the recommendation if answered differently?

---

## Good discussion practices

**Stay focused.** One discussion, one topic. If a conversation drifts, open a new discussion for the new thread.

**Prefer arguments over opinions.** "I think this is better" is a starting point. "This is better because it preserves module independence, which is required by Invariant 6" is an argument.

**Support claims with examples.** Abstract reasoning is useful; concrete examples are more persuasive and easier to evaluate.

**Separate facts from assumptions.** Be explicit about what you know and what you are inferring. Assumptions should be labelled as such.

**Document conclusions.** When a discussion reaches a decision, summarise it clearly at the end. Future contributors should be able to read the last comment and understand what was decided and why.

**Respect previous decisions.** If a decision was made in a prior discussion, reference it before proposing to revisit it. Architectural stability requires continuity.

---

## Closing a discussion

A discussion should be closed when one of the following is true:

- **Consensus reached** — the participants agree on a direction
- **Decision documented** — the conclusion has been written clearly in the thread
- **Issue created** — the outcome has been translated into actionable work
- **Pull request opened** — the implementation is underway
- **Feature rejected** — the proposal was considered and will not be pursued, with reasons stated
- **Question answered** — the original question has a clear, accepted response

Discussions left open indefinitely without a clear status become noise. When closing, always write a short summary of the outcome.

---

## Linking documentation

Discussions gain credibility and context when they reference the official documentation. When opening or contributing to a discussion, link to relevant documents where appropriate:

- [`README.md`](./README.md) — for project-level context
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — for architectural principles and invariants
- [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) — for conventions and module patterns
- [`MANIFESTO.md`](./MANIFESTO.md) — for founding values and vision
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — for contribution standards and workflow

Referencing these documents grounds the discussion in the project's established thinking and helps new contributors follow the reasoning.

---

## Best practices

**Architecture first. Implementation second.**
No implementation decision should be made without architectural clarity. If clarity does not exist, the Discussion is not finished.

**Discussions are not chat rooms.**
A discussion thread is a permanent record. Write as if the person reading it in two years has no other context. Be precise, be complete, and be kind.

**Long-term knowledge is more valuable than short-term opinions.**
The goal of a discussion is not to win an argument — it is to reach the best decision for the engine and to leave a clear record of why that decision was made.

---

## Closing

Every architectural decision in Gabida should be understandable years from now by reading the corresponding Discussion thread. The reasoning, the alternatives considered, the trade-offs accepted, and the conclusion reached should all be there — complete, clear, and accessible to a contributor who was not part of the original conversation.

This is not a standard for documentation. It is a standard for thinking.
