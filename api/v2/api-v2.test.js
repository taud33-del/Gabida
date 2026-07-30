import * as apiV2 from './index.js'
import { traiterInteraction } from '../../core/interaction/index.js'
import {
  DATE_ISO,
  PARTICIPANT_ID,
  PARTICIPANT_ID_B,
  REPONSE_PROVIDER,
  fabriqueEtatInteraction,
  fabriqueEtatInteractionMulti,
  fabriqueEvenement,
  fabriqueGenerateurId,
  fabriqueSollicitation,
} from '../../core/interaction/fixtures.js'

const PROVIDER_API_V2 = 'api-v2-provider-deterministe'
const CLE_API_SECRETE = 'SECRET_API_V2_NE_DOIT_PAS_FUITER_8472'
const randomUUIDOriginal = crypto.randomUUID
let compteurUuid = 0

beforeAll(() => {
  apiV2.registerProvider(PROVIDER_API_V2, async () => ({ ...REPONSE_PROVIDER }))
  crypto.randomUUID = () => `souvenir-api-v2-${compteurUuid++}`
})

afterAll(() => {
  crypto.randomUUID = randomUUIDOriginal
})

const providerConfig = Object.freeze({
  provider: PROVIDER_API_V2,
  cleApi: CLE_API_SECRETE,
  modele: 'test',
})

const dependances = (extra = {}) => ({
  providerConfig,
  genererId: fabriqueGenerateurId().genererId,
  date: DATE_ISO,
  ...extra,
})

const intention = (id, participantId, priorite, ordreCreation, conflit) => ({
  id,
  participantId,
  type: apiV2.TYPES_INTENTION_METIER.ACTION,
  priorite,
  ordreCreation,
  cibleId: null,
  contenu: { action: id },
  statut: apiV2.STATUTS_INTENTION_METIER.PROPOSEE,
  metadata: conflit === undefined ? {} : { conflit },
})

const scene = (overrides = {}) => ({
  id: 'principale',
  type: apiV2.TYPES_SCENE_INTERACTION.PRINCIPALE,
  statut: apiV2.STATUTS_SCENE_INTERACTION.ACTIVE,
  sceneParenteId: null,
  participantIdsPresents: [PARTICIPANT_ID, PARTICIPANT_ID_B],
  groupeIdsAssocies: [],
  contexte: {},
  politiqueDiffusion: apiV2.POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT,
  ordreCreation: 0,
  metadata: {},
  ...overrides,
})

