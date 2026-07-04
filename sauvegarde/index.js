/**
 * sauvegarde/index.js
 *
 * Responsabilite unique : persister et restaurer l'etat complet d'une session narrative.
 *
 * Question : "Comment conserver fidelement l'etat du moteur entre deux executions ?"
 *
 * Ce module transforme un Etat en support de persistance, puis restaure cet Etat.
 * Il ne modifie jamais les donnees recues.
 * Il ne contient aucune intelligence metier.
 * Il est entierement independant du support de stockage via un registre d'adaptateurs.
 *
 * Pattern d'extension : meme principe que api/registerProvider.
 * L'application hote enregistre l'adaptateur qu'elle souhaite utiliser.
 * Le moteur ne connait jamais la technologie de persistance.
 *
 * Axiome 13 : Une information n'existe qu'a un seul endroit.
 *             Seules les donnees non-recalculables sont persistees.
 * Axiome 19 : Toute evolution doit etre explicable.
 *             MetaSauvegarde garantit la tracabilite de chaque ecriture.
 *
 * Versionnage :
 *   ENGINE_VERSION et FORMAT_VERSION sont importées depuis constants/Versions.js.
 *   Elles constituent l'unique source de verite pour tout le moteur.
 *
 *   ENGINE_VERSION : version du moteur — tracabilite uniquement, ne declenche pas de migration.
 *   FORMAT_VERSION : version de la structure du fichier sauvegarde — declenche les migrations.
 *
 *   Ces deux versions evoluent independamment :
 *   - Le moteur peut changer sans modifier le format de sauvegarde.
 *   - Le format peut changer sans modifier la logique du moteur.
 *
 * Pipeline de chargement officiel :
 *   lireSupport()
 *   ↓
 *   verifierFormatVersion()   ← etape officielle, separee
 *   ↓
 *   si version != FORMAT_VERSION : appliquerMigration()
 *   ↓
 *   deserialiserEtat()
 *
 * @module sauvegarde
 */

import { ENGINE_VERSION, FORMAT_VERSION } from '../constants/Versions.js'

export { ENGINE_VERSION, FORMAT_VERSION }

// ─── Registre des adaptateurs ─────────────────────────────────────────────────

/** @type {Map<string, import('../types/Sauvegarde.js').StorageAdapter>} */
const _registre = new Map()

// ─── Erreurs ─────────────────────────────────────────────────────────────────

/**
 * Erreur de base du module sauvegarde.
 * Ne pas instancier directement.
 */
export class ErreurSauvegarde extends Error {
  constructor(message) {
    super(message)
    this.name = 'ErreurSauvegarde'
  }
}

/** Adaptateur non enregistre dans le registre. */
export class ErreurAdaptateurAbsent extends ErreurSauvegarde {
  constructor(name) {
    super(`sauvegarde : adaptateur "${name}" non enregistre. Utiliser registerStorageAdapter() d'abord.`)
    this.name = 'ErreurAdaptateurAbsent'
  }
}

/** Session absente du support. */
export class ErreurSessionAbsente extends ErreurSauvegarde {
  constructor(sessionId) {
    super(`sauvegarde : session "${sessionId}" introuvable.`)
    this.name        = 'ErreurSessionAbsente'
    this.sessionId   = sessionId
  }
}

/** Echec de lecture depuis le support. */
export class ErreurLecture extends ErreurSauvegarde {
  constructor(sessionId, cause) {
    super(`sauvegarde : echec de lecture de la session "${sessionId}" : ${cause.message}`)
    this.name      = 'ErreurLecture'
    this.sessionId = sessionId
    this.cause     = cause
  }
}

/** Echec d'ecriture sur le support. */
export class ErreurEcriture extends ErreurSauvegarde {
  constructor(sessionId, cause) {
    super(`sauvegarde : echec d'ecriture de la session "${sessionId}" : ${cause.message}`)
    this.name      = 'ErreurEcriture'
    this.sessionId = sessionId
    this.cause     = cause
  }
}

/** Donnees JSON invalides ou structure incomplete. */
export class ErreurCorruption extends ErreurSauvegarde {
  constructor(sessionId, detail) {
    super(`sauvegarde : donnees corrompues pour la session "${sessionId}" : ${detail}`)
    this.name      = 'ErreurCorruption'
    this.sessionId = sessionId
  }
}

