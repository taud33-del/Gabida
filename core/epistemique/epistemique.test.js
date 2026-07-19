import { jest } from '@jest/globals'
import { ErreurValidation } from '../index.js'
import { PRECISIONS_PERCEPTION } from '../../constants/PrecisionsPerception.js'
import {
  CODES_ERREUR_EPISTEMIQUE,
  ErreurEpistemique,
  STATUTS_FAIT_EPISTEMIQUE,
  TYPES_FAIT_EPISTEMIQUE,
  TYPES_PROVENANCE_EPISTEMIQUE,
  mettreAJourEtatEpistemique,
  validerEtatEpistemique,
} from './index.js'
import {
  DATE_ISO,
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  enregistrerProviderDeterministe,
  fabriqueEtatInteraction,
  fabriqueEtatInteractionMulti,
  fabriqueEvenement,
  fabriqueGenerateurId,
  fabriqueParticipant,
  fabriqueSollicitation,
} from '../interaction/fixtures.js'
import { traiterInteraction } from '../interaction/index.js'

const perception = (overrides = {}) => ({
  participantId: PARTICIPANT_ID,
  evenementId: 'evenement-entree',
  perceptible: true,
  contenuPercu: {},
  canaux: [],
  precision: PRECISIONS_PERCEPTION.COMPLETE,
  raisons: [],
  metadata: {},
  ...overrides,
})

function evenementAvec(propositions) {
  return fabriqueEvenement({ metadata: { epistemique: { propositions } } })
}

function executer({ propositions, etatPrive = {}, perceptionCourante = perception(), participant = fabriqueParticipant() }) {
  let id = 0
  return mettreAJourEtatEpistemique({
    participant,
    perception: perceptionCourante,
    evenementCanonique: evenementAvec(propositions),
    etatPrive,
    genererId: role => `${role}-${id++}`,
    genererIdEpistemique: () => `fait-${id++}`,
    date: DATE_ISO,
  })
}

describe('RFC-007 - creation explicite', () => {
  test('absence de metadata ne cree rien et ne modifie pas l etat', () => {
    const etatPrive = { tourCourant: 1 }
    const resultat = mettreAJourEtatEpistemique({
      participant: fabriqueParticipant(), perception: perception(),
      evenementCanonique: fabriqueEvenement(), etatPrive,
      genererId: () => 'trace', date: DATE_ISO,
    })
    expect(resultat.etatEpistemique).toBeUndefined()
    expect(resultat.traces).toEqual([])
    expect(etatPrive).toEqual({ tourCourant: 1 })
  })

  test('proposition ordinaire cree une croyance complete de confiance 1', () => {
    const resultat = executer({ propositions: [{ id: 'porte', proposition: { ouverte: true } }] })
    expect(resultat.etatEpistemique.croyances).toHaveLength(1)
    expect(resultat.etatEpistemique.croyances[0]).toMatchObject({
      id: 'porte', type: TYPES_FAIT_EPISTEMIQUE.CROYANCE,
      statut: STATUTS_FAIT_EPISTEMIQUE.ACTIF, confiance: 1,
    })
  })

  test('SYSTEME cree une connaissance par defaut', () => {
    const resultat = executer({ propositions: [{ proposition: 'vrai', provenanceType: TYPES_PROVENANCE_EPISTEMIQUE.SYSTEME }] })
    expect(resultat.etatEpistemique.connaissances[0].type).toBe(TYPES_FAIT_EPISTEMIQUE.CONNAISSANCE)
  })

  test.each([TYPES_FAIT_EPISTEMIQUE.CONNAISSANCE, TYPES_FAIT_EPISTEMIQUE.CROYANCE])(
    'respecte le type explicite %s', type => {
      const resultat = executer({ propositions: [{ id: 'x', proposition: 'x', type }] })
      const collection = type === TYPES_FAIT_EPISTEMIQUE.CONNAISSANCE ? 'connaissances' : 'croyances'
      expect(resultat.etatEpistemique[collection][0].type).toBe(type)
    }
  )

  test('PARTIELLE donne 0.6 et confiance explicite prevaut', () => {
    const partiel = executer({ propositions: [{ id: 'x', proposition: 'x' }], perceptionCourante: perception({ precision: PRECISIONS_PERCEPTION.PARTIELLE }) })
    const explicite = executer({ propositions: [{ id: 'x', proposition: 'x', confiance: 0.8 }], perceptionCourante: perception({ precision: PRECISIONS_PERCEPTION.PARTIELLE }) })
    expect(partiel.etatEpistemique.croyances[0].confiance).toBe(0.6)
    expect(explicite.etatEpistemique.croyances[0].confiance).toBe(0.8)
  })

  test('participant non percevant et participant non informe ne recoivent rien', () => {
    const nonPercu = executer({ propositions: [{ id: 'x', proposition: 'x' }], perceptionCourante: perception({ perceptible: false, precision: PRECISIONS_PERCEPTION.AUCUNE }) })
    const nonInforme = executer({ propositions: [{ id: 'x', proposition: 'x', participantsInformes: [PARTICIPANT_ID_B] }] })
    expect(nonPercu.etatEpistemique).toBeUndefined()
    expect(nonInforme.etatEpistemique.croyances).toEqual([])
  })

  test('identite priorise proposition.id puis entree.id puis generateur', () => {
    const a = executer({ propositions: [{ id: 'entree', proposition: { id: 'proposition' } }] })
    const b = executer({ propositions: [{ id: 'entree', proposition: {} }] })
    const c = executer({ propositions: [{ proposition: {} }] })
    expect(a.etatEpistemique.croyances[0].id).toBe('proposition')
    expect(b.etatEpistemique.croyances[0].id).toBe('entree')
    expect(c.etatEpistemique.croyances[0].id).toMatch(/^fait-/)
  })
})

