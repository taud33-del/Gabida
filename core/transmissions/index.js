import { isDeepStrictEqual } from 'node:util'
import { STATUTS_TRANSMISSION_INFORMATION } from '../../constants/StatutsTransmissionInformation.js'
import { TYPES_RESULTAT_TRANSMISSION } from '../../constants/TypesResultatTransmission.js'
import { TYPES_FAIT_EPISTEMIQUE } from '../../constants/TypesFaitEpistemique.js'
import { TYPES_PROVENANCE_EPISTEMIQUE } from '../../constants/TypesProvenanceEpistemique.js'
import { STATUTS_FAIT_EPISTEMIQUE } from '../../constants/StatutsFaitEpistemique.js'
import { CODES_ERREUR_TRANSMISSION, ErreurTransmission } from './erreurs.js'

export const CONFIANCE_TRANSMISSION_PAR_DEFAUT = 0.5

export const ETAPES_TRACE_TRANSMISSION = Object.freeze({
  VALIDATION: 'transmission_validation',
  EMISE: 'transmission_emise',
  RECUE: 'transmission_recue',
  IGNOREE: 'transmission_ignoree',
  NON_PERCUE: 'transmission_non_percue',
  FAIT_SOURCE_VERIFIE: 'transmission_fait_source_verifie',
  FAIT_EPISTEMIQUE_CREE: 'transmission_fait_epistemique_cree',
  FAIT_EPISTEMIQUE_MIS_A_JOUR: 'transmission_fait_epistemique_mis_a_jour',
  AUCUNE: 'transmission_aucune',
})

const objet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
const texte = valeur => typeof valeur === 'string' && valeur.length > 0
const typesResultat = new Set(Object.values(TYPES_RESULTAT_TRANSMISSION))
const statutsTransmission = new Set(Object.values(STATUTS_TRANSMISSION_INFORMATION))
const echouer = (code, message) => { throw new ErreurTransmission(code, `transmissions : ${message}`) }

function validerConfiance(confiance) {
  if (!Number.isFinite(confiance) || confiance < 0 || confiance > 1) {
    echouer(CODES_ERREUR_TRANSMISSION.CONFIANCE_TRANSMISSION_INVALIDE, 'confiance attendue entre 0 et 1.')
  }
}

export function validerEtatTransmissions(transmissions) {
  if (transmissions === undefined) return
  if (!objet(transmissions) || !Array.isArray(transmissions.emises) || !Array.isArray(transmissions.recues)) {
    echouer(CODES_ERREUR_TRANSMISSION.STRUCTURE_TRANSMISSIONS_INVALIDE, 'historique prive invalide.')
  }
  const idsPrives = new Set()
  for (const transmission of transmissions.emises) {
    if (!objet(transmission) || !texte(transmission.id) || !statutsTransmission.has(transmission.statut)) {
      echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_INVALIDE, 'transmission emise invalide.')
    }
    if (idsPrives.has(transmission.id)) echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_ID_DUPLIQUE, `identifiant historique "${transmission.id}" duplique.`)
    idsPrives.add(transmission.id)
  }
  for (const resultat of transmissions.recues) {
    if (!objet(resultat) || !texte(resultat.transmissionId) || !texte(resultat.destinataireId)) {
      echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_INVALIDE, 'resultat recu invalide.')
    }
    if (idsPrives.has(resultat.transmissionId)) echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_ID_DUPLIQUE, `identifiant historique "${resultat.transmissionId}" duplique.`)
    idsPrives.add(resultat.transmissionId)
  }
}

function trouverFaitSource(etatInteraction, emetteurId, faitSourceId) {
  const epistemique = etatInteraction.etatsPrives?.[emetteurId]?.epistemique
  const faits = [...(epistemique?.connaissances ?? []), ...(epistemique?.croyances ?? [])]
  const fait = faits.find(candidat => candidat.id === faitSourceId)
  if (!fait) echouer(CODES_ERREUR_TRANSMISSION.FAIT_SOURCE_INTROUVABLE, `fait source "${faitSourceId}" introuvable chez "${emetteurId}".`)
  if (fait.statut !== STATUTS_FAIT_EPISTEMIQUE.ACTIF) {
    echouer(CODES_ERREUR_TRANSMISSION.FAIT_SOURCE_INACTIF, `fait source "${faitSourceId}" non actif.`)
  }
  return fait
}

