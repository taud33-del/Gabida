/**
 * types/index.js
 *
 * Langage interne de Gabida — Data Models v1.0
 * Point d'entrée unique. Ce fichier ne définit rien : il réexporte tout.
 *
 * Règles fondamentales :
 *   - Les types sont indépendants des modules, des fiches et des providers.
 *   - Aucun type ne contient de logique.
 *   - Tous les modules importent depuis ici — aucun module n'est propriétaire d'un type de communication.
 *   - Les types métier propres à un domaine (Souvenir, MemoireVecue...) restent dans leur module.
 *
 * Pour importer dans un module :
 *   import { PlayerMessage } from '../types/index.js'   // ou
 *   import { PlayerMessage } from '../types/PlayerMessage.js'
 */

export * from './PlayerMessage.js'
export * from './Evenement.js'
export * from './FiltreRelationnel.js'
export * from './Ressenti.js'
export * from './Decision.js'
export * from './Prompt.js'
export * from './ReponseIA.js'
export * from './Etat.js'
export * from './Sauvegarde.js'
