import { STATUTS_RELATION_PARTICIPANT } from '../../constants/StatutsRelationParticipant.js'
import { TYPES_PROVENANCE_RELATION } from '../../constants/TypesProvenanceRelation.js'
import { MODES_MISE_A_JOUR_RELATION } from '../../constants/ModesMiseAJourRelation.js'
import { DIMENSIONS_RELATION_STANDARD } from '../../constants/DimensionsRelationStandard.js'
import { CODES_ERREUR_RELATION, ErreurRelation } from './erreurs.js'

export const ETAPES_TRACE_RELATION = Object.freeze({
  CREATION: 'relation_creation',
  MISE_A_JOUR: 'relation_mise_a_jour',
  AJUSTEMENT: 'relation_ajustement',
  REMPLACEMENT: 'relation_remplacement',
  SUSPENDUE: 'relation_suspendue',
  REACTIVEE: 'relation_reactivee',
  TERMINEE: 'relation_terminee',
  INVALIDEE: 'relation_invalidee',
  MISE_A_JOUR_IGNOREE: 'relation_mise_a_jour_ignoree',
  AUCUNE_MISE_A_JOUR: 'relation_aucune_mise_a_jour',
})

const valeursStatut = new Set(Object.values(STATUTS_RELATION_PARTICIPANT))
const valeursMode = new Set(Object.values(MODES_MISE_A_JOUR_RELATION))
const valeursProvenance = new Set(Object.values(TYPES_PROVENANCE_RELATION))
const objet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
const texte = valeur => typeof valeur === 'string' && valeur.length > 0
const echouer = (code, message) => { throw new ErreurRelation(code, `relations : ${message}`) }

function validerDimensions(dimensions) {
  if (!objet(dimensions)) echouer(CODES_ERREUR_RELATION.DIMENSION_RELATION_INVALIDE, 'dimensions invalides.')
  for (const [dimension, valeur] of Object.entries(dimensions)) {
    if (!texte(dimension)) echouer(CODES_ERREUR_RELATION.DIMENSION_RELATION_INVALIDE, 'nom de dimension invalide.')
    if (!Number.isFinite(valeur) || valeur < -1 || valeur > 1) {
      echouer(CODES_ERREUR_RELATION.VALEUR_RELATION_INVALIDE, `valeur invalide pour "${dimension}".`)
    }
  }
}

function validerProvenance(provenance) {
  if (!Array.isArray(provenance)) echouer(CODES_ERREUR_RELATION.PROVENANCE_RELATION_INVALIDE, 'provenance invalide.')
  for (const entree of provenance) {
    if (!objet(entree) || !valeursProvenance.has(entree.type) || !texte(entree.sourceId) ||
        (entree.evenementId !== null && !texte(entree.evenementId)) ||
        (entree.participantSourceId !== null && !texte(entree.participantSourceId)) ||
        !texte(entree.date) || !objet(entree.metadata)) {
      echouer(CODES_ERREUR_RELATION.PROVENANCE_RELATION_INVALIDE, 'entree de provenance invalide.')
    }
  }
}

export function validerRelationsParticipant(relations, participantId, participants) {
  if (relations === undefined) return
  if (participants && !participants[participantId]) echouer(CODES_ERREUR_RELATION.PARTICIPANT_RELATION_INTROUVABLE, `participant "${participantId}" introuvable.`)
  if (!objet(relations) || !objet(relations.parParticipantId)) {
    echouer(CODES_ERREUR_RELATION.STRUCTURE_RELATIONS_INVALIDE, `structure privee invalide pour "${participantId}".`)
  }
  for (const [cibleId, relation] of Object.entries(relations.parParticipantId)) {
    if (!objet(relation) || !texte(relation.id) || relation.participantId !== participantId ||
        relation.cibleParticipantId !== cibleId || !valeursStatut.has(relation.statut) ||
        !Array.isArray(relation.evenementSourceIds) || !relation.evenementSourceIds.every(texte) ||
        !texte(relation.dateCreation) || !texte(relation.dateMiseAJour) || !objet(relation.metadata)) {
      echouer(CODES_ERREUR_RELATION.RELATION_INVALIDE, `relation invalide vers "${cibleId}".`)
    }
    if (participantId === cibleId) echouer(CODES_ERREUR_RELATION.RELATION_VERS_SOI_INTERDITE, 'relation vers soi interdite.')
    if (participants && !participants[cibleId]) echouer(CODES_ERREUR_RELATION.CIBLE_RELATION_INTROUVABLE, `cible "${cibleId}" introuvable.`)
    validerDimensions(relation.dimensions)
    validerProvenance(relation.provenance)
  }
}

