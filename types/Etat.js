/**
 * types/Etat.js
 *
 * Produit/mis à jour par : core, sauvegarde
 * Consommé par : tous les modules
 *
 * Aucune logique. Aucune dépendance. Aucune connaissance des modules.
 *
 * Note : la structure de memoireVecue est définie dans memoire/types.js (type métier).
 * Etat y fait référence structurellement mais ne la possède pas.
 */

/**
 * @typedef {object} MetaSession
 *
 * Métadonnées fixes de la session, renseignées à la création et non modifiées ensuite.
 *
 * @property {number} debutTimestamp
 *   [obligatoire] Horodatage Unix (ms) du début de la session.
 *
 * @property {string} langue
 *   [obligatoire] Code langue utilisé pour cette session.
 *   Format ISO 639-1. Exemple : 'fr', 'en'.
 *   Transmis au module prompt pour orienter la langue de réponse.
 */

/**
 * @typedef {object} Etat
 *
 * État complet d'une session à un instant donné.
 * Objet transversal passé à chaque module du cycle.
 * Mis à jour après chaque tour par core, puis persisté par sauvegarde.
 *
 * L'état ne contient jamais de logique — uniquement des données.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} sessionId
 *   [obligatoire] Identifiant unique et stable de la session.
 *   Identique à PlayerMessage.sessionId tout au long de la session.
 *
 * @property {number} tourCourant
 *   [obligatoire] Numéro du tour en cours au moment de la transmission.
 *   Entier strictement positif. Commence à 1 et incrémenté par core en fin de cycle.
 *
 * @property {object} memoireVecue
 *   [obligatoire] Mémoire construite pendant l'aventure.
 *   Structure définie dans memoire/types.js (MemoireVecue).
 *   Lue par tous les modules, mise à jour uniquement par memoire.
 *
 * @property {MessageHistorique[]} historique
 *   [obligatoire] Historique complet et ordonné de la conversation depuis le début de la session.
 *   Chaque élément est un MessageHistorique (défini dans types/Prompt.js).
 *   Mis à jour par core en fin de cycle. Peut être vide au premier tour.
 *
 * @property {MetaSession} meta
 *   [obligatoire] Métadonnées fixes de la session.
 *   Renseignées à la création par l'application hôte, non modifiées ensuite.
 */

/**
 * @typedef {object} CycleResult
 *
 * Résultat complet d'un tour de cycle.
 * Retourné par core.runCycle à l'application hôte.
 * Toutes les propriétés sont obligatoires.
 *
 * @property {string} action
 *   [obligatoire] Action narrative produite par le personnage pour ce tour.
 *
 * @property {string} dialogue
 *   [obligatoire] Paroles prononcées par le personnage pour ce tour.
 *
 * @property {Etat} etatMisAJour
 *   [obligatoire] Nouvel état complet de la session après ce tour.
 *   Contient la mémoire vécue mise à jour, l'historique augmenté et le tour incrémenté.
 *
 * @property {Justification} evolutionExplicable
 *   [obligatoire] Trace complète de tous les changements survenus ce tour (Axiome 19).
 *   Partage la structure de Justification (définie dans types/Decision.js).
 *   Destiné à l'audit, au debug et à la traçabilité — jamais exposé au LLM.
 */
