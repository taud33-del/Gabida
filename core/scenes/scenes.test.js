import { jest } from '@jest/globals'
import { ErreurValidation } from '../index.js'
import { resoudreConflitsActionsParScene } from '../resolution-conflits/index.js'
import {
  ajouterMembresGroupeScene,
  associerGroupeScene,
  CODES_ERREUR_SCENE,
  creerGroupeParticipants,
  creerSceneInteraction,
  deplacerVersSousScene,
  entrerDansScene,
  ErreurScene,
  POLITIQUES_DIFFUSION_SCENE,
  quitterScene,
  rejoindreSceneParente,
  resoudreDestinatairesScene,
  STATUTS_GROUPE_PARTICIPANTS,
  STATUTS_SCENE_INTERACTION,
  transitionnerScene,
  TYPES_SCENE_INTERACTION,
  validerEtatScenes,
} from './index.js'

const participants = { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' }, d: { id: 'd' } }
const groupe = (overrides = {}) => ({
  id: 'g', nom: 'G', participantIds: ['a', 'b'],
  statut: STATUTS_GROUPE_PARTICIPANTS.ACTIF, metadata: {}, ...overrides,
})
const scene = (overrides = {}) => ({
  id: 'principale', type: TYPES_SCENE_INTERACTION.PRINCIPALE,
  statut: STATUTS_SCENE_INTERACTION.ACTIVE, sceneParenteId: null,
  participantIdsPresents: ['a', 'b', 'c'], groupeIdsAssocies: [],
  contexte: {}, politiqueDiffusion: POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT,
  ordreCreation: 0, metadata: {}, ...overrides,
})
const sousScene = (overrides = {}) => scene({
  id: 'privee', type: TYPES_SCENE_INTERACTION.SOUS_SCENE,
  sceneParenteId: 'principale', participantIdsPresents: ['b', 'c'],
  ordreCreation: 1, ...overrides,
})
const etat = (overrides = {}) => ({
  participants, groupes: [], scenes: [scene()], ...overrides,
})

describe('RFC-013 - groupes, scenes et sous-scenes', () => {
  test('cree un groupe immutable et conserve l ordre stable', () => {
    const entree = etat({ scenes: [] })
    const ids = ['b', 'a']
    const resultat = creerGroupeParticipants({ id: 'g', participantIds: ids }, entree)
    expect(resultat).toMatchObject({ id: 'g', participantIds: ['b', 'a'], statut: 'actif' })
    expect(ids).toEqual(['b', 'a'])
    expect(entree.groupes).toEqual([])
  })

  test.each([
    STATUTS_GROUPE_PARTICIPANTS.ACTIF,
    STATUTS_GROUPE_PARTICIPANTS.INACTIF,
    STATUTS_GROUPE_PARTICIPANTS.DISSOUS,
  ])('accepte le statut de groupe %s', statut => {
    expect(creerGroupeParticipants({ id: `g-${statut}`, participantIds: [], statut }, etat({ scenes: [] })).statut)
      .toBe(statut)
  })

  test('rejette participant inconnu, participant duplique et groupe duplique', () => {
    expect(() => creerGroupeParticipants({ id: 'x', participantIds: ['absent'] }, etat({ scenes: [] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARTICIPANT_INCONNU }))
    expect(() => creerGroupeParticipants({ id: 'x', participantIds: ['a', 'a'] }, etat({ scenes: [] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARTICIPANT_DUPLIQUE }))
    expect(() => creerGroupeParticipants({ id: 'g', participantIds: [] }, etat({ groupes: [groupe()], scenes: [] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.GROUPE_DUPLIQUE }))
  })

  test('associe un groupe sans ajouter ses membres puis les ajoute explicitement', () => {
    const initial = etat({ groupes: [groupe()], scenes: [scene({ participantIdsPresents: [] })] })
    const associees = associerGroupeScene({ sceneId: 'principale', groupeId: 'g' }, initial)
    expect(associees[0]).toMatchObject({ groupeIdsAssocies: ['g'], participantIdsPresents: [] })
    const avecMembres = ajouterMembresGroupeScene(
      { sceneId: 'principale', groupeId: 'g' }, { ...initial, scenes: associees }
    )
    expect(avecMembres[0].participantIdsPresents).toEqual(['a', 'b'])
  })

  test('cree une scene principale preparee et une sous-scene directe', () => {
    const initial = etat({ scenes: [] })
    const principale = creerSceneInteraction({
      id: 'p', type: TYPES_SCENE_INTERACTION.PRINCIPALE, ordreCreation: 0,
    }, initial)
    expect(principale).toMatchObject({ statut: 'preparee', sceneParenteId: null })
    const parentActif = { ...principale, statut: STATUTS_SCENE_INTERACTION.ACTIVE }
    const enfant = creerSceneInteraction({
      id: 's', type: TYPES_SCENE_INTERACTION.SOUS_SCENE, sceneParenteId: 'p', ordreCreation: 1,
    }, { ...initial, scenes: [parentActif] })
    expect(enfant).toMatchObject({ type: 'sous_scene', sceneParenteId: 'p' })
  })

  test('rejette parent inconnu, parent ferme, profondeur et scene dupliquee', () => {
    expect(() => creerSceneInteraction({
      id: 's', type: TYPES_SCENE_INTERACTION.SOUS_SCENE, sceneParenteId: 'absente', ordreCreation: 1,
    }, etat({ scenes: [] }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARENT_INCONNU }))
    expect(() => creerSceneInteraction({
      id: 's', type: TYPES_SCENE_INTERACTION.SOUS_SCENE, sceneParenteId: 'principale', ordreCreation: 1,
    }, etat({ scenes: [scene({ statut: STATUTS_SCENE_INTERACTION.FERMEE })] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_FERMEE }))
    expect(() => validerEtatScenes(etat({ scenes: [scene(), sousScene(), sousScene({
      id: 'niveau-2', sceneParenteId: 'privee',
    })] }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE }))
    expect(() => validerEtatScenes(etat({ scenes: [scene(), scene()] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_DUPLIQUEE }))
  })

  test('applique activation, suspension, reactivation et fermeture', () => {
    let courant = etat({ scenes: [scene({ statut: STATUTS_SCENE_INTERACTION.PREPAREE })] })
    let resultat = transitionnerScene({ sceneId: 'principale', statut: 'active', transitionId: 't1' }, courant)
    expect(resultat.transition).toMatchObject({ statutInitial: 'preparee', statutFinal: 'active' })
    courant = { ...courant, scenes: resultat.scenes }
    resultat = transitionnerScene({ sceneId: 'principale', statut: 'suspendue', transitionId: 't2' }, courant)
    courant = { ...courant, scenes: resultat.scenes }
    resultat = transitionnerScene({ sceneId: 'principale', statut: 'active', transitionId: 't3' }, courant)
    courant = { ...courant, scenes: resultat.scenes }
    resultat = transitionnerScene({ sceneId: 'principale', statut: 'fermee', transitionId: 't4' }, courant)
    expect(resultat.scenes[0].statut).toBe('fermee')
    expect(resultat.trace).toMatchObject({ id: 't4', etape: 'scene_fermee' })
  })

  test('rejette transitions invalides et fermeture avec sous-scene ouverte', () => {
    expect(() => transitionnerScene(
      { sceneId: 'principale', statut: 'preparee', transitionId: 'x' }, etat()
    )).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.TRANSITION_INVALIDE }))
    expect(() => transitionnerScene(
      { sceneId: 'principale', statut: 'fermee', transitionId: 'x' },
      etat({ scenes: [scene(), sousScene({ statut: 'suspendue' })] })
    )).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SOUS_SCENE_ACTIVE }))
  })

  test('gere entree, sortie, deplacement et retour sans mutation', () => {
    const initial = etat({ scenes: [scene({ participantIdsPresents: ['a', 'b'] }), sousScene({ participantIdsPresents: [] })] })
    const entrees = entrerDansScene({ sceneId: 'principale', participantId: 'c' }, initial)
    expect(entrees[0].participantIdsPresents).toEqual(['a', 'b', 'c'])
    const sorties = quitterScene({ sceneId: 'principale', participantId: 'b' }, { ...initial, scenes: entrees })
    expect(sorties[0].participantIdsPresents).toEqual(['a', 'c'])
    const deplacees = deplacerVersSousScene({ sceneId: 'privee', participantId: 'b' }, initial)
    expect(deplacees[0].participantIdsPresents).toContain('b')
    expect(deplacees[1].participantIdsPresents).toEqual(['b'])
    const retour = rejoindreSceneParente({ sceneId: 'privee', participantId: 'b' }, { ...initial, scenes: deplacees })
    expect(retour[1].participantIdsPresents).toEqual([])
    expect(initial.scenes[1].participantIdsPresents).toEqual([])
  })

  test('rejette presence dupliquee, absence, participant inconnu, scene fermee ou suspendue', () => {
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'a' }, etat()))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PRESENCE_DUPLIQUEE }))
    expect(() => quitterScene({ sceneId: 'principale', participantId: 'd' }, etat()))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PRESENCE_ABSENTE }))
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'absent' }, etat()))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARTICIPANT_INCONNU }))
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'd' }, etat({
      scenes: [scene({ statut: 'fermee' })],
    }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_FERMEE }))
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'd' }, etat({
      scenes: [scene({ statut: 'suspendue' })],
    }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_SUSPENDUE }))
  })

  test.each([
    [POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT, 'privee', ['b', 'c']],
    [POLITIQUES_DIFFUSION_SCENE.SCENE_ET_PARENT, 'privee', ['a', 'b', 'c']],
    [POLITIQUES_DIFFUSION_SCENE.DESCENDANTS, 'principale', ['a', 'b', 'c']],
    [POLITIQUES_DIFFUSION_SCENE.CIBLES_EXPLICITES, 'principale', ['d']],
    [POLITIQUES_DIFFUSION_SCENE.GLOBALE_INTERACTION, 'principale', ['a', 'b', 'c', 'd']],
  ])('resout la politique %s', (politiqueDiffusion, sceneId, attendus) => {
    const resultat = resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId, politiqueDiffusion, destinataireIds: ['d'] },
      etatInteraction: etat({ scenes: [scene(), sousScene()] }),
      participantIdsCibles: ['a', 'b', 'c', 'd'],
    })
    expect(resultat.participantIdsEligibles).toEqual(attendus)
  })

  test('exclut le participant hors scene et la presence parente masquee par la sous-scene', () => {
    const resultat = resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId: 'principale' },
      etatInteraction: etat({ scenes: [scene(), sousScene()] }),
      participantIdsCibles: ['a', 'b', 'c', 'd'],
    })
    expect(resultat.participantIdsEligibles).toEqual(['a'])
  })

  test('SCENE_ET_PARENT isole une sous-scene soeur active et deduplique les presences structurelles', () => {
    const soeur = sousScene({
      id: 'soeur',
      participantIdsPresents: ['d'],
      ordreCreation: 2,
    })
    const resultat = resoudreDestinatairesScene({
      evenement: {
        id: 'e',
        sousSceneId: 'privee',
        politiqueDiffusion: POLITIQUES_DIFFUSION_SCENE.SCENE_ET_PARENT,
      },
      etatInteraction: etat({
        scenes: [
          scene({ participantIdsPresents: ['a', 'b', 'c', 'd'] }),
          sousScene(),
          soeur,
        ],
      }),
      participantIdsCibles: ['a', 'b', 'c', 'd'],
    })
    expect(resultat.participantIdsEligibles).toEqual(['a', 'b', 'c'])
  })

  test('SCENE_ET_PARENT rattache au parent la presence d une sous-scene soeur suspendue', () => {
    const soeurSuspendue = sousScene({
      id: 'soeur',
      statut: 'suspendue',
      participantIdsPresents: ['d'],
      ordreCreation: 2,
    })
    const resultat = resoudreDestinatairesScene({
      evenement: {
        id: 'e',
        sousSceneId: 'privee',
        politiqueDiffusion: POLITIQUES_DIFFUSION_SCENE.SCENE_ET_PARENT,
      },
      etatInteraction: etat({
        scenes: [
          scene({ participantIdsPresents: ['a', 'b', 'c', 'd'] }),
          sousScene(),
          soeurSuspendue,
        ],
      }),
      participantIdsCibles: ['a', 'b', 'c', 'd'],
    })
    expect(resultat.participantIdsEligibles).toEqual(['a', 'b', 'c', 'd'])
  })

  test('une scene suspendue ne traite rien et une scene fermee rejette', () => {
    expect(resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId: 'principale' },
      etatInteraction: etat({ scenes: [scene({ statut: 'suspendue' })] }),
      participantIdsCibles: ['a'],
    }).participantIdsEligibles).toEqual([])
    expect(() => resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId: 'principale' },
      etatInteraction: etat({ scenes: [scene({ statut: 'fermee' })] }),
      participantIdsCibles: ['a'],
    })).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_FERMEE }))
  })

  test('est reproductible, immutable et sans temps ni hasard', () => {
    const entree = etat({ groupes: [groupe()], scenes: [scene(), sousScene()] })
    const copie = structuredClone(entree)
    const evenement = { id: 'e', sceneId: 'principale', politiqueDiffusion: 'descendants' }
    const now = jest.spyOn(Date, 'now').mockImplementation(() => { throw new Error('temps') })
    const random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('hasard') })
    const un = resoudreDestinatairesScene({ evenement, etatInteraction: entree, participantIdsCibles: ['a', 'b', 'c'] })
    const deux = resoudreDestinatairesScene({ evenement, etatInteraction: entree, participantIdsCibles: ['a', 'b', 'c'] })
    expect(un).toEqual(deux)
    expect(entree).toEqual(copie)
    now.mockRestore(); random.mockRestore()
  })

  test('deux intentions de sous-scenes distinctes ne sont pas en conflit par defaut', () => {
    const intentionsRetenues = ['s1', 's2'].map((sousSceneId, index) => ({
      id: `i${index}`, participantId: `p${index}`, type: 'action',
      priorite: 100, ordreCreation: index, cibleId: null, contenu: null,
      statut: 'retenue',
      metadata: { sousSceneId, conflit: { cleExclusivite: 'meme-cle' } },
    }))
    const resultat = resoudreConflitsActionsParScene({
      intentionsRetenues,
      planificationsExecution: intentionsRetenues.map((item, ordreExecution) => ({
        participantId: item.participantId, intentionId: item.id,
        ordreExecution, mode: 'intention_metier',
      })),
      ressourcesDisponibles: {},
    })
    expect(resultat.ordreExecutionFinal).toEqual(['i0', 'i1'])
    expect(resultat.conflitsDetectes).toEqual([])
  })

  test('ErreurScene appartient a la hierarchie de validation', () => {
    try {
      validerEtatScenes(etat({ scenes: [scene(), scene()] }))
    } catch (error) {
      expect(error).toBeInstanceOf(ErreurScene)
      expect(error).toBeInstanceOf(ErreurValidation)
    }
  })
})
import { jest } from '@jest/globals'
import { ErreurValidation } from '../index.js'
import { resoudreConflitsActionsParScene } from '../resolution-conflits/index.js'
import {
  ajouterMembresGroupeScene,
  associerGroupeScene,
  CODES_ERREUR_SCENE,
  creerGroupeParticipants,
  creerSceneInteraction,
  deplacerVersSousScene,
  entrerDansScene,
  ErreurScene,
  POLITIQUES_DIFFUSION_SCENE,
  quitterScene,
  rejoindreSceneParente,
  resoudreDestinatairesScene,
  STATUTS_GROUPE_PARTICIPANTS,
  STATUTS_SCENE_INTERACTION,
  transitionnerScene,
  TYPES_SCENE_INTERACTION,
  validerEtatScenes,
} from './index.js'

