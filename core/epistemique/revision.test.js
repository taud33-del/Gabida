import { jest } from '@jest/globals'
import { ErreurValidation } from '../index.js'
import { PRECISIONS_PERCEPTION } from '../../constants/PrecisionsPerception.js'
import {
  CODES_ERREUR_EPISTEMIQUE,
  ErreurEpistemique,
  OPERATIONS_REVISION_EPISTEMIQUE as OP,
  STATUTS_FAIT_EPISTEMIQUE as STATUT,
  TYPES_FAIT_EPISTEMIQUE,
  appliquerExpirationsEpistemiques,
  appliquerRevisionsEpistemiques,
  mettreAJourEtatEpistemique,
  selectionnerFaitsEpistemiquesActifs,
  validerEtatEpistemique,
} from './index.js'
import { construireEtatV1 } from '../interaction/adaptateur.js'
import {
  DATE_ISO,
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  fabriqueEtatInteraction,
  fabriqueEvenement,
  fabriqueParticipant,
} from '../interaction/fixtures.js'

const DATE_APRES = '2024-02-01T00:00:00.000Z'
const fait = (overrides = {}) => ({
  id: 'fait-racine', participantId: PARTICIPANT_ID, proposition: 'porte ouverte',
  type: TYPES_FAIT_EPISTEMIQUE.CROYANCE, statut: STATUT.ACTIF, confiance: 0.5,
  provenance: [], evenementSourceIds: [], perceptionSourceIds: [],
  dateCreation: DATE_ISO, dateMiseAJour: DATE_ISO, metadata: {}, ...overrides,
})
const etat = (faitInitial = fait()) => ({ connaissances: [], croyances: [faitInitial] })
const perception = (overrides = {}) => ({
  participantId: PARTICIPANT_ID, evenementId: 'evt-revision', perceptible: true,
  contenuPercu: {}, canaux: [], precision: PRECISIONS_PERCEPTION.COMPLETE,
  raisons: [], metadata: {}, ...overrides,
})

function appliquer(revisions, overrides = {}) {
  let revision = 0
  let version = 0
  let trace = 0
  return appliquerRevisionsEpistemiques({
    participant: fabriqueParticipant(), perception: perception(),
    evenementCanonique: fabriqueEvenement({ id: 'evt-revision' }),
    etatEpistemique: etat(), revisions,
    genererId: () => `trace-${trace++}`,
    genererIdRevision: () => `revision-${revision++}`,
    genererIdVersionFait: () => `version-${version++}`,
    date: DATE_APRES,
    ...overrides,
  })
}

function versionCourante(resultat) {
  return resultat.etatEpistemique.croyances.find(element => element.id.startsWith('version-'))
}

describe('RFC-008 - confiance et transitions', () => {
  test.each([
    [OP.RENFORCER, 0.2, 0.7],
    [OP.RENFORCER, 0.8, 1],
    [OP.AFFAIBLIR, 0.2, 0.3],
    [OP.AFFAIBLIR, 0.8, 0],
  ])('%s applique une variation bornee', (operation, valeur, attendu) => {
    const courant = versionCourante(appliquer([{ faitId: 'fait-racine', operation, valeur }]))
    expect(courant.confiance).toBe(attendu)
    expect(courant.statut).toBe(STATUT.ACTIF)
  })

  test.each([
    [STATUT.ACTIF, OP.SUSPENDRE, STATUT.SUSPENDU],
    [STATUT.SUSPENDU, OP.REACTIVER, STATUT.ACTIF],
    [STATUT.ACTIF, OP.RENDRE_OBSOLETE, STATUT.OBSOLETE],
    [STATUT.SUSPENDU, OP.RENDRE_OBSOLETE, STATUT.OBSOLETE],
    [STATUT.ACTIF, OP.INVALIDER, STATUT.INVALIDE],
    [STATUT.SUSPENDU, OP.INVALIDER, STATUT.INVALIDE],
  ])('%s --%s--> %s', (initial, operation, attendu) => {
    const resultat = appliquer([{ faitId: 'fait-racine', operation }], { etatEpistemique: etat(fait({ statut: initial })) })
    expect(versionCourante(resultat).statut).toBe(attendu)
  })

  test.each([STATUT.CONTREDIT, STATUT.REMPLACE, STATUT.OBSOLETE, STATUT.EXPIRE, STATUT.INVALIDE])(
    'refuse de reactiver le statut terminal %s', statut => {
      expect(() => appliquer([{ faitId: 'fait-racine', operation: OP.REACTIVER }], { etatEpistemique: etat(fait({ statut })) }))
        .toThrow(expect.objectContaining({ code: CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE }))
    }
  )
})