export function validerStructureRelations(structure, participants) {
  if (structure === undefined) return undefined
  if (!objet(structure) || !Array.isArray(structure.misesAJour)) {
    echouer(CODES_ERREUR_RELATION.STRUCTURE_RELATIONS_INVALIDE, 'metadata.relations.misesAJour doit etre un tableau.')
  }
  for (const miseAJour of structure.misesAJour) {
    if (!objet(miseAJour) || !texte(miseAJour.participantId) || !texte(miseAJour.cibleParticipantId) || !objet(miseAJour.dimensions) ||
        (miseAJour.id !== undefined && !texte(miseAJour.id)) ||
        (miseAJour.metadata !== undefined && !objet(miseAJour.metadata)) ||
        (miseAJour.participantsConcernes !== undefined && (!Array.isArray(miseAJour.participantsConcernes) || !miseAJour.participantsConcernes.every(texte)))) {
      echouer(CODES_ERREUR_RELATION.MISE_A_JOUR_RELATION_INVALIDE, 'mise a jour invalide.')
    }
    if (!participants[miseAJour.participantId]) echouer(CODES_ERREUR_RELATION.PARTICIPANT_RELATION_INTROUVABLE, `participant "${miseAJour.participantId}" introuvable.`)
    if (!participants[miseAJour.cibleParticipantId]) echouer(CODES_ERREUR_RELATION.CIBLE_RELATION_INTROUVABLE, `cible "${miseAJour.cibleParticipantId}" introuvable.`)
    if (miseAJour.participantId === miseAJour.cibleParticipantId) echouer(CODES_ERREUR_RELATION.RELATION_VERS_SOI_INTERDITE, 'relation vers soi interdite.')
    validerDimensions(miseAJour.dimensions)
    const mode = miseAJour.mode ?? MODES_MISE_A_JOUR_RELATION.REMPLACER
    if (!valeursMode.has(mode)) echouer(CODES_ERREUR_RELATION.MODE_RELATION_INVALIDE, `mode "${mode}" invalide.`)
    const provenanceType = miseAJour.provenanceType ?? TYPES_PROVENANCE_RELATION.EVENEMENT_EXPLICITE
    if (!valeursProvenance.has(provenanceType)) echouer(CODES_ERREUR_RELATION.PROVENANCE_RELATION_INVALIDE, 'type de provenance invalide.')
    const statut = miseAJour.metadata?.statut
    if (statut !== undefined && !valeursStatut.has(statut)) echouer(CODES_ERREUR_RELATION.STATUT_RELATION_INVALIDE, `statut "${statut}" invalide.`)
  }
  return structure
}

function validerTransition(avant, apres) {
  if (avant === apres) return
  const autorisee =
    (avant === STATUTS_RELATION_PARTICIPANT.ACTIVE && [STATUTS_RELATION_PARTICIPANT.SUSPENDUE, STATUTS_RELATION_PARTICIPANT.TERMINEE, STATUTS_RELATION_PARTICIPANT.INVALIDE].includes(apres)) ||
    (avant === STATUTS_RELATION_PARTICIPANT.SUSPENDUE && [STATUTS_RELATION_PARTICIPANT.ACTIVE, STATUTS_RELATION_PARTICIPANT.TERMINEE, STATUTS_RELATION_PARTICIPANT.INVALIDE].includes(apres)) ||
    (![STATUTS_RELATION_PARTICIPANT.INVALIDE].includes(avant) && apres === STATUTS_RELATION_PARTICIPANT.INVALIDE)
  if (!autorisee) echouer(CODES_ERREUR_RELATION.TRANSITION_RELATION_INTERDITE, `transition ${avant} -> ${apres} interdite.`)
}

