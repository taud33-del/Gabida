import { construireContexteDialogue } from './constructeur-contexte.js'
import * as apiDialogue from './index.js'

function creerEvenements() {
  return [
    { id: 'evt-1', contenu: { texte: 'premier' } },
    { id: 'evt-2', contenu: { texte: 'deuxieme' } },
    { id: 'evt-3', contenu: { texte: 'troisieme' } },
  ]
}

describe('RFC-018.4a - construireContexteDialogue', () => {
  test('accepte un historique vide', () => {
    expect(construireContexteDialogue([])).toEqual({ evenements: [] })
  })

  test('accepte un historique contenant un evenement', () => {
    const evenement = { id: 'evt-1' }
    expect(construireContexteDialogue([evenement]).evenements).toEqual([evenement])
  })

  test('accepte un historique contenant plusieurs evenements', () => {
    const evenements = creerEvenements()
    expect(construireContexteDialogue(evenements).evenements).toHaveLength(3)
  })

  test('rejette un historique absent', () => {
    expect(() => construireContexteDialogue()).toThrow(expect.objectContaining({
      name: 'ErreurConstructeurContexteDialogue',
    }))
  })

  test('rejette null', () => {
    expect(() => construireContexteDialogue(null)).toThrow(TypeError)
  })

  test('rejette un objet', () => {
    expect(() => construireContexteDialogue({})).toThrow(TypeError)
  })

  test('rejette une chaine', () => {
    expect(() => construireContexteDialogue('historique')).toThrow(TypeError)
  })

  test('ne modifie pas le tableau source', () => {
    const historique = creerEvenements()
    const avant = [...historique]
    construireContexteDialogue(historique)
    expect(historique).toEqual(avant)
  })

  test('retourne un contexte different du tableau source', () => {
    const historique = creerEvenements()
    expect(construireContexteDialogue(historique)).not.toBe(historique)
  })

  test('cree un tableau evenements different du tableau source', () => {
    const historique = creerEvenements()
    expect(construireContexteDialogue(historique).evenements).not.toBe(historique)
  })

  test('conserve les memes references evenements', () => {
    const historique = creerEvenements()
    const contexte = construireContexteDialogue(historique)
    historique.forEach((evenement, position) => {
      expect(contexte.evenements[position]).toBe(evenement)
    })
  })

  test('conserve strictement l ordre des evenements', () => {
    const historique = creerEvenements()
    expect(construireContexteDialogue(historique).evenements.map(({ id }) => id))
      .toEqual(['evt-1', 'evt-2', 'evt-3'])
  })

  test('retourne un contexte gele', () => {
    expect(Object.isFrozen(construireContexteDialogue([]))).toBe(true)
  })

  test('retourne un tableau evenements gele', () => {
    expect(Object.isFrozen(construireContexteDialogue([]).evenements)).toBe(true)
  })

  test('ne gele pas les evenements', () => {
    const evenement = { id: 'evt-1' }
    construireContexteDialogue([evenement])
    expect(Object.isFrozen(evenement)).toBe(false)
  })

  test('un ajout ulterieur dans la source est sans effet sur le contexte', () => {
    const historique = creerEvenements()
    const contexte = construireContexteDialogue(historique)
    historique.push({ id: 'evt-4' })
    expect(contexte.evenements.map(({ id }) => id)).toEqual(['evt-1', 'evt-2', 'evt-3'])
  })

  test('une suppression ulterieure dans la source est sans effet sur le contexte', () => {
    const historique = creerEvenements()
    const contexte = construireContexteDialogue(historique)
    historique.pop()
    expect(contexte.evenements.map(({ id }) => id)).toEqual(['evt-1', 'evt-2', 'evt-3'])
  })

  test('un reordonnancement ulterieur de la source est sans effet sur le contexte', () => {
    const historique = creerEvenements()
    const contexte = construireContexteDialogue(historique)
    historique.reverse()
    expect(contexte.evenements.map(({ id }) => id)).toEqual(['evt-1', 'evt-2', 'evt-3'])
  })

  test('refuse une tentative d ajout dans contexte.evenements', () => {
    const contexte = construireContexteDialogue([])
    expect(() => contexte.evenements.push({ id: 'evt-1' })).toThrow(TypeError)
    expect(contexte.evenements).toEqual([])
  })

  test('produit un resultat deterministe pour le meme historique non modifie', () => {
    const historique = creerEvenements()
    const premier = construireContexteDialogue(historique)
    const second = construireContexteDialogue(historique)
    expect(second).toEqual(premier)
    expect(second).not.toBe(premier)
    expect(second.evenements).not.toBe(premier.evenements)
  })

  test('ne contient aucune propriete supplementaire', () => {
    expect(Object.keys(construireContexteDialogue([]))).toEqual(['evenements'])
  })

  test('est expose par l API publique du module dialogue', () => {
    expect(apiDialogue.construireContexteDialogue).toBe(construireContexteDialogue)
  })
})
