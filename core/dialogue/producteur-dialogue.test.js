import { jest } from '@jest/globals'
import { creerProducteurDialogue } from './producteur-dialogue.js'
import * as apiDialogue from './index.js'

function creerDependances(overrides = {}) {
  return {
    serialiserContexteDialogue: jest.fn(() => ({ evenements: [] })),
    construireSpecificationPromptDialogue: jest.fn(() => ({ sections: ['{"evenements":[]}'] })),
    construirePromptGeneration: jest.fn(() => ({ contenu: '{"evenements":[]}' })),
    construireEntreeGeneration: jest.fn(() => ({ contenu: '{"evenements":[]}' })),
    clientGeneration: {
      generer: jest.fn(() => Promise.resolve({ brut: true })),
    },
    ...overrides,
  }
}

describe('ProducteurDialogue', () => {
  test('cree un producteur valide', () => {
    expect(typeof creerProducteurDialogue(creerDependances()).produire).toBe('function')
  })

  test('rejette des options absentes', () => {
    expect(() => creerProducteurDialogue()).toThrow(expect.objectContaining({
      name: 'ErreurProducteurDialogue',
    }))
  })

  test('rejette un serialiseur absent', () => {
    expect(() => creerProducteurDialogue({
      clientGeneration: { generer: () => Promise.resolve() },
    })).toThrow(TypeError)
  })

  test('rejette un client absent', () => {
    expect(() => creerProducteurDialogue({
      serialiserContexteDialogue: () => ({}),
      construireSpecificationPromptDialogue: () => ({ sections: ['{}'] }),
      construirePromptGeneration: () => ({ contenu: '{}' }),
      construireEntreeGeneration: () => ({ contenu: '{}' }),
    })).toThrow(TypeError)
  })

  test('rejette generer absent', () => {
    expect(() => creerProducteurDialogue({
      serialiserContexteDialogue: () => ({}),
      construireSpecificationPromptDialogue: () => ({ sections: ['{}'] }),
      construirePromptGeneration: () => ({ contenu: '{}' }),
      construireEntreeGeneration: () => ({ contenu: '{}' }),
      clientGeneration: {},
    })).toThrow(TypeError)
  })

  test('rejette un constructeur entree absent', () => {
    expect(() => creerProducteurDialogue({
      serialiserContexteDialogue: () => ({}),
      construireSpecificationPromptDialogue: () => ({ sections: ['{}'] }),
      construirePromptGeneration: () => ({ contenu: '{}' }),
      clientGeneration: { generer: () => Promise.resolve() },
    })).toThrow(TypeError)
  })

  test('rejette un constructeur prompt absent', () => {
    expect(() => creerProducteurDialogue({
      serialiserContexteDialogue: () => ({}),
      construireSpecificationPromptDialogue: () => ({ sections: ['{}'] }),
      construireEntreeGeneration: () => ({ contenu: '{}' }),
      clientGeneration: { generer: () => Promise.resolve() },
    })).toThrow(TypeError)
  })

  test('rejette un constructeur specification absent', () => {
    expect(() => creerProducteurDialogue({
      serialiserContexteDialogue: () => ({}),
      construirePromptGeneration: () => ({ contenu: '{}' }),
      construireEntreeGeneration: () => ({ contenu: '{}' }),
      clientGeneration: { generer: () => Promise.resolve() },
    })).toThrow(TypeError)
  })

  test('retourne un producteur gele', () => {
    expect(Object.isFrozen(creerProducteurDialogue(creerDependances()))).toBe(true)
  })

  test('expose une seule methode publique', () => {
    expect(Object.keys(creerProducteurDialogue(creerDependances()))).toEqual(['produire'])
  })

  test('appelle le serialiseur une seule fois', async () => {
    const dependances = creerDependances()
    await creerProducteurDialogue(dependances).produire({})
    expect(dependances.serialiserContexteDialogue).toHaveBeenCalledTimes(1)
  })

  test('appelle le client une seule fois', async () => {
    const dependances = creerDependances()
    await creerProducteurDialogue(dependances).produire({})
    expect(dependances.clientGeneration.generer).toHaveBeenCalledTimes(1)
  })

  test('appelle le constructeur entree une seule fois', async () => {
    const dependances = creerDependances()
    await creerProducteurDialogue(dependances).produire({})
    expect(dependances.construireEntreeGeneration).toHaveBeenCalledTimes(1)
  })

  test('appelle le constructeur prompt une seule fois', async () => {
    const dependances = creerDependances()
    await creerProducteurDialogue(dependances).produire({})
    expect(dependances.construirePromptGeneration).toHaveBeenCalledTimes(1)
  })

  test('appelle le constructeur specification une seule fois', async () => {
    const dependances = creerDependances()
    await creerProducteurDialogue(dependances).produire({})
    expect(dependances.construireSpecificationPromptDialogue).toHaveBeenCalledTimes(1)
  })

  test('respecte l ordre exact des appels', async () => {
    const appels = []
    const dependances = creerDependances({
      serialiserContexteDialogue: jest.fn(() => {
        appels.push('serialiser')
        return {}
      }),
      construireSpecificationPromptDialogue: jest.fn(() => {
        appels.push('specification')
        return { sections: ['{}'] }
      }),
      construirePromptGeneration: jest.fn(() => {
        appels.push('construirePrompt')
        return { contenu: '{}' }
      }),
      construireEntreeGeneration: jest.fn(() => {
        appels.push('construireEntree')
        return { contenu: '{}' }
      }),
      clientGeneration: {
        generer: jest.fn(() => {
          appels.push('generer')
          return Promise.resolve()
        }),
      },
    })
    await creerProducteurDialogue(dependances).produire({})
    expect(appels).toEqual(['serialiser', 'specification', 'construirePrompt', 'construireEntree', 'generer'])
  })

  test('transmet le contexte intact au serialiseur', async () => {
    const contexte = Object.freeze({ evenements: Object.freeze([]) })
    const dependances = creerDependances()
    await creerProducteurDialogue(dependances).produire(contexte)
    expect(dependances.serialiserContexteDialogue).toHaveBeenCalledWith(contexte)
  })

  test('transmet l entree serialisee intacte au client', async () => {
    const representation = Object.freeze({ canonique: true })
    const specification = Object.freeze({ sections: Object.freeze(['{"canonique":true}']) })
    const prompt = Object.freeze({ contenu: '{"canonique":true}' })
    const entree = Object.freeze({ contenu: '{"canonique":true}' })
    const dependances = creerDependances({
      serialiserContexteDialogue: jest.fn(() => representation),
      construireSpecificationPromptDialogue: jest.fn(() => specification),
      construirePromptGeneration: jest.fn(() => prompt),
      construireEntreeGeneration: jest.fn(() => entree),
    })
    await creerProducteurDialogue(dependances).produire({})
    expect(dependances.construireSpecificationPromptDialogue).toHaveBeenCalledWith(representation)
    expect(dependances.construirePromptGeneration).toHaveBeenCalledWith(specification)
    expect(dependances.construireEntreeGeneration).toHaveBeenCalledWith(prompt)
    expect(dependances.clientGeneration.generer).toHaveBeenCalledWith(entree)
  })

  test('propage exactement la Promise du client', () => {
    const promesse = Promise.resolve({ brut: true })
    const dependances = creerDependances({
      clientGeneration: { generer: jest.fn(() => promesse) },
    })
    expect(creerProducteurDialogue(dependances).produire({})).toBe(promesse)
  })

  test('propage exactement le resultat', async () => {
    const resultat = Object.freeze({ brut: true })
    const dependances = creerDependances({
      clientGeneration: { generer: jest.fn(() => Promise.resolve(resultat)) },
    })
    await expect(creerProducteurDialogue(dependances).produire({})).resolves.toBe(resultat)
  })

  test('propage l exception du serialiseur', () => {
    const cause = new Error('serialisation impossible')
    const dependances = creerDependances({
      serialiserContexteDialogue: jest.fn(() => { throw cause }),
    })
    expect(() => creerProducteurDialogue(dependances).produire({})).toThrow(cause)
  })

  test('propage l exception synchrone du client', () => {
    const cause = new Error('generation impossible')
    const dependances = creerDependances({
      clientGeneration: { generer: jest.fn(() => { throw cause }) },
    })
    expect(() => creerProducteurDialogue(dependances).produire({})).toThrow(cause)
  })

  test('propage le rejet Promise du client', async () => {
    const cause = new Error('generation rejetee')
    const dependances = creerDependances({
      clientGeneration: { generer: jest.fn(() => Promise.reject(cause)) },
    })
    await expect(creerProducteurDialogue(dependances).produire({})).rejects.toBe(cause)
  })

  test('ne mute aucune valeur', async () => {
    const contexte = { evenements: [{ id: 'evt-1' }] }
    const entree = { canonique: true }
    const specification = { sections: ['{"canonique":true}'] }
    const prompt = { contenu: '{"canonique":true}' }
    const entreeGeneration = { contenu: '{"canonique":true}' }
    const resultat = { brut: true }
    const avant = {
      contexte: structuredClone(contexte),
      entree: structuredClone(entree),
      specification: structuredClone(specification),
      prompt: structuredClone(prompt),
      entreeGeneration: structuredClone(entreeGeneration),
      resultat: structuredClone(resultat),
    }
    const dependances = creerDependances({
      serialiserContexteDialogue: jest.fn(() => entree),
      construireSpecificationPromptDialogue: jest.fn(() => specification),
      construirePromptGeneration: jest.fn(() => prompt),
      construireEntreeGeneration: jest.fn(() => entreeGeneration),
      clientGeneration: { generer: jest.fn(() => Promise.resolve(resultat)) },
    })
    await creerProducteurDialogue(dependances).produire(contexte)
    expect({ contexte, entree, specification, prompt, entreeGeneration, resultat }).toEqual(avant)
  })

  test('est expose par l API publique', () => {
    expect(apiDialogue.creerProducteurDialogue).toBe(creerProducteurDialogue)
  })
})
