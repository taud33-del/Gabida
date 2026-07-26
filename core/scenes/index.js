import { POLITIQUES_DIFFUSION_SCENE } from '../../constants/PolitiquesDiffusionScene.js'
import { STATUTS_GROUPE_PARTICIPANTS } from '../../constants/StatutsGroupeParticipants.js'
import { STATUTS_SCENE_INTERACTION } from '../../constants/StatutsSceneInteraction.js'
import { TYPES_SCENE_INTERACTION } from '../../constants/TypesSceneInteraction.js'
import { CODES_ERREUR_SCENE, ErreurScene } from './erreurs.js'

const statutsGroupes = new Set(Object.values(STATUTS_GROUPE_PARTICIPANTS))
const statutsScenes = new Set(Object.values(STATUTS_SCENE_INTERACTION))
const typesScenes = new Set(Object.values(TYPES_SCENE_INTERACTION))
const politiques = new Set(Object.values(POLITIQUES_DIFFUSION_SCENE))
const objet = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const erreur = (code, message, sceneId = null) => { throw new ErreurScene(code, `scenes : ${message}`, sceneId) }

function validerIdsUniques(ids, code, message, sceneId = null) {
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || id === '')) {
    erreur(CODES_ERREUR_SCENE.ETAT_INVALIDE, message, sceneId)
  }
  if (new Set(ids).size !== ids.length) erreur(code, message, sceneId)
}

function tableauEtat(value, champ) {
  if (value === undefined) return []
  if (!Array.isArray(value)) erreur(CODES_ERREUR_SCENE.ETAT_INVALIDE, `${champ} doit etre un tableau.`)
  return value
}

export function validerEtatScenes(etatInteraction) {
  const groupes = tableauEtat(etatInteraction?.groupes, 'groupes')
  const scenes = tableauEtat(etatInteraction?.scenes, 'scenes')
  const configurationPresente = etatInteraction?.groupes !== undefined || etatInteraction?.scenes !== undefined
  const active = etatInteraction?.scenes !== undefined
  if (!configurationPresente) return { active: false, groupes: [], scenes: [] }
  const participants = etatInteraction?.participants
  if (!objet(participants)) erreur(CODES_ERREUR_SCENE.ETAT_INVALIDE, 'participants absents.')
  const groupeIds = new Set()
  for (const groupe of groupes) {
    if (!objet(groupe) || typeof groupe.id !== 'string' || groupe.id === '' || !statutsGroupes.has(groupe.statut)) {
      erreur(CODES_ERREUR_SCENE.ETAT_INVALIDE, 'groupe invalide.')
    }
    if (groupeIds.has(groupe.id)) erreur(CODES_ERREUR_SCENE.GROUPE_DUPLIQUE, `groupe duplique "${groupe.id}".`)
    groupeIds.add(groupe.id)
    validerIdsUniques(groupe.participantIds, CODES_ERREUR_SCENE.PARTICIPANT_DUPLIQUE,
      `participants dupliques dans le groupe "${groupe.id}".`)
    for (const id of groupe.participantIds) if (!participants[id]) {
      erreur(CODES_ERREUR_SCENE.PARTICIPANT_INCONNU, `participant inconnu "${id}".`)
    }
  }
  const sceneIds = new Set()
  for (const scene of scenes) {
    if (!objet(scene) || typeof scene.id !== 'string' || scene.id === '' ||
        !typesScenes.has(scene.type) || !statutsScenes.has(scene.statut) ||
        !Number.isInteger(scene.ordreCreation) || !politiques.has(scene.politiqueDiffusion)) {
      erreur(CODES_ERREUR_SCENE.ETAT_INVALIDE, 'scene invalide.', scene?.id)
    }
    if (sceneIds.has(scene.id)) erreur(CODES_ERREUR_SCENE.SCENE_DUPLIQUEE, `scene dupliquee "${scene.id}".`, scene.id)
    sceneIds.add(scene.id)
    validerIdsUniques(scene.participantIdsPresents, CODES_ERREUR_SCENE.PARTICIPANT_DUPLIQUE,
      `participants dupliques dans la scene "${scene.id}".`, scene.id)
    validerIdsUniques(scene.groupeIdsAssocies ?? [], CODES_ERREUR_SCENE.GROUPE_DUPLIQUE,
      `groupes dupliques dans la scene "${scene.id}".`, scene.id)
    for (const id of scene.participantIdsPresents) if (!participants[id]) {
      erreur(CODES_ERREUR_SCENE.PARTICIPANT_INCONNU, `participant inconnu "${id}".`, scene.id)
    }
    for (const id of scene.groupeIdsAssocies ?? []) if (!groupeIds.has(id)) {
      erreur(CODES_ERREUR_SCENE.GROUPE_INCONNU, `groupe inconnu "${id}".`, scene.id)
    }
    if (scene.type === TYPES_SCENE_INTERACTION.PRINCIPALE && scene.sceneParenteId != null) {
      erreur(CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE, 'une scene principale ne peut pas avoir de parent.', scene.id)
    }
    if (scene.type === TYPES_SCENE_INTERACTION.SOUS_SCENE && !scene.sceneParenteId) {
      erreur(CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE, 'une sous-scene doit avoir un parent.', scene.id)
    }
  }
  const parId = new Map(scenes.map(scene => [scene.id, scene]))
  for (const scene of scenes.filter(item => item.type === TYPES_SCENE_INTERACTION.SOUS_SCENE)) {
    const parent = parId.get(scene.sceneParenteId)
    if (!parent) erreur(CODES_ERREUR_SCENE.PARENT_INCONNU, `parent inconnu "${scene.sceneParenteId}".`, scene.id)
    if (parent.type !== TYPES_SCENE_INTERACTION.PRINCIPALE) {
      erreur(CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE, 'profondeur maximale de sous-scene depassee.', scene.id)
    }
    if (parent.statut === STATUTS_SCENE_INTERACTION.FERMEE) {
      erreur(CODES_ERREUR_SCENE.SCENE_FERMEE, 'une sous-scene ne peut pas avoir un parent ferme.', scene.id)
    }
    if (scene.statut === STATUTS_SCENE_INTERACTION.ACTIVE &&
        parent.statut !== STATUTS_SCENE_INTERACTION.ACTIVE) {
      erreur(CODES_ERREUR_SCENE.STATUT_INVALIDE, 'une sous-scene active exige un parent actif.', scene.id)
    }
  }
  return { active, groupes, scenes }
}

