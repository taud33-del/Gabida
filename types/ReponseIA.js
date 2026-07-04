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
 * Réponse brute reçue du LLM après envoi du Prompt.
 * Ce type ne contient aucune interprétation — uniquement le texte brut et les métadonnées de transport.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} texte
 *   [obligatoire] Texte brut produit par le LLM.
 *   Ne doit pas être vide si le transport a réussi.
 *   Aucune interprétation, aucun nettoyage appliqué à ce stade.
 *
 * @property {MetaTransport} meta
 *   [obligatoire] Métadonnées techniques du transport pour ce tour.
 */
