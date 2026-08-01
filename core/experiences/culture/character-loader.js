import { readFile } from 'node:fs/promises'

const CHARACTER_FILES = Object.freeze({
  'solene-han': 'solene-han.json',
  'sonia-nadir': 'sonia-nadir.json',
  'marcus-ramirez-jr': 'marcus-ramirez-jr.json',
  'sven-moreau': 'sven-moreau.json',
})

export const CULTURE_CHARACTER_SCHEMA_KEYS = Object.freeze([
  'schemaVersion',
  'id',
  'editorialPreamble',
  'identity',
  'sections',
  'consistencyRules',
  'consistencyRulesSource',
  'experienceAdaptations',
  'centralSummary',
  'source',
])

export const CULTURE_CHARACTER_SECTION_KEYS = Object.freeze([
  'identity', 'appearance', 'communication', 'personality', 'emotions',
  'relationships', 'decisionMaking', 'values', 'motivations', 'history',
  'evolution', 'particularities',
])

export class CultureCharacterError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CultureCharacterError'
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const child of Object.values(value)) deepFreeze(child)
  return Object.freeze(value)
}

export function validateCultureCharacterSheet(sheet, expectedId) {
  if (!sheet || typeof sheet !== 'object' || Array.isArray(sheet)) {
    throw new CultureCharacterError('La fiche personnage doit etre un objet JSON.')
  }
  const actualKeys = Object.keys(sheet).sort()
  const expectedKeys = [...CULTURE_CHARACTER_SCHEMA_KEYS].sort()
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new CultureCharacterError(`Schema de fiche invalide pour "${expectedId}".`)
  }
  if (sheet.schemaVersion !== 'culture-character-v1' || sheet.id !== expectedId) {
    throw new CultureCharacterError(`Identifiant ou version de fiche invalide pour "${expectedId}".`)
  }
  const identity = sheet.identity
  if (!identity || typeof identity !== 'object') throw new CultureCharacterError(`Identite absente pour "${expectedId}".`)
  for (const key of ['firstName', 'lastName']) {
    if (typeof identity[key] !== 'string' || identity[key].trim() === '') {
      throw new CultureCharacterError(`${key} est absent pour "${expectedId}".`)
    }
  }
  if (!Number.isInteger(identity.age) || identity.age < 0) throw new CultureCharacterError(`Age invalide pour "${expectedId}".`)
  const sectionKeys = Object.keys(sheet.sections ?? {}).sort()
  if (JSON.stringify(sectionKeys) !== JSON.stringify([...CULTURE_CHARACTER_SECTION_KEYS].sort())) {
    throw new CultureCharacterError(`Sections editoriales invalides pour "${expectedId}".`)
  }
  for (const key of ['communication', 'personality']) {
    if (typeof sheet.sections[key] !== 'string' || sheet.sections[key].trim() === '') {
      throw new CultureCharacterError(`Section ${key} absente pour "${expectedId}".`)
    }
  }
  if (!Array.isArray(sheet.consistencyRules) || sheet.consistencyRules.length === 0) {
    throw new CultureCharacterError(`Regles de coherence absentes pour "${expectedId}".`)
  }
  if (typeof sheet.centralSummary !== 'string' || sheet.centralSummary.trim() === '') {
    throw new CultureCharacterError(`Resume central absent pour "${expectedId}".`)
  }
  return sheet
}

export async function loadCultureCharacter(characterId) {
  const file = CHARACTER_FILES[characterId]
  if (!file) throw new CultureCharacterError(`Personnage culture inconnu: "${characterId}".`)

  const url = new URL(`../../../reference/characters/${file}`, import.meta.url)
  const sheet = JSON.parse(await readFile(url, 'utf8'))
  validateCultureCharacterSheet(sheet, characterId)
  return deepFreeze(sheet)
}

export const CULTURE_CHARACTER_IDS = Object.freeze(Object.keys(CHARACTER_FILES))
