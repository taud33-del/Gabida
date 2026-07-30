import { construirePromptGeneration } from './constructeur-prompt-generation.js'
import * as apiDialogue from './index.js'

describe('construirePromptGeneration', () => {
  test('joint les sections avec deux retours a la ligne', () => {
    const prompt = construirePromptGeneration({
      sections: ['premiere', 'deuxieme', 'troisieme'],
    })
    expect(prompt.contenu).toBe('premiere\n\ndeuxieme\n\ntroisieme')
  })

  test('conserve exactement une section unique', () => {
    expect(construirePromptGeneration({ sections: ['{"evenements":[]}'] }).contenu)
      .toBe('{"evenements":[]}')
  })

  test('retourne un PromptGeneration gele', () => {
    const prompt = construirePromptGeneration({ sections: ['{"evenements":[]}'] })
    expect(prompt).toEqual({ contenu: '{"evenements":[]}' })
    expect(Object.isFrozen(prompt)).toBe(true)
  })

  test('ne modifie pas la specification', () => {
    const specification = { sections: ['une', 'deux'] }
    const avant = structuredClone(specification)
    construirePromptGeneration(specification)
    expect(specification).toEqual(avant)
  })

  test('est deterministe', () => {
    const specification = { sections: ['section'] }
    expect(construirePromptGeneration(specification))
      .toEqual(construirePromptGeneration(specification))
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.construirePromptGeneration).toBe(construirePromptGeneration)
  })
})