function idsHistoriques(etatInteraction) {
  const ids = new Set()
  for (const etatPrive of Object.values(etatInteraction.etatsPrives ?? {})) {
    validerEtatTransmissions(etatPrive?.transmissions)
    for (const transmission of etatPrive?.transmissions?.emises ?? []) ids.add(transmission.id)
    for (const resultat of etatPrive?.transmissions?.recues ?? []) ids.add(resultat.transmissionId)
  }
  return ids
}

export function preparerTransmissionsInformation({ evenementCanonique, etatInteraction, genererIdTransmission, date }) {
  const structure = evenementCanonique?.metadata?.transmissions
  if (structure === undefined) return undefined
  if (!objet(structure) || !Array.isArray(structure.informations)) {
    echouer(CODES_ERREUR_TRANSMISSION.STRUCTURE_TRANSMISSIONS_INVALIDE, 'metadata.transmissions.informations doit etre un tableau.')
  }

  const idsUtilises = idsHistoriques(etatInteraction)
  const transmissions = []
  for (const instruction of structure.informations) {
    if (!objet(instruction) || !texte(instruction.emetteurId) || !Array.isArray(instruction.destinataireIds) || instruction.destinataireIds.length === 0 ||
        (instruction.id !== undefined && !texte(instruction.id)) ||
        (instruction.faitSourceId !== undefined && !texte(instruction.faitSourceId)) ||
        (instruction.metadata !== undefined && !objet(instruction.metadata)) ||
        (instruction.participantsConcernes !== undefined && (!Array.isArray(instruction.participantsConcernes) || !instruction.participantsConcernes.every(texte)))) {
      echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_INVALIDE, 'instruction de transmission invalide.')
    }
    if (!Object.prototype.hasOwnProperty.call(instruction, 'proposition') || instruction.proposition === undefined) {
      echouer(CODES_ERREUR_TRANSMISSION.PROPOSITION_TRANSMISSION_INVALIDE, 'proposition explicite requise.')
    }
    if (instruction.statut !== undefined && instruction.statut !== STATUTS_TRANSMISSION_INFORMATION.ACTIVE) {
      echouer(CODES_ERREUR_TRANSMISSION.STATUT_TRANSMISSION_INVALIDE, `statut "${instruction.statut}" invalide.`)
    }
    if (!etatInteraction.participants[instruction.emetteurId]) {
      echouer(CODES_ERREUR_TRANSMISSION.EMETTEUR_TRANSMISSION_INTROUVABLE, `emetteur "${instruction.emetteurId}" introuvable.`)
    }
    const destinatairesVus = new Set()
    for (const destinataireId of instruction.destinataireIds) {
      if (!texte(destinataireId)) echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_INVALIDE, 'identifiant destinataire invalide.')
      if (destinatairesVus.has(destinataireId)) echouer(CODES_ERREUR_TRANSMISSION.DESTINATAIRE_TRANSMISSION_DUPLIQUE, `destinataire "${destinataireId}" duplique.`)
      destinatairesVus.add(destinataireId)
      if (destinataireId === instruction.emetteurId) echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_VERS_SOI_INTERDITE, 'transmission vers soi interdite.')
      if (!etatInteraction.participants[destinataireId]) echouer(CODES_ERREUR_TRANSMISSION.DESTINATAIRE_TRANSMISSION_INTROUVABLE, `destinataire "${destinataireId}" introuvable.`)
    }
    for (const participantId of instruction.participantsConcernes ?? []) {
      if (!etatInteraction.participants[participantId]) echouer(CODES_ERREUR_TRANSMISSION.DESTINATAIRE_TRANSMISSION_INTROUVABLE, `participant concerne "${participantId}" introuvable.`)
    }

    const typeResultat = instruction.typeResultat ?? TYPES_RESULTAT_TRANSMISSION.CROYANCE
    if (!typesResultat.has(typeResultat)) echouer(CODES_ERREUR_TRANSMISSION.TYPE_RESULTAT_TRANSMISSION_INVALIDE, `type resultat "${typeResultat}" invalide.`)
    if (typeResultat === TYPES_RESULTAT_TRANSMISSION.CONNAISSANCE && instruction.metadata?.autorisationConnaissance !== true) {
      echouer(CODES_ERREUR_TRANSMISSION.TYPE_RESULTAT_TRANSMISSION_INVALIDE, 'une connaissance exige metadata.autorisationConnaissance=true.')
    }
    const confiance = instruction.confiance ?? CONFIANCE_TRANSMISSION_PAR_DEFAUT
    validerConfiance(confiance)

    let id = instruction.id
    if (!id) {
      if (typeof genererIdTransmission !== 'function') echouer(CODES_ERREUR_TRANSMISSION.GENERATEUR_ID_TRANSMISSION_ABSENT, 'genererIdTransmission est requis.')
      id = genererIdTransmission()
      if (!texte(id)) echouer(CODES_ERREUR_TRANSMISSION.GENERATEUR_ID_TRANSMISSION_ABSENT, 'genererIdTransmission doit retourner une chaine non vide.')
    }
    if (idsUtilises.has(id)) echouer(CODES_ERREUR_TRANSMISSION.TRANSMISSION_ID_DUPLIQUE, `identifiant "${id}" duplique.`)
    idsUtilises.add(id)

    const faitSourceId = instruction.faitSourceId ?? null
    if (faitSourceId !== null) {
      const faitSource = trouverFaitSource(etatInteraction, instruction.emetteurId, faitSourceId)
      if (!isDeepStrictEqual(faitSource.proposition, instruction.proposition)) {
        echouer(CODES_ERREUR_TRANSMISSION.FAIT_SOURCE_INCOHERENT, `proposition incoherente avec le fait source "${faitSourceId}".`)
      }
    }

    transmissions.push({
      id,
      emetteurId: instruction.emetteurId,
      destinataireIds: [...instruction.destinataireIds],
      proposition: instruction.proposition,
      faitSourceId,
      typeResultat,
      confiance,
      statut: STATUTS_TRANSMISSION_INFORMATION.ACTIVE,
      evenementId: evenementCanonique.id,
      date,
      metadata: { ...(instruction.metadata ?? {}), participantsConcernes: instruction.participantsConcernes === undefined ? undefined : [...instruction.participantsConcernes] },
    })
  }
  return { transmissions, evenementId: evenementCanonique.id }
}

