/**
 * types/Prompt.js
 *
 * Produit par  : prompt
 * Consommé par : api
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * Constantes utilisées :
 *   - ROLES_MESSAGE (constants/RolesMessage.js) → MessageHistorique.role
 */

/**
 * @typedef {object} MessageHistorique
 *
 * Un message individuel dans l'historique de la conversation.
 * Format générique, indépendant de tout LLM.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} role
 *   [obligatoire] Rôle de l'émetteur dans la conversation. Valeur issue de ROLES_MESSAGE.
 *   Voir constants/RolesMessage.js.
 *   - ROLES_MESSAGE.USER      : message émis par le joueur.
 *   - ROLES_MESSAGE.ASSISTANT : message émis par le personnage (réponse de l'IA).
 *
 * @property {string} contenu
 *   [obligatoire] Contenu sérialisé du message.
 *   Les réponses assistant utilisent l'objet JSON canonique `action` / `dialogue`.
 */

/**
 * @typedef {object} Prompt
 *
 * Prompt final prêt à être envoyé au LLM.
 * Contient uniquement du texte en langage naturel.
 * Ne contient jamais de valeurs numériques internes, d'identifiants de critères
 * ni de références aux mécaniques du moteur (Spécification §9).
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} systeme
 *   [obligatoire] Bloc système transmis au LLM.
 *   Contient : identité du personnage, règles de comportement, directives de tour.
 *   Ne dévoile pas les mécaniques internes du moteur.
 *
 * @property {MessageHistorique[]} historique
 *   [obligatoire] Historique de la conversation dans l'ordre chronologique.
 *   Peut être un tableau vide au premier tour.
 *   Le message du joueur pour le tour en cours n'est PAS inclus ici —
 *   il est transmis via le champ `instruction`.
 *
 * @property {string} instruction
 *   [obligatoire] Instruction de tour : ce que le personnage doit accomplir dans cette réponse.
 *   Formulé en langage naturel, sans valeurs numériques.
 *   Inclut le message du joueur reformulé comme contexte narratif.
 *
 * NOTE ARCHITECTURE : le format exact de serialisation vers le LLM
 * (system / user / assistant) est défini par le module api — pas par ce type.
 * Validation requise avant implémentation.
 */
