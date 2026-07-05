/**
 * lecture/LectureError.js
 *
 * Erreurs typees locales du module lecture.
 *
 * Meme philosophie que ressenti/RessentiError.js, decision/DecisionError.js,
 * prompt/PromptError.js et conversation/ConversationError.js : le module ne
 * depend JAMAIS de core/. Il declare ses propres erreurs.
 *
 * Hierarchie :
 *   LectureError (base)
 *     ├── SourcesInvalidesError -- l'objet sources est absent ou n'est pas un objet
 *     ├── FicheManquanteError   -- une fiche obligatoire est absente
 *     ├── TypeFicheInvalideError-- type de fiche inconnu (hors des 5 types)
 *     └── FicheInvalideError    -- la fiche existe mais n'est pas un objet valide
 */

/**
 * Erreur de base du module lecture.
 */
export class LectureError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'LectureError'
  }
}

/**
 * Levee lorsque l'objet sources fourni a loadFiches est absent ou invalide.
 */
export class SourcesInvalidesError extends LectureError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'SourcesInvalidesError'
  }
}

/**
 * Levee lorsqu'une fiche obligatoire est absente des sources.
 */
export class FicheManquanteError extends LectureError {
  /**
   * @param {string} type -- Type de la fiche manquante.
   */
  constructor(type) {
    super(`lecture : fiche obligatoire "${type}" absente.`)
    this.name = 'FicheManquanteError'
    this.type = type
  }
}

/**
 * Levee lorsqu'un type de fiche inconnu est demande (hors des 5 types Gabida).
 */
export class TypeFicheInvalideError extends LectureError {
  /**
   * @param {string} type -- Type demande.
   */
  constructor(type) {
    super(`lecture : type de fiche inconnu "${type}".`)
    this.name = 'TypeFicheInvalideError'
    this.type = type
  }
}

/**
 * Levee lorsqu'une fiche est presente mais n'est pas un objet exploitable.
 */
export class FicheInvalideError extends LectureError {
  /**
   * @param {string} type -- Type de la fiche.
   * @param {string} detail
   */
  constructor(type, detail) {
    super(`lecture : fiche "${type}" invalide : ${detail}`)
    this.name = 'FicheInvalideError'
    this.type = type
  }
}
