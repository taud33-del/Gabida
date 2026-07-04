/**
 * memoire/types.js
 *
 * Types métier du domaine mémoire.
 *
 * Ces types ne circulent pas entre tous les modules.
 * Ils sont propres au domaine `memoire` et utilisés uniquement par :
 *   - memoire/index.js    (producteur)
 *   - sauvegarde/index.js (consommateur — persiste la MemoireVecue via Etat)
 *
 * Ils ne font pas partie du langage inter-modules défini dans types/.
 * Aucune logique. Aucune dépendance externe.
 *
 * Constantes utilisées :
 *   - TYPES_SOUVENIR (constants/TypesSouvenir.js) → Souvenir.type
 */

/**
 * @typedef {object} Souvenir
 *
 * Un souvenir individuel retenu dans la mémoire vécue.
 * Les souvenirs importants priment sur les souvenirs mineurs (Axiome 9).
 * La mémoire modifie progressivement les valeurs (Axiome 5).
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} id
 *   [obligatoire] Identifiant unique et stable du souvenir.
 *   Format libre (ex. : UUID v4). Utilisé pour l'oubli ciblé dans MiseAJourMemoire.
 *
 * @property {string} type
 *   [obligatoire] Origine du souvenir. Valeur issue de TYPES_SOUVENIR.
 *   Voir constants/TypesSouvenir.js.
 *   - TYPES_SOUVENIR.DIALOGUE  : échange verbal notable.
 *   - TYPES_SOUVENIR.EVENEMENT : fait objectif survenu dans l'aventure.
 *   - TYPES_SOUVENIR.DECISION  : choix significatif du joueur ou du personnage.
 *   - TYPES_SOUVENIR.PROMESSE  : engagement exprimé par l'une des parties.
 *   - TYPES_SOUVENIR.MENSONGE  : écart détecté entre ce qui a été dit et la réalité.
 *
 * @property {string} contenu
 *   [obligatoire] Description du souvenir en langage naturel.
 *   Ne doit pas être vide. Formulé du point de vue du personnage.
 *
 * @property {number} importance
 *   [obligatoire] Poids relatif du souvenir, déterminant sa durée de rétention (Axiome 9).
 *   Valeur normalisée entre 0 et 1 inclus.
 *   0 = souvenir mineur (candidate à l'oubli rapide), 1 = souvenir fondateur.
 *
 * @property {number} tour
 *   [obligatoire] Numéro du tour où le souvenir a été créé.
 *   Entier strictement positif. Utilisé pour la gestion de l'ancienneté.
 */

/**
 * @typedef {object} MemoireVecue
 *
 * Mémoire construite et évoluant au fil de l'aventure.
 * Distincte de la mémoire permanente définie par la fiche personnage (non modifiable).
 * Transportée à l'intérieur de Etat.memoireVecue entre les tours.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {Souvenir[]} souvenirs
 *   [obligatoire] Ensemble des souvenirs actuellement retenus, dans l'ordre d'importance décroissante.
 *   Peut être un tableau vide au tout premier tour (aucun souvenir construit).
 */

/**
 * @typedef {object} MiseAJourMemoire
 *
 * Résultat de la mise à jour de la mémoire vécue après un tour.
 * Retourné par memoire.updateMemory à destination de core/sauvegarde.
 * Ne modifie jamais la mémoire permanente.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {Souvenir[]} ajoutes
 *   [obligatoire] Souvenirs nouvellement créés et retenus ce tour.
 *   Peut être un tableau vide si aucun nouveau souvenir n'a été retenu.
 *
 * @property {string[]} oublies
 *   [obligatoire] Identifiants (Souvenir.id) des souvenirs supprimés ce tour.
 *   Peut être un tableau vide si aucun souvenir n'a été oublié.
 *
 * @property {Souvenir[]} conserves
 *   [obligatoire] Souvenirs déjà présents et maintenus sans modification ce tour.
 *   Peut être un tableau vide au premier tour.
 */
