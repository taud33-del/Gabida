# Supported Providers — Gabida

Gabida does not depend on any specific AI model. The engine handles all character cognition — analysis, emotion, decision-making — before a provider is involved. The provider receives a fully prepared prompt and returns text. Nothing more is expected of it.

This separation is intentional and fundamental. It means that switching providers does not change how characters think, feel, or decide. It only changes the voice. The engine owns the cognition; the provider owns the language.

---

## Provider philosophy

1. **Providers are interchangeable.** The engine must produce consistent character behaviour regardless of which provider is configured.
2. **Providers are late in the pipeline.** By the time a provider is called, all decisions have already been made.
3. **Providers do not influence cognition.** The engine never adjusts its reasoning based on which provider is active.
4. **Adapters are thin.** A provider adapter translates between the engine's prompt format and the provider's API. It adds no logic.
5. **Provider failures are isolated.** An error from a provider is caught at the adapter boundary and does not propagate into the cognitive pipeline.
6. **Streaming is optional.** Providers that support streaming may expose it; those that do not remain fully compatible.
7. **New providers do not require engine changes.** Adding a provider means implementing an adapter, not modifying the pipeline.
8. **Provider capabilities are declared, not assumed.** The engine consults the adapter's declared capabilities before using them.

---

## Supported provider capabilities

| Capability | Requirement |
|---|---|
| **Text generation** | Required — every provider must be able to return a text response given a prompt |
| **Streaming** | Optional — adapters may expose streaming; the engine works correctly without it |
| **Structured output** | Optional — useful for richer response parsing; the engine does not require it |
| **Tool calling** | Optional — may be used by advanced adapters; the core pipeline does not depend on it |
| **System prompts** | Recommended — adapters should use system prompts when the provider supports them |
| **Context window reporting** | Optional — useful for memory management; adapters may expose token limits |

---

## Adapter responsibilities

1. Accept a structured prompt from the engine and translate it into the provider's expected format.
2. Send the request to the provider and return a standardised response to the engine.
3. Declare which capabilities the provider supports so the engine can adapt its behaviour.
4. Handle provider-specific errors and translate them into the engine's error taxonomy.
5. Respect rate limits and retry policies without exposing them to the engine.
6. Never modify the prompt content — translation of format is permitted, not modification of intent.
7. Never call back into the engine's cognitive modules.
8. Expose streaming as an option when supported, without requiring the engine to depend on it.

---

## Engine responsibilities

1. Determine what the character analyses, feels, and decides — independent of the provider.
2. Construct the prompt from the character's internal state, not from provider-specific conventions.
3. Route the prompt to the correct adapter without knowledge of the provider's implementation.
4. Handle the response as text and pass it to the memory module for processing.
5. Never change cognitive behaviour based on which provider is active.
6. Validate that an adapter implements the required interface before accepting it.
7. Isolate provider failures so they do not corrupt session state.
8. Log provider interactions for traceability without creating a dependency on their specifics.

---

## Compatibility

New providers are added by implementing the official adapter interface and registering the adapter with the engine. No engine module is modified. The adapter declares its capabilities, implements the required methods, and becomes immediately available for use. This is the only supported path for adding provider support — any approach that modifies the engine to accommodate a specific provider violates the architectural contract.

---

## Closing

Providers are interchangeable components in a system whose cognition belongs entirely to Gabida. The engine does not become a different engine when the provider changes. Characters do not become different characters. Only the voice changes — and that is precisely the point.
