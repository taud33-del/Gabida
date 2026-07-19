import {
  CODES_ERREUR_TRANSMISSION,
  CONFIANCE_TRANSMISSION_PAR_DEFAUT,
  ErreurTransmission,
  ETAPES_TRACE_TRANSMISSION,
  TYPES_RESULTAT_TRANSMISSION,
  construirePropositionsTransmises,
  finaliserTransmissionsInformation,
  preparerTransmissionsInformation,
  validerEtatTransmissions,
} from './index.js'
import { ErreurValidation } from '../index.js'
import { mettreAJourEtatEpistemique } from '../epistemique/index.js'

const DATE = '2026-07-19T12:00:00.000Z'
const participants = { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' } }
const perception = { perceptible: true, precision: 'complete' }

function faitSource(extra = {}) {
  return {
    id: 'fait-source', participantId: 'a', proposition: { id: 'secret', valeur: 42 },
    type: 'connaissance', statut: 'actif', confiance: 1, provenance: [],
    evenementSourceIds: [], perceptionSourceIds: [], dateCreation: DATE,
    dateMiseAJour: DATE, metadata: {}, ...extra,
  }
}

function etat(extra = {}) {
  return {
    participants,
    etatsPrives: {
      a: { epistemique: { connaissances: [faitSource()], croyances: [] } },
      b: {}, c: {},
    },
    ...extra,
  }
}

function instruction(extra = {}) {
  return {
    id: 'transmission-1', emetteurId: 'a', destinataireIds: ['b'],
    proposition: { id: 'information', valeur: 'x' }, ...extra,
  }
}

function evenement(informations, extra = {}) {
  return { id: 'evt-1', metadata: { transmissions: { informations } }, ...extra }
}

function preparer(informations = [instruction()], options = {}) {
  let id = 0
  return preparerTransmissionsInformation({
    evenementCanonique: evenement(informations),
    etatInteraction: options.etatInteraction ?? etat(),
    genererIdTransmission: options.genererIdTransmission ?? (() => `transmission-generee-${id++}`),
    date: DATE,
  })
}

function appliquerParticipant(plan, participantId = 'b', perceptionCourante = perception, etatPrive = {}) {
  let idFait = 0
  const propositions = construirePropositionsTransmises({ plan, participant: participants[participantId], perception: perceptionCourante })
  return mettreAJourEtatEpistemique({
    participant: participants[participantId], perception: perceptionCourante,
    evenementCanonique: { id: 'evt-1', metadata: {} }, etatPrive,
    propositionsSupplementaires: propositions,
    genererId: role => `${role}-x`, genererIdEpistemique: () => `fait-${idFait++}`,
    genererIdRevision: () => 'revision', genererIdVersionFait: () => 'version', date: DATE,
  })
}

describe('RFC-010 - preparation et validation', () => {
  test('absence de metadata.transmissions ne produit aucun plan', () => {
    expect(preparerTransmissionsInformation({ evenementCanonique: { id: 'evt', metadata: {} }, etatInteraction: etat(), date: DATE })).toBeUndefined()
  })

  test('cree une transmission explicite complete et active', () => {
    expect(preparer().transmissions[0]).toMatchObject({
      id: 'transmission-1', emetteurId: 'a', destinataireIds: ['b'],
      faitSourceId: null, typeResultat: 'croyance', confiance: 0.5,
      statut: 'active', evenementId: 'evt-1', date: DATE,
    })
  })

  test('conserve un id explicite', () => expect(preparer().transmissions[0].id).toBe('transmission-1'))

  test('utilise un generateur injecte lorsque l id est absent', () => {
    expect(preparer([{ ...instruction(), id: undefined }]).transmissions[0].id).toBe('transmission-generee-0')
  })

  test('rejette un generateur absent', () => {
    expect(() => preparerTransmissionsInformation({ evenementCanonique: evenement([{ ...instruction(), id: undefined }]), etatInteraction: etat(), date: DATE }))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.GENERATEUR_ID_TRANSMISSION_ABSENT }))
  })

  test('rejette deux transmissions portant le meme id', () => {
    expect(() => preparer([instruction(), instruction({ destinataireIds: ['c'] })]))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.TRANSMISSION_ID_DUPLIQUE }))
  })

  test('rejette un id deja present dans un historique prive', () => {
    const initial = etat()
    initial.etatsPrives.a.transmissions = { emises: [{ ...preparer().transmissions[0] }], recues: [] }
    expect(() => preparer([instruction()], { etatInteraction: initial }))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.TRANSMISSION_ID_DUPLIQUE }))
  })

  test.each([
    [null, CODES_ERREUR_TRANSMISSION.STRUCTURE_TRANSMISSIONS_INVALIDE],
    [{}, CODES_ERREUR_TRANSMISSION.STRUCTURE_TRANSMISSIONS_INVALIDE],
  ])('rejette une structure globale invalide %#', structure => {
    expect(() => preparerTransmissionsInformation({ evenementCanonique: { id: 'evt', metadata: { transmissions: structure } }, etatInteraction: etat(), date: DATE }))
      .toThrow(ErreurTransmission)
  })

  test('rejette une proposition absente', () => {
    const invalide = instruction(); delete invalide.proposition
    expect(() => preparer([invalide])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.PROPOSITION_TRANSMISSION_INVALIDE }))
  })

  test('rejette un emetteur inconnu', () => {
    expect(() => preparer([instruction({ emetteurId: 'absent' })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.EMETTEUR_TRANSMISSION_INTROUVABLE }))
  })

  test('rejette un destinataire inconnu', () => {
    expect(() => preparer([instruction({ destinataireIds: ['absent'] })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.DESTINATAIRE_TRANSMISSION_INTROUVABLE }))
  })

  test('rejette un destinataire duplique', () => {
    expect(() => preparer([instruction({ destinataireIds: ['b', 'b'] })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.DESTINATAIRE_TRANSMISSION_DUPLIQUE }))
  })

  test('rejette une transmission vers soi', () => {
    expect(() => preparer([instruction({ destinataireIds: ['a'] })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.TRANSMISSION_VERS_SOI_INTERDITE }))
  })

  test('conserve l ordre des transmissions et des destinataires', () => {
    const plan = preparer([
      instruction({ id: 't1', destinataireIds: ['c', 'b'] }),
      instruction({ id: 't2', destinataireIds: ['b'] }),
    ])
    expect(plan.transmissions.map(item => item.id)).toEqual(['t1', 't2'])
    expect(plan.transmissions[0].destinataireIds).toEqual(['c', 'b'])
  })

  test('la confiance explicite est conservee', () => expect(preparer([instruction({ confiance: 0.8 })]).transmissions[0].confiance).toBe(0.8))
  test('la confiance par defaut vaut 0.5', () => expect(preparer().transmissions[0].confiance).toBe(CONFIANCE_TRANSMISSION_PAR_DEFAUT))

  test.each([-0.1, 1.1, NaN, Infinity])('rejette la confiance invalide %s', confiance => {
    expect(() => preparer([instruction({ confiance })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.CONFIANCE_TRANSMISSION_INVALIDE }))
  })

  test('CROYANCE est le type par defaut', () => expect(preparer().transmissions[0].typeResultat).toBe(TYPES_RESULTAT_TRANSMISSION.CROYANCE))

  test('CONNAISSANCE exige et accepte une autorisation explicite', () => {
    expect(() => preparer([instruction({ typeResultat: 'connaissance' })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.TYPE_RESULTAT_TRANSMISSION_INVALIDE }))
    expect(preparer([instruction({ typeResultat: 'connaissance', metadata: { autorisationConnaissance: true } })]).transmissions[0].typeResultat).toBe('connaissance')
  })

  test('rejette un type resultat inconnu', () => {
    expect(() => preparer([instruction({ typeResultat: 'rumeur' })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.TYPE_RESULTAT_TRANSMISSION_INVALIDE }))
  })

  test('rejette un statut d instruction autre qu active', () => {
    expect(() => preparer([instruction({ statut: 'annulee' })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.STATUT_TRANSMISSION_INVALIDE }))
  })

  test('ErreurTransmission etend ErreurValidation', () => {
    try { preparer([instruction({ destinataireIds: [] })]) } catch (error) {
      expect(error).toBeInstanceOf(ErreurTransmission)
      expect(error).toBeInstanceOf(ErreurValidation)
    }
  })
})

