/**
 * constants/ImportancesMemoire.js
 *
 * Seuils et valeurs d'importance utilises par memoire/ pour la selection,
 * la protection et l'oubli des souvenirs.
 *
 * Aucune logique. Aucune fonction. Uniquement des constantes exportees.
 *
 * Usage :
 *   - IMPORTANCES_MEMOIRE.SEUIL_PROTECTION   → protection inconditionnelle d'un souvenir
 *   - IMPORTANCES_MEMOIRE.IMPORTANCE_MENSONGE → importance de base d'un mensonge detecte
 *   - IMPORTANCES_MEMOIRE.AMPLIFICATION_TENSION → multiplicateur en moment de tension
 */

/**
 * @readonly
 * @enum {number}
 */
export const IMPORTANCES_MEMOIRE = Object.freeze({
  SEUIL_PROTECTION        : 0.80,
  SEUIL_RETENTION_PROMPT  : 0.50,

  IMPORTANCE_PROMESSE     : 0.85,
  IMPORTANCE_MENSONGE     : 0.90,
  IMPORTANCE_CONFIDENCE   : 0.70,
  IMPORTANCE_PROVOCATION  : 0.65,
  IMPORTANCE_DECISION     : 0.75,
  IMPORTANCE_EVENEMENT    : 0.60,

  AMPLIFICATION_TENSION   : 1.20,
  AMPLIFICATION_EPILOGUE  : 1.10,
})
