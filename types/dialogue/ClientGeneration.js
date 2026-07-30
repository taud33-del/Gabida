/**
 * @typedef {object} ClientGeneration
 *
 * @property {(entree: import('./EntreeGeneration.js').EntreeGeneration) => Promise<import('./ResultatGeneration.js').ResultatGeneration>} generer
 * Produit un résultat normalisé à partir d'une entrée canonique.
 */
