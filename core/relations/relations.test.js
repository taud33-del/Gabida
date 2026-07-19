import {
  CODES_ERREUR_RELATION,
  ErreurRelation,
  ETAPES_TRACE_RELATION,
  MODES_MISE_A_JOUR_RELATION,
  STATUTS_RELATION_PARTICIPANT,
  mettreAJourRelationsParticipant,
  selectionnerRelationsActives,
  validerRelationsParticipant,
  validerStructureRelations,
} from './index.js'
import { ErreurValidation } from '../index.js'

const DATE = '2026-07-19T12:00:00.000Z'
const participants = { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' } }
const perception = { perceptible: true }

function evenement(misesAJour, extra = {}) {
  return { id: 'evt-1', emetteurId: 'c', date: DATE, metadata: { relations: { misesAJour } }, ...extra }
}

function miseAJour(extra = {}) {
  return { participantId: 'a', cibleParticipantId: 'b', dimensions: { confiance: 0.4 }, ...extra }
}

function relation(extra = {}) {
  return {
    id: 'rel-1', participantId: 'a', cibleParticipantId: 'b',
    dimensions: { confiance: 0.2 }, statut: STATUTS_RELATION_PARTICIPANT.ACTIVE,
    provenance: [], evenementSourceIds: [], dateCreation: DATE, dateMiseAJour: DATE,
    metadata: {}, ...extra,
  }
}

function executer({ misesAJour = [miseAJour()], etatPrive = {}, perceptionCourante = perception, idRelation = 'rel-generee' } = {}) {
  let trace = 0
  return mettreAJourRelationsParticipant({
    participant: participants.a,
    perception: perceptionCourante,
    evenementCanonique: evenement(misesAJour),
    etatPrive,
    participants,
    genererId: () => `trace-${trace++}`,
    genererIdRelation: () => idRelation,
    date: DATE,
  })
}

describe('RFC-009 - relations directionnelles privees', () => {
  test('cree une relation active avec un identifiant injecte', () => {
    const resultat = executer()
    expect(resultat.relations.parParticipantId.b).toMatchObject({
      id: 'rel-generee', participantId: 'a', cibleParticipantId: 'b',
      dimensions: { confiance: 0.4 }, statut: 'active',
    })
  })

  test('conserve un identifiant explicite a la creation', () => {
    expect(executer({ misesAJour: [miseAJour({ id: 'explicite' })] }).relations.parParticipantId.b.id).toBe('explicite')
  })

  test('conserve le meme identifiant lors des mises a jour', () => {
    const resultat = executer({ etatPrive: { relations: { parParticipantId: { b: relation() } } } })
    expect(resultat.relations.parParticipantId.b.id).toBe('rel-1')
  })

  test('REMPLACER est le mode par defaut et ne remplace que les dimensions fournies', () => {
    const initiale = relation({ dimensions: { confiance: 0.2, respect: 0.8 } })
    const resultat = executer({ etatPrive: { relations: { parParticipantId: { b: initiale } } } })
    expect(resultat.relations.parParticipantId.b.dimensions).toEqual({ confiance: 0.4, respect: 0.8 })
  })

  test('AJUSTER additionne a la valeur existante', () => {
    const resultat = executer({
      misesAJour: [miseAJour({ dimensions: { confiance: 0.3 }, mode: MODES_MISE_A_JOUR_RELATION.AJUSTER })],
      etatPrive: { relations: { parParticipantId: { b: relation() } } },
    })
    expect(resultat.relations.parParticipantId.b.dimensions.confiance).toBeCloseTo(0.5)
  })

  test.each([[0.9, 0.4, 1], [-0.9, -0.4, -1]])('AJUSTER borne %s + %s a %s', (initiale, delta, attendu) => {
    const resultat = executer({
      misesAJour: [miseAJour({ dimensions: { confiance: delta }, mode: 'ajuster' })],
      etatPrive: { relations: { parParticipantId: { b: relation({ dimensions: { confiance: initiale } }) } } },
    })
    expect(resultat.relations.parParticipantId.b.dimensions.confiance).toBe(attendu)
  })

  test('AJUSTER part de zero pour une nouvelle dimension', () => {
    const resultat = executer({ misesAJour: [miseAJour({ dimensions: { respect: -0.3 }, mode: 'ajuster' })] })
    expect(resultat.relations.parParticipantId.b.dimensions.respect).toBe(-0.3)
  })

  test('ajoute une provenance immuable et deduplique les evenementSourceIds', () => {
    const initiale = relation({ evenementSourceIds: ['evt-1'], provenance: [{ type: 'systeme', sourceId: 'x', evenementId: null, participantSourceId: null, date: DATE, metadata: {} }] })
    const resultat = executer({ etatPrive: { relations: { parParticipantId: { b: initiale } } } })
    expect(resultat.relations.parParticipantId.b.provenance).toHaveLength(2)
    expect(resultat.relations.parParticipantId.b.evenementSourceIds).toEqual(['evt-1'])
    expect(initiale.provenance).toHaveLength(1)
  })

  test('ignore une mise a jour si le participant ne percoit pas', () => {
    const resultat = executer({ perceptionCourante: { perceptible: false } })
    expect(resultat.relations).toBeUndefined()
    expect(resultat.traces[0].etape).toBe(ETAPES_TRACE_RELATION.MISE_A_JOUR_IGNOREE)
  })

  test('ignore une mise a jour hors participantsConcernes', () => {
    const resultat = executer({ misesAJour: [miseAJour({ participantsConcernes: ['c'] })] })
    expect(resultat.relations).toBeUndefined()
  })

  test('une mise a jour appartenant a un autre participant ne fuit pas', () => {
    const resultat = executer({ misesAJour: [{ participantId: 'c', cibleParticipantId: 'b', dimensions: { peur: 0.2 } }] })
    expect(resultat.relations).toBeUndefined()
    expect(resultat.traces[0].etape).toBe(ETAPES_TRACE_RELATION.MISE_A_JOUR_IGNOREE)
  })

  test('ne cree aucun champ lorsque metadata.relations est absent', () => {
    const resultat = mettreAJourRelationsParticipant({
      participant: participants.a, perception, evenementCanonique: { id: 'evt', metadata: {} },
      etatPrive: {}, participants, genererId: () => 'trace', date: DATE,
    })
    expect(resultat).toEqual({ relations: undefined, traces: [] })
  })

  test('trace une liste explicite sans mise a jour', () => {
    expect(executer({ misesAJour: [] }).traces[0].etape).toBe(ETAPES_TRACE_RELATION.AUCUNE_MISE_A_JOUR)
  })

  test.each([
    ['suspendue', ETAPES_TRACE_RELATION.SUSPENDUE],
    ['terminee', ETAPES_TRACE_RELATION.TERMINEE],
    ['invalide', ETAPES_TRACE_RELATION.INVALIDEE],
  ])('autorise active -> %s', (statut, traceAttendue) => {
    const resultat = executer({ misesAJour: [miseAJour({ metadata: { statut } })], etatPrive: { relations: { parParticipantId: { b: relation() } } } })
    expect(resultat.relations.parParticipantId.b.statut).toBe(statut)
    expect(resultat.traces.some(trace => trace.etape === traceAttendue)).toBe(true)
  })

  test('autorise suspendue -> active', () => {
    const initiale = relation({ statut: 'suspendue' })
    const resultat = executer({ misesAJour: [miseAJour({ metadata: { statut: 'active' } })], etatPrive: { relations: { parParticipantId: { b: initiale } } } })
    expect(resultat.traces.some(trace => trace.etape === ETAPES_TRACE_RELATION.REACTIVEE)).toBe(true)
  })

  test.each(['terminee', 'invalide'])('interdit %s -> active', statut => {
    const appel = () => executer({ misesAJour: [miseAJour({ metadata: { statut: 'active' } })], etatPrive: { relations: { parParticipantId: { b: relation({ statut }) } } } })
    expect(appel).toThrow(expect.objectContaining({ code: CODES_ERREUR_RELATION.TRANSITION_RELATION_INTERDITE }))
  })

  test('selectionne uniquement les relations actives et masque les donnees internes', () => {
    const vue = selectionnerRelationsActives({ parParticipantId: {
      b: relation(), c: relation({ id: 'rel-c', cibleParticipantId: 'c', statut: 'suspendue' }),
    } })
    expect(vue).toEqual({ b: { dimensions: { confiance: 0.2 }, statut: 'active', metadata: {} } })
    expect(vue.b).not.toHaveProperty('provenance')
    expect(vue.b).not.toHaveProperty('evenementSourceIds')
    expect(vue.b).not.toHaveProperty('id')
  })

  test('deux executions identiques sont strictement deterministes', () => {
    expect(executer()).toEqual(executer())
  })
})

describe('RFC-009 - validations', () => {
  test.each([
    [null, CODES_ERREUR_RELATION.STRUCTURE_RELATIONS_INVALIDE],
    [{}, CODES_ERREUR_RELATION.STRUCTURE_RELATIONS_INVALIDE],
  ])('rejette une structure metadata.relations invalide', (structure, code) => {
    expect(() => validerStructureRelations(structure, participants)).toThrow(expect.objectContaining({ code }))
  })

  test.each([
    [miseAJour({ participantId: '' }), CODES_ERREUR_RELATION.MISE_A_JOUR_RELATION_INVALIDE],
    [miseAJour({ participantId: 'absent' }), CODES_ERREUR_RELATION.PARTICIPANT_RELATION_INTROUVABLE],
    [miseAJour({ cibleParticipantId: 'absent' }), CODES_ERREUR_RELATION.CIBLE_RELATION_INTROUVABLE],
    [miseAJour({ cibleParticipantId: 'a' }), CODES_ERREUR_RELATION.RELATION_VERS_SOI_INTERDITE],
    [miseAJour({ dimensions: [] }), CODES_ERREUR_RELATION.MISE_A_JOUR_RELATION_INVALIDE],
    [miseAJour({ dimensions: { confiance: NaN } }), CODES_ERREUR_RELATION.VALEUR_RELATION_INVALIDE],
    [miseAJour({ dimensions: { confiance: 1.1 } }), CODES_ERREUR_RELATION.VALEUR_RELATION_INVALIDE],
    [miseAJour({ dimensions: { confiance: -1.1 } }), CODES_ERREUR_RELATION.VALEUR_RELATION_INVALIDE],
    [miseAJour({ mode: 'inconnu' }), CODES_ERREUR_RELATION.MODE_RELATION_INVALIDE],
    [miseAJour({ provenanceType: 'inconnu' }), CODES_ERREUR_RELATION.PROVENANCE_RELATION_INVALIDE],
    [miseAJour({ metadata: { statut: 'inconnu' } }), CODES_ERREUR_RELATION.STATUT_RELATION_INVALIDE],
  ])('rejette une mise a jour invalide %#', (instruction, code) => {
    expect(() => validerStructureRelations({ misesAJour: [instruction] }, participants)).toThrow(expect.objectContaining({ code }))
  })

  test('ErreurRelation appartient a la hierarchie de validation', () => {
    try { validerStructureRelations(null, participants) } catch (error) {
      expect(error).toBeInstanceOf(ErreurRelation)
      expect(error).toBeInstanceOf(ErreurValidation)
    }
  })

  test('exige un generateur si aucun id explicite existe', () => {
    expect(() => mettreAJourRelationsParticipant({
      participant: participants.a, perception, evenementCanonique: evenement([miseAJour()]),
      etatPrive: {}, participants, genererId: () => 'trace', date: DATE,
    })).toThrow(expect.objectContaining({ code: CODES_ERREUR_RELATION.GENERATEUR_ID_RELATION_ABSENT }))
  })

  test('valide les relations privees existantes', () => {
    expect(() => validerRelationsParticipant({ parParticipantId: { b: relation() } }, 'a', participants)).not.toThrow()
  })

  test('rejette une cle cible incoherente dans les donnees existantes', () => {
    expect(() => validerRelationsParticipant({ parParticipantId: { c: relation() } }, 'a', participants))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_RELATION.RELATION_INVALIDE }))
  })

  test('ne mute jamais l etat initial en cas de succes', () => {
    const initiale = relation()
    const etatPrive = { relations: { parParticipantId: { b: initiale } } }
    executer({ etatPrive })
    expect(etatPrive.relations.parParticipantId.b).toBe(initiale)
    expect(initiale.dimensions).toEqual({ confiance: 0.2 })
  })

  test('valide toute la liste avant toute application observable', () => {
    const etatPrive = {}
    expect(() => executer({ misesAJour: [miseAJour({ id: 'ok' }), miseAJour({ cibleParticipantId: 'absent' })], etatPrive }))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_RELATION.CIBLE_RELATION_INTROUVABLE }))
    expect(etatPrive).toEqual({})
  })
})
