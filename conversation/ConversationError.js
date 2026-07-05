/**
 * conversation/ConversationError.js
 *
 * Erreurs typees locales du module conversation.
 *
 * Meme philosophie que ressenti/RessentiError.js, decision/DecisionError.js et
 * prompt/PromptError.js : le module metier ne depend JAMAIS de core/ (regle de
 * dependances). Il declare donc ses propres erreurs, sans importer aucune erreur
 * du noyau.
 *
 * Hierarchie :
 *   ConversationError (base)
 *     ├── InvalidHistoriqueError -- historique fourni qui n'est pas un tableau
 *     └── InvalidMessageError    -- playerMessage/reponseIA absent ou texte non-string
 */

/**
 * Erreur de base du module conversation.
 */
export class ConversationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'ConversationError'
  }
}

/**
 * Levee lorsque l'historique fourni existe mais n'est pas un tableau.
 */
export class InvalidHistoriqueError extends ConversationError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'InvalidHistoriqueError'
  }
}

/**
 * Levee lorsqu'un message (joueur ou reponse IA) est absent ou que son champ
 * texte n'est pas une chaine de caracteres.
 */
export class InvalidMessageError extends ConversationError {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message)
    this.name = 'InvalidMessageError'
  }
}