/** Version de format inconnue ou incompatible. */
export class ErreurFormatIncompatible extends ErreurSauvegarde {
  constructor(sessionId, version) {
    super(`sauvegarde : format "${version}" incompatible pour la session "${sessionId}". Version attendue : ${FORMAT_VERSION}.`)
    this.name      = 'ErreurFormatIncompatible'
    this.sessionId = sessionId
    this.version   = version
  }
}

/** Precondition de validation d'entree non respectee. */
export class ErreurValidationSauvegarde extends ErreurSauvegarde {
  constructor(message) {
    super(message)
    this.name = 'ErreurValidationSauvegarde'
  }
}

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * resoudreAdaptateur(adapterName)
 *
 * Retourne l'adaptateur enregistre ou leve ErreurAdaptateurAbsent.
 * Pure apres acces au registre.
 *
 * @param {string} adapterName
 * @returns {import('../types/Sauvegarde.js').StorageAdapter}
 */
function resoudreAdaptateur(adapterName) {
  const adapter = _registre.get(adapterName)
  if (!adapter) throw new ErreurAdaptateurAbsent(adapterName)
  return adapter
}

/**
 * validerEtat(etat)
 *
 * Pure. Verifie la structure minimale d'un Etat avant serialisation.
 * Leve ErreurValidationSauvegarde si invalide.
 *
 * @param {object} etat
 */
function validerEtat(etat) {
  if (!etat || typeof etat !== 'object') {
    throw new ErreurValidationSauvegarde('sauvegarde.validerEtat : etat est absent ou invalide.')
  }
  if (typeof etat.sessionId !== 'string' || etat.sessionId.trim() === '') {
    throw new ErreurValidationSauvegarde('sauvegarde.validerEtat : etat.sessionId est absent ou vide.')
  }
  if (typeof etat.tourCourant !== 'number' || etat.tourCourant < 1) {
    throw new ErreurValidationSauvegarde('sauvegarde.validerEtat : etat.tourCourant est invalide.')
  }
  if (!etat.memoireVecue || !Array.isArray(etat.memoireVecue.souvenirs)) {
    throw new ErreurValidationSauvegarde('sauvegarde.validerEtat : etat.memoireVecue.souvenirs est absent.')
  }
  if (!Array.isArray(etat.historique)) {
    throw new ErreurValidationSauvegarde('sauvegarde.validerEtat : etat.historique est absent.')
  }
  if (!etat.meta || typeof etat.meta !== 'object') {
    throw new ErreurValidationSauvegarde('sauvegarde.validerEtat : etat.meta est absent.')
  }
}

/**
 * validerSessionId(sessionId)
 *
 * Pure. Leve ErreurValidationSauvegarde si sessionId invalide.
 *
 * @param {string} sessionId
 */
function validerSessionId(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new ErreurValidationSauvegarde('sauvegarde : sessionId est absent ou vide.')
  }
}

/**
 * serialiserEtat(etat, savedAt)
 *
 * Pure. Construit EtatSauvegarde et le serialise en JSON.
 * meta.formatVersion et meta.engineVersion sont toujours issues des constantes.
 * Aucune valeur n'est codee en dur.
 *
 * @param {import('../types/Etat.js').Etat} etat
 * @param {number} savedAt -- Horodatage Unix (ms) de l'ecriture.
 * @returns {string} JSON
 */
export function serialiserEtat(etat, savedAt) {
  /** @type {import('../types/Sauvegarde.js').EtatSauvegarde} */
  const enveloppe = {
    meta: {
      engineVersion : ENGINE_VERSION,
      formatVersion : FORMAT_VERSION,
      savedAt,
      sessionId     : etat.sessionId,
    },
    etat,
  }
  return JSON.stringify(enveloppe, null, 2)
}

/**
 * verifierFormatVersion(parsed, sessionId)
 *
 * Pure. Etape officielle du pipeline de chargement.
 * Lit meta.formatVersion et determine si une migration est necessaire.
 *
 * Comportement :
 *   - version == FORMAT_VERSION : retourne parsed inchange.
 *   - version connue dans _migrations : declenche appliquerMigration.
 *   - version inconnue : leve ErreurFormatIncompatible.
 *
 * Note : meta.engineVersion n'est jamais utilise ici — tracabilite uniquement.
 *
 * @param {object} parsed    -- EtatSauvegarde parse (JSON.parse deja effectue).
 * @param {string} sessionId
 * @returns {import('../types/Sauvegarde.js').EtatSauvegarde}
 */
