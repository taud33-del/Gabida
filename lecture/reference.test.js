/**
 * lecture/reference.test.js
 *
 * Tests de l'ingestion des fiches de référence `.txt` (cas « Léa Martin ») :
 *   - parsing structurel (chapitres, contenu brut préservé)
 *   - extraction des paires « label<TAB>valeur »
 *   - lecture d'une valeur après un libellé
 *   - chargerReference() → loadFiches() → executeTurn() de bout en bout
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  parseFicheTexte,
  extraireChamps,
  valeurApresLibelle,
  chargerReference,
  FICHIERS_REFERENCE,
} from './reference.js'
import { loadFiches, TYPES_FICHE } from './index.js'
import { executeTurn } from '../core/index.js'
import {
  registerProvider,
  createSimulationProvider,
  SIMULATION_MODES,
} from '../api/index.js'
import { PROVIDERS } from '../constants/Providers.js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const CAS_REFERENCE = join(RACINE, 'reference', 'Léa Martin')

describe('parseFicheTexte', () => {
  test('découpe en chapitres et conserve le contenu brut', () => {
    const texte = [
      '📖 Fiche Personnage',
      'Chapitre 1 — Identité',
      '',
      'Nom\tMartin',
      '📖 Fiche Personnage',
      'Chapitre 2 — Apparence',
      '',
      'Taille : 1m64',
    ].join('\n')

    const { contenuBrut, chapitres } = parseFicheTexte(texte)
    expect(contenuBrut).toBe(texte)
    expect(chapitres.map((c) => c.titre)).toEqual(['Identité', 'Apparence'])
    expect(chapitres[0].contenu).toContain('Nom\tMartin')
    expect(chapitres[1].contenu).toContain('Taille : 1m64')
  })
})

describe('extraireChamps', () => {
  test('lit les paires label<TAB>valeur', () => {
    const champs = extraireChamps('Nom\tMartin\nPrénom / Surnom\tLéa\nÂge\t32 ans')
    expect(champs['Nom']).toBe('Martin')
    expect(champs['Prénom / Surnom']).toBe('Léa')
    expect(champs['Âge']).toBe('32 ans')
  })
})

describe('valeurApresLibelle', () => {
  test('retourne la première ligne non vide après le libellé', () => {
    const texte = "1. Nom de l'univers\n\nTerre (Contemporaine)\n"
    expect(valeurApresLibelle(texte, "1. Nom de l'univers")).toBe('Terre (Contemporaine)')
  })
})

describe('chargerReference — cas Léa Martin', () => {
  test('les 5 types sont mappés vers un fichier .txt', () => {
    for (const type of TYPES_FICHE) {
      expect(FICHIERS_REFERENCE[type].fichier).toMatch(/\.txt$/)
    }
  })

  test('charge les 5 fiches, conserve le contenu et extrait les champs moteur', () => {
    const sources = chargerReference(CAS_REFERENCE)

    for (const type of TYPES_FICHE) {
      expect(typeof sources[type]).toBe('object')
      expect(sources[type].contenuBrut.length).toBeGreaterThan(0)
      expect(sources[type].chapitres.length).toBeGreaterThan(0)
    }

    expect(sources.personnage.nom).toBe('Léa Martin')
    expect(sources.univers.nom).toBe('Terre (Contemporaine)')
    expect(sources.personnage.champs['Profession / Fonction']).toContain('puériculture')
  })

  test('les fiches de référence passent loadFiches()', () => {
    const fiches = loadFiches(chargerReference(CAS_REFERENCE))
    for (const type of TYPES_FICHE) {
      expect(fiches[type]).toBeDefined()
    }
  })
})

describe('pipeline complet avec le cas de référence', () => {
  const SESSION = 'session-reference-test'

  beforeAll(() => {
    registerProvider(
      PROVIDERS.SIMULATION,
      createSimulationProvider({ mode: SIMULATION_MODES.SUCCESS })
    )
  })

  test('executeTurn() parcourt tout le pipeline avec Léa Martin', async () => {
    const fiches = loadFiches(chargerReference(CAS_REFERENCE))
    const etat = {
      sessionId  : SESSION,
      tourCourant: 1,
      memoireVecue: { souvenirs: [] },
      historique : [],
      meta       : { debutTimestamp: 0, langue: 'fr' },
    }
    const playerMessage = { texte: 'Bonjour.', tour: 1, sessionId: SESSION, timestamp: 0 }
    const providerConfig = { provider: PROVIDERS.SIMULATION, cleApi: 'x', modele: 'sim-model' }

    const resultat = await executeTurn(playerMessage, providerConfig, fiches, etat)
    expect(typeof resultat.reponse).toBe('string')
    expect(resultat.etatMisAJour.tourCourant).toBe(2)
    expect(resultat.etatMisAJour.historique).toHaveLength(2)
  })
})
