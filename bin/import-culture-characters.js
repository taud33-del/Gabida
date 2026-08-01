#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SECTION_KEYS = Object.freeze({
  IDENTITE: 'identity',
  APPARENCE: 'appearance',
  COMMUNICATION: 'communication',
  PERSONNALITE: 'personality',
  EMOTIONS: 'emotions',
  RELATIONS: 'relationships',
  DECISION: 'decisionMaking',
  VALEURS: 'values',
  MOTIVATIONS: 'motivations',
  HISTOIRE: 'history',
  EVOLUTION: 'evolution',
  PARTICULARITES: 'particularities',
})

const CHARACTERS = Object.freeze([
  { id: 'solene-han', source: ['SoleneHan', 'fiche solene.txt'] },
  { id: 'sonia-nadir', source: ['soniaNadir', 'fiche sonia.txt'] },
  { id: 'marcus-ramirez-jr', source: ['marcusRamirezJr', 'fiche marcus.txt'] },
  // La source editoriale est actuellement rangee dans le dossier Marcus.
  { id: 'sven-moreau', source: ['marcusRamirezJr', 'Fiche sven.txt'] },
])

function normalized(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase().trim()
}

function headingKind(line) {
  const value = normalized(line).replace(/^CHAPITRE\s+\d+\s+[—-]\s+/, '')
  if (SECTION_KEYS[value]) return { type: 'section', key: SECTION_KEYS[value] }
  if (value === 'REGLES DE COHERENCE' || value === 'REGLES DE COHERENCE COMPORTEMENTALE') return { type: 'rules' }
  if (value === 'ADAPTATION AUX EXPERIENCES') return { type: 'adaptations' }
  if (value === 'RESUME' || value === 'RESUME CENTRAL POUR GABIDA') return { type: 'summary' }
  if (value === 'FIN DE LA FICHE') return { type: 'end' }
  return null
}

function cleanContent(lines) {
  return lines.filter(line => !/^={20,}$/.test(line.trim())).join('\n').trim()
}

function splitDocument(text) {
  const sections = Object.fromEntries(Object.values(SECTION_KEYS).map(key => [key, '']))
  const special = { rules: '', adaptations: '', summary: '' }
  const preamble = []
  let current = null
  let buffer = []
  const flush = () => {
    if (!current) return
    const content = cleanContent(buffer)
    if (current.type === 'section') sections[current.key] = content
    else if (current.type !== 'end') special[current.type] = content
    buffer = []
  }
  for (const line of text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n')) {
    const heading = headingKind(line)
    if (heading) {
      flush()
      current = heading
    } else if (current) {
      buffer.push(line)
    } else {
      preamble.push(line)
    }
  }
  flush()
  return { preamble: cleanContent(preamble), sections, special }
}

function field(section, labels) {
  const lines = section.split('\n')
  const normalizeLabel = value => normalized(value).replace(/\s*:\s*$/, '')
  const targets = labels.map(normalizeLabel)
  for (let index = 0; index < lines.length; index += 1) {
    if (!targets.includes(normalizeLabel(lines[index]))) continue
    const values = []
    let started = false
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const value = lines[cursor].trim()
      if (!value) {
        if (started) break
        continue
      }
      started = true
      values.push(value)
    }
    return values.join(' ').trim() || null
  }
  return null
}

function listItems(content) {
  const items = []
  let current = ''
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    const match = line.match(/^(?:-|(\d+)\.)\s+(.*)$/)
    if (match) {
      if (current) items.push(current)
      current = match[2]
    } else if (line && current) {
      current += ` ${line}`
    }
  }
  if (current) items.push(current)
  return items
}

function adaptationBlock(content, start, endCandidates) {
  const lines = content.split('\n')
  const startIndex = lines.findIndex(line => normalized(line) === start)
  if (startIndex < 0) return ''
  const endIndex = lines.findIndex((line, index) => index > startIndex && endCandidates.includes(normalized(line)))
  return cleanContent(lines.slice(startIndex + 1, endIndex < 0 ? undefined : endIndex))
}

function buildAdaptations(content) {
  const askQuestion = adaptationBlock(content, 'POSER UNE QUESTION', ['VIVRE UNE AVENTURE'])
  const adventure = adaptationBlock(content, 'VIVRE UNE AVENTURE', ['DECOUVRIR UNE CULTURE'])
  const culture = adaptationBlock(content, 'DECOUVRIR UNE CULTURE', ['VISITER UN LIEU'])
  const visitPlace = adaptationBlock(content, 'VISITER UN LIEU', [])
  const speakerStart = culture.search(/Si son rôle est [«"]\s*Parler une langue étrangère\s*[»"]\s*:/i)
  const translatorStart = culture.search(/Si son rôle est [«"]\s*Traduire\s*[»"]\s*:/i)
  return {
    askQuestion: listItems(askQuestion),
    adventure: listItems(adventure),
    culture: {
      speaker: speakerStart >= 0 ? listItems(culture.slice(speakerStart, translatorStart < 0 ? undefined : translatorStart)) : [],
      translator: translatorStart >= 0 ? listItems(culture.slice(translatorStart)) : [],
    },
    visitPlace: listItems(visitPlace),
  }
}

function buildCharacter(id, sourceFile, text) {
  const { preamble, sections, special } = splitDocument(text)
  const firstName = field(sections.identity, ['Prénom'])
  const lastName = field(sections.identity, ['Nom officiel', 'Nom'])
  const displayName = field(sections.identity, ['Nom utilisé dans les dialogues', 'Nom utilisé'])
  const ageText = field(sections.identity, ['Âge'])
  return {
    schemaVersion: 'culture-character-v1',
    id,
    editorialPreamble: preamble,
    identity: {
      firstName,
      lastName,
      displayName,
      age: ageText ? Number.parseInt(ageText, 10) : null,
      gender: field(sections.identity, ['Sexe / Genre', 'Sexe']),
      species: field(sections.identity, ['Espèce']),
      nationality: field(sections.identity, ['Nationalité']),
      familyOrigins: field(sections.identity, ['Origines familiales']),
      profession: field(sections.identity, ['Profession principale', 'Profession']),
      currentSituation: field(sections.identity, ['Situation actuelle']),
      publicIdentity: field(sections.identity, ['Identité publique']),
    },
    sections,
    consistencyRules: listItems(special.rules),
    consistencyRulesSource: special.rules,
    experienceAdaptations: {
      ...buildAdaptations(special.adaptations),
      sourceText: special.adaptations,
    },
    centralSummary: special.summary,
    source: {
      format: 'text/plain',
      encoding: 'utf-8',
      originalFileName: sourceFile,
    },
  }
}

export async function importCultureCharacters(sourceRoot, outputRoot) {
  for (const character of CHARACTERS) {
    const sourcePath = resolve(sourceRoot, ...character.source)
    const text = await readFile(sourcePath, 'utf8')
    const data = buildCharacter(character.id, character.source.at(-1), text)
    await writeFile(resolve(outputRoot, `${character.id}.json`), `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , sourceRoot, outputRoot = resolve('reference', 'characters')] = process.argv
  if (!sourceRoot) throw new Error('Usage: node bin/import-culture-characters.js <dossier-source> [dossier-sortie]')
  importCultureCharacters(sourceRoot, outputRoot).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
