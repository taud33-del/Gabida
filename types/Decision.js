/**
 * types/Decision.js
 *
 * Produit par  : decision
 * Consommé par : prompt, memoire
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * IMPORTANT (Sprint 24) : objectifImmediat / attitude / directionNarrative sont
 * des IDENTIFIANTS stables issus des constantes du moteur — jamais du langage
 * naturel. La mise en langage appartient exclusivement au module prompt/
 * (séparation cognition ↔ langage, Axiome 17).
 *
 * Constantes utilisées :
 *   - OBJECTIFS             (constants/Objectifs.js)             → Decision.objectifImmediat
 *   - ATTITUDES             (constants/Attitudes.js)             → Decision.attitude
 *   - DIRECTIONS_NARRATIVES (constants/DirectionsNarratives.js)  → Decision.directionNarrative
 */

/**
 * @typedef {object} Justification
 *
 * Trace complète et explicable de la décision prise.
 * Toute évolution doit être explicable (Axiome 19).
 * Toute décision résulte d'un calcul, jamais du hasard (Axiome 20).
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string[]} criteresActifs
 *   [obligatoire] Identifiants des critères de fiches ayant pesé dans la décision ce tour.
 *   Tableau non vide — au moins un critère est toujours actif (Axiome 4).
 *
 * @property {number[]} axiomesAppliques
 *   [obligatoire] Numéros (1–20) des axiomes Gabida appliqués ce tour.
 *   Tableau non vide — au moins un axiome s'applique toujours.
 *
 * @property {string} explication
 *   [obligatoire] Trace lisible du raisonnement, destinée à l'audit/debug — jamais au LLM.
 *   Résume les identifiants retenus, les critères actifs et les axiomes appliqués.
 *   Ne doit jamais être vide.
 */

/**
 * @typedef {object} Decision
 *
 * Décision du personnage pour ce tour.
 * Répond à la question : "Que dois-je faire ?"
 *
 * La décision n'est jamais aléatoire ni dictée par un scénario figé.
 * Elle est toujours le résultat de l'identité du personnage, du ressenti et du contexte.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} objectifImmediat
 *   [obligatoire] Ce que le personnage cherche à accomplir ce tour.
 *   Identifiant stable issu de OBJECTIFS — décrit une intention, pas une action.
 *   Voir constants/Objectifs.js. Exemple : OBJECTIFS.RENFORCER_RELATION ('renforcer_relation').
 *
 * @property {string} attitude
 *   [obligatoire] Manière d'être adoptée pour ce tour : ton, posture, degré d'ouverture.
 *   Identifiant stable issu de ATTITUDES, transmis tel quel au module prompt.
 *   Voir constants/Attitudes.js. Exemple : ATTITUDES.RESERVEE ('reservee').
 *
 * @property {string} directionNarrative
 *   [obligatoire] Orientation choisie pour faire progresser l'aventure naturellement.
 *   Identifiant stable issu de DIRECTIONS_NARRATIVES — oriente la dynamique, ne dicte pas le texte.
 *   Voir constants/DirectionsNarratives.js. Exemple : DIRECTIONS_NARRATIVES.LAISSER_INITIATIVE ('laisser_initiative').
 *
 * @property {Justification} justification
 *   [obligatoire] Trace complète des critères et axiomes ayant conduit à cette décision.
 */