describe('RFC-008 - versionnement immuable', () => {
  test('cree une version, conserve la precedente et stabilise la racine', () => {
    const initial = etat()
    const avant = structuredClone(initial)
    const resultat = appliquer([{ id: 'revision-explicite', faitId: 'fait-racine', operation: OP.RENFORCER, valeur: 0.1 }], { etatEpistemique: initial })
    const courant = versionCourante(resultat)
    expect(initial).toEqual(avant)
    expect(resultat.etatEpistemique.croyances).toHaveLength(2)
    expect(courant).toMatchObject({ version: 2, faitPrecedentId: 'fait-racine', racineFaitId: 'fait-racine' })
    expect(courant.revisionIds).toEqual(['revision-explicite'])
    expect(resultat.etatEpistemique.croyances[0].statut).toBe(STATUT.REMPLACE)
  })

  test('deduplique revisionIds herites', () => {
    const initial = fait({ revisionIds: ['revision-explicite', 'revision-explicite'] })
    const resultat = appliquer([{ id: 'revision-explicite', faitId: initial.id, operation: OP.RENFORCER, valeur: 0 }], { etatEpistemique: etat(initial) })
    expect(versionCourante(resultat).revisionIds).toEqual(['revision-explicite'])
  })

  test('anciens faits sans version restent valides et commencent a la version 2', () => {
    expect(versionCourante(appliquer([{ faitId: 'fait-racine', operation: OP.SUSPENDRE }])).version).toBe(2)
  })
})

describe('RFC-008 - expiration explicite et automatique', () => {
  test('EXPIRER refuse une date non atteinte et accepte la date injectee atteinte', () => {
    const initial = etat(fait({ dateExpiration: DATE_APRES }))
    expect(() => appliquer([{ faitId: 'fait-racine', operation: OP.EXPIRER }], { etatEpistemique: initial, date: DATE_ISO }))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE }))
    expect(versionCourante(appliquer([{ faitId: 'fait-racine', operation: OP.EXPIRER }], { etatEpistemique: initial })).statut).toBe(STATUT.EXPIRE)
  })

  test('expiration automatique utilise uniquement la date injectee', () => {
    const now = jest.spyOn(Date, 'now')
    const initial = etat(fait({ dateExpiration: DATE_APRES }))
    const avant = appliquerExpirationsEpistemiques({
      participant: fabriqueParticipant(), etatEpistemique: initial, date: DATE_ISO,
      genererId: () => 'trace', genererIdRevision: () => 'revision-auto', genererIdVersionFait: () => 'version-auto',
    })
    const apres = appliquerExpirationsEpistemiques({
      participant: fabriqueParticipant(), etatEpistemique: initial, date: DATE_APRES,
      genererId: () => 'trace', genererIdRevision: () => 'revision-auto', genererIdVersionFait: () => 'version-auto',
    })
    expect(avant.etatEpistemique).toBe(initial)
    expect(apres.etatEpistemique.croyances.find(element => element.id === 'version-auto').statut).toBe(STATUT.EXPIRE)
    expect(now).not.toHaveBeenCalled()
    now.mockRestore()
  })

  test('aucune expiration sans date explicite', () => {
    const initial = etat()
    const resultat = appliquerExpirationsEpistemiques({ participant: fabriqueParticipant(), etatEpistemique: initial, date: DATE_APRES })
    expect(resultat.etatEpistemique).toBe(initial)
  })
})

