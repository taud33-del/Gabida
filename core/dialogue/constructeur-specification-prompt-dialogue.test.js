import { jest } from '@jest/globals'
import { construireSpecificationPromptDialogue } from './constructeur-specification-prompt-dialogue.js'
import * as apiDialogue from './index.js'

describe('construireSpecificationPromptDialogue', () => {
  test('utilise JSON.stringify une seule fois', () => {
    const stringify = jest.spyOn(JSON, 'stringify')
    try {
      construireSpecificationPromptDialogue({ evenements: [] })
      expect(stringify).toHaveBeenCalledTimes(1)
    } finally {
      stringify.mockRestore()
    }
  })

  test('cree les sections du prompt avec la representation serialisee', () => {
    const specification = construireSpecificationPromptDialogue({
      evenements: [{ id: 'evt-1' }],
    })
    expect(specification.sections).toHaveLength(6)
    expect(specification.sections[0]).toContain('Rôle')
    expect(specification.sections[1]).toContain('Objectif')
    expect(specification.sections[2]).toContain('contrat EtatDialogue')
    expect(specification.sections[3]).toContain('Contrat JSON exact')
    expect(specification.sections[3]).toContain('"faits"')
    expect(specification.sections[3]).toContain('"dateMiseAJour"')
    expect(specification.sections[4]).toContain('uniquement un objet JSON valide')
    expect(specification.sections[4]).toContain('sans aucun texte hors JSON')
    expect(specification.sections[5])
      .toBe('Représentation canonique :\n{"evenements":[{"id":"evt-1"}]}')
  })

  test('retourne une specification gelee', () => {
    const specification = construireSpecificationPromptDialogue({ evenements: [] })
    expect(Object.isFrozen(specification)).toBe(true)
    expect(Object.isFrozen(specification.sections)).toBe(true)
  })

  test('ne modifie pas la representation canonique', () => {
    const representation = { evenements: [{ id: 'evt-1' }] }
    const avant = structuredClone(representation)
    construireSpecificationPromptDialogue(representation)
    expect(representation).toEqual(avant)
  })

  test('est deterministe', () => {
    const representation = { evenements: [] }
    expect(construireSpecificationPromptDialogue(representation))
      .toEqual(construireSpecificationPromptDialogue(representation))
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.construireSpecificationPromptDialogue)
      .toBe(construireSpecificationPromptDialogue)
  })
})