describe('RFC-014 - surface publique Gabida V2', () => {
  test('fige la liste exacte des exports publics', () => {
    expect(Object.keys(apiV2).sort()).toEqual([
      'CANAUX_PERCEPTION',
      'CODES_ERREUR_EPISTEMIQUE',
      'CODES_ERREUR_INTENTION_METIER',
      'CODES_ERREUR_INTERACTION',
      'CODES_ERREUR_ORCHESTRATION',
      'CODES_ERREUR_PERCEPTION',
      'CODES_ERREUR_PROPAGATION',
      'CODES_ERREUR_RELATION',
      'CODES_ERREUR_RESOLUTION_CONFLIT',
      'CODES_ERREUR_SCENE',
      'CODES_ERREUR_TRANSMISSION',
      'DIMENSIONS_RELATION_STANDARD',
      'ErreurEpistemique',
      'ErreurGabida',
      'ErreurIntentionMetier',
      'ErreurInteraction',
      'ErreurOrchestration',
      'ErreurPerception',
      'ErreurPipeline',
      'ErreurPropagation',
      'ErreurProvider',
      'ErreurRelation',
      'ErreurResolutionConflit',
      'ErreurScene',
      'ErreurTraitementParticipant',
      'ErreurTransmission',
      'ErreurValidation',
      'InvalidProviderError',
      'MODES_MISE_A_JOUR_RELATION',
      'MODES_PLANIFICATION_EXECUTION',
      'OPERATIONS_REVISION_EPISTEMIQUE',
      'POLITIQUES_DIFFUSION_SCENE',
      'PRECISIONS_PERCEPTION',
      'PRIORITES_INTENTION_METIER',
      'ProviderAlreadyRegisteredError',
      'ProviderError',
      'ProviderNotFoundError',
      'STATUTS_FAIT_EPISTEMIQUE',
      'STATUTS_GROUPE_PARTICIPANTS',
      'STATUTS_INTENTION_METIER',
      'STATUTS_PARTICIPANT',
      'STATUTS_RELATION_PARTICIPANT',
      'STATUTS_RESOLUTION_ACTION',
      'STATUTS_SCENE_INTERACTION',
      'STATUTS_TRANSMISSION_INFORMATION',
      'TYPES_ACTION_PARTICIPANT',
      'TYPES_CONFLIT_ACTION',
      'TYPES_FAIT_EPISTEMIQUE',
      'TYPES_INTENTION_METIER',
      'TYPES_PARTICIPANT',
      'TYPES_PROFIL_PARTICIPANT',
      'TYPES_PROVENANCE_EPISTEMIQUE',
      'TYPES_PROVENANCE_RELATION',
      'TYPES_RESULTAT_TRANSMISSION',
      'TYPES_SCENE_INTERACTION',
      'VERSION_API_GABIDA_V2',
      'VISIBILITES_EVENEMENT',
      'ajouterMembresGroupeScene',
      'arbitrerIntentionsMetier',
      'associerGroupeScene',
      'creerGroupeParticipants',
      'creerSceneInteraction',
      'deplacerVersSousScene',
      'entrerDansScene',
      'quitterScene',
      'registerProvider',
      'rejoindreSceneParente',
      'resoudreConflitsActions',
      'traiterInteractionV2',
      'transitionnerScene',
      'validerEtatInteractionV2',
      'validerEtatScenes',
      'validerIntentionsMetier',
      'validerSollicitationV2',
    ].sort())
  })

  test('n expose aucun helper interne sensible', () => {
    for (const nom of [
      'comparerIntentionsMetier',
      'orchestrerTour',
      'agregerResultats',
      'presenceEffective',
      'resoudreDestinatairesScene',
      'resoudreConflitsActionsParScene',
      'validerEntreesResolution',
      'normaliserConfigurationResolutionConflits',
      'traiterParticipantUnique',
      'construirePlayerMessage',
    ]) {
      expect(apiV2).not.toHaveProperty(nom)
    }
  })

  test('expose une version, des constantes et des erreurs', () => {
    expect(apiV2.VERSION_API_GABIDA_V2).toBe('2.0.0')
    expect(apiV2.TYPES_INTENTION_METIER.ACTION).toBe('action')
    expect(apiV2.POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT).toBe('scene_uniquement')
    expect(new apiV2.ErreurScene('x', 'test')).toBeInstanceOf(apiV2.ErreurValidation)
  })

  test('valide les contrats avec des codes stables', () => {
    expect(() => apiV2.validerSollicitationV2(null)).toThrow(expect.objectContaining({
      code: apiV2.CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE,
    }))
    expect(() => apiV2.validerEtatInteractionV2(null)).toThrow(expect.objectContaining({
      code: apiV2.CODES_ERREUR_INTERACTION.ETAT_INTERACTION_INVALIDE,
    }))
    expect(() => apiV2.validerIntentionsMetier([{}])).toThrow(expect.objectContaining({
      code: apiV2.CODES_ERREUR_INTENTION_METIER.INTENTION_INVALIDE,
    }))
  })

  test('expose uniquement les operations applicatives de scenes', () => {
    const etat = fabriqueEtatInteraction({ groupes: [], scenes: [] })
    const principale = apiV2.creerSceneInteraction({
      id: 'principale',
      type: apiV2.TYPES_SCENE_INTERACTION.PRINCIPALE,
      ordreCreation: 0,
    }, etat)
    expect(principale).toMatchObject({ id: 'principale', statut: 'preparee' })
    expect(apiV2.transitionnerScene({
      sceneId: 'principale',
      statut: 'active',
      transitionId: 'transition-1',
    }, { ...etat, scenes: [principale] }).scenes[0].statut).toBe('active')
  })
})

