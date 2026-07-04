/**
 * types/Evenement.js
 *
 * Produit par  : analyse
 * Consommé par : influences, ressenti, decision, memoire
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * Constantes utilisées :
 *   - INTENTIONS       (constants/Intentions.js)      → Evenement.intention
 *   - MOMENTS_NARRATIFS (constants/MomentsNarratifs.js) → ContexteEvenement.moment
 */

/**
 * @typedef {object} ContexteEvenement
 *
 * Situation narrative au moment où l'événement est vécu.
 * Renseigné par le module analyse à partir des fiches et de l'état courant.
 *
 * @property {string|null} lieu
 *   [optionnel] Lieu de la scène tel qu'identifiable dans le message ou l'état.
 *   Null si le lieu est inconnu ou non pertinent pour ce tour.
 *
 * @property {string} moment
 *   [obligatoire] Stade narratif de l'aventure au moment de l'événement.
 *   Valeurs : MOMENTS_NARRATIFS.OUVERTURE | .DEVELOPPEMENT | .TENSION | .RESOLUTION | .EPILOGUE
 *   Voir constants/MomentsNarratifs.js.
 *   NOTE ARCHITECTURE : cette liste est provisoire — validation requise.
 */

/**
 * @typedef {object} Evenement
 *
 * Qualification du message joueur en tant qu'événement vécu par le personnage.
 * Ce n'est pas une réponse — c'est une lecture de ce qui vient de se passer.
 * Toutes les propriétés sont obligatoires sauf mention contraire.
 *
 * @property {string} intention
 *   [obligatoire] Intention dominante détectée dans le message du joueur.
 *   Valeurs : INTENTIONS.QUESTION | .CONFIDENCE | .PROVOCATION | .DEMANDE | .OBSERVATION | .SILENCE
 *   Voir constants/Intentions.js.
 *   NOTE ARCHITECTURE : cette taxonomie est provisoire — validation requise avant implémentation.
 *
 * @property {string[]} criteresConernes
 *   [obligatoire] Identifiants des critères de fiches directement concernés par cet événement.
 *   Tableau non vide. Chaque identifiant correspond à un critère défini dans une fiche.
 *   Exemple : ['personnalite.curiosite', 'relation.confiance']
 *
 * @property {string[]} elementsImportants
 *   [obligatoire] Éléments notables extraits du message joueur.
 *   Peut être un tableau vide si le message ne contient aucun élément notable.
 *   Exemples : noms propres, promesses, mensonges, aveux, refus explicites.
 *
 * @property {ContexteEvenement} contexte
 *   [obligatoire] Situation narrative au moment où l'événement se produit.
 */
