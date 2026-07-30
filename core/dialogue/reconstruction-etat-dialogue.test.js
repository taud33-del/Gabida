import { reconstruireEtatDialogue } from './reconstruction-etat-dialogue.js'
import * as apiDialogue from './index.js'

describe('reconstruireEtatDialogue', () => {
  test('reconstruit un JSON valide', () => {
    expect(reconstruireEtatDialogue({ contenu: '{"faits":[]}' }))
      .toEqual({ faits: [] })
  })

  test('rejette un JSON invalide avec une SyntaxError explicite', () => {
    expect(() => reconstruireEtatDialogue({ contenu: '{"faits":' }))
      .toThrow(expect.objectContaining({
        name: 'SyntaxError',
        message: 'reconstruction EtatDialogue : contenu JSON invalide.',
      }))
  })

  test('reconstruit un tableau', () => {
    expect(reconstruireEtatDialogue({ contenu: '[1,2]' })).toEqual([1, 2])
  })

  test('reconstruit un objet', () => {
    expect(reconstruireEtatDialogue({ contenu: '{"id":"dialogue-1"}' }))
      .toEqual({ id: 'dialogue-1' })
  })

  test('reconstruit null', () => {
    expect(reconstruireEtatDialogue({ contenu: 'null' })).toBeNull()
  })

  test('ne modifie pas le resultat de generation', () => {
    const resultat = { contenu: '{"faits":[]}' }
    const avant = structuredClone(resultat)
    reconstruireEtatDialogue(resultat)
    expect(resultat).toEqual(avant)
  })

  test('propage une SyntaxError et conserve la cause native', () => {
    try {
      reconstruireEtatDialogue({ contenu: 'invalide' })
      throw new Error('une SyntaxError etait attendue')
    } catch (erreur) {
      expect(erreur).toBeInstanceOf(SyntaxError)
      expect(erreur.cause).toBeInstanceOf(SyntaxError)
    }
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.reconstruireEtatDialogue).toBe(reconstruireEtatDialogue)
  })
})
