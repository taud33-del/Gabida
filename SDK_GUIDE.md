# SDK Guide — Gabida

---

## Philosophy

Gabida is used through its SDK. Developers compose narrative experiences — characters, worlds, sessions — without interacting with the engine internals. The SDK is intentionally small: three objects, a handful of methods, and a single pattern to learn.

---

## Typical workflow

1. Create a `Gabida` engine instance with your provider configuration.
2. Create a `Session` with a character and a world.
3. Send player messages using `session.send()`.
4. Read the character's response from the returned `Response` object.
5. Save the session periodically with `session.save()`.
6. Reload the session with `gabida.loadSession()` when the player returns.
7. Close the session with `session.close()` when the conversation ends.

---

## Main objects

| Object | Responsibility |
|---|---|
| `Gabida` | Engine instance. Initialised once. Creates and loads sessions. |
| `Session` | An active conversation. Sends messages, holds state, handles persistence. |
| `Response` | The result of one turn. Read-only. Contains text, emotion, and metadata. |

---

## Minimal example

```javascript
import { Gabida } from 'gabida'

// 1. Create the engine
const gabida = new Gabida({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})

// 2. Create a session
const session = gabida.createSession({ character, world })

// 3. Send a message and read the response
const response = await session.send('Hello.')
console.log(response.text)

// 4. Save
await session.save()

// 5. Close
await session.close()

// Later — reload and continue
const restored = await gabida.loadSession(session.id)
const next = await restored.send('Good morning.')
console.log(next.text)
```

---

## Best practices

- **One session per conversation.** Do not reuse a session across unrelated narratives.
- **Save regularly.** Call `session.save()` after significant turns or at natural breakpoints.
- **Treat responses as immutable.** Never modify a `Response` object — read from it and move on.
- **Use the public API only.** Do not reach into internal modules, even if they are technically importable.
- **Do not modify session state directly.** All state changes happen through `session.send()`.

---

## What not to do

| Do | Do not |
|---|---|
| Use `Session` to manage conversations | Import `core/`, `decision/`, or any internal module |
| Read from `response.text` and `response.emotion` | Modify or extend `Response` objects |
| Use `session.save()` and `gabida.loadSession()` | Access or overwrite `session.state` directly |
| Configure providers through `new Gabida(options)` | Instantiate provider adapters manually |
| Extend Gabida through the official adapter interfaces | Monkey-patch internal functions |

---

## Closing

The SDK is the only supported interface to Gabida. Internal modules are not versioned as public API and may change between releases. Applications built against the SDK will remain compatible across minor and patch versions. Applications that bypass the SDK have no compatibility guarantees.
