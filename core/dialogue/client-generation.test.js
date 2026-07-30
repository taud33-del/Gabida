import { jest } from '@jest/globals'
import { creerClientGeneration } from './client-generation.js'
import * as apiDialogue from './index.js'

describe('RFC-018.5a - ClientGeneration', () => {
  test('cree un client valide', () => {
    const client = creerClientGeneration({ generer: jest.fn(() => Promise.resolve('resultat')) })
    expect(typeof client.generer).toBe('function')
  })

  test('rejette des options absentes', () => {
    expect(() => creerClientGeneration()).toThrow(expect.objectContaining({
      name: 'ErreurClientGeneration',
    }))
  })

  test('rejette options null', () => {
    expect(() => creerClientGeneration(null)).toThrow(TypeError)
  })

  test('rejette options tableau', () => {
    expect(() => creerClientGeneration([])).toThrow(TypeError)
  })

  test('rejette generer absent', () => {
    expect(() => creerClientGeneration({})).toThrow(TypeError)
  })

  test('rejette generer non fonction', () => {
    expect(() => creerClientGeneration({ generer: 'fonction' })).toThrow(TypeError)
  })

  test('retourne un client gele', () => {
    const client = creerClientGeneration({ generer: () => Promise.resolve() })
    expect(Object.isFrozen(client)).toBe(true)
  })

  test('expose une seule methode publique', () => {
    const client = creerClientGeneration({ generer: () => Promise.resolve() })
    expect(Object.keys(client)).toEqual(['generer'])
  })

  test('propage exactement l entree', async () => {
    const entree = Object.freeze({ canonique: true })
    const generer = jest.fn(() => Promise.resolve())
    await creerClientGeneration({ generer }).generer(entree)
    expect(generer).toHaveBeenCalledWith(entree)
  })

  test('propage exactement le resultat', async () => {
    const resultat = Object.freeze({ brut: true })
    const client = creerClientGeneration({ generer: () => Promise.resolve(resultat) })
    await expect(client.generer({})).resolves.toBe(resultat)
  })

  test('retourne exactement la Promise du client injecte', () => {
    const promesse = Promise.resolve('resultat')
    const client = creerClientGeneration({ generer: () => promesse })
    expect(client.generer({})).toBe(promesse)
  })

  test('propage exactement une exception synchrone', () => {
    const cause = new Error('generation impossible')
    const client = creerClientGeneration({
      generer: () => { throw cause },
    })
    expect(() => client.generer({})).toThrow(cause)
  })

  test('propage exactement un rejet Promise', async () => {
    const cause = new Error('generation rejetee')
    const client = creerClientGeneration({ generer: () => Promise.reject(cause) })
    await expect(client.generer({})).rejects.toBe(cause)
  })

  test('appelle generer une seule fois', async () => {
    const generer = jest.fn(() => Promise.resolve())
    await creerClientGeneration({ generer }).generer({})
    expect(generer).toHaveBeenCalledTimes(1)
  })

  test('ne mute ni l entree ni le resultat', async () => {
    const entree = { canonique: { valeur: 1 } }
    const resultat = { brut: { valeur: 2 } }
    const avantEntree = structuredClone(entree)
    const avantResultat = structuredClone(resultat)
    const client = creerClientGeneration({ generer: () => Promise.resolve(resultat) })
    await client.generer(entree)
    expect(entree).toEqual(avantEntree)
    expect(resultat).toEqual(avantResultat)
  })

  test('conserve un resultat asynchrone', () => {
    const client = creerClientGeneration({ generer: () => Promise.resolve('resultat') })
    expect(client.generer({})).toBeInstanceOf(Promise)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerClientGeneration).toBe(creerClientGeneration)
  })
})
