import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_RELATION = Object.freeze({
  STRUCTURE_RELATIONS_INVALIDE: 'structure_relations_invalide',
  RELATION_INVALIDE: 'relation_invalide',
  MISE_A_JOUR_RELATION_INVALIDE: 'mise_a_jour_relation_invalide',
  PARTICIPANT_RELATION_INTROUVABLE: 'participant_relation_introuvable',
  CIBLE_RELATION_INTROUVABLE: 'cible_relation_introuvable',
  RELATION_VERS_SOI_INTERDITE: 'relation_vers_soi_interdite',
  DIMENSION_RELATION_INVALIDE: 'dimension_relation_invalide',
  VALEUR_RELATION_INVALIDE: 'valeur_relation_invalide',
  MODE_RELATION_INVALIDE: 'mode_relation_invalide',
  STATUT_RELATION_INVALIDE: 'statut_relation_invalide',
  TRANSITION_RELATION_INTERDITE: 'transition_relation_interdite',
  GENERATEUR_ID_RELATION_ABSENT: 'generateur_id_relation_absent',
  PROVENANCE_RELATION_INVALIDE: 'provenance_relation_invalide',
})

export class ErreurRelation extends ErreurValidation {
  constructor(code, message) {
    super(message)
    this.name = 'ErreurRelation'
    this.code = code
  }
}
