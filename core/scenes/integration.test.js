import { registerProvider } from '../../api/index.js'
import { traiterInteraction } from '../interaction/index.js'
import {
  fabriqueEtatInteraction,
  fabriqueEvenement,
  fabriqueGenerateurId,
  fabriqueParticipant,
  fabriqueSollicitation,
  REPONSE_PROVIDER,
} from '../interaction/fixtures.js'
import { ErreurScene } from './index.js'

function participant(id) {
  return fabriqueParticipant({ id })
}
function scene(overrides = {}) {
  return {
    id: 'principale', type: 'principale', statut: 'active', sceneParenteId: null,
    participantIdsPresents: ['a', 'b', 'c'], groupeIdsAssocies: [], contexte: {},
    politiqueDiffusion: 'scene_uniquement', ordreCreation: 0, metadata: {}, ...overrides,
  }
}
function sousScene(overrides = {}) {
  return scene({
    id: 'privee', type: 'sous_scene', sceneParenteId: 'principale',
    participantIdsPresents: ['b', 'c'], ordreCreation: 1, ...overrides,
  })
}
function contexte(overrides = {}) {
  return fabriqueEtatInteraction({
    participants: { a: participant('a'), b: participant('b'), c: participant('c') },
    groupes: [],
    scenes: [scene()],
    ...overrides,
  })
}
function sollicitation(overrides = {}) {
  return fabriqueSollicitation({
    participantIdsCibles: ['a', 'b', 'c'],
    evenement: fabriqueEvenement({
      destinataireIds: ['a', 'b', 'c'], sceneId: 'principale', ...overrides,
    }),
  })
}
let compteurActif
registerProvider('scene-provider', async () => {
  compteurActif.appels += 1
  return { ...REPONSE_PROVIDER }
})

function dependances(compteur, autres = {}) {
  compteurActif = compteur
  return {
    providerConfig: { provider: 'scene-provider', cleApi: 'test', modele: 'test' },
    genererId: fabriqueGenerateurId().genererId,
    ...autres,
  }
}

describe('RFC-013 - integration au pipeline', () => {
  test('une scene principale simple execute tous les presents', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(sollicitation(), contexte(), dependances(compteur))
    expect(resultat.actions.map(item => item.participantId)).toEqual(['a', 'b', 'c'])
    expect(compteur.appels).toBe(3)
  })

  test('un membre de groupe absent ne lance aucun pipeline', async () => {
    const compteur = { appels: 0 }
    const etat = contexte({
      groupes: [{ id: 'g', participantIds: ['a', 'b', 'c'], statut: 'actif', metadata: {} }],
      scenes: [scene({ participantIdsPresents: ['a', 'b'], groupeIdsAssocies: ['g'] })],
    })
    const resultat = await traiterInteraction(sollicitation(), etat, dependances(compteur))
    expect(resultat.actions.map(item => item.participantId)).toEqual(['a', 'b'])
    expect(compteur.appels).toBe(2)
  })

  test('une sous-scene privee execute seulement ses participants', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(
      sollicitation({ sousSceneId: 'privee', politiqueDiffusion: 'scene_uniquement' }),
      contexte({ scenes: [scene(), sousScene()] }),
      dependances(compteur)
    )
    expect(resultat.actions.map(item => item.participantId)).toEqual(['b', 'c'])
    expect(resultat.evenementsProduits.every(item => item.sousSceneId === 'privee')).toBe(true)
  })

  test('une sous-scene peut diffuser vers son parent', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(
      sollicitation({ sousSceneId: 'privee', politiqueDiffusion: 'scene_et_parent' }),
      contexte({ scenes: [scene(), sousScene()] }),
      dependances(compteur)
    )
    expect(resultat.actions.map(item => item.participantId)).toEqual(['a', 'b', 'c'])
  })

  test('une diffusion descendante deduplique les participants', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(
      sollicitation({ politiqueDiffusion: 'descendants' }),
      contexte({ scenes: [scene(), sousScene()] }),
      dependances(compteur)
    )
    expect(resultat.actions.map(item => item.participantId)).toEqual(['a', 'b', 'c'])
    expect(compteur.appels).toBe(3)
  })

  test('une scene suspendue ne lance aucun pipeline', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(
      sollicitation(), contexte({ scenes: [scene({ statut: 'suspendue' })] }), dependances(compteur)
    )
    expect(resultat.actions).toEqual([])
    expect(compteur.appels).toBe(0)
  })

  test('une scene fermee rejette avant le provider', async () => {
    const compteur = { appels: 0 }
    await expect(traiterInteraction(
      sollicitation(), contexte({ scenes: [scene({ statut: 'fermee' })] }), dependances(compteur)
    )).rejects.toBeInstanceOf(ErreurScene)
    expect(compteur.appels).toBe(0)
  })

  test('les intentions conservent la scene et la sous-scene', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(
      sollicitation({ sousSceneId: 'privee' }),
      contexte({ scenes: [scene(), sousScene()] }),
      dependances(compteur, {
        producteurIntentionsMetier: ({ participantsSelectionnes }) =>
          participantsSelectionnes.map((cible, ordreCreation) => ({
            id: `i-${cible.participant.id}`, participantId: cible.participant.id,
            type: 'action', priorite: 100, ordreCreation, cibleId: null,
            contenu: { action: 'test' }, statut: 'proposee', metadata: {},
          })),
      })
    )
    expect(resultat.intentionsRetenues.map(item => item.metadata)).toEqual([
      { sceneId: 'principale', sousSceneId: 'privee' },
      { sceneId: 'principale', sousSceneId: 'privee' },
    ])
  })

  test('la propagation conserve le perimetre de sous-scene', async () => {
    const compteur = { appels: 0 }
    const resultat = await traiterInteraction(
      sollicitation({ sousSceneId: 'privee', politiqueDiffusion: 'scene_uniquement' }),
      contexte({ scenes: [scene(), sousScene()] }),
      dependances(compteur, { propagation: { active: true, profondeurMaximum: 0, nombreMaximumEvenements: 4 } })
    )
    expect(resultat.actions.every(item => ['b', 'c'].includes(item.participantId))).toBe(true)
    expect(resultat.actions.some(item => item.participantId === 'a')).toBe(false)
  })

  test('sans scene le resultat reste strictement identique', async () => {
    const ancien = fabriqueEtatInteraction({
      participants: { a: participant('a') },
      groupes: [{ id: 'g', participantIds: ['a'], statut: 'actif', metadata: {} }],
    })
    const demande = fabriqueSollicitation({
      participantIdsCibles: ['a'],
      evenement: fabriqueEvenement({ destinataireIds: ['a'] }),
    })
    const compteur1 = { appels: 0 }
    const compteur2 = { appels: 0 }
    const un = await traiterInteraction(demande, ancien, dependances(compteur1))
    const deux = await traiterInteraction(demande, structuredClone(ancien), dependances(compteur2))
    expect(un.actions).toEqual(deux.actions)
    expect(un.evenementsProduits).toEqual(deux.evenementsProduits)
    expect(Object.keys(un)).toEqual(Object.keys(deux))
    expect(Object.hasOwn(un, 'scenes')).toBe(false)
    expect(compteur1.appels).toBe(compteur2.appels)
  })
})
