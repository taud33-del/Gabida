# Quick Start — Gabida

> From zero to your first character dialogue in under 5 minutes.

By the end of this guide you will be able to:
- initialise Gabida with a character and a world
- create a session
- send a message and receive a response
- save and reload a session

No knowledge of the internal architecture required.

---

## 1. Installation

```bash
npm install gabida
```

Gabida requires **Node.js 18+**.

---

## 2. Your first project

Create a new directory and initialise your project.

```bash
mkdir my-gabida-project
cd my-gabida-project
npm init -y
npm install gabida
```

Create your entry point.

```bash
touch index.js
```

---

## 3. Prepare your character data

Gabida needs two things to bring a character to life:

- a **character file** — who the character is, their personality, values, and relationships
- a **world file** — the narrative context they live in

For this guide, use the built-in minimal templates.

```javascript
// index.js
import { Gabida } from 'gabida'
import { createMinimalCharacter, createMinimalWorld } from 'gabida/templates'

const character = createMinimalCharacter({
  name: 'Elara',
  personality: 'calm, curious, slightly distrustful of strangers',
})

const world = createMinimalWorld({
  setting: 'A quiet inn at the edge of a frozen forest.',
})
```

In a real project, character and world data are loaded from your own JSON or YAML files.
The templates are provided for prototyping only.

---

## 4. Initialise Gabida

```javascript
const gabida = new Gabida({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})
```

Gabida is provider-agnostic. Swap `'openai'` for `'anthropic'`, `'mistral'`, or any registered adapter without changing any other code.

---

## 5. Create a session

```javascript
const session = gabida.createSession({
  character,
  world,
  sessionId: 'session-001', // optional — generated automatically if omitted
})
```

A session holds the full state of a conversation: the character's memory, emotional state, and history of decisions. It persists across turns.

---

## 6. Send your first message

```javascript
const response = await session.send('Hello.')

console.log(response.text)        // The character's dialogue
console.log(response.decision)    // What the character decided to do
console.log(response.feeling)     // How the character felt in this moment
console.log(response.turn)        // Current turn number
```

`response.text` is what gets displayed to the player.
Everything else is available for your application logic — UI state, debug overlay, analytics, branching narrative conditions.

---

## 7. Continue the conversation

```javascript
const r1 = await session.send('Are you the innkeeper?')
console.log(r1.text)

const r2 = await session.send('I need a room for the night.')
console.log(r2.text)

const r3 = await session.send('I heard there was trouble in the forest.')
console.log(r3.text)
```

Each turn, Gabida updates the character's internal state. The character remembers what was said, adjusts how it feels, and makes decisions accordingly. The conversation stays coherent.

---

## 8. Save a session

```javascript
await session.save()
```

By default, Gabida saves to the local filesystem under `.gabida-sessions/`.
The session is stored as a versioned JSON file, ready to be reloaded at any time.

To use a custom storage backend (database, cloud, etc.), register your own adapter:

```javascript
import { registerStorageAdapter } from 'gabida/sauvegarde'

registerStorageAdapter('my-backend', {
  async save(sessionId, data) { /* write to your storage */ },
  async load(sessionId)       { /* return data string or null */ },
  async delete(sessionId)     { /* remove from your storage */ },
  async list()                { /* return array of session summaries */ },
})
```

---

## 9. Reload a session

```javascript
const session = await gabida.loadSession('session-001')

const response = await session.send('Good morning.')
console.log(response.text) // Elara remembers the night before.
```

The character's memory, emotional history, and previous decisions are fully restored.
The conversation continues exactly where it left off.

---

## 10. Complete example

```javascript
import { Gabida } from 'gabida'
import { createMinimalCharacter, createMinimalWorld } from 'gabida/templates'

const character = createMinimalCharacter({
  name: 'Elara',
  personality: 'calm, curious, slightly distrustful of strangers',
})

const world = createMinimalWorld({
  setting: 'A quiet inn at the edge of a frozen forest.',
})

const gabida = new Gabida({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})

// Create session
const session = gabida.createSession({ character, world })

// First exchange
const r1 = await session.send('Hello. Are you open?')
console.log(r1.text)

// Continue
const r2 = await session.send('I need shelter for the night.')
console.log(r2.text)

// Save
await session.save()

// Later — reload and continue
const restored = await gabida.loadSession(session.sessionId)
const r3 = await restored.send('Good morning. I slept well.')
console.log(r3.text)
```

---

## 11. What does Gabida do during a turn?

You don't need to know this to use Gabida. But if you are curious:

```
  Your message
       ↓
   Analyse        — What does the player mean?
       ↓
   Psychology     — What influences the character?
       ↓
   Feeling        — How does the character feel right now?
       ↓
   Decision       — What does the character decide to do?
       ↓
   Prompt         — How should this be expressed?
       ↓
   AI Provider    — The LLM generates the dialogue text.
       ↓
   Memory         — What should be remembered from this turn?
       ↓
   Your response
```

The character *thinks* before it *speaks*. The LLM only handles language — every decision is made by the engine.

---

## 12. How it all fits together

```
  Your Application
        ↓
  Gabida SDK         ← the only layer you interact with
        ↓
  Gabida Engine      ← cognitive pipeline (invisible to you)
        ↓
  AI Provider        ← OpenAI, Anthropic, Mistral, or your own
        ↓
  Response
```

Your application never talks to the AI provider directly.
Gabida handles everything in between.

---

## 13. What's next?

You've completed the Quick Start. You can now:

**Go deeper into the architecture**
→ [`ARCHITECTURE.md`](./ARCHITECTURE.md)
Principles, invariants, and the full cognitive pipeline.

**Start building your own characters and worlds**
→ [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)
Data file format, custom adapters, extending the engine.

**Understand why Gabida exists**
→ [`MANIFESTO.md`](./MANIFESTO.md)
The vision and philosophy behind the project.

---

*Questions? Open a discussion on GitHub.*
