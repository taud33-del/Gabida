/**
 * core/interaction/index.js
 *
 * Interface publique V2 (Gabida — Phase 2) : exécuter le pipeline cognitif
 * existant pour UN SEUL participant autonome, sans changer le comportement V1.
 *
 * Responsabilité unique : orchestrer un tour d'interaction pour un participant
 * autonome unique en réutilisant le pipeline cognitif canonique de core/ V1.
 *
 * Ce module :
 *   - valide la sollicitation et l'état d'interaction ;
 *   - sélectionne l'unique participant autonome ciblé (règle stricte) ;
 *   - vérifie son type, son statut et ses capacités indispensables ;
 *   - délègue l'adaptation des structures à core/interaction/adaptateur.js ;
 *   - exécute le pipeline V1 canonique (executeTurn) — sans le dupliquer ;
 *   - convertit le résultat en ResultatInteraction (état d'interaction immuable).
 *
 * Il ne contient AUCUNE logique cognitive et ne crée AUCUN orchestrateur
 * multi-participants : exactement un agent autonome est traité par sollicitation.
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
  SOLLICITATION_INVALIDE       : 'sollicitation_invalide',
  ETAT_INTERACTION_INVALIDE    : 'etat_interaction_invalide',
  CIBLES_ABSENTES              : 'cibles_absentes',
  PARTICIPANT_INTROUVABLE      : 'participant_introuvable',
  AUCUN_AGENT_AUTONOME         : 'aucun_agent_autonome',
  PLUSIEURS_AGENTS_AUTONOMES   : 'plusieurs_agents_autonomes',
  PARTICIPANT_NON_AUTONOME     : 'participant_non_autonome',
  STATUT_INVALIDE              : 'statut_invalide',
  PROFIL_ABSENT                : 'profil_absent',
  PROFIL_NON_SUPPORTE          : 'profil_non_supporte',
  DONNEES_PROFIL_INCOMPLETES   : 'donnees_profil_incompletes',
  CAPACITE_INDISPENSABLE_ABSENTE : 'capacite_indispensable_absente',
  ETAT_PRIVE_INCOHERENT        : 'etat_prive_incoherent',
})

// ─── Erreur dédiée ─────────────────────────────────────────────────────────────

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
 * selectionnerParticipantAutonome(sollicitation, etatInteraction)
 *
 * Applique la règle stricte de Phase 2 : parmi les participants ciblés existants,
 * exactement UN doit être de type AGENT_AUTONOME. Toute autre configuration échoue.
 * Aucune sélection « intelligente » n'est effectuée.
 *
 * @returns {import('../../types/Participant.js').Participant}
 * @throws {ErreurInteraction}
 */
export function selectionnerParticipantAutonome(sollicitation, etatInteraction) {
  const cibles = sollicitation.participantIdsCibles
  if (cibles.length === 0) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.CIBLES_ABSENTES,
      'traiterInteraction : aucun participant cible dans la sollicitation.'
    )
  }

  const participantsCibles = cibles.map(id => {
    const participant = etatInteraction.participants[id]
    if (!participant) {
      throw new ErreurInteraction(
        CODES_ERREUR_INTERACTION.PARTICIPANT_INTROUVABLE,
        `traiterInteraction : participant cible introuvable ("${id}").`
      )
    }
    return participant
  })

  const autonomes = participantsCibles.filter(p => p.type === TYPES_PARTICIPANT.AGENT_AUTONOME)

  if (autonomes.length === 0) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.AUCUN_AGENT_AUTONOME,
      'traiterInteraction : aucun participant autonome parmi les cibles.'
    )
  }
  if (autonomes.length > 1) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PLUSIEURS_AGENTS_AUTONOMES,
      'traiterInteraction : plusieurs participants autonomes cibles (Phase 2 en traite un seul).'
    )
  }

  return autonomes[0]
}

/**
 * validerParticipant(participant, etatInteraction)
 *
 * Vérifie type, statut, profil, capacités indispensables et cohérence de l'état
 * privé/mémoire du participant sélectionné. Retourne les fiches extraites.
 *
 * @returns {object} fiches V1 extraites du profil
 * @throws {ErreurInteraction}
 */
