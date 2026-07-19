/**
 * core/interaction/adaptateur.js
 *
 * Couche d'adaptation minimale entre le modèle V2 (participant, événement, état
 * d'interaction) et les structures attendues par le pipeline cognitif V1.
 *
 * RESPONSABILITÉ UNIQUE : convertir des structures, dans les deux sens.
 *   V2 → V1 : construire (fiches, PlayerMessage, Etat) pour le pipeline existant.
 *   V1 → V2 : construire (ActionParticipant, EvenementInteraction, EtatInteraction,
 *             TraceInteraction[]) à partir du TurnResult produit par le pipeline.
 *
 * Ce module ne contient AUCUNE logique cognitive :
 *   - il ne calcule aucune décision, aucun ressenti, aucune mémoire ;
 *   - il ne reproduit aucun module métier ;
 *   - il ne modifie jamais les fiches reçues ;
 *   - il ne crée pas de second pipeline.
 *
 * Toutes les fonctions sont pures et déterministes : aucune mutation des entrées,
 * aucun accès réseau, aucune horloge implicite, aucun identifiant implicite.
 * Les identifiants et dates éventuels sont fournis explicitement par l'appelant.
 *
 * @module core/interaction/adaptateur
 */

import { TYPES_ACTION_PARTICIPANT } from '../../constants/TypesActionParticipant.js'
import { selectionnerFaitsEpistemiquesActifs } from '../epistemique/revision.js'

// ─── Constantes locales d'orchestration ──────────────────────────────────────
//
// Ces valeurs qualifient des structures V2 produites par l'adaptation. Elles ne
// portent aucune logique métier et restent locales à la couche d'interaction.

/**
 * Étapes cognitives tracées, dans l'ordre du pipeline V1.
 * Sert uniquement à nommer les TraceInteraction produites (pas de logique).
 * @readonly
 * @enum {string}
 */
export const ETAPES_TRACE = Object.freeze({
  ANALYSE    : 'analyse',
  INFLUENCES : 'influences',
  RESSENTI   : 'ressenti',
  DECISION   : 'decision',
  REPONSE    : 'reponse',
  MEMOIRE    : 'memoire',
})

/**
 * Clés des cinq fiches attendues par le pipeline V1.
 * Forme minimale de profil.donnees.fiches pour un profil PERSONNAGE.
 * @readonly
 */
export const CLES_FICHES = Object.freeze([
  'personnage',
  'aventure',
  'univers',
  'joueur',
  'memoire',
])

// ─── V2 → V1 ──────────────────────────────────────────────────────────────────

/**
 * extraireFiches(profil)
 *
 * Pure. Extrait les cinq fiches V1 depuis profil.donnees.fiches, sans les modifier.
 * Ne valide pas leur contenu (c'est core/ V1 qui le fait via preparerTour) : ici
 * on ne vérifie que la présence de la structure attendue.
 *
 * @param {import('../../types/Participant.js').ProfilParticipant} profil
 * @returns {object|null} les fiches, ou null si la structure attendue est absente
 */
export function extraireFiches(profil) {
  if (!profil || typeof profil !== 'object') return null
  const donnees = profil.donnees
  if (!donnees || typeof donnees !== 'object') return null
  const fiches = donnees.fiches
  if (!fiches || typeof fiches !== 'object') return null
  return fiches
}

/**
 * fichesCompletes(fiches)
 *
 * Pure. Retourne true si les cinq clés de fiches sont présentes (valeurs non nulles).
 *
 * @param {object|null} fiches
 * @returns {boolean}
 */
export function fichesCompletes(fiches) {
  if (!fiches || typeof fiches !== 'object') return false
  return CLES_FICHES.every(cle => Boolean(fiches[cle]))
}

/**
 * construireEtatV1(participantId, etatInteraction)
 *
 * Pure. Reconstruit l'Etat V1 du participant ciblé à partir de l'état
 * d'interaction, en isolant strictement ses données privées :
 *   - memoireVecue ← etatInteraction.memoires[participantId]
 *   - historique   ← etatInteraction.etatsPrives[participantId].historique
 *   - tourCourant  ← etatInteraction.etatsPrives[participantId].tourCourant
 *   - sessionId    ← etatInteraction.metadata.sessionId (identité canonique)
 *   - meta         ← etatInteraction.etatPartage.meta (configuration canonique)
 *
 * La mémoire ou l'état privé d'un AUTRE participant n'est jamais lu.
 *
 * @param {string} participantId
 * @param {import('../../types/EtatInteraction.js').EtatInteraction} etatInteraction
 * @returns {import('../../types/Etat.js').Etat}
 */
export function construireEtatV1(participantId, etatInteraction) {
  const etatPrive = etatInteraction.etatsPrives?.[participantId] ?? {}
  const memoire   = etatInteraction.memoires?.[participantId] ?? { souvenirs: [] }
  const meta      = etatInteraction.etatPartage?.meta ?? etatPrive.meta ?? {}

  return {
    sessionId    : etatInteraction.metadata?.sessionId,
    tourCourant  : etatPrive.tourCourant ?? 1,
    memoireVecue : memoire,
    historique   : etatPrive.historique ?? [],
    meta,
    epistemique  : etatPrive.epistemique === undefined
      ? undefined
      : selectionnerFaitsEpistemiquesActifs(etatPrive.epistemique),
  }
}

