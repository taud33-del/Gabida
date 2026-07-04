# FAQ — Gabida

---

**What is Gabida?**
Gabida is a Narrative Operating System — an engine that gives characters a structured inner life before they speak. It is not a chatbot, not an AI model, and not a dialogue generator. It is the system that decides how a character thinks, feels, and acts. The AI provider only handles language.

---

**Is Gabida an AI model?**
No. Gabida is an engine. It orchestrates cognition — analysis, emotion, decision — using deterministic, structured logic. The AI model (LLM) is a separate, swappable component responsible only for generating dialogue text. You can change the AI provider without changing how characters behave.

---

**Which AI providers are supported?**
Gabida is provider-agnostic. Providers are connected through a standard adapter interface and can be swapped without modifying the engine. The set of supported providers may grow over time. Check the repository for the current list.

---

**Can I build my own provider?**
Yes. Implement the provider adapter interface and register it with the engine. Your provider will work identically to any built-in one. See [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) for the adapter contract.

---

**Do I need to understand the internal architecture?**
No. Application developers interact exclusively with the public SDK — `Gabida`, `Session`, and `Response`. The internal pipeline is invisible by design. Start with [`QUICKSTART.md`](./QUICKSTART.md) and [`SDK_GUIDE.md`](./SDK_GUIDE.md).

---

**Is the API stable?**
The public API (`Gabida`, `Session`, `Response`) is stable and versioned. Internal modules are not part of the public API and may change between releases. Applications built against the public API will remain compatible across minor and patch versions.

---

**Where should I start?**
Read [`README.md`](./README.md) for an overview, then follow [`QUICKSTART.md`](./QUICKSTART.md) to run your first session. [`SDK_GUIDE.md`](./SDK_GUIDE.md) covers the full development workflow.

---

**Where can I ask questions?**
Open a discussion in the **Questions** category on [GitHub Discussions](../../discussions). For specific, answerable questions, the issue tracker also accepts question reports using the question template.

---

**How do I report a bug?**
Open an issue using the **Bug Report** template on GitHub Issues. Include the Gabida version, Node.js version, steps to reproduce, and the expected versus actual behaviour.

---

**Where can I contribute?**
Read [`CONTRIBUTING.md`](./CONTRIBUTING.md). It describes the full contribution workflow, the pull request checklist, and the documents you should read before submitting anything.

---

Start with a small project. Get a character talking. Save a session. Reload it. Once the basic lifecycle feels natural, the rest of the documentation — architecture, developer guide, narrative design — will make considerably more sense.