export function validerParticipant(participant, etatInteraction) {
  if (participant.type !== TYPES_PARTICIPANT.AGENT_AUTONOME) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PARTICIPANT_NON_AUTONOME,
      'traiterInteraction : le participant sélectionné n est pas autonome.'
    )
  }

  if (participant.statut !== STATUTS_PARTICIPANT.ACTIF) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.STATUT_INVALIDE,
      `traiterInteraction : une action est demandee mais le statut est "${participant.statut}" (attendu : ACTIF).`
    )
  }

  const capacites = participant.capacites
  if (!capacites || typeof capacites !== 'object') {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.CAPACITE_INDISPENSABLE_ABSENTE,
      'traiterInteraction : capacites du participant absentes.'
    )
  }
  const indispensables = ['peutAnalyser', 'peutDecider', 'peutProduireAction']
  for (const capacite of indispensables) {
    if (capacites[capacite] !== true) {
      throw new ErreurInteraction(
        CODES_ERREUR_INTERACTION.CAPACITE_INDISPENSABLE_ABSENTE,
        `traiterInteraction : capacite indispensable manquante ("${capacite}").`
      )
    }
  }

  if (!participant.profil) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PROFIL_ABSENT,
      'traiterInteraction : profil du participant absent.'
    )
  }
  if (participant.profil.type !== TYPES_PROFIL_PARTICIPANT.PERSONNAGE) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.PROFIL_NON_SUPPORTE,
      `traiterInteraction : type de profil "${participant.profil.type}" non pris en charge en Phase 2 (attendu : PERSONNAGE).`
    )
  }

  const fiches = extraireFiches(participant.profil)
  if (!fichesCompletes(fiches)) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.DONNEES_PROFIL_INCOMPLETES,
      'traiterInteraction : profil.donnees.fiches incomplet (5 fiches attendues).'
    )
  }

  const etatPrive = etatInteraction.etatsPrives[participant.id]
  if (etatPrive !== undefined && (etatPrive === null || typeof etatPrive !== 'object')) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_PRIVE_INCOHERENT,
      'traiterInteraction : etat prive du participant incoherent.'
    )
  }
  const memoire = etatInteraction.memoires[participant.id]
  if (memoire !== undefined && (!memoire || !Array.isArray(memoire.souvenirs))) {
    throw new ErreurInteraction(
      CODES_ERREUR_INTERACTION.ETAT_PRIVE_INCOHERENT,
      'traiterInteraction : memoire du participant incoherente (souvenirs manquants).'
    )
  }

  return fiches
}

// ─── Conversion de sortie ─────────────────────────────────────────────────────

/**
 * construireResultatInteraction(params)
 *
 * Assemble le ResultatInteraction et le nouvel EtatInteraction immuable à partir
 * du TurnResult V1. Aucune donnée d'un autre participant n'est touchée.
 *
 * @returns {import('../../types/ResultatInteraction.js').ResultatInteraction}
 */
function construireResultatInteraction({
  sollicitation,
  etatInteraction,
  participant,
  turnResult,
  genererId,
  date,
  peutMemoriser,
}) {
  const participantId  = participant.id
  const evenementEntree = sollicitation.evenement
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

  const evenementsProduits = [evenementProduit]

  const traces = construireTraces({ participantId, genererId, date, turnResult })

  const etatPrivePrecedent = etatInteraction.etatsPrives[participantId] ?? {}
  const nouvelEtatPrive = construireEtatPrive(etatPrivePrecedent, turnResult.etatMisAJour)

  const nouvellesMemoires = peutMemoriser
    ? { ...etatInteraction.memoires, [participantId]: turnResult.etatMisAJour.memoireVecue }
    : etatInteraction.memoires

  const nouvelEtat = {
    ...etatInteraction,
    etatsPrives: {
      ...etatInteraction.etatsPrives,
      [participantId]: nouvelEtatPrive,
    },
    memoires: nouvellesMemoires,
    historique: [
      ...etatInteraction.historique,
      evenementEntree,
      ...evenementsProduits,
    ],
  }

  return {
    sollicitationId: sollicitation.id,
    actions: [action],
    evenementsProduits,
    etat: nouvelEtat,
    traces,
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * traiterInteraction(sollicitation, etatInteraction, dependances)
 *
 * Point d'entrée public V2 (Phase 2). Traite EXACTEMENT un participant autonome
 * en réutilisant le pipeline cognitif V1 canonique (executeTurn).
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
 * @throws {ErreurValidation|ErreurPipeline|ErreurProvider} erreurs du pipeline V1 (propagées telles quelles)
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

  const participant = selectionnerParticipantAutonome(sollicitation, etatInteraction)
  const fiches      = validerParticipant(participant, etatInteraction)

  const date = typeof dependances.date === 'string'
    ? dependances.date
    : sollicitation.evenement.date

  const etatV1        = construireEtatV1(participant.id, etatInteraction)
  const playerMessage = construirePlayerMessage(sollicitation.evenement, etatV1)

  const turnResult = await executeTurn(
    playerMessage,
    dependances.providerConfig,
    fiches,
    etatV1
  )

  return construireResultatInteraction({
    sollicitation,
    etatInteraction,
    participant,
    turnResult,
    genererId,
    date,
    peutMemoriser: participant.capacites.peutMemoriser === true,
  })
}

export { ErreurGabida, ErreurValidation }