describe('RFC-008 - validation et atomicite', () => {
  test.each([
    [[{ faitId: 'absent', operation: OP.SUSPENDRE }], CODES_ERREUR_EPISTEMIQUE.FAIT_REVISION_INTROUVABLE],
    [[{ faitId: 'fait-racine', operation: 'inconnue' }], CODES_ERREUR_EPISTEMIQUE.OPERATION_REVISION_INVALIDE],
    [[{ faitId: 'fait-racine', operation: OP.RENFORCER, valeur: 2 }], CODES_ERREUR_EPISTEMIQUE.VALEUR_REVISION_INVALIDE],
  ])('rejette une revision invalide', (revisions, code) => {
    expect(() => appliquer(revisions)).toThrow(expect.objectContaining({ code }))
  })

  test('valide toutes les revisions avant de produire un etat', () => {
    const initial = etat()
    const avant = structuredClone(initial)
    expect(() => appliquer([
      { faitId: 'fait-racine', operation: OP.SUSPENDRE },
      { faitId: 'absent', operation: OP.SUSPENDRE },
    ], { etatEpistemique: initial })).toThrow(ErreurEpistemique)
    expect(initial).toEqual(avant)
  })

  test('une erreur de revision empeche aussi les propositions RFC-007', () => {
    const initial = etat()
    const evenement = fabriqueEvenement({ metadata: { epistemique: {
      revisions: [{ faitId: 'absent', operation: OP.SUSPENDRE }],
      propositions: [{ id: 'nouveau', proposition: 'ne doit pas exister' }],
    } } })
    expect(() => mettreAJourEtatEpistemique({
      participant: fabriqueParticipant(), perception: perception(), evenementCanonique: evenement,
      etatPrive: { epistemique: initial }, genererId: () => 'trace',
      genererIdEpistemique: () => 'nouveau', genererIdRevision: () => 'revision',
      genererIdVersionFait: () => 'version', date: DATE_APRES,
    })).toThrow(ErreurEpistemique)
    expect(initial.croyances).toHaveLength(1)
  })

  test('ErreurEpistemique reste une ErreurValidation', () => {
    try { appliquer([{ faitId: 'absent', operation: OP.SUSPENDRE }]) }
    catch (error) {
      expect(error).toBeInstanceOf(ErreurEpistemique)
      expect(error).toBeInstanceOf(ErreurValidation)
    }
  })

  test.each([
    ['genererIdRevision', CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_REVISION_ABSENT],
    ['genererIdVersionFait', CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_VERSION_ABSENT],
  ])('rejette le generateur absent %s', (generateur, code) => {
    const overrides = { [generateur]: undefined }
    expect(() => appliquer([{ faitId: 'fait-racine', operation: OP.SUSPENDRE }], overrides))
      .toThrow(expect.objectContaining({ code }))
  })

  test('rejette une version epistemique invalide', () => {
    expect(() => validerEtatEpistemique(etat(fait({ version: 0 })), PARTICIPANT_ID))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_EPISTEMIQUE.VERSION_INVALIDE }))
  })
})

