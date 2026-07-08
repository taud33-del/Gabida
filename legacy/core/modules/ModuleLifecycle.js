/**
 * core/modules/ModuleLifecycle.js
 *
 * Responsabilite unique : valider les transitions du cycle de vie d'un module.
 *
 * Question : "Cette transition d'etat de module est-elle legale ?"
 *
 * Ce fichier expose uniquement des fonctions pures d'aide.
 * Il ne modifie aucun etat.
 * Il ne produit aucun effet de bord.
 * Il ne connait pas Module, ModuleRegistry ni ModuleManager.
 *
 * Transitions autorisees :
 *   CREATED     → INITIALIZED
 *   INITIALIZED → STARTING
 *   STARTING    → RUNNING
 *   RUNNING     → STOPPING
 *   STOPPING    → STOPPED
 *   STOPPED     → DISPOSED
 *   * (tout etat sauf DISPOSED) → ERROR
 */

import { MODULE_STATES } from './ModuleState.js'

// ─── Table des transitions ────────────────────────────────────────────────────

/** @type {Record<string, string[]>} */
const ALLOWED_TRANSITIONS = Object.freeze({
  [MODULE_STATES.CREATED]     : [MODULE_STATES.INITIALIZED, MODULE_STATES.ERROR],
  [MODULE_STATES.INITIALIZED] : [MODULE_STATES.STARTING,    MODULE_STATES.ERROR],
  [MODULE_STATES.STARTING]    : [MODULE_STATES.RUNNING,     MODULE_STATES.ERROR],
  [MODULE_STATES.RUNNING]     : [MODULE_STATES.STOPPING,    MODULE_STATES.ERROR],
  [MODULE_STATES.STOPPING]    : [MODULE_STATES.STOPPED,     MODULE_STATES.ERROR],
  [MODULE_STATES.STOPPED]     : [MODULE_STATES.DISPOSED,    MODULE_STATES.ERROR],
  [MODULE_STATES.ERROR]       : [MODULE_STATES.DISPOSED],
  [MODULE_STATES.DISPOSED]    : [],
})

// ─── Fonctions pures ─────────────────────────────────────────────────────────

/**
 * Indique si la transition de `from` vers `to` est une transition legale.
 *
 * @param {string} from - Etat actuel du module.
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
 * @param {string} from - Etat actuel du module.
 * @returns {string[]} Liste des etats cibles accessibles.
 */
export function getAllowedTransitions(from) {
  return ALLOWED_TRANSITIONS[from] ?? []
}