describe('RFC-007 - mise a jour, contradiction et remplacement', () => {
  const premier = () => executer({ propositions: [{ id: 'fait', proposition: 'version 1', confiance: 0.4 }] }).etatEpistemique

  test('meme id met a jour sans doublon avec max et sources dedupliquees', () => {
    const initial = premier()
    const resultat = executer({ propositions: [{ id: 'fait', proposition: 'version 2', confiance: 0.9 }], etatPrive: { epistemique: initial } })
    const fait = resultat.etatEpistemique.croyances[0]
    expect(resultat.etatEpistemique.croyances).toHaveLength(1)
    expect(fait.confiance).toBe(0.9)
    expect(fait.provenance).toHaveLength(2)
    expect(fait.evenementSourceIds).toEqual(['evenement-entree'])
    expect(fait.perceptionSourceIds).toEqual([`evenement-entree:${PARTICIPANT_ID}`])
    expect(initial.croyances[0].provenance).toHaveLength(1)
  })

  test('confiance ne diminue jamais', () => {
    const initial = executer({ propositions: [{ id: 'fait', proposition: 'x', confiance: 0.9 }] }).etatEpistemique
    const resultat = executer({ propositions: [{ id: 'fait', proposition: 'x', confiance: 0.2 }], etatPrive: { epistemique: initial } })
    expect(resultat.etatEpistemique.croyances[0].confiance).toBe(0.9)
  })

  test.each([
    ['contreditFaitId', STATUTS_FAIT_EPISTEMIQUE.CONTREDIT],
    ['remplaceFaitId', STATUTS_FAIT_EPISTEMIQUE.REMPLACE],
  ])('%s conserve l ancien fait avec son nouveau statut', (champ, statut) => {
    const initial = premier()
    const resultat = executer({ propositions: [{ id: 'nouveau', proposition: 'nouveau', metadata: { [champ]: 'fait' } }], etatPrive: { epistemique: initial } })
    expect(resultat.etatEpistemique.croyances).toHaveLength(2)
    expect(resultat.etatEpistemique.croyances.find(f => f.id === 'fait').statut).toBe(statut)
    expect(resultat.etatEpistemique.croyances.find(f => f.id === 'nouveau').statut).toBe(STATUTS_FAIT_EPISTEMIQUE.ACTIF)
  })

  test.each([
    ['contreditFaitId', CODES_ERREUR_EPISTEMIQUE.FAIT_CONTREDIT_INTROUVABLE],
    ['remplaceFaitId', CODES_ERREUR_EPISTEMIQUE.FAIT_REMPLACE_INTROUVABLE],
  ])('%s introuvable est une erreur explicite', (champ, code) => {
    expect(() => executer({ propositions: [{ id: 'x', proposition: 'x', metadata: { [champ]: 'absent' } }] }))
      .toThrow(ErreurEpistemique)
    try { executer({ propositions: [{ id: 'x', proposition: 'x', metadata: { [champ]: 'absent' } }] }) }
    catch (error) { expect(error.code).toBe(code) }
  })

  test('aucune contradiction semantique automatique', () => {
    const initial = premier()
    const resultat = executer({ propositions: [{ id: 'autre', proposition: 'contraire' }], etatPrive: { epistemique: initial } })
    expect(resultat.etatEpistemique.croyances.every(f => f.statut === STATUTS_FAIT_EPISTEMIQUE.ACTIF)).toBe(true)
  })
})

