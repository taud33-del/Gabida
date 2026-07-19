/**
 * Propagation deterministe des evenements (RFC-005).
 *
 * Ce module pilote uniquement une file FIFO bornee. Il delegue la selection et
 * l'execution d'une etape a l'orchestrateur RFC-004 et ne contient aucune
 * logique cognitive ou narrative.
 */

import { TYPES_ACTION_PARTICIPANT } from '../../constants/TypesActionParticipant.js'
import { ErreurValidation } from '../index.js'
import { orchestrerTour } from './orchestrateur.js'

export const OPTIONS_PROPAGATION_PAR_DEFAUT = Object.freeze({
  active: false,
  nombreMaximumEvenements: 20,
  profondeurMaximum: 5,
})

export const CODES_ERREUR_PROPAGATION = Object.freeze({
  CONFIGURATION_INVALIDE: 'configuration_propagation_invalide',
  PROFONDEUR_MAXIMALE_INVALIDE: 'profondeur_maximale_invalide',
  NOMBRE_MAXIMAL_EVENEMENTS_INVALIDE: 'nombre_maximal_evenements_invalide',
  EVENEMENT_SANS_IDENTIFIANT: 'evenement_sans_identifiant',
  EVENEMENT_PROPAGE_INCOHERENT: 'evenement_propage_incoherent',
})

export const ETAPES_TRACE_PROPAGATION = Object.freeze({
  EVENEMENT_DEPILE: 'propagation_evenement_depile',
  EVENEMENT_AJOUTE: 'propagation_evenement_ajoute',
  EVENEMENT_IGNORE: 'propagation_evenement_ignore',
  PROFONDEUR_MAXIMALE: 'propagation_profondeur_maximale',
  NOMBRE_MAXIMAL: 'propagation_nombre_maximal',
})

export class ErreurPropagation extends ErreurValidation {
  constructor(code, message, evenementId) {
    super(message)
    this.name = 'ErreurPropagation'
    this.code = code
    this.evenementId = evenementId
  }
}

export function normaliserOptionsPropagation(options) {
  if (options === undefined) return { ...OPTIONS_PROPAGATION_PAR_DEFAUT }
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.CONFIGURATION_INVALIDE,
      'propagation : configuration absente ou invalide.'
    )
  }

  const normalisees = { ...OPTIONS_PROPAGATION_PAR_DEFAUT, ...options }
  if (typeof normalisees.active !== 'boolean') {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.CONFIGURATION_INVALIDE,
      'propagation : active doit etre un booleen.'
    )
  }
  if (!Number.isInteger(normalisees.nombreMaximumEvenements) || normalisees.nombreMaximumEvenements < 1) {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.NOMBRE_MAXIMAL_EVENEMENTS_INVALIDE,
      'propagation : nombreMaximumEvenements doit etre un entier strictement positif.'
    )
  }
  if (!Number.isInteger(normalisees.profondeurMaximum) || normalisees.profondeurMaximum < 0) {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.PROFONDEUR_MAXIMALE_INVALIDE,
      'propagation : profondeurMaximum doit etre un entier positif ou nul.'
    )
  }
  return normalisees
}

export function validerEvenementIdentifie(evenement) {
  if (!evenement || typeof evenement !== 'object' || typeof evenement.id !== 'string' || evenement.id === '') {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.EVENEMENT_SANS_IDENTIFIANT,
      'propagation : tout evenement doit posseder un identifiant non vide.',
      evenement?.id
    )
  }
}

export function estEvenementPropagable(action, evenement) {
  if (!action || typeof action !== 'object') return false
  return (
    action.type === TYPES_ACTION_PARTICIPANT.PAROLE ||
    action.type === TYPES_ACTION_PARTICIPANT.ACTION
  ) && Boolean(evenement && typeof evenement === 'object')
}

function creerTrace(etape, evenementId, profondeur, genererId, date, donnees = {}) {
  return {
    id: genererId('trace'),
    participantId: null,
    etape,
    donnees: { evenementId, profondeur, ...donnees },
    date,
  }
}

function ajouterHistoriqueUnique(historique, idsHistorique, evenement) {
  if (!idsHistorique.has(evenement.id)) {
    historique.push(evenement)
    idsHistorique.add(evenement.id)
  }
}

function validerAssociation(action, evenement) {
  if (!action || typeof action !== 'object' || !evenement || typeof evenement !== 'object') {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.EVENEMENT_PROPAGE_INCOHERENT,
      'propagation : association action/evenement produite incoherente.',
      evenement?.id
    )
  }
  validerEvenementIdentifie(evenement)
  if (evenement.emetteurId !== action.participantId) {
    throw new ErreurPropagation(
      CODES_ERREUR_PROPAGATION.EVENEMENT_PROPAGE_INCOHERENT,
      `propagation : l evenement "${evenement.id}" ne correspond pas a son action.`,
      evenement.id
    )
  }
}

