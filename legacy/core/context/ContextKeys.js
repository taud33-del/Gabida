/**
 * core/context/ContextKeys.js
 *
 * Single responsibility: declare the official keys of the execution Context.
 *
 * These constants are the only valid top-level keys within a Context.
 * No module uses raw strings to address context slots.
 *
 * No logic. No dependencies. Constants only.
 */

export const CONTEXT_KEYS = Object.freeze({
  PLAYER    : 'player',
  CHARACTER : 'character',
  UNIVERSE  : 'universe',
  ADVENTURE : 'adventure',
  MEMORY    : 'memory',
  VARIABLES : 'variables',
  FLAGS     : 'flags',
  SERVICES  : 'services',
  SESSION   : 'session',
  RUNTIME   : 'runtime',
  METADATA  : 'metadata',
})
