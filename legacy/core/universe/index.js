/**
 * core/universe/index.js
 *
 * Single entry point for the universe sub-module.
 * This file defines nothing — it only re-exports.
 */

export { Universe, createUniverse }                    from './Universe.js'
export { UniverseCollection }                          from './UniverseCollection.js'
export { UniverseLocation }                            from './UniverseLocation.js'
export { UniverseRule }                                from './UniverseRule.js'
export { UNIVERSE_KEYS }                               from './UniverseKeys.js'
export {
  validateUniverse,
  validateUniverseName,
  validateLocation,
  validateRule,
  validateTimeline,
}                                                      from './UniverseValidator.js'
export {
  UniverseError,
  InvalidUniverseError,
  DuplicateLocationError,
  LocationNotFoundError,
  DuplicateRuleError,
  RuleNotFoundError,
}                                                      from './UniverseError.js'
