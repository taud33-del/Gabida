/**
 * core/events/EventValidator.js
 *
 * Responsabilite unique : valider les entrees du bus d'evenements.
 *
 * Question : "Cette entree est-elle valide pour le bus d'evenements ?"
 *
 * Ce fichier expose uniquement des fonctions pures.
 * Il ne modifie aucun etat.
 * Il ne produit aucun effet de bord.
 * Il ne connait pas EventBus ni EventSubscription.
 *
 * Les fonctions validateX() lancent une erreur typee si la valeur est invalide.
 * Les fonctions isValidX() retournent un boolean sans lancer d'erreur.
 */

import {
  InvalidEventNameError,
  InvalidCallbackError,
} from './EventError.js'

// ─── Fonctions de validation (lancent des erreurs) ────────────────────────────

/**
 * Valide qu'un nom d'evenement est une chaine non vide.
 *
 * @param {unknown} name
 * @returns {void}
 * @throws {InvalidEventNameError}
 */
export function validateEventName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidEventNameError(name)
  }
}

/**
 * Valide qu'un callback est une fonction.
 *
 * @param {unknown} callback
 * @returns {void}
 * @throws {InvalidCallbackError}
 */
export function validateCallback(callback) {
  if (typeof callback !== 'function') {
    throw new InvalidCallbackError(callback)
  }
}

// ─── Fonctions de test (retournent un boolean) ────────────────────────────────

/**
 * Indique si un nom d'evenement est valide.
 *
 * @param {unknown} name
 * @returns {boolean}
 */
export function isValidEventName(name) {
  return typeof name === 'string' && name.trim().length > 0
}

/**
 * Indique si un callback est valide.
 *
 * @param {unknown} callback
 * @returns {boolean}
 */
export function isValidCallback(callback) {
  return typeof callback === 'function'
}
