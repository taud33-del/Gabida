/**
 * core/context/ContextTypedValidator.js
 *
 * Single responsibility: validate that domain objects are the correct class before
 * they are stored in a typed Context slot.
 *
 * Pure functions only. No side effects. No shared state.
 * Each function throws the domain's own typed error so callers get precise diagnostics.
 */

import { Player }     from '../player/Player.js'
import { Character }  from '../character/Character.js'
import { Universe }   from '../universe/Universe.js'
import { Adventure }  from '../adventure/Adventure.js'
import { Memory }     from '../memory/Memory.js'

import { InvalidPlayerError }    from '../player/PlayerError.js'
import { InvalidCharacterError } from '../character/CharacterError.js'
import { InvalidUniverseError }  from '../universe/UniverseError.js'
import { InvalidAdventureError } from '../adventure/AdventureError.js'
import { InvalidMemoryError }    from '../memory/MemoryError.js'

// ─── Typed validators ─────────────────────────────────────────────────────────

/**
 * @param {unknown} value
 * @throws {InvalidPlayerError}
 */
export function assertPlayer(value) {
  if (!(value instanceof Player)) {
    throw new InvalidPlayerError('value must be a Player instance', value)
  }
}

/**
 * @param {unknown} value
 * @throws {InvalidCharacterError}
 */
export function assertCharacter(value) {
  if (!(value instanceof Character)) {
    throw new InvalidCharacterError('value must be a Character instance', value)
  }
}

/**
 * @param {unknown} value
 * @throws {InvalidUniverseError}
 */
export function assertUniverse(value) {
  if (!(value instanceof Universe)) {
    throw new InvalidUniverseError('value must be a Universe instance', value)
  }
}

/**
 * @param {unknown} value
 * @throws {InvalidAdventureError}
 */
export function assertAdventure(value) {
  if (!(value instanceof Adventure)) {
    throw new InvalidAdventureError('value must be an Adventure instance', value)
  }
}

/**
 * @param {unknown} value
 * @throws {InvalidMemoryError}
 */
export function assertMemory(value) {
  if (!(value instanceof Memory)) {
    throw new InvalidMemoryError('value must be a Memory instance', value)
  }
}
