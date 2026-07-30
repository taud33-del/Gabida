import { jest } from '@jest/globals'
import { creerResultatGeneration } from './resultat-generation.js'
import { reconstruireEtatDialogue as reconstruireResultatGeneration } from './reconstruction-etat-dialogue.js'

const validerEtatDialogueContextuel = jest.fn()

jest.unstable_mockModule('./validation-contextuelle.js', () => ({
  validerEtatDialogueContextuel,
}))

const { creerGestionnaireEtatDialogue } = await import('./gestionnaire-etat-dialogue.js')

const ETAT_VALIDE = Object.freeze({
  faits: [],
  objectifs: [],
  questionsOuvertes: [],
  decisions: [],
  contraintes: [],
  reponses: [],
  faitsAConfirmer: [],
  evenementSourceIds: ['evt-1'],
  dateMiseAJour: '2026-07-30T10:00:00.000Z',
})

function creerDependances(overrides = {}) {
  const contexte = { evenements: [] }
  const representation = { evenements: [] }
  const specification = { sections: ['section'] }
  const prompt = { contenu: 'prompt' }
  const entree = { contenu: 'prompt' }
  const resultat = creerResultatGeneration(JSON.stringify(ETAT_VALIDE))

  return {
    construireContexteDialogue: jest.fn(() => contexte),
    serialiserContexteDialogue: jest.fn(() => representation),
    construireSpecificationPromptDialogue: jest.fn(() => specification),
    construirePromptGeneration: jest.fn(() => prompt),
    construireEntreeGeneration: jest.fn(() => entree),
    clientGeneration: {
      generer: jest.fn(() => Promise.resolve(resultat)),
    },
    reconstruireEtatDialogue: jest.fn(reconstruireResultatGeneration),
    ...overrides,
  }
}

beforeEach(() => {
  validerEtatDialogueContextuel.mockReset()
})

