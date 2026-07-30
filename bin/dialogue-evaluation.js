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
import { scenariosDialogue } from '../tests/dialogue/corpus/scenarios.js'
import { comparerEtatsDialogue } from '../evaluation/dialogue/comparateur-etat-dialogue.js'

const MODELE_PAR_DEFAUT = 'gpt-5.5'

function creerGestionnaire(clientGeneration) {
  return creerGestionnaireEtatDialogue({
    construireContexteDialogue,
    serialiserContexteDialogue,
    construireSpecificationPromptDialogue,
    construirePromptGeneration,
    construireEntreeGeneration,
    clientGeneration,
    reconstruireEtatDialogue,
  })
}

function formaterJson(valeur) {
  return `\`\`\`json\n${JSON.stringify(valeur, null, 2)}\n\`\`\``
}

function formaterResultat(resultat) {
  const lignes = [
    `# ${resultat.nom}`,
    '',
    `Résultat : **${resultat.erreur ? 'Erreur' : resultat.comparaison.conforme ? 'Conforme' : 'Différences détectées'}**`,
    '',
    '## Attendu',
    '',
    formaterJson(resultat.attendu),
    '',
    '## Obtenu',
    '',
    formaterJson(resultat.obtenu),
    '',
    '## Différences',
    '',
  ]

  if (resultat.erreur) {
    lignes.push(`- Erreur d’exécution : ${resultat.erreur}`)
  } else if (resultat.comparaison.ecarts.length === 0) {
    lignes.push('- Aucun écart.')
  } else {
    resultat.comparaison.ecarts.forEach(ecart => {
      lignes.push(`- ${ecart.message}`)
    })
  }

  return lignes.join('\n')
}

function genererRapport(resultats, modele) {
  const conformes = resultats.filter(resultat => resultat.comparaison?.conforme).length
  const erreurs = resultats.filter(resultat => resultat.erreur).length
  const differents = resultats.length - conformes - erreurs
  return [
    '# Évaluation du moteur de dialogue',
    '',
    `Modèle : \`${modele}\``,
    '',
    ...resultats.flatMap(resultat => [formaterResultat(resultat), '']),
    '# Synthèse finale',
    '',
    `- Nombre de scénarios exécutés : ${resultats.length}`,
    `- Nombre conformes : ${conformes}`,
    `- Nombre différents : ${differents}`,
    `- Nombre d’erreurs : ${erreurs}`,
    '',
  ].join('\n')
}

export async function main() {
  if (typeof process.env.OPENAI_API_KEY !== 'string' || process.env.OPENAI_API_KEY.trim() === '') {
    throw new Error(
      'OPENAI_API_KEY est absente. Definissez cette variable pour lancer l evaluation dialogue.',
    )
  }

  const modele = process.env.OPENAI_DIALOGUE_MODEL || MODELE_PAR_DEFAUT
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const clientGeneration = creerClientGenerationOpenAI({ client, modele })
  const scenarios = scenariosDialogue.filter(scenario => scenario.valide)
  const resultats = []

  for (const scenario of scenarios) {
    try {
      const gestionnaire = creerGestionnaire(clientGeneration)
      const obtenu = await gestionnaire.reconstruireEtatDialogue(scenario.historique)
      resultats.push({
        nom: scenario.nom,
        attendu: scenario.etatAttendu,
        obtenu,
        comparaison: comparerEtatsDialogue(scenario.etatAttendu, obtenu),
      })
    } catch (erreur) {
      resultats.push({
        nom: scenario.nom,
        attendu: scenario.etatAttendu,
        obtenu: null,
        erreur: erreur.message,
      })
    }
  }

  process.stdout.write(genererRapport(resultats, modele))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((erreur) => {
    console.error(`Echec de l evaluation dialogue : ${erreur.message}`)
    process.exitCode = 1
  })
}
