import { creerEntreeGeneration } from './entree-generation.js'
import * as apiDialogue from './index.js'

describe('EntreeGeneration', () => {
  test('cree une entree valide', () => {
    expect(creerEntreeGeneration('texte')).toEqual({ contenu: 'texte' })
  })

  test('rejette une chaine vide', () => {
    expect(() => creerEntreeGeneration('')).toThrow(expect.objectContaining({
      name: 'ErreurEntreeGeneration',
    }))
  })

  test('rejette une chaine composee d espaces', () => {
    expect(() => creerEntreeGeneration(' \t\n ')).toThrow(TypeError)
  })

  test.each([undefined, null, 1, {}, []])('rejette une valeur invalide : %p', contenu => {
    expect(() => creerEntreeGeneration(contenu)).toThrow(TypeError)
  })

  test('retourne un objet gele', () => {
    expect(Object.isFrozen(creerEntreeGeneration('texte'))).toBe(true)
  })

  test('contient uniquement la propriete contenu', () => {
    expect(Object.keys(creerEntreeGeneration('texte'))).toEqual(['contenu'])
  })

  test('conserve exactement la chaine', () => {
    const contenu = '  texte\nexact  '
    expect(creerEntreeGeneration(contenu).contenu).toBe(contenu)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerEntreeGeneration).toBe(creerEntreeGeneration)
  })
})
