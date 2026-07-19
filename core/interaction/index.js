/**
 * core/interaction/index.js
 *
 * Interface publique V2 (Gabida — Phase 3) : exécuter le pipeline cognitif
 * existant pour UN OU PLUSIEURS participants autonomes ciblés dans une même
 * sollicitation, sans changer le comportement V1.
 *
 * Responsabilité unique : orchestrer un tour d'interaction en répétant, de façon
 * séquentielle et déterministe, le traitement individuel d'un participant autonome
 * (traiterParticipantUnique) puis en agrégeant les résultats.
 *
 * Ce module :
 *   - valide la sollicitation et l'état d'interaction ;
 *   - résout et valide les participants autonomes ciblés (ordre = participantIdsCibles) ;
 *   - filtre les participants selon une règle de perception minimale ;
 *   - exécute le pipeline V1 canonique (executeTurn) une fois par participant ;
 *   - convertit chaque résultat en ActionParticipant attribuée à son auteur ;
 *   - agrège actions/événements/traces et mises à jour d'état (immuables).
 *
 * Isolation stricte : chaque participant réagit à l'ÉTAT INITIAL de la
 * sollicitation. Aucun participant ne reçoit la mémoire, l'état privé ou l'action
 * d'un autre participant. Aucune réaction croisée, aucun ordre narratif, aucun
 * arbitrage de conflit : ce sont des phases ultérieures.
 *
 * @module core/interaction
 */

import { executeTurn, ErreurGabida, ErreurValidation } from '../index.js'

import { TYPES_PARTICIPANT }        from '../../constants/TypesParticipant.js'
import { STATUTS_PARTICIPANT }      from '../../constants/StatutsParticipant.js'
import { TYPES_PROFIL_PARTICIPANT } from '../../constants/TypesProfilParticipant.js'
import { VISIBILITES_EVENEMENT }    from '../../constants/VisibilitesEvenement.js'

import {
  extraireFiches,
  fichesCompletes,
  construireEtatV1,
  construirePlayerMessage,
  construireActionParticipant,
  construireEvenementProduit,
  construireTraces,
  construireEtatPrive,
} from './adaptateur.js'

// ─── Constantes locales ───────────────────────────────────────────────────────

/**
 * Type d'EvenementInteraction émis pour représenter l'action d'un participant.
 * Valeur d'orchestration (le champ EvenementInteraction.type est libre) ; aucune
 * logique métier.
 */
export const TYPE_EVENEMENT_ACTION = 'action_participant'

/**
 * Codes des conditions d'erreur documentées de traiterInteraction.
 * Chaque code identifie précisément une précondition non respectée.
 * @readonly
 * @enum {string}
 */
export const CODES_ERREUR_INTERACTION = Object.freeze({
  SOLLICITATION_INVALIDE         : 'sollicitation_invalide',
  ETAT_INTERACTION_INVALIDE      : 'etat_interaction_invalide',
  CIBLES_ABSENTES                : 'cibles_absentes',
  CIBLES_DUPLIQUEES              : 'cibles_dupliquees',
  PARTICIPANT_INTROUVABLE        : 'participant_introuvable',
  PARTICIPANT_NON_AUTONOME       : 'participant_non_autonome',
  STATUT_INVALIDE                : 'statut_invalide',
  PROFIL_ABSENT                  : 'profil_absent',
  PROFIL_NON_SUPPORTE            : 'profil_non_supporte',
  DONNEES_PROFIL_INCOMPLETES     : 'donnees_profil_incompletes',
  CAPACITE_INDISPENSABLE_ABSENTE : 'capacite_indispensable_absente',
  ETAT_PRIVE_INCOHERENT          : 'etat_prive_incoherent',
  EVENEMENT_NON_PERCEPTIBLE      : 'evenement_non_perceptible',
})

// ─── Erreurs dédiées ────────────────────────────────────────────────────────────

/**
 * Précondition non respectée à l'entrée de traiterInteraction.
 * Sous-classe d'ErreurValidation (même catégorie « validation à la frontière »),
 * enrichie d'un `code` stable issu de CODES_ERREUR_INTERACTION.
 */
export class ErreurInteraction extends ErreurValidation {
  /**
   * @param {string} code    -- valeur de CODES_ERREUR_INTERACTION
   * @param {string} message -- message destiné au consommateur
   */
  constructor(code, message) {
    super(message)
    this.name = 'ErreurInteraction'
    this.code = code
  }
}

