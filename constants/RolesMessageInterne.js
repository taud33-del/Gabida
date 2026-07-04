/**
 * constants/RolesMessageInterne.js
 *
 * Roles utilises dans le format interne de message de api/.
 * Distincts de ROLES_MESSAGE (types/Prompt.js) qui concerne l'historique Gabida.
 *
 * Ces roles correspondent au format standard system/user/assistant
 * attendu par la majorite des providers LLM.
 * La conversion vers le format exact d'un provider est la responsabilite de l'adaptateur.
 */

export const ROLES_MESSAGE_INTERNE = Object.freeze({
  SYSTEM    : 'system',
  USER      : 'user',
  ASSISTANT : 'assistant',
})
