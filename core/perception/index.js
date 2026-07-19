/** Moteur pur de perception individuelle deterministe (RFC-006). */

import { CANAUX_PERCEPTION } from '../../constants/CanauxPerception.js'
import { PRECISIONS_PERCEPTION } from '../../constants/PrecisionsPerception.js'
import { STATUTS_PARTICIPANT } from '../../constants/StatutsParticipant.js'
import { TYPES_PARTICIPANT } from '../../constants/TypesParticipant.js'
import { VISIBILITES_EVENEMENT } from '../../constants/VisibilitesEvenement.js'
import { ErreurValidation } from '../index.js'

export const CODES_ERREUR_PERCEPTION = Object.freeze({
  PARTICIPANT_INVALIDE: 'participant_perception_invalide',
  EVENEMENT_INVALIDE: 'evenement_perception_invalide',
  CONTEXTE_INVALIDE: 'contexte_perception_invalide',
  CANAL_INVALIDE: 'canal_perception_invalide',
  PRECISION_INVALIDE: 'precision_perception_invalide',
})

export const ETAPES_TRACE_PERCEPTION = Object.freeze({
  EVALUEE: 'perception_evaluee',
  ACCEPTEE: 'perception_acceptee',
  REFUSEE: 'perception_refusee',
  PARTIELLE: 'perception_partielle',
  COMPLETE: 'perception_complete',
})

export class ErreurPerception extends ErreurValidation {
  constructor(code, message) {
    super(message)
    this.name = 'ErreurPerception'
    this.code = code
  }
}

const canauxValides = new Set(Object.values(CANAUX_PERCEPTION))
const precisionsValides = new Set(Object.values(PRECISIONS_PERCEPTION))

function estObjet(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validerListeChaines(value, champ) {
  if (value !== undefined && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.CONTEXTE_INVALIDE,
      `perception : ${champ} doit etre un tableau de chaines.`
    )
  }
}

export function validerContextePerception(contexte = {}) {
  if (!estObjet(contexte)) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.CONTEXTE_INVALIDE,
      'perception : contexte absent ou invalide.'
    )
  }
  validerListeChaines(contexte.canaux, 'canaux')
  validerListeChaines(contexte.participantsPouvantPercevoir, 'participantsPouvantPercevoir')
  validerListeChaines(contexte.participantsExclus, 'participantsExclus')
  if (contexte.contenuParParticipant !== undefined && !estObjet(contexte.contenuParParticipant)) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.CONTEXTE_INVALIDE,
      'perception : contenuParParticipant doit etre un objet.'
    )
  }
  if (contexte.metadata !== undefined && !estObjet(contexte.metadata)) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.CONTEXTE_INVALIDE,
      'perception : metadata doit etre un objet.'
    )
  }
  for (const canal of contexte.canaux ?? []) {
    if (!canauxValides.has(canal)) {
      throw new ErreurPerception(
        CODES_ERREUR_PERCEPTION.CANAL_INVALIDE,
        `perception : canal inconnu ("${canal}").`
      )
    }
  }
  if (contexte.precision !== undefined && !precisionsValides.has(contexte.precision)) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.PRECISION_INVALIDE,
      `perception : precision inconnue ("${contexte.precision}").`
    )
  }
  return contexte
}

function refuser(participantId, evenementId, canaux, raisons, metadata) {
  return {
    participantId,
    evenementId,
    perceptible: false,
    contenuPercu: undefined,
    canaux: [...canaux],
    precision: PRECISIONS_PERCEPTION.AUCUNE,
    raisons,
    metadata: { ...metadata },
  }
}