/**
 * Échec du pipeline cognitif pour un participant donné.
 * Catégorie « engine/runtime » : n'est PAS une erreur de validation. Préserve la
 * cause d'origine et identifie le participant concerné (atomicité : aucun résultat
 * partiel n'est retourné lorsqu'elle est levée).
 */
export class ErreurTraitementParticipant extends ErreurGabida {
  /**
   * @param {string} participantId
   * @param {Error} cause
   */
  constructor(participantId, cause) {
    super(`traiterInteraction : echec du pipeline pour le participant "${participantId}" : ${cause.message}`)
    this.name          = 'ErreurTraitementParticipant'
    this.participantId = participantId
    this.cause         = cause
  }
}

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * validerSollicitation(sollicitation)
 * @param {import('../../types/Sollicitation.js').Sollicitation} sollicitation
 * @throws {ErreurInteraction}
 */
function validerSollicitation(sollicitation) {
  if (!sollicitation || typeof sollicitation !== 'object') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE,
      'traiterInteraction : sollicitation absente ou invalide.'
    )
  }
  if (typeof sollicitation.id !== 'string' || sollicitation.id === '') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE,
      'traiterInteraction : sollicitation.id est absent.'
    )
  }
  if (!sollicitation.evenement || typeof sollicitation.evenement !== 'object') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE,
      'traiterInteraction : sollicitation.evenement est absent.'
    )
  }
  if (!Array.isArray(sollicitation.participantIdsCibles)) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE,
      'traiterInteraction : sollicitation.participantIdsCibles doit etre un tableau.'
    )
  }
}

/**
 * validerEtatInteraction(etatInteraction)
 * @param {import('../../types/EtatInteraction.js').EtatInteraction} etatInteraction
 * @throws {ErreurInteraction}
 */
function validerEtatInteraction(etatInteraction) {
  if (!etatInteraction || typeof etatInteraction !== 'object') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_INTERACTION_INVALIDE,
      'traiterInteraction : etatInteraction absent ou invalide.'
    )
  }
  const champsObjet = ['participants', 'etatsPrives', 'memoires']
  for (const champ of champsObjet) {
    if (!etatInteraction[champ] || typeof etatInteraction[champ] !== 'object') {
      throw new ErreurInteraction(
        CODES_ERREUR_INTERACTION.ETAT_INTERACTION_INVALIDE,
        `traiterInteraction : etatInteraction.${champ} est absent ou invalide.`
      )
    }
  }
  if (!Array.isArray(etatInteraction.historique)) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_INTERACTION_INVALIDE,
      'traiterInteraction : etatInteraction.historique doit etre un tableau.'
    )
  }
  if (!etatInteraction.metadata || typeof etatInteraction.metadata !== 'object') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_INTERACTION_INVALIDE,
      'traiterInteraction : etatInteraction.metadata est absent ou invalide.'
    )
  }
}

/**
 * validerParticipant(participant, etatInteraction)
 *
 * Vérifie type, statut, profil, capacités indispensables et cohérence de l'état
 * privé/mémoire d'un participant ciblé. Retourne les fiches extraites de son profil.
 *
 * @param {import('../../types/Participant.js').Participant} participant
 * @param {import('../../types/EtatInteraction.js').EtatInteraction} etatInteraction
 * @returns {object} fiches V1 extraites du profil
 * @throws {ErreurInteraction}
 */
