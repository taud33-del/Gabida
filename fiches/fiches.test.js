/**
 * fiches/fiches.test.js
 *
 * Vérifie que les cinq fiches minimales de Gabida :
 *   1. se chargent via lecture.loadFiches() sans erreur de validation ;
 *   2. permettent à core.executeTurn() de parcourir tout le pipeline
 *      (Analyse → Influences → Ressenti → Décision → Prompt → Provider →
 *       Mémoire → mise à jour d'état) sans lever d'erreur.
 *
 * Le provider utilisé est le SimulationProvider déterministe (aucun réseau).
 * Ce test ne modifie aucun module métier ; il ne fait que consommer les
 * interfaces publiques existantes avec les fiches réelles.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadFiches, TYPES_FICHE } from '../lecture/index.js'
import { executeTurn } from '../core/index.js'
import {
  registerProvider,
  createSimulationProvider,
  SIMULATION_MODES,
} from '../api/index.js'
import { PROVIDERS } from '../constants/Providers.js'

const DOSSIER = dirname(fileURLToPath(import.meta.url))

/**
 * Lit une fiche JSON du dossier fiches/.
 * @param {string} type
 * @returns {object}
 */
function lireFiche(type) {
  return JSON.parse(readFileSync(join(DOSSIER, `${type}.json`), 'utf8'))
}

/**
 * Construit l'objet sources attendu par loadFiches à partir des 5 fichiers JSON.
 * @returns {object}
 */
function chargerSources() {
  const sources = {}
  for (const type of TYPES_FICHE) {
    sources[type] = lireFiche(type)
  }
  return sources
}

describe('fiches minimales — chargement', () => {
  test('les 5 fichiers JSON existent et sont des objets', () => {
    const sources = chargerSources()
    for (const type of TYPES_FICHE) {
      expect(typeof sources[type]).toBe('object')
      expect(sources[type]).not.toBeNull()
    }
  })

  test('loadFiches() réussit et retourne les 5 fiches', () => {
    const fiches = loadFiches(chargerSources())
    for (const type of TYPES_FICHE) {
      expect(fiches[type]).toBeDefined()
    }
  })

  test('ne contiennent que des champs réellement lus par le moteur', () => {
    const sources = chargerSources()
    expect(Object.keys(sources.personnage).sort()).toEqual(['capaciteMemoire', 'criteres', 'nom'])
    expect(Object.keys(sources.univers)).toEqual(['nom'])
    expect(Object.keys(sources.aventure).sort()).toEqual(['dureeEstimee', 'lieuDepart'])
    // joueur et memoire ne sont lus par aucun module → objets vides.
    expect(Object.keys(sources.joueur)).toEqual([])
    expect(Object.keys(sources.memoire)).toEqual([])
  })
})

describe('fiches minimales — pipeline complet via executeTurn', () => {
  const SESSION = 'session-fiches-test'

  beforeAll(() => {
    registerProvider(
      PROVIDERS.SIMULATION,
      createSimulationProvider({ mode: SIMULATION_MODES.SUCCESS })
    )
  })

  function etatInitial() {
    return {
      sessionId  : SESSION,
      tourCourant: 1,
      memoireVecue: { souvenirs: [] },
      historique : [],
      meta       : { debutTimestamp: 0, langue: 'fr' },
    }
  }

  function messageJoueur() {
    return { texte: 'Bonjour.', tour: 1, sessionId: SESSION, timestamp: 0 }
  }

  const providerConfig = { provider: PROVIDERS.SIMULATION, cleApi: 'x', modele: 'sim-model' }

  test('executeTurn() parcourt tout le pipeline sans erreur', async () => {
    const fiches = loadFiches(chargerSources())
    const resultat = await executeTurn(messageJoueur(), providerConfig, fiches, etatInitial())

    expect(typeof resultat.reponse).toBe('string')
    expect(resultat.etatMisAJour.tourCourant).toBe(2)
    expect(resultat.etatMisAJour.historique).toHaveLength(2)
  })

  test('est déterministe (deux exécutions identiques → même réponse)', async () => {
    const fiches = loadFiches(chargerSources())
    const r1 = await executeTurn(messageJoueur(), providerConfig, fiches, etatInitial())
    const r2 = await executeTurn(messageJoueur(), providerConfig, fiches, etatInitial())
    expect(r1.reponse).toBe(r2.reponse)
  })
})