describe('GestionnaireEtatDialogue', () => {
  test('cree un gestionnaire valide et immutable', () => {
    const gestionnaire = creerGestionnaireEtatDialogue(creerDependances())
    expect(Object.keys(gestionnaire)).toEqual(['reconstruireEtatDialogue'])
    expect(Object.isFrozen(gestionnaire)).toBe(true)
  })

  test.each([undefined, null, [], 'options'])('rejette des options invalides : %p', options => {
    expect(() => creerGestionnaireEtatDialogue(options)).toThrow(expect.objectContaining({
      name: 'ErreurGestionnaireEtatDialogue',
    }))
  })

  test.each([
    'construireContexteDialogue',
    'serialiserContexteDialogue',
    'construireSpecificationPromptDialogue',
    'construirePromptGeneration',
    'construireEntreeGeneration',
    'reconstruireEtatDialogue',
  ])('rejette la dependance absente %s', nom => {
    const dependances = creerDependances()
    delete dependances[nom]
    expect(() => creerGestionnaireEtatDialogue(dependances)).toThrow(TypeError)
  })

  test.each([
    null,
    {},
    { generer: 'invalide' },
  ])('rejette un clientGeneration invalide : %p', clientGeneration => {
    expect(() => creerGestionnaireEtatDialogue(creerDependances({ clientGeneration })))
      .toThrow(TypeError)
  })

  test('retourne un EtatDialogue reconstruit et valide', async () => {
    const historique = [{ id: 'evt-1' }]
    const etatDialogue = await creerGestionnaireEtatDialogue(creerDependances())
      .reconstruireEtatDialogue(historique)
    expect(etatDialogue).toEqual(ETAT_VALIDE)
    expect(validerEtatDialogueContextuel).toHaveBeenCalledWith(etatDialogue, historique)
  })

  test('appelle toutes les etapes dans l ordre exact', async () => {
    const appels = []
    const dependances = creerDependances()
    for (const nom of [
      'construireContexteDialogue',
      'serialiserContexteDialogue',
      'construireSpecificationPromptDialogue',
      'construirePromptGeneration',
      'construireEntreeGeneration',
      'reconstruireEtatDialogue',
    ]) {
      const implementation = dependances[nom].getMockImplementation()
      dependances[nom].mockImplementation((...argumentsRecus) => {
        appels.push(nom)
        return implementation(...argumentsRecus)
      })
    }
    const generer = dependances.clientGeneration.generer.getMockImplementation()
    dependances.clientGeneration.generer.mockImplementation(entree => {
      appels.push('generer')
      return generer(entree)
    })
    validerEtatDialogueContextuel.mockImplementation(() => appels.push('validerEtatDialogueContextuel'))

    await creerGestionnaireEtatDialogue(dependances).reconstruireEtatDialogue([])

    expect(appels).toEqual([
      'construireContexteDialogue',
      'serialiserContexteDialogue',
      'construireSpecificationPromptDialogue',
      'construirePromptGeneration',
      'construireEntreeGeneration',
      'generer',
      'reconstruireEtatDialogue',
      'validerEtatDialogueContextuel',
    ])
  })

  test('transmet chaque resultat sans modification a l etape suivante', async () => {
    const historique = Object.freeze([{ id: 'evt-1' }])
    const dependances = creerDependances()
    const gestionnaire = creerGestionnaireEtatDialogue(dependances)

    await gestionnaire.reconstruireEtatDialogue(historique)

    const contexte = dependances.construireContexteDialogue.mock.results[0].value
    const representation = dependances.serialiserContexteDialogue.mock.results[0].value
    const specification = dependances.construireSpecificationPromptDialogue.mock.results[0].value
    const prompt = dependances.construirePromptGeneration.mock.results[0].value
    const entree = dependances.construireEntreeGeneration.mock.results[0].value
    const resultat = await dependances.clientGeneration.generer.mock.results[0].value
    expect(dependances.construireContexteDialogue).toHaveBeenCalledWith(historique)
    expect(dependances.serialiserContexteDialogue).toHaveBeenCalledWith(contexte)
    expect(dependances.construireSpecificationPromptDialogue).toHaveBeenCalledWith(representation)
    expect(dependances.construirePromptGeneration).toHaveBeenCalledWith(specification)
    expect(dependances.construireEntreeGeneration).toHaveBeenCalledWith(prompt)
    expect(dependances.clientGeneration.generer).toHaveBeenCalledWith(entree)
    expect(dependances.reconstruireEtatDialogue).toHaveBeenCalledWith(resultat)
  })

  test('retourne exactement la reference reconstruite', async () => {
    const etatDialogue = Object.freeze({ projection: true })
    const dependances = creerDependances({
      reconstruireEtatDialogue: jest.fn(() => etatDialogue),
    })
    await expect(creerGestionnaireEtatDialogue(dependances).reconstruireEtatDialogue([]))
      .resolves.toBe(etatDialogue)
  })

  test('ne mute aucune entree ni valeur intermediaire', async () => {
    const historique = [{ id: 'evt-1' }]
    const dependances = creerDependances()
    const valeurs = [
      historique,
      dependances.construireContexteDialogue(),
      dependances.serialiserContexteDialogue(),
      dependances.construireSpecificationPromptDialogue(),
      dependances.construirePromptGeneration(),
      dependances.construireEntreeGeneration(),
    ]
    const avant = structuredClone(valeurs)
    Object.values(dependances).forEach(dependance => {
      if (typeof dependance?.mockClear === 'function') dependance.mockClear()
    })

    await creerGestionnaireEtatDialogue(dependances).reconstruireEtatDialogue(historique)

    expect(valeurs).toEqual(avant)
  })

  test.each([
    'construireContexteDialogue',
    'serialiserContexteDialogue',
    'construireSpecificationPromptDialogue',
    'construirePromptGeneration',
    'construireEntreeGeneration',
    'reconstruireEtatDialogue',
  ])('propage l exception de %s', async nom => {
    const cause = new Error(`${nom} impossible`)
    const dependances = creerDependances({
      [nom]: jest.fn(() => { throw cause }),
    })
    await expect(creerGestionnaireEtatDialogue(dependances).reconstruireEtatDialogue([]))
      .rejects.toBe(cause)
  })

  test('propage le rejet du client', async () => {
    const cause = new Error('generation impossible')
    const dependances = creerDependances({
      clientGeneration: {
        generer: jest.fn(() => Promise.reject(cause)),
      },
    })
    await expect(creerGestionnaireEtatDialogue(dependances).reconstruireEtatDialogue([]))
      .rejects.toBe(cause)
  })

  test('propage l exception du validateur', async () => {
    const cause = new Error('projection invalide')
    validerEtatDialogueContextuel.mockImplementation(() => { throw cause })
    await expect(creerGestionnaireEtatDialogue(creerDependances()).reconstruireEtatDialogue([]))
      .rejects.toBe(cause)
  })

  test('appelle chaque etape une seule fois', async () => {
    const dependances = creerDependances()
    await creerGestionnaireEtatDialogue(dependances).reconstruireEtatDialogue([])
    expect(dependances.construireContexteDialogue).toHaveBeenCalledTimes(1)
    expect(dependances.serialiserContexteDialogue).toHaveBeenCalledTimes(1)
    expect(dependances.construireSpecificationPromptDialogue).toHaveBeenCalledTimes(1)
    expect(dependances.construirePromptGeneration).toHaveBeenCalledTimes(1)
    expect(dependances.construireEntreeGeneration).toHaveBeenCalledTimes(1)
    expect(dependances.clientGeneration.generer).toHaveBeenCalledTimes(1)
    expect(dependances.reconstruireEtatDialogue).toHaveBeenCalledTimes(1)
    expect(validerEtatDialogueContextuel).toHaveBeenCalledTimes(1)
  })
})