/**
 * Traite une chaine d'evenements en FIFO. Une limite configuree termine
 * proprement la chaine ; toute erreur reelle est propagee sans resultat partiel.
 */
export async function propagerInteraction({
  sollicitation,
  etatInitial,
  ciblesResolues,
  options,
  evaluerPerceptions,
  peutPercevoir,
  executerParticipant,
  genererId,
  date,
}) {
  const configuration = normaliserOptionsPropagation(options)
  validerEvenementIdentifie(sollicitation.evenement)

  const file = [{ evenement: sollicitation.evenement, profondeur: 0 }]
  const evenementIdsTraites = new Set()
  const historique = [...etatInitial.historique]
  const idsHistorique = new Set(
    historique
      .filter(evenement => evenement && typeof evenement.id === 'string')
      .map(evenement => evenement.id)
  )
  const actions = []
  const evenementsProduits = []
  const traces = []
  let etatCourant = etatInitial
  let nombreEvenementsTraites = 0

  ajouterHistoriqueUnique(historique, idsHistorique, sollicitation.evenement)

  while (file.length > 0) {
    if (nombreEvenementsTraites >= configuration.nombreMaximumEvenements) {
      const prochain = file[0]
      traces.push(creerTrace(
        ETAPES_TRACE_PROPAGATION.NOMBRE_MAXIMAL,
        prochain.evenement.id,
        prochain.profondeur,
        genererId,
        date,
        { nombreEvenementsTraites }
      ))
      break
    }

    const { evenement, profondeur } = file.shift()
    validerEvenementIdentifie(evenement)

    if (evenementIdsTraites.has(evenement.id)) {
      traces.push(creerTrace(
        ETAPES_TRACE_PROPAGATION.EVENEMENT_IGNORE,
        evenement.id,
        profondeur,
        genererId,
        date,
        { raison: 'identifiant_deja_traite' }
      ))
      continue
    }

    evenementIdsTraites.add(evenement.id)
    nombreEvenementsTraites += 1
    traces.push(creerTrace(
      ETAPES_TRACE_PROPAGATION.EVENEMENT_DEPILE,
      evenement.id,
      profondeur,
      genererId,
      date
    ))

    const sollicitationEtape = { ...sollicitation, evenement }
    const perceptionEtape = typeof evaluerPerceptions === 'function'
      ? evaluerPerceptions({ evenement, etatInteraction: etatCourant })
      : {
          participantsSelectionnes: ciblesResolues.filter(
            ({ participant }) => peutPercevoir(participant, evenement)
          ),
          traces: [],
        }
    const participantsSelectionnes = perceptionEtape.participantsSelectionnes
      .filter(({ participant }) => participant.id !== evenement.emetteurId)

    const resultatEtape = await orchestrerTour({
      participantsSelectionnes,
      sollicitation: sollicitationEtape,
      etatInitial: etatCourant,
      tracesSupplementaires: perceptionEtape.traces,
      executerParticipant: (cible, etatEtape) => executerParticipant(cible, etatEtape, {
        ...sollicitationEtape,
        evenement: cible.evenementPercu ?? evenement,
        perception: cible.perception,
      }),
    })

    actions.push(...resultatEtape.actions)
    evenementsProduits.push(...resultatEtape.evenementsProduits)
    traces.push(...resultatEtape.traces)

    for (let index = 0; index < resultatEtape.actions.length; index += 1) {
      const action = resultatEtape.actions[index]
      const evenementProduit = resultatEtape.evenementsProduits[index]
      validerAssociation(action, evenementProduit)
      ajouterHistoriqueUnique(historique, idsHistorique, evenementProduit)

      if (!estEvenementPropagable(action, evenementProduit)) continue

      const profondeurProduite = profondeur + 1
      if (profondeurProduite > configuration.profondeurMaximum) {
        traces.push(creerTrace(
          ETAPES_TRACE_PROPAGATION.PROFONDEUR_MAXIMALE,
          evenementProduit.id,
          profondeurProduite,
          genererId,
          date,
          { profondeurMaximum: configuration.profondeurMaximum }
        ))
        continue
      }

      file.push({ evenement: evenementProduit, profondeur: profondeurProduite })
      traces.push(creerTrace(
        ETAPES_TRACE_PROPAGATION.EVENEMENT_AJOUTE,
        evenementProduit.id,
        profondeurProduite,
        genererId,
        date
      ))
    }

    etatCourant = { ...resultatEtape.etat, historique: [...historique] }
  }

  return {
    sollicitationId: sollicitation.id,
    actions,
    evenementsProduits,
    etat: { ...etatCourant, historique: [...historique] },
    traces,
  }
}