describe('RFC-010 - fait source', () => {
  test('une transmission sans faitSourceId est autorisee', () => expect(preparer().transmissions[0].faitSourceId).toBeNull())

  test('un fait source actif et coherent est accepte', () => {
    const plan = preparer([instruction({ proposition: { id: 'secret', valeur: 42 }, faitSourceId: 'fait-source' })])
    expect(plan.transmissions[0].faitSourceId).toBe('fait-source')
  })

  test('un fait source introuvable est rejete', () => {
    expect(() => preparer([instruction({ faitSourceId: 'absent' })])).toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.FAIT_SOURCE_INTROUVABLE }))
  })

  test.each(['suspendu', 'obsolete', 'expire', 'invalide'])('un fait source %s est rejete', statut => {
    const initial = etat()
    initial.etatsPrives.a.epistemique.connaissances[0].statut = statut
    expect(() => preparer([instruction({ proposition: { id: 'secret', valeur: 42 }, faitSourceId: 'fait-source' })], { etatInteraction: initial }))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.FAIT_SOURCE_INACTIF }))
  })

  test('une proposition incoherente avec le fait source est rejetee', () => {
    expect(() => preparer([instruction({ proposition: { id: 'secret', valeur: 41 }, faitSourceId: 'fait-source' })]))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.FAIT_SOURCE_INCOHERENT }))
  })
})

