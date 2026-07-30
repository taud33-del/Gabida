import { creerSpecificationPromptDialogue } from './specification-prompt-dialogue.js'
import * as apiDialogue from './index.js'

describe('SpecificationPromptDialogue', () => {
  test('cree une specification valide', () => {
    expect(creerSpecificationPromptDialogue(['section'])).toEqual({
      sections: ['section'],
    })
  })

  test('accepte plusieurs sections', () => {
    expect(creerSpecificationPromptDialogue(['une', 'deux']).sections).toEqual(['une', 'deux'])
  })

  test('rejette des sections absentes', () => {
    expect(() => creerSpecificationPromptDialogue()).toThrow(expect.objectContaining({
      name: 'ErreurSpecificationPromptDialogue',
    }))
  })

  test('rejette une valeur non-tableau', () => {
    expect(() => creerSpecificationPromptDialogue('section')).toThrow(TypeError)
  })

  test('rejette un tableau vide', () => {
    expect(() => creerSpecificationPromptDialogue([])).toThrow(TypeError)
  })

  test('rejette une section vide', () => {
    expect(() => creerSpecificationPromptDialogue([''])).toThrow(TypeError)
  })

  test('rejette une section blanche', () => {
    expect(() => creerSpecificationPromptDialogue([' \t\n '])).toThrow(TypeError)
  })

  test('rejette une section non-chaine', () => {
    expect(() => creerSpecificationPromptDialogue(['valide', 1])).toThrow(TypeError)
  })

  test('conserve exactement les chaines', () => {
    const sections = ['  premiere  ', 'deuxieme\nligne']
    expect(creerSpecificationPromptDialogue(sections).sections).toEqual(sections)
  })

  test('conserve l ordre des sections', () => {
    expect(creerSpecificationPromptDialogue(['trois', 'un', 'deux']).sections)
      .toEqual(['trois', 'un', 'deux'])
  })

  test('copie le tableau source', () => {
    const sections = ['section']
    expect(creerSpecificationPromptDialogue(sections).sections).not.toBe(sections)
  })

  test('ne modifie pas le tableau source', () => {
    const sections = ['une', 'deux']
    const avant = [...sections]
    creerSpecificationPromptDialogue(sections)
    expect(sections).toEqual(avant)
  })

  test('retourne un objet gele', () => {
    expect(Object.isFrozen(creerSpecificationPromptDialogue(['section']))).toBe(true)
  })

  test('retourne un tableau sections gele', () => {
    expect(Object.isFrozen(creerSpecificationPromptDialogue(['section']).sections)).toBe(true)
  })

  test('contient uniquement la propriete sections', () => {
    expect(Object.keys(creerSpecificationPromptDialogue(['section']))).toEqual(['sections'])
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerSpecificationPromptDialogue).toBe(creerSpecificationPromptDialogue)
  })
})