export function validerParticipant(participant, etatInteraction) {
  const id = participant.id

  if (participant.type !== TYPES_PARTICIPANT.AGENT_AUTONOME) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PARTICIPANT_NON_AUTONOME,
      `traiterInteraction : le participant "${id}" n est pas autonome (type "${participant.type}").`
    )
  }

  if (participant.statut !== STATUTS_PARTICIPANT.ACTIF) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.STATUT_INVALIDE,
      `traiterInteraction : une action est demandee au participant "${id}" mais son statut est "${participant.statut}" (attendu : ACTIF).`
    )
  }

  const capacites = participant.capacites
  if (!capacites || typeof capacites !== 'object') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.CAPACITE_INDISPENSABLE_ABSENTE,
      `traiterInteraction : capacites du participant "${id}" absentes.`
    )
  }
  const indispensables = ['peutAnalyser', 'peutDecider', 'peutProduireAction']
  for (const capacite of indispensables) {
    if (capacites[capacite] !== true) {
      throw new ErreurInteraction(
        CODES_ERREUR_INTERACTION.CAPACITE_INDISPENSABLE_ABSENTE,
        `traiterInteraction : capacite indispensable manquante pour "${id}" ("${capacite}").`
      )
    }
  }

  if (!participant.profil) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PROFIL_ABSENT,
      `traiterInteraction : profil du participant "${id}" absent.`
    )
  }
  if (participant.profil.type !== TYPES_PROFIL_PARTICIPANT.PERSONNAGE) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PROFIL_NON_SUPPORTE,
      `traiterInteraction : type de profil "${participant.profil.type}" non pris en charge pour "${id}" (attendu : PERSONNAGE).`
    )
  }

  const fiches = extraireFiches(participant.profil)
  if (!fichesCompletes(fiches)) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.DONNEES_PROFIL_INCOMPLETES,
      `traiterInteraction : profil.donnees.fiches incomplet pour "${id}" (5 fiches attendues).`
    )
  }

  const etatPrive = etatInteraction.etatsPrives[id]
  if (etatPrive !== undefined && (etatPrive === null || typeof etatPrive !== 'object')) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_PRIVE_INCOHERENT,
      `traiterInteraction : etat prive du participant "${id}" incoherent.`
    )
  }
  const memoire = etatInteraction.memoires[id]
  if (memoire !== undefined && (!memoire || !Array.isArray(memoire.souvenirs))) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_PRIVE_INCOHERENT,
      `traiterInteraction : memoire du participant "${id}" incoherente (souvenirs manquants).`
    )
  }

  return fiches
}

/**
 * resoudreCiblesAutonomes(sollicitation, etatInteraction)
 *
 * Résout les participants ciblés STRICTEMENT dans l'ordre de participantIdsCibles.
 * Rejette une liste vide et les identifiants dupliqués (pour ne pas masquer une
 * entrée invalide). Valide chaque participant (existence + validerParticipant).
 *
 * @returns {{ participant: import('../../types/Participant.js').Participant, fiches: object }[]}
 * @throws {ErreurInteraction}
 */
export function resoudreCiblesAutonomes(sollicitation, etatInteraction) {
  const cibles = sollicitation.participantIdsCibles

  if (cibles.length === 0) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.CIBLES_ABSENTES,
      'traiterInteraction : aucun participant cible dans la sollicitation.'
    )
  }

  const vus = new Set()
  for (const id of cibles) {
    if (vus.has(id)) {
      throw new ErreurInteraction(
        CODES_ERREUR_INTERACTION.CIBLES_DUPLIQUEES,
        `traiterInteraction : identifiant cible duplique ("${id}").`
      )
    }
    vus.add(id)
  }

  return cibles.map(id => {
    const participant = etatInteraction.participants[id]
    if (!participant) {
      throw new ErreurInteraction(
        CODES_ERREUR_INTERACTION.PARTICIPANT_INTROUVABLE,
        `traiterInteraction : participant cible introuvable ("${id}").`
      )
    }
    const fiches = validerParticipant(participant, etatInteraction)
    return { participant, fiches }
  })
}

// ─── Perception minimale ─────────────────────────────────────────────────────

/**
 * peutPercevoirEvenement(participant, evenement)
 *
 * Règle de perception minimale et déterministe (aucun moteur de perception) :
 *   - PUBLIQUE   : perceptible par tout participant ciblé ;
 *   - PRIVEE     : perceptible uniquement par les participants de destinataireIds ;
 *   - RESTREINTE : règle minimale — identique à PRIVEE (limitée à destinataireIds)
 *                  tant qu'aucun ensemble de perception explicite n'existe ;
 *   - SYSTEME    : non transmise aux agents incarnés (AGENT_AUTONOME) ;
 *   - absente    : traitée comme PUBLIQUE (compatibilité).
 *
 * Rappel des contrats : destinataireIds = participants directement concernés ;
 * visibilite = qui peut potentiellement percevoir. Percevoir n'implique pas être
 * destinataire.
 *
 * @param {import('../../types/Participant.js').Participant} participant
 * @param {import('../../types/EvenementInteraction.js').EvenementInteraction} evenement
 * @returns {boolean}
 */
