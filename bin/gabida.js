#!/usr/bin/env node
/**
 * bin/gabida.js
 *
 * Harnais d'exécution du premier dialogue de Gabida.
 *
 * Point d'entrée exécutable HORS environnement de test. Il ne contient aucune
 * logique métier : il se contente d'assembler les API publiques existantes.
 *
 * Étapes :
 *   1. charge les cinq fiches via lecture.loadFiches()
 *   2. crée un état initial valide
 *   3. enregistre le SimulationProvider (déterministe, sans réseau)
 *   4. appelle core.executeTurn()
 *   5. affiche la réponse et le nouvel état dans la console
 *
 * Lancement : `npm start` (ou `node bin/gabida.js`).
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

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOSSIER_FICHES = join(RACINE, 'fiches')

/**
 * Charge l'objet `sources` attendu par loadFiches à partir des fichiers JSON.
 * @returns {object}
 */
function chargerSources() {
  const sources = {}
  for (const type of TYPES_FICHE) {
    const chemin = join(DOSSIER_FICHES, `${type}.json`)
    sources[type] = JSON.parse(readFileSync(chemin, 'utf8'))
  }
  return sources
}

/**
 * Construit un état initial valide pour le premier tour.
 * @param {string} sessionId
 * @returns {import('../types/Etat.js').Etat}
 */
function creerEtatInitial(sessionId) {
  return {
    sessionId,
    tourCourant : 1,
    memoireVecue: { souvenirs: [] },
    historique  : [],
    meta        : { debutTimestamp: Date.now(), langue: 'fr' },
  }
}

/**
 * Point d'entrée du harnais.
 * @returns {Promise<void>}
 */
async function main() {
  const sessionId = 'session-demo'

  // 1. Fiches
  const fiches = loadFiches(chargerSources())

  // 2. État initial
  const etat = creerEtatInitial(sessionId)

  // 3. Provider (déterministe, sans réseau)
  registerProvider(
    PROVIDERS.SIMULATION,
    createSimulationProvider({ mode: SIMULATION_MODES.SUCCESS })
  )

  // 4. Premier tour
  const playerMessage = {
    texte    : 'Bonjour.',
    tour     : 1,
    sessionId,
    timestamp: Date.now(),
  }
  const providerConfig = {
    provider: PROVIDERS.SIMULATION,
    cleApi  : 'simulation',
    modele  : 'sim-model',
  }

  const resultat = await executeTurn(playerMessage, providerConfig, fiches, etat)

  // 5. Affichage
  console.log('=== Gabida — premier dialogue ===')
  console.log(`Joueur   : ${playerMessage.texte}`)
  console.log(`Gabida   : ${resultat.reponse}`)
  console.log('--- Nouvel état ---')
  console.log(`tourCourant : ${resultat.etatMisAJour.tourCourant}`)
  console.log(`historique  : ${resultat.etatMisAJour.historique.length} message(s)`)
  console.log(`souvenirs   : ${resultat.etatMisAJour.memoireVecue.souvenirs.length}`)
  console.log(JSON.stringify(resultat.etatMisAJour, null, 2))
}

main().catch((erreur) => {
  console.error('Échec du harnais Gabida :', erreur)
  process.exitCode = 1
})
