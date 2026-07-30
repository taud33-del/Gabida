import { creerPromptGeneration } from './prompt-generation.js'
import * as apiDialogue from './index.js'

describe('PromptGeneration', () => {
  test('cree un prompt valide', () => {
    expect(creerPromptGeneration('texte')).toEqual({ contenu: 'texte' })
  })

  test('conserve exactement le contenu', () => {
    const contenu = '  prompt\ntextuel  '
    expect(creerPromptGeneration(contenu).contenu).toBe(contenu)
  })

  test('retourne un objet gele', () => {
    expect(Object.isFrozen(creerPromptGeneration('texte'))).toBe(true)
  })

  test('contient uniquement la propriete contenu', () => {
    expect(Object.keys(creerPromptGeneration('texte'))).toEqual(['contenu'])
  })

  test('rejette une chaine vide', () => {
    expect(() => creerPromptGeneration('')).toThrow(expect.objectContaining({
      name: 'ErreurPromptGeneration',
    }))
  })

  test('rejette une chaine blanche', () => {
    expect(() => creerPromptGeneration(' \t\n ')).toThrow(TypeError)
  })

  test.each([undefined, null, 1, {}, []])('rejette une valeur invalide : %p', contenu => {
    expect(() => creerPromptGeneration(contenu)).toThrow(TypeError)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerPromptGeneration).toBe(creerPromptGeneration)
  })
})