const participants = { a: { id: 'a' }, b: { id: 'b' }, c: { id: 'c' }, d: { id: 'd' } }
const groupe = (overrides = {}) => ({
  id: 'g', nom: 'G', participantIds: ['a', 'b'],
  statut: STATUTS_GROUPE_PARTICIPANTS.ACTIF, metadata: {}, ...overrides,
})
const scene = (overrides = {}) => ({
  id: 'principale', type: TYPES_SCENE_INTERACTION.PRINCIPALE,
  statut: STATUTS_SCENE_INTERACTION.ACTIVE, sceneParenteId: null,
  participantIdsPresents: ['a', 'b', 'c'], groupeIdsAssocies: [],
  contexte: {}, politiqueDiffusion: POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT,
  ordreCreation: 0, metadata: {}, ...overrides,
})
const sousScene = (overrides = {}) => scene({
  id: 'privee', type: TYPES_SCENE_INTERACTION.SOUS_SCENE,
  sceneParenteId: 'principale', participantIdsPresents: ['b', 'c'],
  ordreCreation: 1, ...overrides,
})
const etat = (overrides = {}) => ({
  participants, groupes: [], scenes: [scene()], ...overrides,
})

describe('RFC-013 - groupes, scenes et sous-scenes', () => {
  test('cree un groupe immutable et conserve l ordre stable', () => {
    const entree = etat({ scenes: [] })
    const ids = ['b', 'a']
    const resultat = creerGroupeParticipants({ id: 'g', participantIds: ids }, entree)
    expect(resultat).toMatchObject({ id: 'g', participantIds: ['b', 'a'], statut: 'actif' })
    expect(ids).toEqual(['b', 'a'])
    expect(entree.groupes).toEqual([])
  })

  test.each([
    STATUTS_GROUPE_PARTICIPANTS.ACTIF,
    STATUTS_GROUPE_PARTICIPANTS.INACTIF,
    STATUTS_GROUPE_PARTICIPANTS.DISSOUS,
  ])('accepte le statut de groupe %s', statut => {
    expect(creerGroupeParticipants({ id: `g-${statut}`, participantIds: [], statut }, etat({ scenes: [] })).statut)
      .toBe(statut)
  })

  test('rejette participant inconnu, participant duplique et groupe duplique', () => {
    expect(() => creerGroupeParticipants({ id: 'x', participantIds: ['absent'] }, etat({ scenes: [] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARTICIPANT_INCONNU }))
    expect(() => creerGroupeParticipants({ id: 'x', participantIds: ['a', 'a'] }, etat({ scenes: [] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARTICIPANT_DUPLIQUE }))
    expect(() => creerGroupeParticipants({ id: 'g', participantIds: [] }, etat({ groupes: [groupe()], scenes: [] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.GROUPE_DUPLIQUE }))
  })

  test('associe un groupe sans ajouter ses membres puis les ajoute explicitement', () => {
    const initial = etat({ groupes: [groupe()], scenes: [scene({ participantIdsPresents: [] })] })
    const associees = associerGroupeScene({ sceneId: 'principale', groupeId: 'g' }, initial)
    expect(associees[0]).toMatchObject({ groupeIdsAssocies: ['g'], participantIdsPresents: [] })
    const avecMembres = ajouterMembresGroupeScene(
      { sceneId: 'principale', groupeId: 'g' }, { ...initial, scenes: associees }
    )
    expect(avecMembres[0].participantIdsPresents).toEqual(['a', 'b'])
  })

  test('cree une scene principale preparee et une sous-scene directe', () => {
    const initial = etat({ scenes: [] })
    const principale = creerSceneInteraction({
      id: 'p', type: TYPES_SCENE_INTERACTION.PRINCIPALE, ordreCreation: 0,
    }, initial)
    expect(principale).toMatchObject({ statut: 'preparee', sceneParenteId: null })
    const parentActif = { ...principale, statut: STATUTS_SCENE_INTERACTION.ACTIVE }
    const enfant = creerSceneInteraction({
      id: 's', type: TYPES_SCENE_INTERACTION.SOUS_SCENE, sceneParenteId: 'p', ordreCreation: 1,
    }, { ...initial, scenes: [parentActif] })
    expect(enfant).toMatchObject({ type: 'sous_scene', sceneParenteId: 'p' })
  })

  test('rejette parent inconnu, parent ferme, profondeur et scene dupliquee', () => {
    expect(() => creerSceneInteraction({
      id: 's', type: TYPES_SCENE_INTERACTION.SOUS_SCENE, sceneParenteId: 'absente', ordreCreation: 1,
    }, etat({ scenes: [] }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARENT_INCONNU }))
    expect(() => creerSceneInteraction({
      id: 's', type: TYPES_SCENE_INTERACTION.SOUS_SCENE, sceneParenteId: 'principale', ordreCreation: 1,
    }, etat({ scenes: [scene({ statut: STATUTS_SCENE_INTERACTION.FERMEE })] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_FERMEE }))
    expect(() => validerEtatScenes(etat({ scenes: [scene(), sousScene(), sousScene({
      id: 'niveau-2', sceneParenteId: 'privee',
    })] }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE }))
    expect(() => validerEtatScenes(etat({ scenes: [scene(), scene()] })))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_DUPLIQUEE }))
  })

  test('applique activation, suspension, reactivation et fermeture', () => {
    let courant = etat({ scenes: [scene({ statut: STATUTS_SCENE_INTERACTION.PREPAREE })] })
    let resultat = transitionnerScene({ sceneId: 'principale', statut: 'active', transitionId: 't1' }, courant)
    expect(resultat.transition).toMatchObject({ statutInitial: 'preparee', statutFinal: 'active' })
    courant = { ...courant, scenes: resultat.scenes }
    resultat = transitionnerScene({ sceneId: 'principale', statut: 'suspendue', transitionId: 't2' }, courant)
    courant = { ...courant, scenes: resultat.scenes }
    resultat = transitionnerScene({ sceneId: 'principale', statut: 'active', transitionId: 't3' }, courant)
    courant = { ...courant, scenes: resultat.scenes }
    resultat = transitionnerScene({ sceneId: 'principale', statut: 'fermee', transitionId: 't4' }, courant)
    expect(resultat.scenes[0].statut).toBe('fermee')
    expect(resultat.trace).toMatchObject({ id: 't4', etape: 'scene_fermee' })
  })

  test('rejette transitions invalides et fermeture avec sous-scene ouverte', () => {
    expect(() => transitionnerScene(
      { sceneId: 'principale', statut: 'preparee', transitionId: 'x' }, etat()
    )).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.TRANSITION_INVALIDE }))
    expect(() => transitionnerScene(
      { sceneId: 'principale', statut: 'fermee', transitionId: 'x' },
      etat({ scenes: [scene(), sousScene({ statut: 'suspendue' })] })
    )).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SOUS_SCENE_ACTIVE }))
  })

  test('gere entree, sortie, deplacement et retour sans mutation', () => {
    const initial = etat({ scenes: [scene({ participantIdsPresents: ['a', 'b'] }), sousScene({ participantIdsPresents: [] })] })
    const entrees = entrerDansScene({ sceneId: 'principale', participantId: 'c' }, initial)
    expect(entrees[0].participantIdsPresents).toEqual(['a', 'b', 'c'])
    const sorties = quitterScene({ sceneId: 'principale', participantId: 'b' }, { ...initial, scenes: entrees })
    expect(sorties[0].participantIdsPresents).toEqual(['a', 'c'])
    const deplacees = deplacerVersSousScene({ sceneId: 'privee', participantId: 'b' }, initial)
    expect(deplacees[0].participantIdsPresents).toContain('b')
    expect(deplacees[1].participantIdsPresents).toEqual(['b'])
    const retour = rejoindreSceneParente({ sceneId: 'privee', participantId: 'b' }, { ...initial, scenes: deplacees })
    expect(retour[1].participantIdsPresents).toEqual([])
    expect(initial.scenes[1].participantIdsPresents).toEqual([])
  })

  test('rejette presence dupliquee, absence, participant inconnu, scene fermee ou suspendue', () => {
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'a' }, etat()))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PRESENCE_DUPLIQUEE }))
    expect(() => quitterScene({ sceneId: 'principale', participantId: 'd' }, etat()))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PRESENCE_ABSENTE }))
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'absent' }, etat()))
      .toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.PARTICIPANT_INCONNU }))
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'd' }, etat({
      scenes: [scene({ statut: 'fermee' })],
    }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_FERMEE }))
    expect(() => entrerDansScene({ sceneId: 'principale', participantId: 'd' }, etat({
      scenes: [scene({ statut: 'suspendue' })],
    }))).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_SUSPENDUE }))
  })

  test.each([
    [POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT, 'privee', ['b', 'c']],
    [POLITIQUES_DIFFUSION_SCENE.SCENE_ET_PARENT, 'privee', ['a', 'b', 'c']],
    [POLITIQUES_DIFFUSION_SCENE.DESCENDANTS, 'principale', ['a', 'b', 'c']],
    [POLITIQUES_DIFFUSION_SCENE.CIBLES_EXPLICITES, 'principale', ['d']],
    [POLITIQUES_DIFFUSION_SCENE.GLOBALE_INTERACTION, 'principale', ['a', 'b', 'c', 'd']],
  ])('resout la politique %s', (politiqueDiffusion, sceneId, attendus) => {
    const resultat = resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId, politiqueDiffusion, destinataireIds: ['d'] },
      etatInteraction: etat({ scenes: [scene(), sousScene()] }),
      participantIdsCibles: ['a', 'b', 'c', 'd'],
    })
    expect(resultat.participantIdsEligibles).toEqual(attendus)
  })

  test('exclut le participant hors scene et la presence parente masquee par la sous-scene', () => {
    const resultat = resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId: 'principale' },
      etatInteraction: etat({ scenes: [scene(), sousScene()] }),
      participantIdsCibles: ['a', 'b', 'c', 'd'],
    })
    expect(resultat.participantIdsEligibles).toEqual(['a'])
  })

  test('une scene suspendue ne traite rien et une scene fermee rejette', () => {
    expect(resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId: 'principale' },
      etatInteraction: etat({ scenes: [scene({ statut: 'suspendue' })] }),
      participantIdsCibles: ['a'],
    }).participantIdsEligibles).toEqual([])
    expect(() => resoudreDestinatairesScene({
      evenement: { id: 'e', sceneId: 'principale' },
      etatInteraction: etat({ scenes: [scene({ statut: 'fermee' })] }),
      participantIdsCibles: ['a'],
    })).toThrow(expect.objectContaining({ code: CODES_ERREUR_SCENE.SCENE_FERMEE }))
  })

  test('est reproductible, immutable et sans temps ni hasard', () => {
    const entree = etat({ groupes: [groupe()], scenes: [scene(), sousScene()] })
    const copie = structuredClone(entree)
    const evenement = { id: 'e', sceneId: 'principale', politiqueDiffusion: 'descendants' }
    const now = jest.spyOn(Date, 'now').mockImplementation(() => { throw new Error('temps') })
    const random = jest.spyOn(Math, 'random').mockImplementation(() => { throw new Error('hasard') })
    const un = resoudreDestinatairesScene({ evenement, etatInteraction: entree, participantIdsCibles: ['a', 'b', 'c'] })
    const deux = resoudreDestinatairesScene({ evenement, etatInteraction: entree, participantIdsCibles: ['a', 'b', 'c'] })
    expect(un).toEqual(deux)
    expect(entree).toEqual(copie)
    now.mockRestore(); random.mockRestore()
  })

  test('deux intentions de sous-scenes distinctes ne sont pas en conflit par defaut', () => {
    const intentionsRetenues = ['s1', 's2'].map((sousSceneId, index) => ({
      id: `i${index}`, participantId: `p${index}`, type: 'action',
      priorite: 100, ordreCreation: index, cibleId: null, contenu: null,
      statut: 'retenue',
      metadata: { sousSceneId, conflit: { cleExclusivite: 'meme-cle' } },
    }))
    const resultat = resoudreConflitsActionsParScene({
      intentionsRetenues,
      planificationsExecution: intentionsRetenues.map((item, ordreExecution) => ({
        participantId: item.participantId, intentionId: item.id,
        ordreExecution, mode: 'intention_metier',
      })),
      ressourcesDisponibles: {},
    })
    expect(resultat.ordreExecutionFinal).toEqual(['i0', 'i1'])
    expect(resultat.conflitsDetectes).toEqual([])
  })

  test('ErreurScene appartient a la hierarchie de validation', () => {
    try {
      validerEtatScenes(etat({ scenes: [scene(), scene()] }))
    } catch (error) {
      expect(error).toBeInstanceOf(ErreurScene)
      expect(error).toBeInstanceOf(ErreurValidation)
    }
  })
})
