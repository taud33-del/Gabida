/**
 * core/registry/RegistryValidator.js
 *
 * Responsabilite unique : valider les entrees du registre de services.
 *
 * Question : "Cette entree est-elle valide pour le registre ?"
 *
 * Ce fichier expose uniquement des fonctions pures.
 * Il ne modifie aucun etat.
 * Il ne produit aucun effet de bord.
 * Il ne connait pas ServiceRegistry ni ServiceDescriptor.
 *
 * Les fonctions validateX() lancent une erreur typee si la valeur est invalide.
 * Les fonctions isValidX() retournent un boolean sans lancer d'erreur.
 */

import { REGISTRATION_TYPES }    from './RegistrationTypes.js'
import {
  InvalidRegistrationError,
  InvalidFactoryError,
}                                from './RegistryError.js'

// ─── Fonctions de validation (lancent des erreurs) ────────────────────────────

/**
 * Valide qu'un nom de service est une chaine non vide.
 *
 * @param {unknown} name
 * @returns {void}
 * @throws {InvalidRegistrationError}
 */
export function validateServiceName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new InvalidRegistrationError(
      `Le nom de service doit etre une chaine non vide, recu : ${typeof name}`,
      name,
    )
  }
}

/**
 * Valide qu'un type d'enregistrement est un REGISTRATION_TYPES connu.
 *
 * @param {unknown} type
 * @returns {void}
 * @throws {InvalidRegistrationError}
 */
export function validateRegistrationType(type) {
  const valid = Object.values(REGISTRATION_TYPES)
  if (!valid.includes(type)) {
    throw new InvalidRegistrationError(
      `Type d'enregistrement inconnu : "${type}". Valeurs attendues : ${valid.join(', ')}`,
      type,
    )
  }
}

/**
 * Valide qu'une factory est une fonction.
 *
 * @param {unknown} factory
 * @returns {void}
 * @throws {InvalidFactoryError}
 */
export function validateFactory(factory) {
  if (typeof factory !== 'function') {
    throw new InvalidFactoryError(factory)
  }
}

// ─── Fonctions de test (retournent un boolean) ────────────────────────────────

/**
 * Indique si un nom de service est valide.
 *
 * @param {unknown} name
 * @returns {boolean}
 */
export function isValidServiceName(name) {
  return typeof name === 'string' && name.trim().length > 0
}

/**
 * Indique si un type d'enregistrement est valide.
 *
 * @param {unknown} type
 * @returns {boolean}
 */
export function isValidRegistrationType(type) {
  return Object.values(REGISTRATION_TYPES).includes(type)
}

/**
 * Indique si une factory est valide.
 *
 * @param {unknown} factory
 * @returns {boolean}
 */
export function isValidFactory(factory) {
  return typeof factory === 'function'
}