export function verifierFormatVersion(parsed, sessionId) {
  const version = parsed.meta.formatVersion
  if (version === FORMAT_VERSION) return parsed
  if (_migrations.has(version)) return appliquerMigration(parsed, version, sessionId)
  throw new ErreurFormatIncompatible(sessionId, version)
}

/**
 * deserialiserEtat(donneesBrutes, sessionId)
 *
 * Pure. Parse et valide la structure structurelle de EtatSauvegarde.
 * Appelle verifierFormatVersion comme etape separee du pipeline.
 * Leve ErreurCorruption ou ErreurFormatIncompatible si invalide.
 *
 * Pipeline interne :
 *   JSON.parse → validation structure → verifierFormatVersion → retour
 *
 * @param {string} donneesBrutes
 * @param {string} sessionId
 * @returns {import('../types/Sauvegarde.js').EtatSauvegarde}
 */
export function deserialiserEtat(donneesBrutes, sessionId) {
  let parsed
  try {
    parsed = JSON.parse(donneesBrutes)
  } catch {
    throw new ErreurCorruption(sessionId, 'JSON invalide.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new ErreurCorruption(sessionId, 'Structure racine invalide.')
  }
  if (!parsed.meta || typeof parsed.meta !== 'object') {
    throw new ErreurCorruption(sessionId, 'Champ "meta" absent.')
  }
  if (!parsed.etat || typeof parsed.etat !== 'object') {
    throw new ErreurCorruption(sessionId, 'Champ "etat" absent.')
  }

  return verifierFormatVersion(parsed, sessionId)
}

/**
 * appliquerMigration(etatSauvegarde, version, sessionId)
 *
 * Pure. Enchaine les migrations connues jusqu'a FORMAT_VERSION.
 * Chaque fonction de migration doit mettre a jour meta.formatVersion
 * dans l'objet retourne pour permettre l'enchainement.
 *
 * @param {object} etatSauvegarde
 * @param {string} version
 * @param {string} sessionId
 * @returns {import('../types/Sauvegarde.js').EtatSauvegarde}
 */
function appliquerMigration(etatSauvegarde, version, sessionId) {
  let courant = etatSauvegarde
  let v       = version

  while (v !== FORMAT_VERSION) {
    const fn = _migrations.get(v)
    if (!fn) throw new ErreurFormatIncompatible(sessionId, v)
    courant = fn(courant)
    v       = courant.meta.formatVersion
  }

  return courant
}

/**
 * Registre des fonctions de migration.
 * Cle : formatVersion source. Valeur : fonction pure (etatSauvegarde) -> etatSauvegarde migre.
 *
 * Vide pour v1.0 — aucune migration definie.
 * Exemple futur : _migrations.set('0.9', migrer_0_9_vers_1_0)
 *
 * Convention pour les fonctions de migration :
 *   - Retourner un nouvel objet (ne pas muter l'entree).
 *   - Mettre a jour meta.formatVersion vers la version cible.
 *   - Ne pas modifier meta.engineVersion (tracabilite de l'ecriture originale).
 *
 * @type {Map<string, (es: object) => object>}
 */
const _migrations = new Map()

// ─── Pipeline saveState ───────────────────────────────────────────────────────

/**
 * ecrireSupport(adapter, sessionId, donnees)
 *
 * Effet de bord isole. Delegue l'ecriture a l'adaptateur.
 * Leve ErreurEcriture si l'adaptateur echoue.
 *
 * @param {import('../types/Sauvegarde.js').StorageAdapter} adapter
 * @param {string} sessionId
 * @param {string} donnees
 */
async function ecrireSupport(adapter, sessionId, donnees) {
  try {
    await adapter.save(sessionId, donnees)
  } catch (e) {
    throw new ErreurEcriture(sessionId, e)
  }
}

// ─── Pipeline loadState ───────────────────────────────────────────────────────

/**
 * lireSupport(adapter, sessionId)
 *
 * Effet de bord isole. Delegue la lecture a l'adaptateur.
 * Leve ErreurSessionAbsente si null, ErreurLecture si throw.
 *
 * @param {import('../types/Sauvegarde.js').StorageAdapter} adapter
 * @param {string} sessionId
 * @returns {Promise<string>}
 */
async function lireSupport(adapter, sessionId) {
  let donnees
  try {
    donnees = await adapter.load(sessionId)
  } catch (e) {
    throw new ErreurLecture(sessionId, e)
  }
  if (donnees === null || donnees === undefined) {
    throw new ErreurSessionAbsente(sessionId)
  }
  return donnees
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * registerStorageAdapter(name, adapter)
 *
 * Enregistre un adaptateur de stockage sous un identifiant stable.
 * Meme principe que api.registerProvider.
 * L'application hote appelle cette fonction au demarrage.
 *
 * @param {string} name -- Identifiant de l'adaptateur (ex. : 'fichier', 'localStorage', 'postgres').
 * @param {import('../types/Sauvegarde.js').StorageAdapter} adapter
 * @returns {void}
 */
export function registerStorageAdapter(name, adapter) {
  if (!name || typeof name !== 'string') {
    throw new ErreurValidationSauvegarde('registerStorageAdapter : name doit etre une chaine non vide.')
  }
  if (!adapter || typeof adapter.save !== 'function' || typeof adapter.load !== 'function') {
    throw new ErreurValidationSauvegarde('registerStorageAdapter : adapter doit implementer { save, load }.')
  }
  _registre.set(name, adapter)
}

/**
 * getAdapters()
 *
 * Retourne la liste des noms d'adaptateurs enregistres.
 * Utile pour le debug et les tests.
 *
 * @returns {string[]}
 */
export function getAdapters() {
  return [..._registre.keys()]
}

/**
 * saveState(etat, adapterName)
 *
 * Persiste l'etat complet d'une session.
 * Valide l'etat, le serialise, delegue l'ecriture a l'adaptateur.
 * Ne modifie jamais l'objet etat recu.
 *
 * @param {import('../types/Etat.js').Etat} etat
 * @param {string} adapterName
 * @returns {Promise<import('../types/Sauvegarde.js').ResultatSauvegarde>}
 */
export async function saveState(etat, adapterName) {
  const adapter   = resoudreAdaptateur(adapterName)
  const timestamp = Date.now()

  validerEtat(etat)

  const donnees = serialiserEtat(etat, timestamp)
  await ecrireSupport(adapter, etat.sessionId, donnees)

  return {
    success       : true,
    sessionId     : etat.sessionId,
    savedAt       : timestamp,
    formatVersion : FORMAT_VERSION,
  }
}

/**
 * loadState(sessionId, adapterName)
 *
 * Charge et restaure l'etat d'une session depuis le support.
 * Valide la session, lit le support, deserialie et verifie la version.
 *
 * @param {string} sessionId
 * @param {string} adapterName
 * @returns {Promise<import('../types/Sauvegarde.js').ResultatChargement>}
 */
export async function loadState(sessionId, adapterName) {
  const adapter = resoudreAdaptateur(adapterName)

  validerSessionId(sessionId)

  const donneesBrutes  = await lireSupport(adapter, sessionId)
  const etatSauvegarde = deserialiserEtat(donneesBrutes, sessionId)

  return {
    success   : true,
    sessionId,
    etat      : etatSauvegarde.etat,
    meta      : etatSauvegarde.meta,
  }
}

/**
 * deleteState(sessionId, adapterName)
 *
 * Supprime la sauvegarde d'une session.
 * Ne leve pas d'erreur si la session est deja absente.
 *
 * @param {string} sessionId
 * @param {string} adapterName
 * @returns {Promise<import('../types/Sauvegarde.js').ResultatSuppression>}
 */
export async function deleteState(sessionId, adapterName) {
  const adapter   = resoudreAdaptateur(adapterName)
  const timestamp = Date.now()

  validerSessionId(sessionId)

  try {
    await adapter.delete(sessionId)
  } catch (e) {
    throw new ErreurEcriture(sessionId, e)
  }

  return { success: true, sessionId, timestamp }
}

/**
 * listSessions(adapterName)
 *
 * Retourne la liste des sessions disponibles (metadonnees uniquement).
 * Ne charge pas les etats complets.
 *
 * @param {string} adapterName
 * @returns {Promise<import('../types/Sauvegarde.js').SessionResume[]>}
 */
export async function listSessions(adapterName) {
  const adapter = resoudreAdaptateur(adapterName)

  try {
    return await adapter.list()
  } catch (e) {
    throw new ErreurLecture('(liste)', e)
  }
}