/** Applique les regles RFC-006 dans leur ordre de priorite documente. */
export function calculerPerception({ participant, evenement, etatInteraction, contexte }) {
  if (!estObjet(participant) || typeof participant.id !== 'string' || participant.id === '') {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.PARTICIPANT_INVALIDE,
      'perception : participant invalide.'
    )
  }
  if (!estObjet(evenement) || typeof evenement.id !== 'string' || evenement.id === '') {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.EVENEMENT_INVALIDE,
      'perception : evenement canonique invalide.'
    )
  }
  if (!estObjet(etatInteraction)) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.CONTEXTE_INVALIDE,
      'perception : etatInteraction invalide.'
    )
  }

  const contexteValide = validerContextePerception(
    contexte ?? evenement.metadata?.perception ?? {}
  )
  const id = participant.id
  const canaux = [...(contexteValide.canaux ?? [])]
  const metadata = contexteValide.metadata ?? {}
  const autorises = contexteValide.participantsPouvantPercevoir
  const exclus = contexteValide.participantsExclus ?? []
  const autorisationExplicite = Array.isArray(autorises) && autorises.includes(id)

  // 1. Capacite ; 2. statut ; 3. SYSTEME ; 4. exclusion ; 5. autorisation.
  if (participant.capacites?.peutPercevoir !== true) {
    return refuser(id, evenement.id, canaux, ['capacite_absente'], metadata)
  }
  if (participant.statut === STATUTS_PARTICIPANT.INACTIF) {
    return refuser(id, evenement.id, canaux, ['participant_inactif'], metadata)
  }
  if (evenement.visibilite === VISIBILITES_EVENEMENT.SYSTEME && !autorisationExplicite) {
    return refuser(id, evenement.id, canaux, ['evenement_systeme'], metadata)
  }
  if (exclus.includes(id)) {
    return refuser(id, evenement.id, canaux, ['participant_exclu'], metadata)
  }
  if (Array.isArray(autorises) && autorises.length > 0 && !autorisationExplicite) {
    return refuser(id, evenement.id, canaux, ['participant_non_autorise'], metadata)
  }

  const destinataires = Array.isArray(evenement.destinataireIds) ? evenement.destinataireIds : []
  if (evenement.visibilite === VISIBILITES_EVENEMENT.PRIVEE && !destinataires.includes(id) && !autorisationExplicite) {
    return refuser(id, evenement.id, canaux, ['participant_non_destinataire'], metadata)
  }
  if (
    evenement.visibilite === VISIBILITES_EVENEMENT.RESTREINTE &&
    (!Array.isArray(autorises) || autorises.length === 0) &&
    !destinataires.includes(id)
  ) {
    return refuser(id, evenement.id, canaux, ['participant_hors_restriction'], metadata)
  }

  const contenus = contexteValide.contenuParParticipant ?? {}
  const contenuPersonnalise = Object.prototype.hasOwnProperty.call(contenus, id)
  const contenuParDefaut = Object.prototype.hasOwnProperty.call(contexteValide, 'contenuParDefaut')
  const contenuPercu = contenuPersonnalise
    ? contenus[id]
    : contenuParDefaut
      ? contexteValide.contenuParDefaut
      : evenement.contenu
  const precision = contexteValide.precision ?? (
    contenuPersonnalise || contenuParDefaut
      ? PRECISIONS_PERCEPTION.PARTIELLE
      : PRECISIONS_PERCEPTION.COMPLETE
  )

  return {
    participantId: id,
    evenementId: evenement.id,
    perceptible: true,
    contenuPercu,
    canaux,
    precision,
    raisons: ['perception_autorisee'],
    metadata: { ...metadata },
  }
}

export function construireEvenementPercu(evenement, perception) {
  if (!perception || perception.perceptible !== true || !precisionsValides.has(perception.precision)) {
    throw new ErreurPerception(
      CODES_ERREUR_PERCEPTION.PRECISION_INVALIDE,
      'perception : perception perceptible et precision valide requises.'
    )
  }
  return {
    ...evenement,
    contenu: perception.contenuPercu,
    metadata: {
      ...(evenement.metadata ?? {}),
      perception: {
        participantId: perception.participantId,
        evenementCanoniqueId: perception.evenementId,
        precision: perception.precision,
        canaux: [...perception.canaux],
      },
    },
  }
}

export function construireTracesPerception(perception, genererId, date) {
  const donnees = {
    evenementId: perception.evenementId,
    perceptible: perception.perceptible,
    precision: perception.precision,
    raisons: [...perception.raisons],
    canaux: [...perception.canaux],
  }
  const etapes = [ETAPES_TRACE_PERCEPTION.EVALUEE]
  etapes.push(perception.perceptible ? ETAPES_TRACE_PERCEPTION.ACCEPTEE : ETAPES_TRACE_PERCEPTION.REFUSEE)
  if (perception.perceptible && perception.precision === PRECISIONS_PERCEPTION.PARTIELLE) {
    etapes.push(ETAPES_TRACE_PERCEPTION.PARTIELLE)
  }
  if (perception.perceptible && perception.precision === PRECISIONS_PERCEPTION.COMPLETE) {
    etapes.push(ETAPES_TRACE_PERCEPTION.COMPLETE)
  }
  return etapes.map(etape => ({
    id: genererId('trace'),
    participantId: perception.participantId,
    etape,
    donnees: { ...donnees, raisons: [...donnees.raisons], canaux: [...donnees.canaux] },
    date,
  }))
}

export function construireEntreePerception(perception, date) {
  return {
    evenementId: perception.evenementId,
    perceptible: perception.perceptible,
    contenuPercu: perception.contenuPercu,
    canaux: [...perception.canaux],
    precision: perception.precision,
    date,
  }
}

export { CANAUX_PERCEPTION, PRECISIONS_PERCEPTION }
