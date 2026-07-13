/**
 * types/ReponseIA.js
 *
 * Produit par  : api
 * Consommé par : memoire, core
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 */

/**
 * @typedef {object} MetaTransport
 *
 * Métadonnées techniques du transport LLM.
 * Ne contient aucune donnée narrative.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} provider
 *   [obligatoire] Identifiant opaque du provider LLM utilisé.
 *   Défini par le registre des providers dans api/. Exemple : 'openai', 'anthropic'.
 *
 * @property {number} tokensEntree
 *   [obligatoire] Nombre de tokens envoyés au LLM pour ce tour.
 *   Entier positif ou nul. Utilisé pour la traçabilité et la limite de contexte.
 *
 * @property {number} tokensSortie
 *   [obligatoire] Nombre de tokens reçus du LLM pour ce tour.
 *   Entier strictement positif si la requête a réussi.
 *
 * @property {number} dureeMs
 *   [obligatoire] Durée du transport aller-retour en millisecondes.
 *   Entier positif. Utilisé pour la traçabilité — non utilisé dans les calculs du cycle.
 */

/**
 * @typedef {object} ReponseIA
 *
 * Réponse structurée reçue du LLM après envoi du Prompt.
 * L'adaptateur provider valide le contrat canonique avant de construire ce type.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} action
 *   [obligatoire] Action narrative produite par le personnage.
 *
 * @property {string} dialogue
 *   [obligatoire] Paroles prononcées par le personnage.
 *
 * @property {MetaTransport} meta
 *   [obligatoire] Métadonnées techniques du transport pour ce tour.
 */
