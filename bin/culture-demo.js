#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { createCultureEngine } from '../core/experiences/culture/index.js'

const generator = {
  async plan({ characterId, context }) {
    const role = context.layers[3].content.role
    return {
      understood: 'La personne souhaite decouvrir la culture suedoise.',
      intention: role === 'speaker' ? 'Demarrer un echange simple' : 'Proposer une aide de comprehension',
      contribution: role === 'speaker' ? 'Saluer et demander quel sujet interesse la personne.' : 'Rester disponible pour expliquer le suedois.',
      relevance: 0.9, novelty: 0.9, complementarity: 0.9,
      roleCompliance: 1, personalityCompliance: 1, timing: 0.9,
      estimatedLength: 'short', shouldSpeak: true,
      reason: `${characterId} peut apporter une contribution breve et distincte.`,
    }
  },
  async respond({ characterId }) {
    if (characterId === 'solene-han') {
      return { text: 'Hej! Vad är du mest nyfiken på – vardagsliv, mat eller traditioner?', openQuestions: ['Choisir un premier theme culturel.'] }
    }
    return { text: 'Le « fika » est une pause conviviale autour d’un café, souvent accompagnée de quelque chose à manger. Ce n’est pas seulement boire un café : l’idée est surtout de prendre le temps d’échanger.' }
  },
}

export async function main() {
  const engine = createCultureEngine({ generator, idFactory: () => 'culture-demo' })
  const started = await engine.startCultureConversation({
    experience: 'culture', userLanguage: 'fr',
    participants: [
      { characterId: 'solene-han', role: 'speaker', language: 'sv' },
      { characterId: 'sonia-nadir', role: 'translator', language: 'sv' },
    ],
    message: 'Bonjour, j’aimerais découvrir la culture suédoise.',
  })
  console.log('Personnages disponibles:')
  console.log(JSON.stringify(started.availableSpeakers, null, 2))
  console.log('\nChoix simule: solene-han')
  const result = await engine.generateCharacterResponse({ conversationId: started.conversationId, characterId: 'solene-han' })
  console.log(`\nReponse de Solene:\n${result.response}`)
  console.log('\nReevaluation de Sonia:')
  console.log(JSON.stringify(result.reevaluatedIntentions, null, 2))

  const secondMessage = 'Pouvez-vous expliquer ce que signifie « fika » ?'
  console.log(`\nSecond message utilisateur:\n${secondMessage}`)
  const secondTurn = await engine.addCultureUserMessage({
    conversationId: started.conversationId,
    message: secondMessage,
  })
  console.log('\nNouveaux personnages disponibles:')
  console.log(JSON.stringify(secondTurn.availableSpeakers, null, 2))

  console.log('\nChoix simule: sonia-nadir')
  const translated = await engine.generateCharacterResponse({
    conversationId: started.conversationId,
    characterId: 'sonia-nadir',
  })
  console.log(`\nReponse de Sonia:\n${translated.response}`)
  console.log('\nResume public final:')
  console.log(JSON.stringify(engine.getConversationState(started.conversationId), null, 2))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
