/**
 * api/ProviderRegistry.js
 *
 * Responsabilite unique : inventorier les adaptateurs de providers IA.
 *
 * Question : "Quel adaptateur repond au nom d'un provider ?"
 *
 * Le ProviderRegistry est un simple inventaire nom -> adaptateur. Il n'appelle
 * jamais un provider, ne construit aucun prompt, ne normalise aucune reponse et
 * ne gere aucune cle API : ces roles restent ceux de callProvider (api/index.js).
 *
 * Il confine la connaissance des providers a la couche api/, seul module autorise
 * a les connaitre. Le noyau (core/, Runtime) ignore totalement son existence.
 *
 * Semantique stricte (contrat definitif) :
 *   - register(name, provider) leve si le nom est deja enregistre (aucun
 *     ecrasement silencieux) et si l'adaptateur n'est pas une fonction.
 *   - get(name) leve si le provider est absent (jamais de retour undefined).
 *
 * Aucune dependance sur le Runtime, le noyau ou un provider concret.
 */

import {
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
  InvalidProviderError,
} from './ProviderError.js'

// ─── ProviderRegistry ─────────────────────────────────────────────────────────

export class ProviderRegistry {
  constructor() {
    /** @type {Map<string, import('./index.js').Adaptateur>} */
    this._providers = new Map()
  }

  /**
   * Enregistre un adaptateur de provider sous un nom stable.
   *
   * @param {string} name
   * @param {import('./index.js').Adaptateur} provider
   * @returns {void}
   * @throws {InvalidProviderError}            -- si provider n'est pas une fonction
   * @throws {ProviderAlreadyRegisteredError}  -- si le nom est deja enregistre
   */
  register(name, provider) {
    if (typeof provider !== 'function') {
      throw new InvalidProviderError(name, provider)
    }
    if (this._providers.has(name)) {
      throw new ProviderAlreadyRegisteredError(name)
    }
    this._providers.set(name, provider)
  }

  /**
   * Retourne l'adaptateur enregistre sous ce nom.
   *
   * @param {string} name
   * @returns {import('./index.js').Adaptateur}
   * @throws {ProviderNotFoundError} -- si aucun provider n'est enregistre sous ce nom
   */
  get(name) {
    const provider = this._providers.get(name)
    if (!provider) {
      throw new ProviderNotFoundError(name)
    }
    return provider
  }

  /**
   * Indique si un provider est enregistre sous ce nom.
   *
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._providers.has(name)
  }

  /**
   * Retourne les noms des providers enregistres, dans leur ordre d'insertion.
   *
   * @returns {string[]}
   */
  list() {
    return Array.from(this._providers.keys())
  }
}
