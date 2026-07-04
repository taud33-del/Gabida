/**
 * types/Decision.js
 *
 * Produit par  : decision
 * Consommé par : prompt, memoire
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
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
 *   [obligatoire] Résumé lisible en langage naturel du raisonnement.
 *   Doit expliquer pourquoi cette décision a été prise, pas comment elle a été calculée.
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
 *   Formulé en langage naturel. Ne décrit pas une action mais une intention.
 *   Exemple : "Regagner la confiance du joueur" ou "Maintenir une distance prudente".
 *
 * @property {string} attitude
 *   [obligatoire] Manière d'être adoptée pour ce tour : ton, posture, degré d'ouverture.
 *   Formulé en langage naturel. Transmis tel quel au module prompt.
 *   Exemple : "Chaleureux mais avec une réserve perceptible".
 *
 * @property {string} directionNarrative
 *   [obligatoire] Orientation choisie pour faire progresser l'aventure naturellement.
 *   Ne dicte pas le texte de la réponse — oriente seulement la dynamique narrative.
 *   Exemple : "Introduire un élément de passé" ou "Laisser le joueur faire le prochain pas".
 *
 * @property {Justification} justification
 *   [obligatoire] Trace complète des critères et axiomes ayant conduit à cette décision.
 */
