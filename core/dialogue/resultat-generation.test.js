import { creerResultatGeneration } from './resultat-generation.js'
import * as apiDialogue from './index.js'

describe('RFC-018.5c - ResultatGeneration', () => {
  test('accepte une chaine simple', () => {
    expect(creerResultatGeneration('texte')).toEqual({ contenu: 'texte' })
  })

  test('accepte une chaine JSON comme texte brut', () => {
    const contenu = '{"faits":[]}'
    expect(creerResultatGeneration(contenu).contenu).toBe(contenu)
  })

  test('conserve les espaces internes', () => {
    expect(creerResultatGeneration('un  texte').contenu).toBe('un  texte')
  })

  test('conserve les espaces en debut et fin', () => {
    expect(creerResultatGeneration('  texte  ').contenu).toBe('  texte  ')
  })

  test('conserve un retour a la ligne interne', () => {
    expect(creerResultatGeneration('premiere\nseconde').contenu).toBe('premiere\nseconde')
  })

  test('rejette une chaine vide', () => {
    expect(() => creerResultatGeneration('')).toThrow(expect.objectContaining({
      name: 'ErreurResultatGeneration',
    }))
  })

  test('rejette une chaine composee d espaces', () => {
    expect(() => creerResultatGeneration('   ')).toThrow(TypeError)
  })

  test('rejette une chaine composee de tabulations', () => {
    expect(() => creerResultatGeneration('\t\t')).toThrow(TypeError)
  })

  test('rejette une chaine composee de retours a la ligne', () => {
    expect(() => creerResultatGeneration('\n\r\n')).toThrow(TypeError)
  })

  test('rejette undefined', () => {
    expect(() => creerResultatGeneration()).toThrow(TypeError)
  })

  test('rejette null', () => {
    expect(() => creerResultatGeneration(null)).toThrow(TypeError)
  })

  test('rejette un nombre', () => {
    expect(() => creerResultatGeneration(1)).toThrow(TypeError)
  })

  test('rejette un objet', () => {
    expect(() => creerResultatGeneration({ contenu: 'texte' })).toThrow(TypeError)
  })

  test('rejette un tableau', () => {
    expect(() => creerResultatGeneration(['texte'])).toThrow(TypeError)
  })

  test('rejette un booleen', () => {
    expect(() => creerResultatGeneration(true)).toThrow(TypeError)
  })

  test('retourne un objet gele', () => {
    expect(Object.isFrozen(creerResultatGeneration('texte'))).toBe(true)
  })

  test('retourne uniquement la propriete contenu', () => {
    expect(Object.keys(creerResultatGeneration('texte'))).toEqual(['contenu'])
  })

  test('conserve exactement l identite de la chaine', () => {
    const contenu = new Array(3).fill('portion').join(' ')
    expect(creerResultatGeneration(contenu).contenu).toBe(contenu)
  })

  test('deux appels produisent deux objets distincts', () => {
    const premier = creerResultatGeneration('texte')
    const second = creerResultatGeneration('texte')
    expect(second).not.toBe(premier)
    expect(second).toEqual(premier)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerResultatGeneration).toBe(creerResultatGeneration)
  })
})
