import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_TRANSMISSION = Object.freeze({
  STRUCTURE_TRANSMISSIONS_INVALIDE: 'structure_transmissions_invalide',
  TRANSMISSION_INVALIDE: 'transmission_invalide',
  TRANSMISSION_ID_DUPLIQUE: 'transmission_id_duplique',
  EMETTEUR_TRANSMISSION_INTROUVABLE: 'emetteur_transmission_introuvable',
  DESTINATAIRE_TRANSMISSION_INTROUVABLE: 'destinataire_transmission_introuvable',
  DESTINATAIRE_TRANSMISSION_DUPLIQUE: 'destinataire_transmission_duplique',
  TRANSMISSION_VERS_SOI_INTERDITE: 'transmission_vers_soi_interdite',
  PROPOSITION_TRANSMISSION_INVALIDE: 'proposition_transmission_invalide',
  TYPE_RESULTAT_TRANSMISSION_INVALIDE: 'type_resultat_transmission_invalide',
  CONFIANCE_TRANSMISSION_INVALIDE: 'confiance_transmission_invalide',
  STATUT_TRANSMISSION_INVALIDE: 'statut_transmission_invalide',
  FAIT_SOURCE_INTROUVABLE: 'fait_source_introuvable',
  FAIT_SOURCE_INACTIF: 'fait_source_inactif',
  FAIT_SOURCE_INCOHERENT: 'fait_source_incoherent',
  GENERATEUR_ID_TRANSMISSION_ABSENT: 'generateur_id_transmission_absent',
})

export class ErreurTransmission extends ErreurValidation {
  constructor(code, message) {
    super(message)
    this.name = 'ErreurTransmission'
    this.code = code
  }
}
