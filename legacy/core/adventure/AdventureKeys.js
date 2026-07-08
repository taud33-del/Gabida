/**
 * core/adventure/AdventureKeys.js
 *
 * Single responsibility: declare the official field keys for a Gabida Adventure.
 *
 * No logic. No dependencies. Constants only.
 */

export const ADVENTURE_KEYS = Object.freeze({
  ID           : 'id',
  NAME         : 'name',
  DESCRIPTION  : 'description',
  STATUS       : 'status',
  OBJECTIVES   : 'objectives',
  VARIABLES    : 'variables',
  FLAGS        : 'flags',
  CURRENT_STEP : 'currentStep',
  COMPLETED    : 'completed',
  FAILED       : 'failed',
  SUCCESS      : 'success',
  METADATA     : 'metadata',
})

export const ADVENTURE_STATUS = Object.freeze({
  IDLE      : 'idle',
  ACTIVE    : 'active',
  PAUSED    : 'paused',
  COMPLETED : 'completed',
  FAILED    : 'failed',
})