export function construirePropositionsTransmises({ plan, participant, perception }) {
  if (plan === undefined) return []
  const propositions = []
  for (const transmission of plan.transmissions) {
    const concernee = transmission.destinataireIds.includes(participant.id) &&
      (transmission.metadata.participantsConcernes === undefined || transmission.metadata.participantsConcernes.includes(participant.id))
    if (!concernee || !perception.perceptible) continue
    propositions.push({
      proposition: transmission.proposition,
      type: transmission.typeResultat === TYPES_RESULTAT_TRANSMISSION.CONNAISSANCE
        ? TYPES_FAIT_EPISTEMIQUE.CONNAISSANCE
        : TYPES_FAIT_EPISTEMIQUE.CROYANCE,
      confiance: transmission.confiance,
      provenanceType: TYPES_PROVENANCE_EPISTEMIQUE.COMMUNICATION,
      sourceId: transmission.id,
      participantSourceId: transmission.emetteurId,
      participantsInformes: [participant.id],
      metadata: { ...transmission.metadata, transmissionId: transmission.id },
    })
  }
  return propositions
}

function trouverFaitTransmission(resultatEpistemique, transmissionId) {
  const candidats = [...resultatEpistemique.faitsCrees, ...resultatEpistemique.faitsMisAJour]
  return candidats.find(fait => fait.provenance.some(provenance => provenance.metadata?.transmissionId === transmissionId))
}

function trace({ etape, transmission, destinataireId = null, perceptible = null, faitEpistemiqueId = null, raison = null, genererId, date }) {
  return {
    id: genererId('trace'),
    participantId: destinataireId ?? transmission.emetteurId,
    etape,
    donnees: {
      transmissionId: transmission.id,
      emetteurId: transmission.emetteurId,
      destinataireId,
      evenementId: transmission.evenementId,
      perceptible,
      typeResultat: transmission.typeResultat,
      confiance: transmission.confiance,
      faitSourceId: transmission.faitSourceId,
      faitEpistemiqueId,
      raison,
    },
    date,
  }
}

