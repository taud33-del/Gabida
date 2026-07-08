/**
 * core/character/index.js
 *
 * Single entry point for the character sub-module.
 * This file defines nothing — it only re-exports.
 */

export { Character }                                   from './Character.js'
export { CharacterState }                              from './CharacterState.js'
export { CharacterTraits }                             from './CharacterTraits.js'
export { CharacterRelations }                          from './CharacterRelations.js'
export { CHARACTER_KEYS }                              from './CharacterKeys.js'
export {
  validateId,
  validateName,
  validateTrait,
  validateRelation,
  validateCharacter,
}                                                      from './CharacterValidator.js'
export {
  CharacterError,
  InvalidCharacterError,
  DuplicateTraitError,
  RelationNotFoundError,
  InvalidCharacterStateError,
}                                                      from './CharacterError.js'
