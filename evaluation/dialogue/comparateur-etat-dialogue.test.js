import { comparerEtatsDialogue } from './comparateur-etat-dialogue.js'

const DATE = '2026-01-10T09:00:00.000Z'

function creerEtat(overrides = {}) {
  return {
    faits: [{
      id: 'fait-1',
      contenu: 'Un fait.',
      evenementSourceIds: ['evt-1'],
      dateMiseAJour: DATE,
    }],
    objectifs: [{
      id: 'objectif-1',
      contenu: 'Un objectif.',
      participantIds: ['joueur'],
      evenementSourceIds: ['evt-1'],
      dateMiseAJour: DATE,
    }],
    questionsOuvertes: [],
    decisions: [{
      id: 'decision-1',
      contenu: 'Une décision.',
      participantIds: ['joueur'],
      evenementSourceIds: ['evt-1'],
      dateDecision: DATE,
    }],
    contraintes: [],
    reponses: [],
    faitsAConfirmer: [],
    evenementSourceIds: ['evt-1'],
    dateMiseAJour: DATE,
    ...overrides,
  }
}

describe('RFC-022 - comparerEtatsDialogue', () => {
  test('reconnaît une égalité parfaite', () => {
    const etat = creerEtat()
    expect(comparerEtatsDialogue(etat, structuredClone(etat))).toEqual({
      conforme: true,
      ecarts: [],
    })
  })

  test('détecte un fait manquant', () => {
    const comparaison = comparerEtatsDialogue(creerEtat(), creerEtat({ faits: [] }))
    expect(comparaison.conforme).toBe(false)
    expect(comparaison.ecarts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        section: 'faits',
        type: 'manquant',
      }),
    ]))
  })

  test('détecte un objectif supplémentaire', () => {
    const obtenu = creerEtat()
    obtenu.objectifs.push({
      id: 'objectif-2',
      contenu: 'Un autre objectif.',
      participantIds: [],
      evenementSourceIds: ['evt-1'],
      dateMiseAJour: DATE,
    })
    const comparaison = comparerEtatsDialogue(creerEtat(), obtenu)
    expect(comparaison.ecarts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        section: 'objectifs',
        type: 'supplementaire',
      }),
    ]))
  })

  test('détecte une décision différente', () => {
    const obtenu = creerEtat()
    obtenu.decisions[0].contenu = 'Une autre décision.'
    const comparaison = comparerEtatsDialogue(creerEtat(), obtenu)
    expect(comparaison.ecarts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        section: 'decisions',
        type: 'different',
      }),
    ]))
  })

  test('ignore l ordre des collections lorsque leur contenu est identique', () => {
    const faitSupplementaire = {
      id: 'fait-2',
      contenu: 'Un autre fait.',
      evenementSourceIds: ['evt-1'],
      dateMiseAJour: DATE,
    }
    const attendu = creerEtat({ faits: [creerEtat().faits[0], faitSupplementaire] })
    const obtenu = creerEtat({ faits: [faitSupplementaire, creerEtat().faits[0]] })
    expect(comparerEtatsDialogue(attendu, obtenu).conforme).toBe(true)
  })

  test('détecte un événement source absent', () => {
    const comparaison = comparerEtatsDialogue(
      creerEtat({ evenementSourceIds: ['evt-1', 'evt-2'] }),
      creerEtat({ evenementSourceIds: ['evt-1'] }),
    )
    expect(comparaison.ecarts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        section: 'evenementSourceIds',
        type: 'different',
      }),
    ]))
  })

  test('ne modifie aucun EtatDialogue', () => {
    const attendu = creerEtat()
    const obtenu = structuredClone(attendu)
    const avantAttendu = structuredClone(attendu)
    const avantObtenu = structuredClone(obtenu)
    comparerEtatsDialogue(attendu, obtenu)
    expect(attendu).toEqual(avantAttendu)
    expect(obtenu).toEqual(avantObtenu)
  })
})
