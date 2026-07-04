/**
 * types/FiltreRelationnel.js
 *
 * Produit par  : influences
 * Consomme par : ressenti uniquement
 *
 * FiltreRelationnel est une donnee interne du cycle.
 * Il ne traverse pas la frontiere vers decision/.
 * decision/ recoit Ressenti -- jamais FiltreRelationnel.
 *
 * Aucune logique. Aucune dependance. Aucune connaissance des modules.
 *
 * Constantes utilisees :
 *   - SOURCES_INFLUENCE (constants/SourcesInfluence.js) → InfluenceActive.source
 *   - TONALITES_FILTRE  (constants/TonalitesFiltre.js)  → SyntheseFiltre.tonalite
 */

/**
 * @typedef {object} InfluenceActive
 *
 * Une influence individuelle active ce tour, issue d'une source unique.
 * Les influences sont toujours cumulatives -- elles ne s'annulent pas (Axiome 3).
 * Elles ne sont jamais des emotions, ni des jauges, ni des objectifs.
 *
 * @property {string} source
 *   [obligatoire] Origine de cette influence. Valeur issue de SOURCES_INFLUENCE.
 *   Voir constants/SourcesInfluence.js.
 *   - SOURCES_INFLUENCE.CRITERE  : issue directement d'une valeur de critere dans une fiche.
 *   - SOURCES_INFLUENCE.SOUVENIR : issue d'un souvenir de la memoire vecue.
 *   - SOURCES_INFLUENCE.AXIOME   : issue de l'application d'un axiome Gabida.
 *
 * @property {string} cibleId
 *   [obligatoire] Identifiant du critere de la fiche que cette influence affecte.
 *   Format : identifiant de critere tel que defini dans la fiche personnage.
 *
 * @property {number} poids
 *   [obligatoire] Poids relatif de cette influence dans la fusion globale.
 *   Valeur normalisee entre 0 et 1 inclus. La somme des poids n'est pas
 *   necessairement egale a 1 -- la normalisation est faite lors de la fusion.
 *
 * @property {string} raison
 *   [obligatoire] Explication lisible en langage naturel.
 *   Justifie pourquoi cette influence est active ce tour (Axiome 19).
 *   Ne doit jamais etre vide.
 */

/**
 * @typedef {object} SyntheseFiltre
 *
 * Vue consolidee du filtre relationnel, transmise a ressenti/.
 * Resume de haut niveau calcule a partir de la fusion des influences actives.
 *
 * @property {string} tonalite
 *   [obligatoire] Tonalite relationnelle dominante ce tour. Valeur issue de TONALITES_FILTRE.
 *   Voir constants/TonalitesFiltre.js.
 *   Reflete la disposition generale du personnage envers le joueur.
 *
 * @property {number} intensite
 *   [obligatoire] Intensite globale du filtre.
 *   Valeur normalisee entre 0 et 1 inclus.
 *   0 = filtre neutre (aucune influence notable), 1 = filtre maximal.
 *
 * @property {string} critereMoteur
 *   [obligatoire] Identifiant du critere portant le poids le plus eleve ce tour.
 *   Indique quelle dimension de la relation est determinante pour le ressenti.
 */

/**
 * @typedef {object} FiltreRelationnel
 *
 * Resultat de la fusion de toutes les influences actives du tour.
 * Represente la maniere dont le personnage percoit le joueur a cet instant.
 *
 * Ce type est la sortie de influences/ et l'entree de ressenti/.
 * Il n'est jamais transmis a decision/.
 *
 * Ce n'est pas l'etat emotionnel du personnage.
 * C'est le filtre a travers lequel ressenti/ calcule son interpretation.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {InfluenceActive[]} influences
 *   [obligatoire] Liste des influences actives fusionnees, ordonnees par poids decroissant.
 *   Ne doit pas etre vide : au minimum une influence est toujours presente.
 *
 * @property {SyntheseFiltre} synthese
 *   [obligatoire] Vue consolidee a destination de ressenti/ uniquement.
 *
 * NOTE ARCHITECTURE : la definition exacte des 10 influences (Carnet 6)
 * necessite une validation. Leur liste precise n'est pas encore documentee.
 */