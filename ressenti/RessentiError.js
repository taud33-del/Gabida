/**
 * ressenti/RessentiError.js
 *
 * Responsabilite unique : declarer les erreurs typees du module ressenti.
 *
 * Le module ressenti est un module metier pur : il n'importe jamais core/.
 * Ces erreurs sont donc locales au module et n'ont aucune dependance.
 *
 * Aucune logique au-dela de la construction d'erreur. Aucun effet de bord.
 */

// ─── Base ─────────────────────────────────────────────────────────────────────

export class RessentiError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'RessentiError'
  }
}

// ─── Erreurs specifiques ──────────────────────────────────────────────────────

/**
 * Levee quand le FiltreRelationnel recu est absent ou malforme
 * (influences vide/absente, ou synthese absente).
 */
export class InvalidFiltreRelationnelError extends RessentiError {
  /** @param {string} raison -- Description de la non-conformite */
  constructor(raison) {
    super(`ressenti.computeRessenti : FiltreRelationnel invalide — ${raison}.`)
    this.name = 'InvalidFiltreRelationnelError'
  }
}