export function creerGroupeParticipants({ id, nom, participantIds, statut = STATUTS_GROUPE_PARTICIPANTS.ACTIF, metadata = {} }, etatInteraction) {
  const groupes = tableauEtat(etatInteraction.groupes, 'groupes')
  const groupe = { id, ...(nom === undefined ? {} : { nom }), participantIds: [...participantIds], statut, metadata: { ...metadata } }
  validerEtatScenes({ ...etatInteraction, groupes: [...groupes, groupe], scenes: etatInteraction.scenes ?? [] })
  return groupe
}

export function creerSceneInteraction(donnees, etatInteraction) {
  const scene = {
    id: donnees.id,
    type: donnees.type,
    statut: donnees.statut ?? STATUTS_SCENE_INTERACTION.PREPAREE,
    sceneParenteId: donnees.sceneParenteId ?? null,
    participantIdsPresents: [...(donnees.participantIdsPresents ?? [])],
    groupeIdsAssocies: [...(donnees.groupeIdsAssocies ?? [])],
    contexte: { ...(donnees.contexte ?? {}) },
    politiqueDiffusion: donnees.politiqueDiffusion ?? POLITIQUES_DIFFUSION_SCENE.SCENE_UNIQUEMENT,
    ordreCreation: donnees.ordreCreation,
    metadata: { ...(donnees.metadata ?? {}) },
  }
  validerEtatScenes({ ...etatInteraction, groupes: etatInteraction.groupes ?? [], scenes: [...(etatInteraction.scenes ?? []), scene] })
  return scene
}

const transitions = new Set([
  'preparee>active', 'active>suspendue', 'suspendue>active',
  'active>fermee', 'suspendue>fermee',
])

export function transitionnerScene({ sceneId, statut, transitionId, metadata = {} }, etatInteraction) {
  const valide = validerEtatScenes(etatInteraction)
  const scene = valide.scenes.find(item => item.id === sceneId)
  if (!scene) erreur(CODES_ERREUR_SCENE.SCENE_INCONNUE, `scene inconnue "${sceneId}".`, sceneId)
  if (!transitions.has(`${scene.statut}>${statut}`)) {
    erreur(CODES_ERREUR_SCENE.TRANSITION_INVALIDE, `transition ${scene.statut} vers ${statut} interdite.`, sceneId)
  }
  if (statut === STATUTS_SCENE_INTERACTION.ACTIVE && scene.sceneParenteId) {
    const parent = valide.scenes.find(item => item.id === scene.sceneParenteId)
    if (parent.statut !== STATUTS_SCENE_INTERACTION.ACTIVE) {
      erreur(CODES_ERREUR_SCENE.TRANSITION_INVALIDE, 'le parent doit etre actif.', sceneId)
    }
  }
  if (statut === STATUTS_SCENE_INTERACTION.FERMEE) {
    const enfantOuvert = valide.scenes.find(item => item.sceneParenteId === sceneId &&
      item.statut !== STATUTS_SCENE_INTERACTION.FERMEE)
    if (enfantOuvert) erreur(CODES_ERREUR_SCENE.SOUS_SCENE_ACTIVE, `sous-scene ouverte "${enfantOuvert.id}".`, sceneId)
  }
  const sceneMiseAJour = { ...scene, statut }
  return {
    scenes: valide.scenes.map(item => item.id === sceneId ? sceneMiseAJour : { ...item }),
    transition: {
      id: transitionId, sceneId, statutInitial: scene.statut, statutFinal: statut, metadata: { ...metadata },
    },
    trace: {
      id: transitionId, participantId: null, etape: `scene_${statut}`,
      donnees: { sceneId, statutInitial: scene.statut, statutFinal: statut },
    },
  }
}

