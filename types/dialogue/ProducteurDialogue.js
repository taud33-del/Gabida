/**
 * @typedef {object} ProducteurDialogue
 *
 * @property {(contexte: import('./ContexteProjectionDialogue.js').ContexteProjectionDialogue) => Promise<import('./ResultatGeneration.js').ResultatGeneration>} produire
 * Produit un résultat de génération normalisé via une EntreeGeneration construite
 * à partir d'un contexte de projection.
 */