export function peutPercevoirEvenement(participant, evenement) {
  const destinataireIds = Array.isArray(evenement.destinataireIds) ? evenement.destinataireIds : []
  switch (evenement.visibilite) {
    case VISIBILITES_EVENEMENT.PRIVEE:
    case VISIBILITES_EVENEMENT.RESTREINTE:
      return destinataireIds.includes(participant.id)
    case VISIBILITES_EVENEMENT.SYSTEME:
      return false
    case VISIBILITES_EVENEMENT.PUBLIQUE:
    default:
      return true
  }
}

// ─── Traitement individuel (réutilisé pour chaque participant) ────────────────

/**
 * traiterParticipantUnique(params)
 *
 * Encapsule le traitement cognitif d'UN participant autonome : construit son
 * contexte V1 isolé à partir de l'ÉTAT INITIAL, exécute le pipeline V1 canonique
 * (executeTurn — jamais dupliqué), puis convertit le résultat V1 en fragments V2.
 * Ne mute jamais etatInteraction et ne lit jamais les données d'un autre participant.
 *
 * @returns {Promise<{
 *   participantId: string,
 *   action: import('../../types/ActionParticipant.js').ActionParticipant,
 *   evenementProduit: import('../../types/EvenementInteraction.js').EvenementInteraction,
 *   traces: import('../../types/TraceInteraction.js').TraceInteraction[],
 *   etatPrive: object,
 *   memoire: (object|undefined),
 * }>}
 * @throws {ErreurTraitementParticipant} si le pipeline échoue pour ce participant
 */
export async function traiterParticipantUnique({
  participant,
  fiches,
  sollicitation,
  etatInteraction,
  providerConfig,
  genererId,
  date,
}) {
  const participantId = participant.id
  const evenementEntree = sollicitation.evenement

  const etatV1        = construireEtatV1(participantId, etatInteraction)
  const playerMessage = construirePlayerMessage(evenementEntree, etatV1)

  let turnResult
  try {
    turnResult = await executeTurn(playerMessage, providerConfig, fiches, etatV1)
  } catch (cause) {
    throw new ErreurTraitementParticipant(participantId, cause)
  }

  const destinataireIds = evenementEntree.emetteurId ? [evenementEntree.emetteurId] : []
  const visibilite = evenementEntree.visibilite ?? VISIBILITES_EVENEMENT.PUBLIQUE

  const action = construireActionParticipant({
    id: genererId('action'),
    participantId,
    reponseIA: turnResult.reponseIA,
    destinataireIds,
    visibilite,
  })

  const evenementProduit = construireEvenementProduit({
    id: genererId('evenement'),
    type: TYPE_EVENEMENT_ACTION,
    emetteurId: participantId,
    action,
    date,
  })

  const traces = construireTraces({ participantId, genererId, date, turnResult })

  const etatPrivePrecedent = etatInteraction.etatsPrives[participantId] ?? {}
  const etatPrive = construireEtatPrive(etatPrivePrecedent, turnResult.etatMisAJour)

  const peutMemoriser = participant.capacites.peutMemoriser === true

  return {
    participantId,
    action,
    evenementProduit,
    traces,
    etatPrive,
    memoire: peutMemoriser ? turnResult.etatMisAJour.memoireVecue : undefined,
  }
}

// ─── Agrégation ────────────────────────────────────────────────────────────────

/**
 * agregerResultats({ sollicitation, etatInteraction, resultatsParticipants })
 *
 * Agrège de façon déterministe les fragments produits par chaque participant,
 * dans l'ordre de traitement, et construit le nouvel EtatInteraction immuable.
 * L'événement d'entrée est ajouté UNE SEULE fois à l'historique, suivi des
 * événements produits (ordre des participants). L'état initial n'est jamais muté ;
 * seules les entrées des participants traités sont remplacées.
 *
 * @returns {import('../../types/ResultatInteraction.js').ResultatInteraction}
 */
