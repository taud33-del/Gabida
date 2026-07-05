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
 * Valide qu'un message porte un champ texte de type string.
 * Le contenu n'est jamais interprete : une chaine vide est acceptee telle quelle.
 *
 * @param {{ texte: string }} message
 * @param {string} nom -- nom du parametre pour le message d'erreur
 * @throws {InvalidMessageError}
 */
function validerMessage(message, nom) {
  if (message === undefined || message === null || typeof message !== 'object') {
    throw new InvalidMessageError(`conversation.ajouterEchange : ${nom} est absent.`)
  }
  if (typeof message.texte !== 'string') {
    throw new InvalidMessageError(
      `conversation.ajouterEchange : ${nom}.texte doit etre une chaine de caracteres.`
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
 * @param {{ texte: string }} reponseIA     -- reponse produite par le provider
 * @returns {import('../types/Prompt.js').MessageHistorique[]} nouvel historique
 * @throws {InvalidHistoriqueError}
 * @throws {InvalidMessageError}
 */
export function ajouterEchange(historique, playerMessage, reponseIA) {
  const historiqueCourant = normaliserHistorique(historique)
  validerMessage(playerMessage, 'playerMessage')
  validerMessage(reponseIA, 'reponseIA')

  const messageUser      = { role: ROLES_MESSAGE.USER,      contenu: playerMessage.texte }
  const messageAssistant = { role: ROLES_MESSAGE.ASSISTANT, contenu: reponseIA.texte }

  return [...historiqueCourant, messageUser, messageAssistant]
}
