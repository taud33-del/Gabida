import { jest } from '@jest/globals'
import { creerClientGenerationOpenAI } from './client-generation-openai.js'
import * as apiDialogue from './index.js'

function creerOptions(overrides = {}) {
  return {
    client: {
      responses: {
        create: jest.fn(() => Promise.resolve({ output_text: 'texte genere' })),
      },
    },
    modele: 'modele-test',
    ...overrides,
  }
}

describe('RFC-018.6a - ClientGenerationOpenAI', () => {
  test('cree un client valide', () => {
    expect(typeof creerClientGenerationOpenAI(creerOptions()).generer).toBe('function')
  })

  test('rejette des options absentes', () => {
    expect(() => creerClientGenerationOpenAI()).toThrow(expect.objectContaining({
      name: 'ErreurClientGenerationOpenAI',
    }))
  })

  test('rejette un client absent', () => {
    expect(() => creerClientGenerationOpenAI({ modele: 'modele-test' })).toThrow(TypeError)
  })

  test('rejette un client invalide', () => {
    expect(() => creerClientGenerationOpenAI({
      client: 'client',
      modele: 'modele-test',
    })).toThrow(TypeError)
  })

  test('rejette responses absent', () => {
    expect(() => creerClientGenerationOpenAI({
      client: {},
      modele: 'modele-test',
    })).toThrow(TypeError)
  })

  test('rejette create absent', () => {
    expect(() => creerClientGenerationOpenAI({
      client: { responses: {} },
      modele: 'modele-test',
    })).toThrow(TypeError)
  })

  test('rejette modele absent', () => {
    const options = creerOptions()
    delete options.modele
    expect(() => creerClientGenerationOpenAI(options)).toThrow(TypeError)
  })

  test('rejette modele vide', () => {
    expect(() => creerClientGenerationOpenAI(creerOptions({ modele: '  ' }))).toThrow(TypeError)
  })

  test('retourne un client gele', () => {
    expect(Object.isFrozen(creerClientGenerationOpenAI(creerOptions()))).toBe(true)
  })

  test('expose une seule methode publique', () => {
    expect(Object.keys(creerClientGenerationOpenAI(creerOptions()))).toEqual(['generer'])
  })

  test('appelle responses.create une seule fois', async () => {
    const options = creerOptions()
    await creerClientGenerationOpenAI(options).generer({})
    expect(options.client.responses.create).toHaveBeenCalledTimes(1)
  })

  test('transmet exactement les parametres attendus', async () => {
    const entree = Object.freeze({ contenu: '{"evenements":[]}' })
    const options = creerOptions()
    await creerClientGenerationOpenAI(options).generer(entree)
    expect(options.client.responses.create).toHaveBeenCalledWith({
      model: 'modele-test',
      input: entree.contenu,
    })
  })

  test('transmet les options structurees et le timeout quand ils sont demandes', async () => {
    const options = creerOptions()
    const format = { type: 'json_schema', name: 'test', strict: true, schema: { type: 'object' } }
    await creerClientGenerationOpenAI(options).generer(
      { contenu: 'entree' },
      { request: { text: { format } }, timeoutMs: 2500 },
    )
    expect(options.client.responses.create).toHaveBeenCalledWith({
      model: 'modele-test',
      input: 'entree',
      text: { format },
    }, { timeout: 2500 })
  })

  test('transmet exactement le modele', async () => {
    const options = creerOptions({ modele: 'modele-exact' })
    await creerClientGenerationOpenAI(options).generer({})
    expect(options.client.responses.create.mock.calls[0][0].model).toBe('modele-exact')
  })

  test('transmet exactement l entree', async () => {
    const entree = Object.freeze({ contenu: '{"canonique":true}' })
    const options = creerOptions()
    await creerClientGenerationOpenAI(options).generer(entree)
    expect(options.client.responses.create.mock.calls[0][0].input).toBe(entree.contenu)
  })

  test('extrait output_text sans le modifier', async () => {
    const contenu = '  texte\ngenere  '
    const options = creerOptions({
      client: {
        responses: {
          create: jest.fn(() => Promise.resolve({ output_text: contenu })),
        },
      },
    })
    await expect(creerClientGenerationOpenAI(options).generer({}))
      .resolves.toEqual({ contenu })
  })

  test('retourne un ResultatGeneration gele', async () => {
    const resultat = await creerClientGenerationOpenAI(creerOptions()).generer({})
    expect(resultat).toEqual({ contenu: 'texte genere' })
    expect(Object.isFrozen(resultat)).toBe(true)
  })

  test('retourne une Promise', () => {
    expect(creerClientGenerationOpenAI(creerOptions()).generer({})).toBeInstanceOf(Promise)
  })

  test('propage exactement un rejet du SDK', async () => {
    const cause = new Error('reseau indisponible')
    const options = creerOptions({
      client: {
        responses: {
          create: jest.fn(() => Promise.reject(cause)),
        },
      },
    })
    await expect(creerClientGenerationOpenAI(options).generer({})).rejects.toBe(cause)
  })

  test('propage une exception synchrone du SDK comme rejet de la Promise', async () => {
    const cause = new Error('appel impossible')
    const options = creerOptions({
      client: {
        responses: {
          create: jest.fn(() => { throw cause }),
        },
      },
    })
    await expect(creerClientGenerationOpenAI(options).generer({})).rejects.toBe(cause)
  })

  test('ne mute aucune valeur', async () => {
    const entree = { contenu: '{"valeur":1}' }
    const reponse = { output_text: 'texte genere' }
    const avantEntree = structuredClone(entree)
    const avantReponse = structuredClone(reponse)
    const options = creerOptions({
      client: {
        responses: {
          create: jest.fn(() => Promise.resolve(reponse)),
        },
      },
    })
    await creerClientGenerationOpenAI(options).generer(entree)
    expect(entree).toEqual(avantEntree)
    expect(reponse).toEqual(avantReponse)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerClientGenerationOpenAI).toBe(creerClientGenerationOpenAI)
  })
})