function modifierPresence(sceneId, participantId, etatInteraction, ajout) {
  const valide = validerEtatScenes(etatInteraction)
  const scene = valide.scenes.find(item => item.id === sceneId)
  if (!scene) erreur(CODES_ERREUR_SCENE.SCENE_INCONNUE, `scene inconnue "${sceneId}".`, sceneId)
  if (!etatInteraction.participants[participantId]) erreur(CODES_ERREUR_SCENE.PARTICIPANT_INCONNU, `participant inconnu "${participantId}".`, sceneId)
  if (scene.statut === STATUTS_SCENE_INTERACTION.FERMEE) erreur(CODES_ERREUR_SCENE.SCENE_FERMEE, 'scene fermee.', sceneId)
  if (scene.statut === STATUTS_SCENE_INTERACTION.SUSPENDUE) erreur(CODES_ERREUR_SCENE.SCENE_SUSPENDUE, 'scene suspendue.', sceneId)
  const present = scene.participantIdsPresents.includes(participantId)
  if (ajout && present) erreur(CODES_ERREUR_SCENE.PRESENCE_DUPLIQUEE, 'participant deja present.', sceneId)
  if (!ajout && !present) erreur(CODES_ERREUR_SCENE.PRESENCE_ABSENTE, 'participant absent.', sceneId)
  const ids = ajout
    ? [...scene.participantIdsPresents, participantId]
    : scene.participantIdsPresents.filter(id => id !== participantId)
  return valide.scenes.map(item => item.id === sceneId ? { ...scene, participantIdsPresents: ids } : { ...item })
}

export const entrerDansScene = ({ sceneId, participantId }, etat) => modifierPresence(sceneId, participantId, etat, true)
export const quitterScene = ({ sceneId, participantId }, etat) => modifierPresence(sceneId, participantId, etat, false)

export function deplacerVersSousScene({ sceneId, participantId }, etatInteraction) {
  const valide = validerEtatScenes(etatInteraction)
  const scene = valide.scenes.find(item => item.id === sceneId)
  if (!scene || scene.type !== TYPES_SCENE_INTERACTION.SOUS_SCENE) {
    erreur(CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE, 'destination non sous-scene.', sceneId)
  }
  const parent = valide.scenes.find(item => item.id === scene.sceneParenteId)
  if (!parent.participantIdsPresents.includes(participantId)) {
    erreur(CODES_ERREUR_SCENE.PRESENCE_ABSENTE, 'participant absent de la scene parente.', sceneId)
  }
  return entrerDansScene({ sceneId, participantId }, etatInteraction)
}

export function rejoindreSceneParente({ sceneId, participantId }, etatInteraction) {
  const valide = validerEtatScenes(etatInteraction)
  const scene = valide.scenes.find(item => item.id === sceneId)
  if (!scene || scene.type !== TYPES_SCENE_INTERACTION.SOUS_SCENE) {
    erreur(CODES_ERREUR_SCENE.HIERARCHIE_INVALIDE, 'origine non sous-scene.', sceneId)
  }
  return quitterScene({ sceneId, participantId }, etatInteraction)
}

export function associerGroupeScene({ sceneId, groupeId }, etatInteraction) {
  const valide = validerEtatScenes(etatInteraction)
  const scene = valide.scenes.find(item => item.id === sceneId)
  if (!scene) erreur(CODES_ERREUR_SCENE.SCENE_INCONNUE, 'scene inconnue.', sceneId)
  if (!valide.groupes.some(item => item.id === groupeId)) erreur(CODES_ERREUR_SCENE.GROUPE_INCONNU, 'groupe inconnu.', sceneId)
  if (scene.groupeIdsAssocies.includes(groupeId)) return valide.scenes.map(item => ({ ...item }))
  return valide.scenes.map(item => item.id === sceneId
    ? { ...scene, groupeIdsAssocies: [...scene.groupeIdsAssocies, groupeId] } : { ...item })
}