function creerTrace(etape, participantId, cibleParticipantId, evenementId, genererId, date, donnees = {}) {
  return { id: genererId('trace'), participantId, etape, donnees: { cibleParticipantId, evenementId, ...donnees }, date }
}

function etapeStatut(avant, apres) {
  if (avant === apres) return null
  if (apres === STATUTS_RELATION_PARTICIPANT.SUSPENDUE) return ETAPES_TRACE_RELATION.SUSPENDUE
  if (apres === STATUTS_RELATION_PARTICIPANT.TERMINEE) return ETAPES_TRACE_RELATION.TERMINEE
  if (apres === STATUTS_RELATION_PARTICIPANT.INVALIDE) return ETAPES_TRACE_RELATION.INVALIDEE
  if (apres === STATUTS_RELATION_PARTICIPANT.ACTIVE) return ETAPES_TRACE_RELATION.REACTIVEE
  return null
}

export function mettreAJourRelationsParticipant({ participant, perception, evenementCanonique, etatPrive = {}, participants, genererId, genererIdRelation, date }) {
  validerRelationsParticipant(etatPrive.relations, participant.id, participants)
  const structure = validerStructureRelations(evenementCanonique.metadata?.relations, participants)
  if (structure === undefined) return { relations: etatPrive.relations, traces: [] }
  if (typeof genererId !== 'function') echouer(CODES_ERREUR_RELATION.MISE_A_JOUR_RELATION_INVALIDE, 'genererId est requis.')

  const traces = []
  const initiales = etatPrive.relations?.parParticipantId ?? {}
  let parParticipantId = { ...initiales }
  let change = false

  // Prevalidation atomique des transitions et des identifiants avant la
  // premiere construction de relation ou de trace.
  const statutsSimules = Object.fromEntries(Object.entries(initiales).map(([cibleId, relation]) => [cibleId, relation.statut]))
  const relationsSimulees = new Set(Object.keys(initiales))
  for (const miseAJour of structure.misesAJour) {
    const concerne = miseAJour.participantId === participant.id &&
      perception.perceptible &&
      (miseAJour.participantsConcernes === undefined || miseAJour.participantsConcernes.includes(participant.id))
    if (!concerne) continue
    const existe = relationsSimulees.has(miseAJour.cibleParticipantId)
    const avant = statutsSimules[miseAJour.cibleParticipantId]
    const apres = miseAJour.metadata?.statut ?? avant ?? STATUTS_RELATION_PARTICIPANT.ACTIVE
    if (existe) validerTransition(avant, apres)
    else {
      if (apres !== STATUTS_RELATION_PARTICIPANT.ACTIVE) echouer(CODES_ERREUR_RELATION.TRANSITION_RELATION_INTERDITE, 'une nouvelle relation doit etre active.')
      if (!miseAJour.id && typeof genererIdRelation !== 'function') echouer(CODES_ERREUR_RELATION.GENERATEUR_ID_RELATION_ABSENT, 'genererIdRelation est requis.')
      relationsSimulees.add(miseAJour.cibleParticipantId)
    }
    statutsSimules[miseAJour.cibleParticipantId] = apres
  }

  if (structure.misesAJour.length === 0) {
    traces.push(creerTrace(ETAPES_TRACE_RELATION.AUCUNE_MISE_A_JOUR, participant.id, null, evenementCanonique.id, genererId, date))
  }

  for (const miseAJour of structure.misesAJour) {
    const concerne = miseAJour.participantId === participant.id &&
      perception.perceptible &&
      (miseAJour.participantsConcernes === undefined || miseAJour.participantsConcernes.includes(participant.id))
    if (!concerne) {
      traces.push(creerTrace(ETAPES_TRACE_RELATION.MISE_A_JOUR_IGNOREE, participant.id, miseAJour.cibleParticipantId, evenementCanonique.id, genererId, date, { participantProprietaireId: miseAJour.participantId }))
      continue
    }

    const precedente = parParticipantId[miseAJour.cibleParticipantId]
    const mode = miseAJour.mode ?? MODES_MISE_A_JOUR_RELATION.REMPLACER
    const statut = miseAJour.metadata?.statut ?? precedente?.statut ?? STATUTS_RELATION_PARTICIPANT.ACTIVE
    if (precedente) validerTransition(precedente.statut, statut)
    else if (statut !== STATUTS_RELATION_PARTICIPANT.ACTIVE) echouer(CODES_ERREUR_RELATION.TRANSITION_RELATION_INTERDITE, 'une nouvelle relation doit etre active.')

    let id = precedente?.id ?? miseAJour.id
    if (!id) {
      if (typeof genererIdRelation !== 'function') echouer(CODES_ERREUR_RELATION.GENERATEUR_ID_RELATION_ABSENT, 'genererIdRelation est requis.')
      id = genererIdRelation()
      if (!texte(id)) echouer(CODES_ERREUR_RELATION.GENERATEUR_ID_RELATION_ABSENT, 'genererIdRelation doit retourner une chaine non vide.')
    }
    const dimensions = { ...(precedente?.dimensions ?? {}) }
    for (const [cle, valeur] of Object.entries(miseAJour.dimensions)) {
      dimensions[cle] = mode === MODES_MISE_A_JOUR_RELATION.AJUSTER
        ? Math.max(-1, Math.min(1, (dimensions[cle] ?? 0) + valeur))
        : valeur
    }
    const provenance = {
      type: miseAJour.provenanceType ?? TYPES_PROVENANCE_RELATION.EVENEMENT_EXPLICITE,
      sourceId: evenementCanonique.id,
      evenementId: evenementCanonique.id,
      participantSourceId: evenementCanonique.emetteurId ?? null,
      date,
      metadata: {},
    }
    const metadata = { ...(precedente?.metadata ?? {}), ...(miseAJour.metadata ?? {}) }
    delete metadata.statut
    const relation = {
      id,
      participantId: participant.id,
      cibleParticipantId: miseAJour.cibleParticipantId,
      dimensions,
      statut,
      provenance: [...(precedente?.provenance ?? []), provenance],
      evenementSourceIds: [...new Set([...(precedente?.evenementSourceIds ?? []), evenementCanonique.id])],
      dateCreation: precedente?.dateCreation ?? date,
      dateMiseAJour: date,
      metadata,
    }
    parParticipantId[miseAJour.cibleParticipantId] = relation
    change = true
    traces.push(creerTrace(precedente ? ETAPES_TRACE_RELATION.MISE_A_JOUR : ETAPES_TRACE_RELATION.CREATION, participant.id, miseAJour.cibleParticipantId, evenementCanonique.id, genererId, date, { relationId: id }))
    traces.push(creerTrace(mode === MODES_MISE_A_JOUR_RELATION.AJUSTER ? ETAPES_TRACE_RELATION.AJUSTEMENT : ETAPES_TRACE_RELATION.REMPLACEMENT, participant.id, miseAJour.cibleParticipantId, evenementCanonique.id, genererId, date, { relationId: id }))
    const traceStatut = precedente && etapeStatut(precedente.statut, statut)
    if (traceStatut) traces.push(creerTrace(traceStatut, participant.id, miseAJour.cibleParticipantId, evenementCanonique.id, genererId, date, { relationId: id }))
  }

  return { relations: change ? { parParticipantId } : etatPrive.relations, traces }
}

export function selectionnerRelationsActives(relations) {
  if (relations === undefined) return undefined
  const vue = {}
  for (const [cibleId, relation] of Object.entries(relations.parParticipantId ?? {})) {
    if (relation.statut !== STATUTS_RELATION_PARTICIPANT.ACTIVE) continue
    vue[cibleId] = { dimensions: { ...relation.dimensions }, statut: relation.statut, metadata: { ...relation.metadata } }
  }
  return vue
}

export { CODES_ERREUR_RELATION, ErreurRelation }
export { STATUTS_RELATION_PARTICIPANT, TYPES_PROVENANCE_RELATION, MODES_MISE_A_JOUR_RELATION, DIMENSIONS_RELATION_STANDARD }
