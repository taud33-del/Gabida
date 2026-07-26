import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_SCENE = Object.freeze({
  ETAT_INVALIDE: 'etat_scenes_invalide',
  GROUPE_DUPLIQUE: 'groupe_duplique',
  SCENE_DUPLIQUEE: 'scene_dupliquee',
  PARTICIPANT_INCONNU: 'participant_scene_inconnu',
  PARTICIPANT_DUPLIQUE: 'participant_scene_duplique',
  GROUPE_INCONNU: 'groupe_scene_inconnu',
  SCENE_INCONNUE: 'scene_inconnue',
  PARENT_INCONNU: 'scene_parente_inconnue',
  HIERARCHIE_INVALIDE: 'hierarchie_scene_invalide',
  STATUT_INVALIDE: 'statut_scene_invalide',
  TRANSITION_INVALIDE: 'transition_scene_invalide',
  SCENE_FERMEE: 'scene_fermee',
  SCENE_SUSPENDUE: 'scene_suspendue',
  PRESENCE_DUPLIQUEE: 'presence_scene_dupliquee',
  PRESENCE_ABSENTE: 'presence_scene_absente',
  SOUS_SCENE_ACTIVE: 'sous_scene_active',
  POLITIQUE_INVALIDE: 'politique_diffusion_scene_invalide',
})

export class ErreurScene extends ErreurValidation {
  constructor(code, message, sceneId = null) {
    super(message)
    this.name = 'ErreurScene'
    this.code = code
    this.sceneId = sceneId
  }
}
