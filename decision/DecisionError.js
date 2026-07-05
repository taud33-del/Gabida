/**
 * decision/DecisionError.js
 *
 * Responsabilite unique : declarer les erreurs typees du module decision.
 *
 * Le module decision est un module metier pur : il n'importe jamais core/.
 * Ces erreurs sont donc locales au module et n'ont aucune dependance.
 *
 * Aucune logique au-dela de la construction d'erreur. Aucun effet de bord.
 */

// ─── Base ─────────────────────────────────────────────────────────────────────

export class DecisionError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message)
    this.name = 'DecisionError'
  }
}

// ─── Erreurs specifiques ──────────────────────────────────────────────────────

/**
 * Levee quand le Ressenti recu est absent ou malforme
 * (dominants absents ou de longueur differente de 3).
 */
export class InvalidRessentiError extends DecisionError {
  /** @param {string} raison -- Description de la non-conformite */
  constructor(raison) {
    super(`decision.computeDecision : Ressenti invalide — ${raison}.`)
    this.name = 'InvalidRessentiError'
  }
}

/**
 * Levee quand les fiches necessaires a la decision sont absentes.
 */
export class MissingFichesError extends DecisionError {
  constructor() {
    super('decision.computeDecision : fiches absentes — identite requise.')
    this.name = 'MissingFichesError'
  }
}