export function ajouterMembresGroupeScene({ sceneId, groupeId }, etatInteraction) {
  const valide = validerEtatScenes(etatInteraction)
  const groupe = valide.groupes.find(item => item.id === groupeId)
  if (!groupe) erreur(CODES_ERREUR_SCENE.GROUPE_INCONNU, 'groupe inconnu.', sceneId)
  let scenes = valide.scenes.map(item => ({ ...item, participantIdsPresents: [...item.participantIdsPresents] }))
  for (const participantId of groupe.participantIds) {
    const courant = scenes.find(item => item.id === sceneId)
    if (!courant) erreur(CODES_ERREUR_SCENE.SCENE_INCONNUE, 'scene inconnue.', sceneId)
    if (!courant.participantIdsPresents.includes(participantId)) {
      scenes = entrerDansScene({ sceneId, participantId }, { ...etatInteraction, scenes })
    }
  }
  return scenes
}

function presenceEffective(scene, scenes) {
  if (scene.type === TYPES_SCENE_INTERACTION.SOUS_SCENE) return [...scene.participantIdsPresents]
  const dansEnfantActif = new Set(scenes.filter(item =>
    item.sceneParenteId === scene.id && item.statut === STATUTS_SCENE_INTERACTION.ACTIVE
  ).flatMap(item => item.participantIdsPresents))
  return scene.participantIdsPresents.filter(id => !dansEnfantActif.has(id))
}

export function resoudreDestinatairesScene({ evenement, etatInteraction, participantIdsCibles }) {
  const reference = evenement?.sousSceneId ?? evenement?.sceneId
  const etat = validerEtatScenes(etatInteraction)
  if (!reference && !etat.active) return { active: false, participantIdsEligibles: [...participantIdsCibles] }
  if (!reference) erreur(CODES_ERREUR_SCENE.SCENE_INCONNUE, 'sceneId requis lorsque les scenes sont activees.')
  const scene = etat.scenes.find(item => item.id === reference)
  if (!scene) erreur(CODES_ERREUR_SCENE.SCENE_INCONNUE, `scene inconnue "${reference}".`, reference)
  if (scene.statut === STATUTS_SCENE_INTERACTION.FERMEE) erreur(CODES_ERREUR_SCENE.SCENE_FERMEE, 'evenement rattache a une scene fermee.', reference)
  if (scene.statut === STATUTS_SCENE_INTERACTION.SUSPENDUE) {
    return { active: true, sceneId: reference, politiqueDiffusion: evenement.politiqueDiffusion ?? scene.politiqueDiffusion, participantIdsEligibles: [] }
  }
  if (scene.statut !== STATUTS_SCENE_INTERACTION.ACTIVE) {
    return { active: true, sceneId: reference, politiqueDiffusion: evenement.politiqueDiffusion ?? scene.politiqueDiffusion, participantIdsEligibles: [] }
  }
  const politique = evenement.politiqueDiffusion ?? scene.politiqueDiffusion
  if (!politiques.has(politique)) erreur(CODES_ERREUR_SCENE.POLITIQUE_INVALIDE, `politique inconnue "${politique}".`, reference)
  let ids
  if (politique === POLITIQUES_DIFFUSION_SCENE.CIBLES_EXPLICITES) ids = [...(evenement.destinataireIds ?? [])]
  else if (politique === POLITIQUES_DIFFUSION_SCENE.GLOBALE_INTERACTION) ids = Object.keys(etatInteraction.participants)
  else if (politique === POLITIQUES_DIFFUSION_SCENE.SCENE_ET_PARENT) {
    const parent = etat.scenes.find(item => item.id === scene.sceneParenteId)
    ids = [...scene.participantIdsPresents, ...(parent?.participantIdsPresents ?? [])]
  } else if (politique === POLITIQUES_DIFFUSION_SCENE.DESCENDANTS) {
    ids = [...scene.participantIdsPresents]
    for (const enfant of etat.scenes.filter(item => item.sceneParenteId === scene.id &&
      item.statut === STATUTS_SCENE_INTERACTION.ACTIVE)) ids.push(...enfant.participantIdsPresents)
  } else ids = presenceEffective(scene, etat.scenes)
  const eligibles = new Set(ids)
  return {
    active: true,
    sceneId: reference,
    politiqueDiffusion: politique,
    participantIdsEligibles: participantIdsCibles.filter(id => eligibles.has(id)),
  }
}

export {
  CODES_ERREUR_SCENE,
  ErreurScene,
  POLITIQUES_DIFFUSION_SCENE,
  STATUTS_GROUPE_PARTICIPANTS,
  STATUTS_SCENE_INTERACTION,
  TYPES_SCENE_INTERACTION,
}