export function finaliserTransmissionsInformation({ plan, evaluations, resultatsEpistemiques, etatsPrives, genererId, date }) {
  if (plan === undefined) return { etatsPrives, transmissionsAppliquees: [], transmissionsIgnorees: [], traces: [] }
  const evaluationsParId = new Map(evaluations.map(evaluation => [evaluation.participant.id, evaluation]))
  const suivants = { ...etatsPrives }
  const transmissionsAppliquees = []
  const transmissionsIgnorees = []
  const traces = []

  if (plan.transmissions.length === 0) {
    traces.push({
      id: genererId('trace'), participantId: null, etape: ETAPES_TRACE_TRANSMISSION.AUCUNE,
      donnees: {
        transmissionId: null, emetteurId: null, destinataireId: null,
        evenementId: plan.evenementId, perceptible: null, typeResultat: null,
        confiance: null, faitSourceId: null, faitEpistemiqueId: null, raison: null,
      },
      date,
    })
  }

  for (const transmission of plan.transmissions) {
    traces.push(trace({ etape: ETAPES_TRACE_TRANSMISSION.VALIDATION, transmission, genererId, date }))
    if (transmission.faitSourceId) traces.push(trace({ etape: ETAPES_TRACE_TRANSMISSION.FAIT_SOURCE_VERIFIE, transmission, genererId, date }))
    traces.push(trace({ etape: ETAPES_TRACE_TRANSMISSION.EMISE, transmission, genererId, date }))
    const etatSource = suivants[transmission.emetteurId] ?? {}
    suivants[transmission.emetteurId] = {
      ...etatSource,
      transmissions: {
        emises: [...(etatSource.transmissions?.emises ?? []), transmission],
        recues: [...(etatSource.transmissions?.recues ?? [])],
      },
    }

    for (const destinataireId of transmission.destinataireIds) {
      const evaluation = evaluationsParId.get(destinataireId)
      const perceptible = evaluation?.perception?.perceptible === true
      const concerne = transmission.metadata.participantsConcernes === undefined || transmission.metadata.participantsConcernes.includes(destinataireId)
      const fait = perceptible && concerne ? trouverFaitTransmission(resultatsEpistemiques.get(destinataireId), transmission.id) : undefined
      const appliquee = Boolean(fait)
      const raison = !concerne ? 'participant_non_concerne' : !perceptible ? 'non_percue' : null
      const resultat = {
        transmissionId: transmission.id,
        destinataireId,
        perceptible,
        faitEpistemiqueId: fait?.id ?? null,
        appliquee,
        raison,
        date,
        metadata: {},
      }
      const etatDestinataire = suivants[destinataireId] ?? {}
      suivants[destinataireId] = {
        ...etatDestinataire,
        transmissions: {
          emises: [...(etatDestinataire.transmissions?.emises ?? [])],
          recues: [...(etatDestinataire.transmissions?.recues ?? []), resultat],
        },
      }
      ;(appliquee ? transmissionsAppliquees : transmissionsIgnorees).push(resultat)
      const etape = !concerne ? ETAPES_TRACE_TRANSMISSION.IGNOREE : !perceptible ? ETAPES_TRACE_TRANSMISSION.NON_PERCUE : ETAPES_TRACE_TRANSMISSION.RECUE
      traces.push(trace({ etape, transmission, destinataireId, perceptible, faitEpistemiqueId: fait?.id ?? null, raison, genererId, date }))
      if (fait) {
        const cree = resultatEpistemiqueContient(resultatsEpistemiques.get(destinataireId).faitsCrees, fait.id, transmission.id)
        traces.push(trace({
          etape: cree ? ETAPES_TRACE_TRANSMISSION.FAIT_EPISTEMIQUE_CREE : ETAPES_TRACE_TRANSMISSION.FAIT_EPISTEMIQUE_MIS_A_JOUR,
          transmission, destinataireId, perceptible, faitEpistemiqueId: fait.id, genererId, date,
        }))
      }
    }
  }
  return { etatsPrives: suivants, transmissionsAppliquees, transmissionsIgnorees, traces }
}

function resultatEpistemiqueContient(faits, faitId, transmissionId) {
  return faits.some(fait => fait.id === faitId && fait.provenance.some(provenance => provenance.metadata?.transmissionId === transmissionId))
}

export { CODES_ERREUR_TRANSMISSION, ErreurTransmission }
export { STATUTS_TRANSMISSION_INFORMATION, TYPES_RESULTAT_TRANSMISSION }
