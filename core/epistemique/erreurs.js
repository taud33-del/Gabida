import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_EPISTEMIQUE = Object.freeze({
  STRUCTURE_INVALIDE: 'structure_epistemique_invalide',
  PROPOSITION_INVALIDE: 'proposition_epistemique_invalide',
  TYPE_FAIT_INVALIDE: 'type_fait_epistemique_invalide',
  STATUT_FAIT_INVALIDE: 'statut_fait_epistemique_invalide',
  TYPE_PROVENANCE_INVALIDE: 'type_provenance_epistemique_invalide',
  CONFIANCE_INVALIDE: 'confiance_epistemique_invalide',
  FAIT_CONTREDIT_INTROUVABLE: 'fait_contredit_introuvable',
  FAIT_REMPLACE_INTROUVABLE: 'fait_remplace_introuvable',
  GENERATEUR_ID_ABSENT: 'generateur_id_epistemique_absent',
  REVISION_INVALIDE: 'revision_epistemique_invalide',
  OPERATION_REVISION_INVALIDE: 'operation_revision_invalide',
  VALEUR_REVISION_INVALIDE: 'valeur_revision_invalide',
  FAIT_REVISION_INTROUVABLE: 'fait_revision_introuvable',
  TRANSITION_INTERDITE: 'transition_epistemique_interdite',
  DATE_EXPIRATION_INVALIDE: 'date_expiration_invalide',
  GENERATEUR_ID_REVISION_ABSENT: 'generateur_id_revision_absent',
  GENERATEUR_ID_VERSION_ABSENT: 'generateur_id_version_absent',
  VERSION_INVALIDE: 'version_epistemique_invalide',
})

export const ETAPES_TRACE_EPISTEMIQUE = Object.freeze({
  PROPOSITION_IGNOREE: 'epistemique_proposition_ignoree',
  FAIT_CREE: 'epistemique_fait_cree',
  FAIT_MIS_A_JOUR: 'epistemique_fait_mis_a_jour',
  FAIT_CONTREDIT: 'epistemique_fait_contredit',
  FAIT_REMPLACE: 'epistemique_fait_remplace',
  AUCUNE_PERCEPTION: 'epistemique_aucune_perception',
  AUCUNE_PROPOSITION: 'epistemique_aucune_proposition',
  REVISION_APPLIQUEE: 'epistemique_revision_appliquee',
  CONFIANCE_RENFORCEE: 'epistemique_confiance_renforcee',
  CONFIANCE_AFFAIBLIE: 'epistemique_confiance_affaiblie',
  FAIT_SUSPENDU: 'epistemique_fait_suspendu',
  FAIT_REACTIVE: 'epistemique_fait_reactive',
  FAIT_OBSOLETE: 'epistemique_fait_obsolete',
  FAIT_EXPIRE: 'epistemique_fait_expire',
  FAIT_INVALIDE: 'epistemique_fait_invalide',
  REVISION_IGNOREE: 'epistemique_revision_ignoree',
  TRANSITION_REFUSEE: 'epistemique_transition_refusee',
})

export class ErreurEpistemique extends ErreurValidation {
  constructor(code, message) {
    super(message)
    this.name = 'ErreurEpistemique'
    this.code = code
  }
}
