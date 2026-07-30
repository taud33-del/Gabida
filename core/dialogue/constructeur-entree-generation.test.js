import { construireEntreeGeneration } from './constructeur-entree-generation.js'
import * as apiDialogue from './index.js'

describe('construireEntreeGeneration', () => {
  test('reprend exactement prompt.contenu', () => {
    const prompt = { contenu: '{"evenements":[{"id":"evt-1"}]}' }
    expect(construireEntreeGeneration(prompt).contenu).toBe(prompt.contenu)
  })

  test('conserve les espaces du prompt', () => {
    const prompt = { contenu: '  texte\nexact  ' }
    expect(construireEntreeGeneration(prompt).contenu).toBe(prompt.contenu)
  })

  test('retourne un objet gele conforme a EntreeGeneration', () => {
    const resultat = construireEntreeGeneration({ contenu: '{"evenements":[]}' })
    expect(resultat).toEqual({ contenu: '{"evenements":[]}' })
    expect(Object.isFrozen(resultat)).toBe(true)
  })

  test('ne modifie pas le prompt', () => {
    const prompt = { contenu: '{"evenements":[]}' }
    const avant = structuredClone(prompt)
    construireEntreeGeneration(prompt)
    expect(prompt).toEqual(avant)
  })

  test('est deterministe', () => {
    const prompt = { contenu: '{"evenements":[]}' }
    expect(construireEntreeGeneration(prompt))
      .toEqual(construireEntreeGeneration(prompt))
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.construireEntreeGeneration).toBe(construireEntreeGeneration)
  })
})
