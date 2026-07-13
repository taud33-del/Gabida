#!/usr/bin/env node
/**
 * bin/gabida.js
 *
 * Harnais d'exécution du premier dialogue réel de Gabida.
 *
 * Point d'entrée exécutable HORS environnement de test. Il ne contient aucune
 * logique métier : il se contente d'assembler les API publiques existantes et
 * d'afficher l'échange produit par le pipeline.
 *
 * Le personnage est construit UNIQUEMENT à partir des fiches du cas de
 * référence : le nom affiché provient de `fiches.personnage.nom`, et la réponse
 * provient intégralement du pipeline (Lecture → Analyse → Influences → Ressenti
 * → Décision → Prompt → Réponse). Aucun texte de dialogue n'est codé en dur.
 *
 * Étapes :
 *   1. charge les cinq fiches du cas de référence « Léa Martin » via
 *      lecture.chargerReference() puis lecture.loadFiches()
 *   2. crée un état initial valide
 *   3. enregistre le SimulationProvider (déterministe, sans réseau)
 *   4. appelle core.executeTurn()
 *   5. affiche le dialogue « Player / <personnage> »
 *
 * Lancement : `npm start` (ou `node bin/gabida.js`).
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadFiches } from '../lecture/index.js'
import { chargerReference } from '../lecture/reference.js'
import { executeTurn } from '../core/index.js'
import {
  registerProvider,
  createSimulationProvider,
  SIMULATION_MODES,
} from '../api/index.js'
import { PROVIDERS } from '../constants/Providers.js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')
const CAS_REFERENCE = join(RACINE, 'reference', 'Léa Martin')

/** Message d'ouverture du joueur pour ce premier tour. */
const MESSAGE_OUVERTURE = 'Bonjour.'

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
 * formaterDialogue(nomPersonnage, texteJoueur, action, dialogue)
 *
 * Pure. Met en forme l'échange sous la forme demandée :
 *   Player :
 *   <texteJoueur>
 *
 *   <nomPersonnage> :
 *   <action>
 *   <dialogue>
 *
 * Le nom du locuteur provient exclusivement des fiches (aucun nom codé en dur).
 *
 * @param {string} nomPersonnage
 * @param {string} texteJoueur
 * @param {string} action
 * @param {string} dialogue
 * @returns {string}
 */
export function formaterDialogue(nomPersonnage, texteJoueur, action, dialogue) {
  return [
    'Player :',
    texteJoueur,
    '',
    `${nomPersonnage} :`,
    action,
    dialogue,
  ].filter((ligne, index) => ligne !== '' || index === 2).join('\n')
}

/**
 * Point d'entrée du harnais.
 * @returns {Promise<void>}
 */
export async function main() {
  const sessionId = 'session-demo'

  // 1. Fiches du cas de référence officiel
  const fiches = loadFiches(chargerReference(CAS_REFERENCE))

  // 2. État initial
  const etat = creerEtatInitial(sessionId)

  // 3. Provider (déterministe, sans réseau)
  registerProvider(
    PROVIDERS.SIMULATION,
    createSimulationProvider({ mode: SIMULATION_MODES.SUCCESS })
  )

  // 4. Premier tour
  const playerMessage = {
    texte    : MESSAGE_OUVERTURE,
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

  // 5. Dialogue réel — nom issu de la fiche, réponse issue du pipeline
  console.log(
    formaterDialogue(
      fiches.personnage.nom,
      playerMessage.texte,
      resultat.action,
      resultat.dialogue
    )
  )
}

// Exécution uniquement lorsque le fichier est lancé directement (npm start).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((erreur) => {
    console.error('Échec du harnais Gabida :', erreur)
    process.exitCode = 1
  })
}