describe('RFC-007 - validations et integration', () => {
  test.each([-0.1, 1.1, 'forte'])('rejette la confiance invalide %s', confiance => {
    expect(() => executer({ propositions: [{ proposition: 'x', confiance }] })).toThrow(ErreurEpistemique)
  })

  test('generateur absent est une erreur et ErreurEpistemique etend ErreurValidation', () => {
    expect.assertions(3)
    try {
      mettreAJourEtatEpistemique({ participant: fabriqueParticipant(), perception: perception(), evenementCanonique: evenementAvec([{ proposition: 'x' }]), etatPrive: {}, genererId: () => 'trace', date: DATE_ISO })
    } catch (error) {
      expect(error).toBeInstanceOf(ErreurEpistemique)
      expect(error).toBeInstanceOf(ErreurValidation)
      expect(error.code).toBe(CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_ABSENT)
    }
  })

  test('import initial valide est accepte sans reecriture', () => {
    const etat = executer({ propositions: [{ id: 'initial', proposition: 'x', provenanceType: TYPES_PROVENANCE_EPISTEMIQUE.IMPORT_INITIAL }] }).etatEpistemique
    expect(() => validerEtatEpistemique(etat, PARTICIPANT_ID)).not.toThrow()
    const avant = structuredClone(etat)
    validerEtatEpistemique(etat, PARTICIPANT_ID)
    expect(etat).toEqual(avant)
  })

  let providerConfig
  beforeAll(() => { providerConfig = enregistrerProviderDeterministe() })

  function deps() {
    const ids = fabriqueGenerateurId()
    let epistemique = 0
    return { providerConfig, genererId: ids.genererId, genererIdEpistemique: () => `fait-${epistemique++}`, date: DATE_ISO }
  }

  test('interaction isole les croyances et ne pollue pas l historique canonique', async () => {
    const evenement = evenementAvec([{ id: 'secret', proposition: 'secret', participantsInformes: [PARTICIPANT_ID] }])
    const resultat = await traiterInteraction(fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }), fabriqueEtatInteractionMulti(), deps())
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].epistemique.croyances).toHaveLength(1)
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID_B].epistemique.croyances).toHaveLength(0)
    expect(resultat.etat.historique.every(item => item.type !== TYPES_FAIT_EPISTEMIQUE.CROYANCE)).toBe(true)
  })

  test('propagation rend l etat epistemique de N disponible a N+1 sans faits dans la FIFO', async () => {
    const evenement = evenementAvec([{ id: 'initial', proposition: 'observe' }])
    const resultat = await traiterInteraction(fabriqueSollicitation({ evenement, participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }), fabriqueEtatInteractionMulti(), { ...deps(), propagation: { active: true, profondeurMaximum: 1, nombreMaximumEvenements: 2 } })
    expect(resultat.etat.etatsPrives[PARTICIPANT_ID].epistemique.croyances.some(f => f.id === 'initial')).toBe(true)
    expect(resultat.etat.historique.every(item => Object.hasOwn(item, 'visibilite'))).toBe(true)
  })

  test('erreur epistemique preserve l atomicite totale', async () => {
    const etat = fabriqueEtatInteraction()
    const avant = structuredClone(etat)
    const evenement = evenementAvec([{ proposition: 'x', confiance: 2 }])
    await expect(traiterInteraction(fabriqueSollicitation({ evenement }), etat, deps())).rejects.toBeInstanceOf(ErreurEpistemique)
    expect(etat).toEqual(avant)
  })

  test('memes entrees et dependances donnent les memes sorties', async () => {
    const uuid = jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('souvenir-deterministe')
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000)
    const sollicitation = fabriqueSollicitation({ evenement: evenementAvec([{ proposition: 'x' }]) })
    const a = await traiterInteraction(sollicitation, fabriqueEtatInteraction(), deps())
    const b = await traiterInteraction(sollicitation, fabriqueEtatInteraction(), deps())
    expect(b).toEqual(a)
    uuid.mockRestore()
    now.mockRestore()
  })
})
