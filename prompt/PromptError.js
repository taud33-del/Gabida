/**
 * prompt/PromptError.js
 *
 * Erreurs typees locales du module prompt.
 *
 * Meme philosophie que ressenti/RessentiError.js et decision/DecisionError.js :
 * le module metier ne depend JAMAIS de core/ (regle de dependances). Il declare
 * donc ses propres erreurs, sans importer aucune erreur du noyau.
 *
 * Hierarchie :
 *   PromptError (base)
 *     ├── MissingDecisionError        -- Decision absente ou malformee
 *     └── MissingFichePersonnageError -- Fiche personnage (identite) absente
 */

/**
 * Erreur de base du module prompt.
 */
export class PromptError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'PromptError'
  }
}

/**
 * Levee lorsque la Decision fournie est absente ou ne respecte pas son contrat
 * minimal (objectifImmediat / attitude / directionNarrative / justification).
 */
export class MissingDecisionError extends PromptError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'MissingDecisionError'
  }
}

/**
 * Levee lorsque la fiche personnage (identite requise pour le bloc systeme)
 * est absente.
 */
export class MissingFichePersonnageError extends PromptError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'MissingFichePersonnageError'
  }
}
