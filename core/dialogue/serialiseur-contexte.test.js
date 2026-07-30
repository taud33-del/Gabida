import { serialiserContexteDialogue } from './serialiseur-contexte.js'
import * as apiDialogue from './index.js'

function creerContexte() {
  return {
    evenements: [
      { id: 'evt-1', contenu: { texte: 'premier' } },
      { id: 'evt-2', contenu: { texte: 'deuxieme' } },
    ],
  }
}

describe('serialiserContexteDialogue', () => {
  test('accepte un contexte valide', () => {
    const resultat = serialiserContexteDialogue(creerContexte())
    expect(resultat).toEqual(creerContexte())
  })

  test('rejette un contexte absent', () => {
    expect(() => serialiserContexteDialogue()).toThrow(expect.objectContaining({
      name: 'ErreurSerialiseurContexteDialogue',
    }))
  })

  test.each([null, [], 'contexte'])('rejette un contexte invalide : %p', contexte => {
    expect(() => serialiserContexteDialogue(contexte)).toThrow(TypeError)
  })

  test('rejette evenements absent', () => {
    expect(() => serialiserContexteDialogue({})).toThrow(TypeError)
  })

  test('rejette evenements non-tableau', () => {
    expect(() => serialiserContexteDialogue({ evenements: {} })).toThrow(TypeError)
  })

  test('effectue une copie superficielle du tableau', () => {
    const contexte = creerContexte()
    const resultat = serialiserContexteDialogue(contexte)
    expect(resultat).not.toBe(contexte)
    expect(resultat.evenements).not.toBe(contexte.evenements)
  })

  test('conserve l identite des references evenements', () => {
    const contexte = creerContexte()
    const resultat = serialiserContexteDialogue(contexte)
    contexte.evenements.forEach((evenement, position) => {
      expect(resultat.evenements[position]).toBe(evenement)
    })
  })

  test('conserve strictement l ordre', () => {
    const resultat = serialiserContexteDialogue(creerContexte())
    expect(resultat.evenements.map(({ id }) => id)).toEqual(['evt-1', 'evt-2'])
  })

  test('retourne un objet gele', () => {
    expect(Object.isFrozen(serialiserContexteDialogue(creerContexte()))).toBe(true)
  })

  test('retourne un tableau gele', () => {
    expect(Object.isFrozen(serialiserContexteDialogue(creerContexte()).evenements)).toBe(true)
  })

  test('ne mute ni le contexte ni les evenements', () => {
    const contexte = creerContexte()
    const avant = structuredClone(contexte)
    const evenements = [...contexte.evenements]
    serialiserContexteDialogue(contexte)
    expect(contexte).toEqual(avant)
    expect(contexte.evenements[0]).toBe(evenements[0])
    expect(Object.isFrozen(contexte.evenements[0])).toBe(false)
  })

  test('produit un resultat deterministe', () => {
    const contexte = creerContexte()
    const premier = serialiserContexteDialogue(contexte)
    const second = serialiserContexteDialogue(contexte)
    expect(second).toEqual(premier)
    expect(second).not.toBe(premier)
    expect(second.evenements).not.toBe(premier.evenements)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.serialiserContexteDialogue).toBe(serialiserContexteDialogue)
  })
})
