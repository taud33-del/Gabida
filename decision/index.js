/**
 * decision/index.js
 *
 * Responsabilite unique : determiner la decision du personnage pour ce tour.
 *
 * Role (source : Cycle valide v1.0 — etape 6) :
 *   - Repondre a la question : "Que dois-je faire ?"
 *   - Choisir l'objectif immediat du personnage.
 *   - Choisir son attitude pour ce tour.
 *   - Determiner la direction narrative.
 *
 * Ordre dans le cycle : Analyse -> Influences -> Ressenti -> Decision
 *
 * La decision depend uniquement de :
 *   - L'identite du personnage (fiches).
 *   - L'evenement vecu (Evenement).
 *   - Le ressenti calcule (Ressenti) — seule entree psychologique autorisee.
 *   - L'etat courant de la session.
 *
 * FiltreRelationnel n'est PAS une entree de ce module.
 * Les influences sont absorbees par ressenti/ avant d'atteindre decision/.
 * Elles restent disponibles pour debug, tests et tracabilite — jamais ici.
 *
 * Jamais d'un scenario fige.
 *
 * Axiome 4  : Aucune decision ne repose sur un seul critere.
 * Axiome 10 : La relation est toujours prioritaire.
 * Axiome 18 : La coherence est plus importante que la variete.
 * Axiome 20 : Chaque reponse est le resultat d'un calcul, jamais du hasard.
 */

/**
 * computeDecision(evenement, ressenti, fiches, etat)
 *
 * Determine la decision du personnage pour ce tour.
 * Repond a la question : "Que dois-je faire ?"
 * Retourne l'objectif immediat, l'attitude et la direction narrative choisie.
 *
 * La decision n'est jamais aleatoire et jamais dictee par un scenario fige.
 * Elle est toujours le resultat de l'identite du personnage, du ressenti et du contexte.
 *
 * Entrees admises :
 *   - evenement : ce que le joueur a dit ou fait ce tour.
 *   - ressenti   : ce que le personnage ressent ce tour (issu de ressenti/).
 *   - fiches     : les 5 fiches validees (identite, valeurs, histoire...).
 *   - etat       : etat courant de la session (memoire vecue, historique, tour).
 *
 * Entrees interdites :
 *   - filtreRelationnel : absorbe par ressenti/ — ne doit jamais etre passe ici.
 *
 * @param {import('../types/Evenement.js').Evenement} evenement
 * @param {import('../types/Ressenti.js').Ressenti} ressenti
 * @param {object} fiches -- Les 5 fiches validees (issues de lecture.loadFiches).
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {import('../types/Decision.js').Decision}
 */
export function computeDecision(evenement, ressenti, fiches, etat) {
  // TODO : implementer
  throw new Error('computeDecision : non implemente')
}