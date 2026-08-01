import { readFile } from 'node:fs/promises'
import {
  CULTURE_CHARACTER_IDS,
  CULTURE_CHARACTER_SCHEMA_KEYS,
  loadCultureCharacter,
  validateCultureCharacterSheet,
} from './character-loader.js'
import { buildCultureContext } from './engine.js'

const expected = Object.freeze({
  'solene-han': { firstName: 'Solène', lastName: 'Han', age: 27 },
  'sonia-nadir': { firstName: 'Sonia', lastName: 'Nadir', age: 30 },
  'marcus-ramirez-jr': { firstName: 'Marcus', lastName: 'Ramirez', age: 45 },
  'sven-moreau': { firstName: 'Sven', lastName: 'Moreau', age: 20 },
})

describe.each(CULTURE_CHARACTER_IDS)('fiche editoriale %s', characterId => {
  test('charge et valide les donnees indispensables', async () => {
    const sheet = await loadCultureCharacter(characterId)
    expect(sheet.id).toBe(characterId)
    expect(sheet.identity).toMatchObject(expected[characterId])
    expect(sheet.sections.communication.length).toBeGreaterThan(0)
    expect(sheet.sections.personality.length).toBeGreaterThan(0)
    expect(sheet.consistencyRules.length).toBeGreaterThan(0)
    expect(sheet.centralSummary.length).toBeGreaterThan(0)
  })
})

test('conserve les caracteres accentues en UTF-8', async () => {
  const solene = await loadCultureCharacter('solene-han')
  expect(solene.identity.firstName).toBe('Solène')
  expect(solene.centralSummary).toMatch(/réfléchie|médiatrice/)
})

test('les quatre fichiers possedent exactement le meme schema racine', async () => {
  const sheets = await Promise.all(CULTURE_CHARACTER_IDS.map(loadCultureCharacter))
  for (const sheet of sheets) {
    expect(Object.keys(sheet).sort()).toEqual([...CULTURE_CHARACTER_SCHEMA_KEYS].sort())
    expect(() => validateCultureCharacterSheet(sheet, sheet.id)).not.toThrow()
  }
})

test('retourne une fiche profondement immuable', async () => {
  const solene = await loadCultureCharacter('solene-han')
  expect(Object.isFrozen(solene)).toBe(true)
  expect(Object.isFrozen(solene.identity)).toBe(true)
  expect(Object.isFrozen(solene.consistencyRules)).toBe(true)
  expect(() => { solene.identity.firstName = 'Autre' }).toThrow(TypeError)
})

test('superpose role et langue sans modifier la fiche permanente', async () => {
  const solene = await loadCultureCharacter('solene-han')
  const context = buildCultureContext({
    participant: { characterId: 'solene-han', role: 'speaker', language: 'sv' },
    character: solene,
    state: { userLanguage: 'fr' },
    lastUserMessage: 'Bonjour',
  })
  expect(context.layers[2].content).toBe(solene)
  expect(context.layers[3].content).toMatchObject({ role: 'speaker', language: 'sv' })
  expect(solene).not.toHaveProperty('role')
  expect(solene).not.toHaveProperty('language')
})

test('chaque JSON est syntaxiquement valide', async () => {
  for (const characterId of CULTURE_CHARACTER_IDS) {
    const url = new URL(`../../../reference/characters/${characterId}.json`, import.meta.url)
    await expect(readFile(url, 'utf8').then(JSON.parse)).resolves.toMatchObject({ id: characterId })
  }
})
