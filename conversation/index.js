/**
 * conversation/index.js
 *
 * Module metier : historique conversationnel (memoire court terme).
 *
 * Responsabilite UNIQUE : construire le nouvel historique exact des echanges.
 * Il ne decide jamais, ne resume jamais, ne filtre jamais, ne reordonne jamais
 * et ne reecrit jamais un message. Il ne fait qu'AJOUTER l'echange du tour
 * (message joueur puis reponse IA) a la fin de l'historique existant.
 *
 * Le module ne connait rien de Ressenti, Decision, Prompt, Provider ni de la
 * memoire narrative. Il est pur et totalement deterministe : aucune date,
 * aucun aleatoire, aucun reseau, aucune IA, aucun provider.
 *
 * @module conversation
 */

import { ROLES_MESSAGE } from '../constants/RolesMessage.js'
import {
  InvalidHistoriqueError,
  InvalidMessageError,
} from './ConversationError.js'

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Valide que l'historique fourni est un tableau (ou absent → traite comme vide).
 *
 * @param {import('../types/Prompt.js').MessageHistorique[]} [historique]
 * @returns {import('../types/Prompt.js').MessageHistorique[]}
 * @throws {InvalidHistoriqueError}
 */
function normaliserHistorique(historique) {
  if (historique === undefined || historique === null) return []
  if (!Array.isArray(historique)) {
    throw new InvalidHistoriqueError(
      'conversation.ajouterEchange : historique doit etre un tableau.'
    )
  }
  return historique
}

/**
 * Valide les donnees du joueur et de la reponse structuree.
 * Les chaines vides sont acceptees telles quelles.
 *
 * @param {{ texte: string }} playerMessage
 * @param {{ action: string, dialogue: string }} reponseIA
 * @throws {InvalidMessageError}
 */
function validerMessages(playerMessage, reponseIA) {
  if (playerMessage === undefined || playerMessage === null || typeof playerMessage !== 'object') {
    throw new InvalidMessageError('conversation.ajouterEchange : playerMessage est absent.')
  }
  if (typeof playerMessage.texte !== 'string') {
    throw new InvalidMessageError(
      'conversation.ajouterEchange : playerMessage.texte doit etre une chaine de caracteres.'
    )
  }
  if (reponseIA === undefined || reponseIA === null || typeof reponseIA !== 'object') {
    throw new InvalidMessageError('conversation.ajouterEchange : reponseIA est absent.')
  }
  if (typeof reponseIA.action !== 'string' || typeof reponseIA.dialogue !== 'string') {
    throw new InvalidMessageError(
      'conversation.ajouterEchange : reponseIA.action et reponseIA.dialogue doivent etre des chaines de caracteres.'
    )
  }
}

// ─── API publique ────────────────────────────────────────────────────────────────

/**
 * ajouterEchange(historique, playerMessage, reponseIA)
 *
 * Construit et retourne un NOUVEL historique en ajoutant, dans l'ordre strict,
 * le message du joueur puis la reponse IA a l'historique existant.
 *
 * L'historique recu n'est jamais mute (write-as-copy). L'ordre est conserve.
 * Aucun message existant n'est modifie, supprime, resume ou reordonne.
 *
 * @param {import('../types/Prompt.js').MessageHistorique[]} historique
 *   Historique courant (peut etre vide, undefined ou null).
 * @param {{ texte: string }} playerMessage -- message brut du joueur
 * @param {{ action: string, dialogue: string }} reponseIA -- reponse produite par le provider
 * @returns {import('../types/Prompt.js').MessageHistorique[]} nouvel historique
 * @throws {InvalidHistoriqueError}
 * @throws {InvalidMessageError}
 */
export function ajouterEchange(historique, playerMessage, reponseIA) {
  const historiqueCourant = normaliserHistorique(historique)
  validerMessages(playerMessage, reponseIA)

  const messageUser = { role: ROLES_MESSAGE.USER, contenu: playerMessage.texte }
  const messageAssistant = {
    role: ROLES_MESSAGE.ASSISTANT,
    contenu: JSON.stringify({ action: reponseIA.action, dialogue: reponseIA.dialogue }),
  }

  return [...historiqueCourant, messageUser, messageAssistant]
}
