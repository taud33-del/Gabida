/**
 * types/Ressenti.js
 *
 * Produit par  : ressenti
 * Consomme par : decision, prompt
 *
 * Ressenti est la synthese psychologique du tour.
 * Il remplace FiltreRelationnel a partir de l'etape decision/ :
 * decision/ recoit Ressenti -- jamais FiltreRelationnel.
 *
 * Aucune logique. Aucune dependance. Aucune connaissance des modules.
 *
 * Constantes utilisees :
 *   - ORIGINES_RESSENTI (constants/OriginesRessenti.js) → RessentDominant.origine
 */

/**
 * @typedef {object} RessentDominant
 *
 * Un ressenti individuel dominant pour ce tour.
 * Issu d'un critere emotionnel de la fiche, colore par le filtre relationnel.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {string} critereId
 *   [obligatoire] Identifiant du critere emotionnel dans la fiche personnage.
 *   Doit correspondre a un critere existant dans la fiche du personnage actif.
 *
 * @property {number} intensite
 *   [obligatoire] Intensite de ce ressenti pour ce tour.
 *   Valeur normalisee entre 0 et 1 inclus.
 *   0 = present mais quasi nul, 1 = ressenti maximal.
 *
 * @property {string} origine
 *   [obligatoire] Ce qui a principalement declenche ce ressenti. Valeur issue de ORIGINES_RESSENTI.
 *   Voir constants/OriginesRessenti.js.
 *   - ORIGINES_RESSENTI.EVENEMENT  : declenche par ce que le joueur a dit ou fait.
 *   - ORIGINES_RESSENTI.INFLUENCE  : amplifie ou cree par le filtre relationnel.
 *   - ORIGINES_RESSENTI.TRAIT      : present independamment de l'evenement (fond de personnalite).
 */

/**
 * @typedef {object} EtatCritere
 *
 * Valeur actuelle d'un critere emotionnel du personnage pour ce tour.
 * Utilise pour representer aussi bien les etats temporaires que les traits permanents.
 *
 * @property {string} critereId
 *   [obligatoire] Identifiant du critere dans la fiche personnage.
 *
 * @property {number} valeur
 *   [obligatoire] Valeur actuelle du critere ce tour.
 *   Valeur normalisee entre 0 et 1 inclus.
 */

/**
 * @typedef {object} Ressenti
 *
 * Synthese psychologique du personnage pour ce tour.
 * Produit par ressenti/ a partir de l'evenement et du filtre relationnel.
 * Constitue la seule entree psychologique de decision/.
 *
 * Le ressenti est distinct de l'emotion : il est le resultat d'un calcul, pas un etat brut.
 * Il est produit apres le filtre relationnel -- il en est la synthese interpretee.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {RessentDominant[]} dominants
 *   [obligatoire] Les 3 ressentis les plus intenses du tour, ordonnes par intensite decroissante.
 *   Tableau de longueur exactement 3. Si moins de 3 ressentis sont actifs,
 *   les positions restantes sont remplies avec intensite = 0.
 *
 * @property {EtatCritere[]} etatsTemporaires
 *   [obligatoire] Criteres emotionnels a evolution rapide actifs ce tour (Axiome 7).
 *   Exemples : colere, peur, surprise, joie soudaine.
 *   Peut etre un tableau vide si aucun etat temporaire n'est actif.
 *
 * @property {EtatCritere[]} traitsPermanents
 *   [obligatoire] Criteres de personnalite de fond, peu mutables (Axiome 6).
 *   Toujours presents -- representent l'identite stable du personnage.
 *   Ne doit pas etre vide : un personnage a toujours au moins un trait permanent.
 */