/**
 * construirePlayerMessage(evenement, etatV1)
 *
 * Pure. Traduit l'EvenementInteraction déclencheur en PlayerMessage V1.
 * Le contenu attendu est un objet { texte } (message du joueur).
 *
 * @param {import('../../types/EvenementInteraction.js').EvenementInteraction} evenement
 * @param {import('../../types/Etat.js').Etat} etatV1
 * @returns {import('../../types/PlayerMessage.js').PlayerMessage}
 */
export function construirePlayerMessage(evenement, etatV1) {
  const contenu = evenement?.contenu
  const texte = contenu && typeof contenu === 'object'
    ? contenu.texte
    : contenu
  const timestamp = Number.isFinite(Date.parse(evenement?.date)) ? Date.parse(evenement.date) : 0

  return {
    texte,
    tour      : etatV1.tourCourant,
    sessionId : etatV1.sessionId,
    timestamp,
  }
}

// ─── V1 → V2 ──────────────────────────────────────────────────────────────────

/**
 * determinerTypeAction(reponseIA)
 *
 * Pure. Détermine le type d'ActionParticipant à partir de la réponse V1, sans
 * réinterpréter la décision : on se fonde uniquement sur les champs déjà produits.
 *   - dialogue non vide          → PAROLE
 *   - sinon action non vide      → ACTION
 *   - sinon (rien de produit)    → SILENCE
 *
 * @param {import('../../types/ReponseIA.js').ReponseIA} reponseIA
 * @returns {string} valeur de TYPES_ACTION_PARTICIPANT
 */
export function determinerTypeAction(reponseIA) {
  const dialogue = typeof reponseIA?.dialogue === 'string' ? reponseIA.dialogue.trim() : ''
  const action   = typeof reponseIA?.action   === 'string' ? reponseIA.action.trim()   : ''
  if (dialogue !== '') return TYPES_ACTION_PARTICIPANT.PAROLE
  if (action   !== '') return TYPES_ACTION_PARTICIPANT.ACTION
  return TYPES_ACTION_PARTICIPANT.SILENCE
}

/**
 * construireActionParticipant(params)
 *
 * Pure. Construit l'ActionParticipant attribué au participant à partir de la
 * réponse V1. L'action porte toujours un participantId explicite.
 *
 * @param {object} params
 * @param {string} params.id
 * @param {string} params.participantId
 * @param {import('../../types/ReponseIA.js').ReponseIA} params.reponseIA
 * @param {string[]} params.destinataireIds
 * @param {string} params.visibilite
 * @returns {import('../../types/ActionParticipant.js').ActionParticipant}
 */
export function construireActionParticipant({ id, participantId, reponseIA, destinataireIds, visibilite }) {
  return {
    id,
    participantId,
    type    : determinerTypeAction(reponseIA),
    contenu : { action: reponseIA.action, dialogue: reponseIA.dialogue },
    destinataireIds,
    visibilite,
    metadata: {},
  }
}

/**
 * construireEvenementProduit(params)
 *
 * Pure. Construit l'EvenementInteraction émis dans l'interaction pour représenter
 * l'action du participant (afin d'enrichir l'historique).
 *
 * @param {object} params
 * @param {string} params.id
 * @param {string} params.type -- type d'événement (fourni par l'orchestrateur)
 * @param {string} params.emetteurId
 * @param {import('../../types/ActionParticipant.js').ActionParticipant} params.action
 * @param {string} params.date
 * @returns {import('../../types/EvenementInteraction.js').EvenementInteraction}
 */
export function construireEvenementProduit({ id, type, emetteurId, action, date }) {
  return {
    id,
    type,
    emetteurId,
    destinataireIds: action.destinataireIds,
    contenu        : action.contenu,
    visibilite     : action.visibilite,
    date,
    metadata       : {},
  }
}

/**
 * construireTraces(params)
 *
 * Pure. Construit les TraceInteraction minimales à partir des sorties déjà
 * présentes dans le TurnResult. Aucune logique de traçage : simple recopie.
 *
 * @param {object} params
 * @param {string} params.participantId
 * @param {(etape: string) => string} params.genererId
 * @param {string} params.date
 * @param {import('../index.js').TurnResult} params.turnResult
 * @returns {import('../../types/TraceInteraction.js').TraceInteraction[]}
 */
export function construireTraces({ participantId, genererId, date, turnResult }) {
  const etapes = [
    [ETAPES_TRACE.ANALYSE,    turnResult.evenement],
    [ETAPES_TRACE.INFLUENCES, turnResult.filtreRelationnel],
    [ETAPES_TRACE.RESSENTI,   turnResult.ressenti],
    [ETAPES_TRACE.DECISION,   turnResult.decision],
    [ETAPES_TRACE.REPONSE,    turnResult.reponseIA],
    [ETAPES_TRACE.MEMOIRE,    turnResult.miseAJourMemoire],
  ]
  return etapes.map(([etape, donnees]) => ({
    id: genererId(etape),
    participantId,
    etape,
    donnees,
    date,
  }))
}

/**
 * construireEtatPrive(etatPrivePrecedent, etatV1MisAJour)
 *
 * Pure. Construit le nouvel état privé du participant à partir de l'Etat V1 mis à
 * jour, en excluant la mémoire vécue (persistée séparément dans `memoires`).
 * L'objet précédent n'est jamais muté.
 *
 * @param {object} etatPrivePrecedent
 * @param {import('../../types/Etat.js').Etat} etatV1MisAJour
 * @returns {object}
 */
export function construireEtatPrive(etatPrivePrecedent, etatV1MisAJour) {
  return {
    ...etatPrivePrecedent,
    tourCourant: etatV1MisAJour.tourCourant,
    historique : etatV1MisAJour.historique,
  }
}