describe('RFC-014 - facade fonctionnelle et compatibilite', () => {
  test('delegue au meme moteur avec un resultat strictement identique et sans mutation', async () => {
    const sollicitation = fabriqueSollicitation()
    const etat = fabriqueEtatInteraction()
    const copie = structuredClone(etat)
    const publicDeps = dependances()
    const interneDeps = dependances()
    compteurUuid = 0
    const publicResult = await apiV2.traiterInteractionV2(sollicitation, etat, publicDeps)
    compteurUuid = 0
    const internalResult = await traiterInteraction(sollicitation, structuredClone(etat), interneDeps)
    const publicDureeMs = publicResult.traces.find(trace => trace.etape === 'reponse').donnees.meta.dureeMs
    const internalDureeMs = internalResult.traces.find(trace => trace.etape === 'reponse').donnees.meta.dureeMs
    const internalResultAvecDureePublique = {
      ...internalResult,
      traces: internalResult.traces.map(trace => trace.etape === 'reponse'
        ? { ...trace, donnees: { ...trace.donnees, meta: { ...trace.donnees.meta, dureeMs: publicDureeMs } } }
        : trace),
    }
    expect(publicResult).toEqual(internalResultAvecDureePublique)
    expect(Math.abs(publicDureeMs - internalDureeMs)).toBeLessThanOrEqual(1)
    expect(etat).toEqual(copie)
    expect(apiV2.traiterInteractionV2).toBe(traiterInteraction)
  })

  test('traite plusieurs participants et preserve le chemin RFC-010', async () => {
    const resultat = await apiV2.traiterInteractionV2(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(),
      dependances()
    )
    expect(resultat.actions.map(action => action.participantId)).toEqual([PARTICIPANT_ID, PARTICIPANT_ID_B])
    expect(resultat).not.toHaveProperty('intentionsRetenues')
    expect(resultat).not.toHaveProperty('resultatResolutionConflits')
  })

  test('execute intentions et resolution de conflits via la facade', async () => {
    const resultat = await apiV2.traiterInteractionV2(
      fabriqueSollicitation({ participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B] }),
      fabriqueEtatInteractionMulti(),
      dependances({
        producteurIntentionsMetier: () => [
          intention('gagnante', PARTICIPANT_ID, 200, 0, { cleExclusivite: 'objet' }),
          intention('ecartee', PARTICIPANT_ID_B, 100, 1, { cleExclusivite: 'objet' }),
        ],
        resolutionConflits: { active: true },
      })
    )
    expect(resultat.actions.map(action => action.metadata.intentionId)).toEqual(['gagnante'])
    expect(resultat.intentionsEcarteesParConflit.map(item => item.id)).toEqual(['ecartee'])
  })

  test('traite scene, sous-scene et propagation sans exposer de secret', async () => {
    const sousScene = scene({
      id: 'privee',
      type: apiV2.TYPES_SCENE_INTERACTION.SOUS_SCENE,
      sceneParenteId: 'principale',
      participantIdsPresents: [PARTICIPANT_ID],
      ordreCreation: 1,
    })
    const etat = fabriqueEtatInteractionMulti({ groupes: [], scenes: [scene(), sousScene] })
    const sollicitation = fabriqueSollicitation({
      participantIdsCibles: [PARTICIPANT_ID, PARTICIPANT_ID_B],
      evenement: fabriqueEvenement({
        sceneId: 'principale',
        sousSceneId: 'privee',
        politiqueDiffusion: apiV2.POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT,
      }),
    })
    const resultat = await apiV2.traiterInteractionV2(
      sollicitation,
      etat,
      dependances({ propagation: { active: true, profondeurMaximum: 0 } })
    )
    expect(resultat.actions.map(action => action.participantId)).toEqual([PARTICIPANT_ID])
    expect(resultat.evenementsProduits.every(item => item.sousSceneId === 'privee')).toBe(true)
    expect(JSON.stringify(resultat)).not.toContain(CLE_API_SECRETE)
    expect(JSON.stringify(resultat)).not.toContain('providerConfig')
  })

  test('propage les memes erreurs de validation et de scene', async () => {
    await expect(apiV2.traiterInteractionV2(null, fabriqueEtatInteraction(), dependances()))
      .rejects.toMatchObject({ code: apiV2.CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE })
    await expect(apiV2.traiterInteractionV2(
      fabriqueSollicitation({ evenement: fabriqueEvenement({ sceneId: 'principale' }) }),
      fabriqueEtatInteraction({ groupes: [], scenes: [scene({ statut: 'fermee' })] }),
      dependances()
    )).rejects.toBeInstanceOf(apiV2.ErreurScene)
  })
})
