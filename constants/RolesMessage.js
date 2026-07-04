/**
 * constants/RolesMessage.js
 *
 * Rôles des émetteurs dans l'historique de la conversation.
 * Format générique indépendant de tout LLM.
 * Utilisé par : types/Prompt.js (MessageHistorique.role), module prompt, module api.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportées.
 */

/**
 * @readonly
 * @enum {string}
 */
export const ROLES_MESSAGE = Object.freeze({
  /** Message émis par le joueur. */
  USER: 'user',

  /** Message émis par le personnage — réponse produite par le LLM. */
  ASSISTANT: 'assistant',
})
