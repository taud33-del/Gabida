/**
 * ressenti/index.js
 *
 * Responsabilite unique : calculer le ressenti du personnage pour ce tour.
 *
 * Le module repond a la question : "Que ressent le personnage ?"
 *
 * Distinction fondamentale (source : langage interne Gabida v1.0) :
 *   - Une emotion est un etat brut issu de la fiche personnage (defini, nomme, stable).
 *   - Un ressenti est le resultat calcule de ce que le personnage eprouve a cet instant precis,
 *     sous l'effet conjugue de son identite, de l'evenement vecu et du filtre relationnel.
 *
 * Ordre dans le cycle : Analyse -> Influences -> Ressenti -> Decision
 *
 * Ce module recoit FiltreRelationnel et le consomme entierement.
 * Il produit un Ressenti qui remplace FiltreRelationnel dans la suite du cycle.
 * decision/ ne recoit jamais FiltreRelationnel -- il recoit uniquement Ressenti.
 *
 * Responsabilites de ce module :
 *   - Lire FiltreRelationnel et en extraire les informations utiles.
 *   - Croiser avec l'evenement et les traits de personnalite (fiches).
 *   - Produire un Ressenti complet et tracable.
 *
 * Ce module ne contient aucune emotion nommee.
 * Les etats emotionnels de reference sont definis par les fiches et les constantes.
 *
 * Axiome 6  : Les valeurs permanentes changent difficilement (personnalite, curiosite...).
 * Axiome 7  : Les etats temporaires changent rapidement (colere, peur, fatigue...).
 * Axiome 8  : Une emotion ne remplace jamais la personnalite.
 * Axiome 19 : Toute evolution doit etre explicable.
 */

/**
 * computeRessenti(evenement, filtreRelationnel, fiches, etat)
 *
 * Calcule le ressenti du personnage pour ce tour.
 *
 * Le ressenti est produit apres les influences — il en est la synthese interpretee.
 * Il constitue la seule entree psychologique transmise a decision/.
 * FiltreRelationnel ne sera plus accessible apres ce module.
 *
 * @param {import('../types/Evenement.js').Evenement} evenement
 * @param {import('../types/FiltreRelationnel.js').FiltreRelationnel} filtreRelationnel
 * @param {object} fiches -- Les 5 fiches validees (issues de lecture.loadFiches).
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {import('../types/Ressenti.js').Ressenti}
 */
export function computeRessenti(evenement, filtreRelationnel, fiches, etat) {
  // TODO : implementer
  throw new Error('computeRessenti : non implemente')
}