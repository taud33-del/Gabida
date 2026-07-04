/**
 * sauvegarde/adapters/fichier.js
 *
 * Adaptateur de stockage de reference — systeme de fichiers Node.js.
 *
 * Chaque session est stockee dans un fichier JSON individuel.
 * Repertoire par defaut : .gabida-sessions/ (configurable via baseDir).
 * Un fichier par session : <baseDir>/<sessionId>.json
 *
 * Interface implementee : StorageAdapter
 *   - save(sessionId, donnees)  → ecrit <baseDir>/<sessionId>.json
 *   - load(sessionId)           → lit   <baseDir>/<sessionId>.json ou null
 *   - delete(sessionId)         → supprime le fichier (silencieux si absent)
 *   - list()                    → lit les meta de tous les fichiers .json
 *
 * Usage :
 *   import { creerAdaptateurFichier } from './sauvegarde/adapters/fichier.js'
 *   import { registerStorageAdapter } from './sauvegarde/index.js'
 *
 *   registerStorageAdapter('fichier', creerAdaptateurFichier('./mes-sessions'))
 *
 * Ce module ne contient aucune logique metier.
 * Il ne connait pas la structure de EtatSauvegarde — il manipule uniquement des chaines.
 */

import { promises as fs } from 'node:fs'
import { join }           from 'node:path'

const BASE_DIR_DEFAUT = '.gabida-sessions'

/**
 * creerAdaptateurFichier(baseDir)
 *
 * Cree et retourne un StorageAdapter base sur le systeme de fichiers.
 *
 * @param {string} [baseDir] -- Repertoire de base. Defaut : '.gabida-sessions'.
 * @returns {import('../../types/Sauvegarde.js').StorageAdapter}
 */
export function creerAdaptateurFichier(baseDir = BASE_DIR_DEFAUT) {
  /**
   * Retourne le chemin complet du fichier de session.
   *
   * @param {string} sessionId
   * @returns {string}
   */
  function cheminFichier(sessionId) {
    return join(baseDir, `${sessionId}.json`)
  }

  /**
   * Assure que le repertoire de base existe.
   *
   * @returns {Promise<void>}
   */
  async function assureRepertoire() {
    await fs.mkdir(baseDir, { recursive: true })
  }

  return {
    /**
     * Ecrit les donnees sous <baseDir>/<sessionId>.json.
     * Cree le repertoire si necessaire.
     *
     * @param {string} sessionId
     * @param {string} donnees
     * @returns {Promise<void>}
     */
    async save(sessionId, donnees) {
      await assureRepertoire()
      await fs.writeFile(cheminFichier(sessionId), donnees, 'utf8')
    },

    /**
     * Lit le fichier de la session. Retourne null si absent.
     *
     * @param {string} sessionId
     * @returns {Promise<string|null>}
     */
    async load(sessionId) {
      try {
        return await fs.readFile(cheminFichier(sessionId), 'utf8')
      } catch (e) {
        if (e.code === 'ENOENT') return null
        throw e
      }
    },

    /**
     * Supprime le fichier. Silencieux si absent.
     *
     * @param {string} sessionId
     * @returns {Promise<void>}
     */
    async delete(sessionId) {
      try {
        await fs.unlink(cheminFichier(sessionId))
      } catch (e) {
        if (e.code !== 'ENOENT') throw e
      }
    },

    /**
     * Liste les sessions disponibles en lisant les metadonnees de chaque fichier.
     * Ne charge pas les etats complets.
     *
     * @returns {Promise<import('../../types/Sauvegarde.js').SessionResume[]>}
     */
    async list() {
      let fichiers
      try {
        fichiers = await fs.readdir(baseDir)
      } catch (e) {
        if (e.code === 'ENOENT') return []
        throw e
      }

      const resumes = []
      for (const fichier of fichiers) {
        if (!fichier.endsWith('.json')) continue
        try {
          const contenu = await fs.readFile(join(baseDir, fichier), 'utf8')
          const parsed  = JSON.parse(contenu)
          if (parsed?.meta) {
            resumes.push({
              sessionId     : parsed.meta.sessionId,
              tourCourant   : parsed.etat?.tourCourant ?? 0,
              savedAt       : parsed.meta.savedAt,
              formatVersion : parsed.meta.formatVersion,
              engineVersion : parsed.meta.engineVersion,
            })
          }
        } catch {
          // Fichier corrompu — ignore dans la liste
        }
      }

      return resumes
    },
  }
}
