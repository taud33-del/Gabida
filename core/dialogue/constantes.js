export const CODES_ERREUR_ETAT_DIALOGUE = Object.freeze({
  ETAT_ABSENT: 'etat_dialogue_absent',
  TYPE_INVALIDE: 'type_etat_dialogue_invalide',
  PROPRIETE_MANQUANTE: 'propriete_etat_dialogue_manquante',
  PROPRIETE_INCONNUE: 'propriete_etat_dialogue_inconnue',
  TABLEAU_INVALIDE: 'tableau_etat_dialogue_invalide',
  CHAINE_INVALIDE: 'chaine_etat_dialogue_invalide',
  DATE_INVALIDE: 'date_etat_dialogue_invalide',
  IDENTIFIANT_DUPLIQUE: 'identifiant_etat_dialogue_duplique',
  SOURCE_ABSENTE: 'source_etat_dialogue_absente',
  HISTORIQUE_ABSENT: 'historique_etat_dialogue_absent',
  HISTORIQUE_INVALIDE: 'historique_etat_dialogue_invalide',
  EVENEMENT_DUPLIQUE: 'evenement_historique_duplique',
  EVENEMENT_SOURCE_INTROUVABLE: 'evenement_source_etat_dialogue_introuvable',
  ORDRE_CHRONOLOGIQUE_INVALIDE: 'ordre_chronologique_etat_dialogue_invalide',
  DATE_PROJECTION_INCOHERENTE: 'date_projection_dialogue_incoherente',
  REFERENCE_DIALOGUE_INVALIDE: 'reference_dialogue_invalide',
  QUESTION_HISTORIQUE_INTROUVABLE: 'question_historique_introuvable',
})

export const TYPES_REFERENCE_DIALOGUE = Object.freeze({
  FAIT: 'fait',
  OBJECTIF: 'objectif',
  QUESTION: 'question',
  DECISION: 'decision',
  CONTRAINTE: 'contrainte',
  REPONSE: 'reponse',
  FAIT_A_CONFIRMER: 'fait_a_confirmer',
})
