# Public API — Gabida

This document defines everything an application developer needs to work with Gabida. Anything not listed here is internal and subject to change without notice.

---

## Philosophy

Gabida exposes a minimal, stable API. The internal architecture — modules, pipeline, cognitive model — is deliberately hidden. Application developers interact with three objects: `Gabida`, `Session`, and `Response`. Simplicity is preferred over completeness.

---

## Public surface

| Object | Purpose |
|---|---|
| `Gabida` | Engine instance. Entry point for all operations. |
| `Session` | An active conversation with a character. |
| `Response` | The result of a single turn. |

---

## Gabida

```javascript
new Gabida(options)
```

Creates an engine instance. `options` includes the AI provider and API key.

| Method | Description |
|---|---|
| `gabida.createSession(options)` | Creates a new session with a character and world. Returns a `Session`. |
| `gabida.loadSession(sessionId)` | Restores a previously saved session. Returns a `Session`. |

---

## Session

| Property / Method | Description |
|---|---|
| `session.id` | The unique identifier of this session. |
| `session.state` | Read-only snapshot of the current session state. |
| `await session.send(message)` | Sends a player message and returns a `Response`. |
| `await session.save()` | Persists the current session state to the configured storage. |
| `await session.close()` | Closes the session and releases any associated resources. |

---

## Response

| Field | Description |
|---|---|
| `response.text` | The character's dialogue — the string to display to the player. |
| `response.emotion` | The character's emotional state during this turn. |
| `response.actions` | Any actions the character performed beyond speaking. |
| `response.metadata` | Turn number, session ID, timestamp, and provider used. |

---

## Example

```javascript
import { Gabida } from 'gabida'

const gabida = new Gabida({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})

const session = gabida.createSession({ character, world })

const response = await session.send('Hello.')
console.log(response.text)

await session.save()
```

---

## Internal modules — not part of the public API

The following are internal to the engine. They are not exported, not versioned as public API, and must not be imported directly by application code.

- `core/` — pipeline orchestration
- `analyse/`, `influences/`, `ressenti/`, `decision/`, `prompt/` — cognitive pipeline stages
- `memoire/` — memory internals
- `sauvegarde/` — persistence internals
- Provider adapter implementations
- All internal runtime objects and context types

---

## Closing

The public API is designed to remain stable across engine versions. Internal modules may be restructured, extended, or replaced as the engine evolves — the three public objects (`Gabida`, `Session`, `Response`) and their documented methods will not change without a major version increment and a documented migration path.
