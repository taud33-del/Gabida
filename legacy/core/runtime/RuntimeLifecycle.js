/**
 * core/runtime/RuntimeLifecycle.js
 *
 * Responsabilite unique : valider les transitions du cycle de vie du runtime.
 *
 * Question : "Cette transition d'etat est-elle legale ?"
 *
 * Ce fichier expose uniquement des fonctions pures d'aide.
 * Il ne modifie aucun etat.
 * Il ne produit aucun effet de bord.
 * Il ne connait pas le Runtime lui-meme.
 *
 * Transitions autorisees :
 *   STOPPED  → STARTING
 *   STARTING → RUNNING
 *   RUNNING  → PAUSED
 *   RUNNING  → STOPPING
 *   PAUSED   → RUNNING
 *   STOPPING → STOPPED
 */

import { RUNTIME_STATES } from '../../constants/RuntimeStates.js'

// ─── Table des transitions ────────────────────────────────────────────────────

/** @type {Record<string, string[]>} */
const ALLOWED_TRANSITIONS = Object.freeze({
  [RUNTIME_STATES.STOPPED]  : [RUNTIME_STATES.STARTING],
  [RUNTIME_STATES.STARTING] : [RUNTIME_STATES.RUNNING],
  [RUNTIME_STATES.RUNNING]  : [RUNTIME_STATES.PAUSED, RUNTIME_STATES.STOPPING],
  [RUNTIME_STATES.PAUSED]   : [RUNTIME_STATES.RUNNING],
  [RUNTIME_STATES.STOPPING] : [RUNTIME_STATES.STOPPED],
})

// ─── Fonctions pures ─────────────────────────────────────────────────────────

/**
 * Indique si la transition de `from` vers `to` est une transition legale.
 *
 * @param {string} from - Etat actuel du runtime.
 * @param {string} to   - Etat cible de la transition.
 * @returns {boolean}
 */
export function isTransitionAllowed(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from]
  return Array.isArray(allowed) && allowed.includes(to)
}

/**
 * Retourne la liste des etats accessibles depuis un etat donne.
 *
 * @param {string} from - Etat actuel du runtime.
 * @returns {string[]} Liste des etats cibles accessibles.
 */
export function getAllowedTransitions(from) {
  return ALLOWED_TRANSITIONS[from] ?? []
}