function agregerResultats({ sollicitation, etatInteraction, resultatsParticipants }) {
  const actions            = resultatsParticipants.map(r => r.action)
  const evenementsProduits = resultatsParticipants.map(r => r.evenementProduit)
  const traces             = resultatsParticipants.flatMap(r => r.traces)

  const etatsPrives = { ...etatInteraction.etatsPrives }
  for (const r of resultatsParticipants) {
    etatsPrives[r.participantId] = r.etatPrive
  }

  // La carte des mémoires n'est recopiée que si au moins un participant a
  // effectivement mémorisé (peutMemoriser) : sinon la référence initiale est
  // conservée telle quelle (aucune mémoire modifiée).
  const misesAJourMemoire = resultatsParticipants.filter(r => r.memoire !== undefined)
  let memoires = etatInteraction.memoires
  if (misesAJourMemoire.length > 0) {
    memoires = { ...etatInteraction.memoires }
    for (const r of misesAJourMemoire) {
      memoires[r.participantId] = r.memoire
    }
  }

  const nouvelEtat = {
    ...etatInteraction,
    etatsPrives,
    memoires,
    historique: [
      ...etatInteraction.historique,
      sollicitation.evenement,
      ...evenementsProduits,
    ],
  }

  return {
    sollicitationId: sollicitation.id,
    actions,
    evenementsProduits,
    etat: nouvelEtat,
    traces,
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * traiterInteraction(sollicitation, etatInteraction, dependances)
 *
 * Point d'entrée public V2 (Phase 3). Traite un ou plusieurs participants
 * autonomes ciblés, chacun exécutant INDÉPENDAMMENT le pipeline cognitif V1
 * canonique (executeTurn), puis agrège les résultats en un seul ResultatInteraction.
 *
 * Traitement séquentiel et déterministe dans l'ordre de participantIdsCibles.
 * Atomicité : si le pipeline d'un participant échoue, l'appel échoue entièrement
 * (aucun état partiellement mis à jour n'est retourné).
 *
 * @param {import('../../types/Sollicitation.js').Sollicitation} sollicitation
 * @param {import('../../types/EtatInteraction.js').EtatInteraction} etatInteraction
 * @param {object} dependances
 * @param {import('../../api/index.js').ProviderConfig} dependances.providerConfig
 *   [obligatoire] Configuration du provider transmise au pipeline V1.
 * @param {(role?: string) => string} [dependances.genererId]
 *   [optionnel] Générateur d'identifiants (actions/événements/traces).
 *   Défaut : crypto.randomUUID. Injectable pour le déterminisme des tests.
 * @param {string} [dependances.date]
 *   [optionnel] Date ISO 8601 appliquée aux structures produites.
 *   Défaut : la date de l'événement déclencheur.
 *
 * @returns {Promise<import('../../types/ResultatInteraction.js').ResultatInteraction>}
 *
 * @throws {ErreurInteraction} précondition non respectée (voir CODES_ERREUR_INTERACTION)
 * @throws {ErreurTraitementParticipant} échec du pipeline pour un participant (atomique)
 */
export async function traiterInteraction(sollicitation, etatInteraction, dependances) {
  if (!dependances || typeof dependances !== 'object' || !dependances.providerConfig) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.SOLLICITATION_INVALIDE,
      'traiterInteraction : dependances.providerConfig est absent.'
    )
  }

  const genererId = typeof dependances.genererId === 'function'
    ? dependances.genererId
    : () => crypto.randomUUID()

  validerSollicitation(sollicitation)
  validerEtatInteraction(etatInteraction)

  const ciblesResolues = resoudreCiblesAutonomes(sollicitation, etatInteraction)

  const percevants = ciblesResolues.filter(
    ({ participant }) => peutPercevoirEvenement(participant, sollicitation.evenement)
  )
  if (percevants.length === 0) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.EVENEMENT_NON_PERCEPTIBLE,
      'traiterInteraction : evenement non perceptible par aucun participant cible.'
    )
  }

  const date = typeof dependances.date === 'string'
    ? dependances.date
    : sollicitation.evenement.date

  // Traitement séquentiel contre l'ÉTAT INITIAL (aucune réaction croisée).
  // Les résultats sont d'abord tous collectés : l'état agrégé n'est construit
  // qu'après réussite de tous les traitements (atomicité, pas de résultat partiel).
  const resultatsParticipants = []
  for (const { participant, fiches } of percevants) {
    const resultat = await traiterParticipantUnique({
      participant,
      fiches,
      sollicitation,
      etatInteraction,
      providerConfig: dependances.providerConfig,
      genererId,
      date,
    })
    resultatsParticipants.push(resultat)
  }

  return agregerResultats({ sollicitation, etatInteraction, resultatsParticipants })
}

export { ErreurGabida, ErreurValidation }