describe('RFC-010 - conversion epistemique et finalisation', () => {
  test('produit une proposition epistemique COMMUNICATION ordonnee', () => {
    const propositions = construirePropositionsTransmises({ plan: preparer(), participant: participants.b, perception })
    expect(propositions[0]).toMatchObject({
      type: 'croyance', confiance: 0.5, provenanceType: 'communication',
      sourceId: 'transmission-1', participantSourceId: 'a', participantsInformes: ['b'],
    })
  })

  test('un destinataire non percevant ne recoit aucune proposition', () => {
    expect(construirePropositionsTransmises({ plan: preparer(), participant: participants.b, perception: { perceptible: false, precision: 'aucune' } })).toEqual([])
  })

  test('un destinataire hors participantsConcernes est ignore', () => {
    const plan = preparer([instruction({ participantsConcernes: ['c'] })])
    expect(construirePropositionsTransmises({ plan, participant: participants.b, perception })).toEqual([])
  })

  test('cree une croyance par le moteur epistemique existant', () => {
    const resultat = appliquerParticipant(preparer())
    expect(resultat.faitsCrees[0]).toMatchObject({ type: 'croyance', confiance: 0.5, proposition: { id: 'information', valeur: 'x' } })
  })

  test('cree une connaissance explicitement autorisee', () => {
    const plan = preparer([instruction({ typeResultat: 'connaissance', metadata: { autorisationConnaissance: true } })])
    expect(appliquerParticipant(plan).faitsCrees[0].type).toBe('connaissance')
  })

  test('la provenance identifie la communication, la source, l evenement et la perception', () => {
    const provenance = appliquerParticipant(preparer()).faitsCrees[0].provenance[0]
    expect(provenance).toMatchObject({
      type: 'communication', sourceId: 'transmission-1', evenementId: 'evt-1',
      participantSourceId: 'a', precisionPerception: 'complete', confianceInitiale: 0.5,
      metadata: { transmissionId: 'transmission-1' },
    })
  })

  test('met a jour un fait existant sans doublon et ajoute une provenance immuable', () => {
    const premier = appliquerParticipant(preparer())
    const initial = { epistemique: premier.etatEpistemique }
    const avant = structuredClone(initial)
    const secondPlan = preparer([instruction({ id: 'transmission-2', confiance: 0.8 })])
    const second = appliquerParticipant(secondPlan, 'b', perception, initial)
    expect(second.etatEpistemique.croyances).toHaveLength(1)
    expect(second.etatEpistemique.croyances[0].confiance).toBe(0.8)
    expect(second.etatEpistemique.croyances[0].provenance).toHaveLength(2)
    expect(initial).toEqual(avant)
  })

  test('enregistre emises, recues, resultats et traces sans proposition complete', () => {
    const plan = preparer()
    const resultatEpistemique = appliquerParticipant(plan)
    let traceId = 0
    const final = finaliserTransmissionsInformation({
      plan,
      evaluations: [{ participant: participants.b, perception }],
      resultatsEpistemiques: new Map([['b', resultatEpistemique]]),
      etatsPrives: { a: etat().etatsPrives.a, b: { epistemique: resultatEpistemique.etatEpistemique } },
      genererId: () => `trace-${traceId++}`, date: DATE,
    })
    expect(final.etatsPrives.a.transmissions.emises).toHaveLength(1)
    expect(final.etatsPrives.b.transmissions.recues[0]).toMatchObject({ transmissionId: 'transmission-1', appliquee: true, faitEpistemiqueId: 'information' })
    expect(final.transmissionsAppliquees).toHaveLength(1)
    expect(final.traces.some(item => item.etape === ETAPES_TRACE_TRANSMISSION.RECUE)).toBe(true)
    expect(final.traces.every(item => !Object.hasOwn(item.donnees, 'proposition'))).toBe(true)
  })

  test('conserve l ordre transmission puis destinataires dans les resultats', () => {
    const plan = preparer([instruction({ id: 't1', destinataireIds: ['c', 'b'] }), instruction({ id: 't2' })])
    const resultats = new Map([['b', appliquerParticipant(plan, 'b')], ['c', appliquerParticipant(plan, 'c')]])
    const final = finaliserTransmissionsInformation({
      plan,
      evaluations: [{ participant: participants.b, perception }, { participant: participants.c, perception }],
      resultatsEpistemiques: resultats, etatsPrives: { a: {}, b: {}, c: {} },
      genererId: () => 'trace', date: DATE,
    })
    expect([...final.transmissionsAppliquees, ...final.transmissionsIgnorees].map(item => `${item.transmissionId}:${item.destinataireId}`))
      .toEqual(['t1:c', 't1:b', 't2:b'])
  })

  test('un non-percevant produit un resultat ignore sans fait', () => {
    const plan = preparer()
    const nonPercu = { perceptible: false, precision: 'aucune' }
    const resultat = appliquerParticipant(plan, 'b', nonPercu)
    const final = finaliserTransmissionsInformation({
      plan, evaluations: [{ participant: participants.b, perception: nonPercu }],
      resultatsEpistemiques: new Map([['b', resultat]]), etatsPrives: { a: {}, b: {} },
      genererId: () => 'trace', date: DATE,
    })
    expect(final.transmissionsIgnorees[0]).toMatchObject({ perceptible: false, appliquee: false, raison: 'non_percue', faitEpistemiqueId: null })
    expect(final.traces.some(item => item.etape === ETAPES_TRACE_TRANSMISSION.NON_PERCUE)).toBe(true)
  })

  test('les anciens etats sans historique restent valides', () => expect(() => validerEtatTransmissions(undefined)).not.toThrow())

  test('rejette un historique prive contenant deux fois le meme id', () => {
    const emise = preparer().transmissions[0]
    expect(() => validerEtatTransmissions({ emises: [emise, emise], recues: [] }))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_TRANSMISSION.TRANSMISSION_ID_DUPLIQUE }))
  })

  test('trace explicitement l absence de transmission structuree dans une liste vide', () => {
    const plan = preparer([])
    const final = finaliserTransmissionsInformation({
      plan, evaluations: [], resultatsEpistemiques: new Map(), etatsPrives: {},
      genererId: () => 'trace', date: DATE,
    })
    expect(final.traces[0]).toMatchObject({ etape: ETAPES_TRACE_TRANSMISSION.AUCUNE, donnees: { evenementId: 'evt-1', transmissionId: null } })
  })
})
