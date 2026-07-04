/**
 * constants/Versions.js
 *
 * Source de verite unique pour les versions du moteur Gabida.
 *
 * Deux versions distinctes et independantes :
 *
 * ENGINE_VERSION
 *   Version du moteur Gabida (logique, modules, cycle de vie).
 *   Change lorsque des modules evoluent, des interfaces changent
 *   ou des comportements sont modifies.
 *   Conservee dans les sauvegardes a des fins de tracabilite.
 *   N'est PAS utilisee pour decider si une migration est necessaire.
 *
 * FORMAT_VERSION
 *   Version de la structure du fichier de sauvegarde (EtatSauvegarde).
 *   Change uniquement lorsque la forme de l'enveloppe persiste change :
 *   ajout ou suppression d'un champ dans MetaSauvegarde,
 *   restructuration de EtatSauvegarde, changement de format JSON.
 *   C'est CETTE version qui declenche les migrations.
 *
 * Independance des deux versions :
 *   - Le moteur peut passer de 1.2.0 a 1.3.0 sans modifier le format
 *     (ex. : nouveau module ajoute, logique metier amelioree).
 *     → ENGINE_VERSION change, FORMAT_VERSION reste a 1.0.
 *   - Une restructuration du fichier sauvegarde peut intervenir
 *     sans changer la logique du moteur.
 *     → FORMAT_VERSION change, ENGINE_VERSION reste inchangee.
 *
 * Utilisation dans les migrations :
 *   Le pipeline de chargement lit meta.formatVersion dans le fichier persiste.
 *   Si meta.formatVersion !== FORMAT_VERSION, une migration est declenchee.
 *   meta.engineVersion n'est jamais utilise pour la migration — seulement pour l'audit.
 *
 * Aucune logique. Aucune dependance. Constantes uniquement.
 */

/**
 * Version du moteur Gabida.
 * Trace dans MetaSauvegarde pour l'audit et la retrotraçabilite.
 * Ne declenche jamais de migration.
 *
 * @type {string}
 */
export const ENGINE_VERSION = '1.0.0'

/**
 * Version du format de sauvegarde (structure de EtatSauvegarde).
 * Seule version utilisee par le pipeline de migration.
 * Incrementer uniquement lors d'un changement de structure du fichier persiste.
 *
 * @type {string}
 */
export const FORMAT_VERSION = '1.0'