describe('RFC-008 - perception, ordre et vue active', () => {
  test('participant non percevant et participant non concerne ne recoivent rien', () => {
    const initial = etat()
    const nonPercu = appliquer([{ faitId: 'fait-racine', operation: OP.SUSPENDRE }], { etatEpistemique: initial, perception: perception({ perceptible: false }) })
    const autre = appliquer([{ faitId: 'fait-racine', operation: OP.SUSPENDRE, participantsConcernes: [PARTICIPANT_ID_B] }], { etatEpistemique: initial })
    expect(nonPercu.etatEpistemique).toBe(initial)
    expect(autre.etatEpistemique).toBe(initial)
    expect(autre.traces[0].etape).toBe('epistemique_revision_ignoree')
  })

  test('applique les revisions avant les propositions RFC-007', () => {
    const evenement = fabriqueEvenement({ metadata: { epistemique: {
      revisions: [{ id: 'revision', faitId: 'fait-racine', operation: OP.RENFORCER, valeur: 0.2 }],
      propositions: [{ id: 'fait-racine', proposition: 'mise a jour', confiance: 0.9 }],
    } } })
    const resultat = mettreAJourEtatEpistemique({
      participant: fabriqueParticipant(), perception: perception(), evenementCanonique: evenement,
      etatPrive: { epistemique: etat() }, genererId: () => 'trace',
      genererIdRevision: () => 'revision', genererIdVersionFait: () => 'version-0', date: DATE_APRES,
    })
    const courant = resultat.etatEpistemique.croyances.find(element => element.id === 'version-0')
    expect(courant.confiance).toBe(0.9)
    expect(resultat.traces.findIndex(trace => trace.etape === 'epistemique_revision_appliquee'))
      .toBeLessThan(resultat.traces.findIndex(trace => trace.etape === 'epistemique_fait_mis_a_jour'))
  })

  test.each([STATUT.SUSPENDU, STATUT.OBSOLETE, STATUT.EXPIRE, STATUT.CONTREDIT, STATUT.REMPLACE, STATUT.INVALIDE])(
    'exclut %s de la vue active', statut => {
      const vue = selectionnerFaitsEpistemiquesActifs({ connaissances: [], croyances: [fait({ statut }), fait({ id: 'actif' })] })
      expect(vue.croyancesActives.map(element => element.id)).toEqual(['actif'])
    }
  )

  test('le pipeline ne recoit que les faits actifs et l etat prive conserve tout', () => {
    const etatInteraction = fabriqueEtatInteraction()
    etatInteraction.etatsPrives[PARTICIPANT_ID] = { epistemique: {
      connaissances: [], croyances: [fait(), fait({ id: 'suspendu', statut: STATUT.SUSPENDU })],
    } }
    const vue = construireEtatV1(PARTICIPANT_ID, etatInteraction).epistemique
    expect(vue.croyancesActives.map(element => element.id)).toEqual(['fait-racine'])
    expect(etatInteraction.etatsPrives[PARTICIPANT_ID].epistemique.croyances).toHaveLength(2)
  })

  test('etat epistemique A n est jamais transmis a B', () => {
    const interaction = fabriqueEtatInteraction()
    interaction.participants[PARTICIPANT_ID_B] = { ...fabriqueParticipant(), id: PARTICIPANT_ID_B }
    interaction.etatsPrives[PARTICIPANT_ID] = { epistemique: etat(fait({ id: 'secret-a' })) }
    interaction.etatsPrives[PARTICIPANT_ID_B] = { epistemique: { connaissances: [], croyances: [] } }
    expect(construireEtatV1(PARTICIPANT_ID_B, interaction).epistemique.croyancesActives).toEqual([])
  })

  test('sans revisions ni expiration le comportement RFC-007 reste identique', () => {
    const initial = etat()
    const resultat = mettreAJourEtatEpistemique({
      participant: fabriqueParticipant(), perception: perception(), evenementCanonique: fabriqueEvenement(),
      etatPrive: { epistemique: initial }, genererId: () => 'trace', date: DATE_APRES,
    })
    expect(resultat.etatEpistemique).toBe(initial)
    expect(resultat.traces).toEqual([])
  })

  test('memes entrees injectees produisent les memes sorties et aucune donnee entre dans le canonique', () => {
    const run = () => appliquer([{ faitId: 'fait-racine', operation: OP.RENFORCER, valeur: 0.2 }])
    expect(run()).toEqual(run())
    expect(run().etatEpistemique.croyances.every(element => !Object.hasOwn(element, 'visibilite'))).toBe(true)
  })
})
