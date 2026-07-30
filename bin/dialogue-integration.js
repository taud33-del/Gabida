#!/usr/bin/env node

import OpenAI from 'openai'
import { fileURLToPath } from 'node:url'
import {
  construireContexteDialogue,
  serialiserContexteDialogue,
  construireSpecificationPromptDialogue,
  construirePromptGeneration,
  construireEntreeGeneration,
  creerClientGenerationOpenAI,
  reconstruireEtatDialogue,
  creerGestionnaireEtatDialogue,
} from '../core/dialogue/index.js'

const MODELE_PAR_DEFAUT = 'gpt-5.5'

const historique = Object.freeze([
  Object.freeze({
    id: 'evenement-1',
    type: 'message_utilisateur',
    emetteurId: 'joueur-1',
    destinataireIds: Object.freeze(['assistant-1']),
    contenu: Object.freeze({
      texte: 'Je souhaite organiser une promenade demain matin.',
    }),
    visibilite: 'publique',
    date: '2026-07-30T08:00:00.000Z',
    metadata: Object.freeze({}),
    referencesDialogue: Object.freeze([
      Object.freeze({
        categorie: 'objectif',
        id: 'objectif-promenade',
      }),
    ]),
  }),
])

export async function main() {
  if (typeof process.env.OPENAI_API_KEY !== 'string' || process.env.OPENAI_API_KEY.trim() === '') {
    throw new Error(
      'OPENAI_API_KEY est absente. Definissez cette variable pour lancer l integration dialogue.',
    )
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const clientGeneration = creerClientGenerationOpenAI({
    client,
    modele: process.env.OPENAI_DIALOGUE_MODEL || MODELE_PAR_DEFAUT,
  })
  const gestionnaire = creerGestionnaireEtatDialogue({
    construireContexteDialogue,
    serialiserContexteDialogue,
    construireSpecificationPromptDialogue,
    construirePromptGeneration,
    construireEntreeGeneration,
    clientGeneration,
    reconstruireEtatDialogue,
  })

  const etatDialogue = await gestionnaire.reconstruireEtatDialogue(historique)
  console.log(JSON.stringify(etatDialogue, null, 2))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((erreur) => {
    console.error(`Echec de l integration dialogue : ${erreur.message}`)
    process.exitCode = 1
  })
}
