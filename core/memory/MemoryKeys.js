/**
 * core/memory/MemoryKeys.js
 *
 * Single responsibility: declare the official memory slot keys for Gabida.
 *
 * These constants are the canonical keys used to categorise memory entries.
 * No module uses raw strings to address memory slots.
 *
 * No logic. No dependencies. Constants only.
 */

export const MEMORY_KEYS = Object.freeze({
  FACT         : 'fact',
  EVENT        : 'event',
  DECISION     : 'decision',
  RELATIONSHIP : 'relationship',
  EMOTION      : 'emotion',
  LOCATION     : 'location',
  ITEM         : 'item',
  DIALOGUE     : 'dialogue',
  GOAL         : 'goal',
  BELIEF       : 'belief',
})
