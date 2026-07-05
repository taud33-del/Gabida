/**
 * api/ProviderError.js
 *
 * Responsabilite unique : definir les erreurs typees du registre de providers IA.
 *
 * Question : "Quelle erreur s'est produite dans le ProviderRegistry ?"
 *
 * Toutes les erreurs du registre de providers sont typees et nommees.
 * Aucune erreur brute ne traverse les frontieres du ProviderRegistry.
 * Aucune logique. Declarations uniquement.
 *
 * Ces erreurs restent confinees a api/ — la seule couche autorisee a connaitre
 * les providers IA.
 */

// ─── Erreur de base ───────────────────────────────────────────────────────────

export class ProviderError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'ProviderError'
  }
}

// ─── Erreurs specifiques ──────────────────────────────────────────────────────

export class ProviderAlreadyRegisteredError extends ProviderError {
  /** @param {string} name */
  constructor(name) {
    super(`Provider deja enregistre : "${name}"`)
    this.name         = 'ProviderAlreadyRegisteredError'
    this.providerName = name
  }
}

export class ProviderNotFoundError extends ProviderError {
  /** @param {string} name */
  constructor(name) {
    super(`Provider introuvable : "${name}"`)
    this.name         = 'ProviderNotFoundError'
    this.providerName = name
  }
}

export class InvalidProviderError extends ProviderError {
  /**
   * @param {string}  name
   * @param {unknown} value
   */
  constructor(name, value) {
    super(`L'adaptateur du provider "${name}" doit etre une fonction, recu : ${typeof value}`)
    this.name         = 'InvalidProviderError'
    this.providerName = name
    this.value        = value
  }
}
