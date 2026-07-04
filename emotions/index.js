/**
 * emotions/index.js
 *
 * Responsabilité unique : calculer l'état émotionnel du personnage à chaque tour.
 *
 * Rôle (source : Cycle de Vie étape 4 + Axiomes) :
 *   - Répondre à la question : "Qu'est-ce que je ressens ?"
 *   - Calculer les 3 ressentis dominants du tour.
 *   - Distinguer les états temporaires des traits permanents.
 *
 * Axiome 6  : Les valeurs permanentes changent difficilement (personnalité, curiosité...).
 * Axiome 7  : Les états temporaires changent rapidement (colère, peur, fatigue...).
 * Axiome 8  : Une émotion ne remplace jamais la personnalité.
 * Axiome 19 : Toute évolution doit être explicable.
 *
 * Ce module ne contient aucune émotion nommée.
 * Les émotions sont définies par les fiches.
 */

/**
 * computeEmotions(evenement, fiches, etat)
 *
 * Calcule l'état émotionnel du personnage pour ce tour.
 * Répond à la question : "Qu'est-ce que je ressens ?"
 * Retourne les 3 ressentis dominants, ordonnés par intensité décroissante.
 *
 * @param {object} evenement — Événement vécu (issu de analyse.analyzeEvent).
 * @param {object} fiches    — Les 5 fiches validées.
 * @param {object} etat      — État courant de la session.
 *
 * @returns {EtatEmotionnel}
 *
 * @typedef {object} EtatEmotionnel
 * @property {Ressenti[]} ressentis       — Les 3 ressentis dominants du tour (Axiome 4).
 * @property {object}     etatsTemporaires — États qui montent et redescendent (Axiome 7).
 * @property {object}     traitsPermanents — Traits de personnalité de fond, peu mutables (Axiome 6).
 *
 * @typedef {object} Ressenti
 * @property {string} critereId — Identifiant du critère émotionnel dans la fiche.
 * @property {number} intensite — Intensité calculée pour ce tour.
 */
export function computeEmotions(evenement, fiches, etat) {
  // TODO : implémenter
  throw new Error('computeEmotions : non implémenté')
}
