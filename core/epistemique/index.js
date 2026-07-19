/** Gestion deterministe des connaissances et croyances individuelles (RFC-007). */

import { PRECISIONS_PERCEPTION } from '../../constants/PrecisionsPerception.js'
import { TYPES_FAIT_EPISTEMIQUE } from '../../constants/TypesFaitEpistemique.js'
import { STATUTS_FAIT_EPISTEMIQUE } from '../../constants/StatutsFaitEpistemique.js'
import { TYPES_PROVENANCE_EPISTEMIQUE } from '../../constants/TypesProvenanceEpistemique.js'
import { OPERATIONS_REVISION_EPISTEMIQUE } from '../../constants/OperationsRevisionEpistemique.js'
import { CODES_ERREUR_EPISTEMIQUE, ErreurEpistemique, ETAPES_TRACE_EPISTEMIQUE } from './erreurs.js'
import {
  appliquerExpirationsEpistemiques,
  appliquerRevisionsEpistemiques,
  selectionnerFaitsEpistemiquesActifs,
  validerRevisionsEpistemiques,
} from './revision.js'

const typesFait = new Set(Object.values(TYPES_FAIT_EPISTEMIQUE))
const statutsFait = new Set(Object.values(STATUTS_FAIT_EPISTEMIQUE))
const typesProvenance = new Set(Object.values(TYPES_PROVENANCE_EPISTEMIQUE))
const estObjet = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const uniques = valeurs => [...new Set(valeurs)]

function erreur(code, message) {
  throw new ErreurEpistemique(code, `epistemique : ${message}`)
}

function validerConfiance(confiance) {
  if (typeof confiance !== 'number' || !Number.isFinite(confiance) || confiance < 0 || confiance > 1) {
    erreur(CODES_ERREUR_EPISTEMIQUE.CONFIANCE_INVALIDE, 'confiance attendue entre 0 et 1.')
  }
}

function validerProvenance(provenance) {
  if (!estObjet(provenance) || !typesProvenance.has(provenance.type)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.TYPE_PROVENANCE_INVALIDE, 'provenance invalide.')
  }
  if (typeof provenance.sourceId !== 'string' || provenance.sourceId === '') {
    erreur(CODES_ERREUR_EPISTEMIQUE.STRUCTURE_INVALIDE, 'sourceId de provenance invalide.')
  }
  validerConfiance(provenance.confianceInitiale)
}

function validerFait(fait, participantId) {
  if (!estObjet(fait) || typeof fait.id !== 'string' || fait.id === '' || fait.participantId !== participantId) {
    erreur(CODES_ERREUR_EPISTEMIQUE.STRUCTURE_INVALIDE, 'fait initial invalide ou attribue a un autre participant.')
  }
  if (!typesFait.has(fait.type)) erreur(CODES_ERREUR_EPISTEMIQUE.TYPE_FAIT_INVALIDE, 'type de fait invalide.')
  if (!statutsFait.has(fait.statut)) erreur(CODES_ERREUR_EPISTEMIQUE.STATUT_FAIT_INVALIDE, 'statut de fait invalide.')
  validerConfiance(fait.confiance)
  if (!Array.isArray(fait.provenance) || !Array.isArray(fait.evenementSourceIds) || !Array.isArray(fait.perceptionSourceIds)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.STRUCTURE_INVALIDE, 'collections du fait invalides.')
  }
  fait.provenance.forEach(validerProvenance)
  if (fait.version !== undefined && (!Number.isInteger(fait.version) || fait.version < 1)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.VERSION_INVALIDE, 'version de fait invalide.')
  }
  if (fait.faitPrecedentId !== undefined && fait.faitPrecedentId !== null && typeof fait.faitPrecedentId !== 'string') {
    erreur(CODES_ERREUR_EPISTEMIQUE.VERSION_INVALIDE, 'faitPrecedentId invalide.')
  }
  if (fait.racineFaitId !== undefined && (typeof fait.racineFaitId !== 'string' || fait.racineFaitId === '')) {
    erreur(CODES_ERREUR_EPISTEMIQUE.VERSION_INVALIDE, 'racineFaitId invalide.')
  }
  if (fait.dateExpiration !== undefined && fait.dateExpiration !== null && (
    typeof fait.dateExpiration !== 'string' || !Number.isFinite(Date.parse(fait.dateExpiration))
  )) erreur(CODES_ERREUR_EPISTEMIQUE.DATE_EXPIRATION_INVALIDE, 'dateExpiration du fait invalide.')
  if (fait.revisionIds !== undefined && (!Array.isArray(fait.revisionIds) || fait.revisionIds.some(id => typeof id !== 'string'))) {
    erreur(CODES_ERREUR_EPISTEMIQUE.VERSION_INVALIDE, 'revisionIds invalide.')
  }
}

export function validerEtatEpistemique(etatEpistemique, participantId) {
  if (etatEpistemique === undefined) return
  if (!estObjet(etatEpistemique) || !Array.isArray(etatEpistemique.connaissances) || !Array.isArray(etatEpistemique.croyances)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.STRUCTURE_INVALIDE, 'etat epistemique invalide.')
  }
  etatEpistemique.connaissances.forEach(fait => validerFait(fait, participantId))
  etatEpistemique.croyances.forEach(fait => validerFait(fait, participantId))
}

function validerEntree(entree) {
  if (!estObjet(entree) || !Object.prototype.hasOwnProperty.call(entree, 'proposition')) {
    erreur(CODES_ERREUR_EPISTEMIQUE.PROPOSITION_INVALIDE, 'proposition explicite requise.')
  }
  if (entree.type !== undefined && !typesFait.has(entree.type)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.TYPE_FAIT_INVALIDE, 'type explicite invalide.')
  }
  if (entree.provenanceType !== undefined && !typesProvenance.has(entree.provenanceType)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.TYPE_PROVENANCE_INVALIDE, 'type de provenance invalide.')
  }
  if (entree.confiance !== undefined) validerConfiance(entree.confiance)
  if (entree.participantsInformes !== undefined && (
    !Array.isArray(entree.participantsInformes) || entree.participantsInformes.some(id => typeof id !== 'string')
  )) erreur(CODES_ERREUR_EPISTEMIQUE.PROPOSITION_INVALIDE, 'participantsInformes invalide.')
  if (entree.metadata !== undefined && !estObjet(entree.metadata)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.PROPOSITION_INVALIDE, 'metadata de proposition invalide.')
  }
}

export function validerStructureEpistemique(structure) {
  if (!estObjet(structure) || (structure.propositions !== undefined && !Array.isArray(structure.propositions))) {
    erreur(CODES_ERREUR_EPISTEMIQUE.STRUCTURE_INVALIDE, 'metadata.epistemique invalide.')
  }
  ;(structure.propositions ?? []).forEach(validerEntree)
  if (structure.revisions !== undefined) validerRevisionsEpistemiques(structure.revisions)
  return structure
}

function confianceParDefaut(perception) {
  if (perception.precision === PRECISIONS_PERCEPTION.COMPLETE) return 1
  if (perception.precision === PRECISIONS_PERCEPTION.PARTIELLE) return 0.6
  return undefined
}

function creerTrace({ etape, participantId, fait, evenementId, provenanceType, genererId, date }) {
  return {
    id: genererId('trace'),
    participantId,
    etape,
    donnees: {
      faitId: fait?.id ?? null,
      type: fait?.type ?? null,
      statut: fait?.statut ?? null,
      evenementId,
      confiance: fait?.confiance ?? null,
      provenanceType: provenanceType ?? null,
    },
    date,
  }
}

function identifierFait(entree, genererIdEpistemique) {
  const idProposition = estObjet(entree.proposition) && typeof entree.proposition.id === 'string'
    ? entree.proposition.id
    : undefined
  if (idProposition) return idProposition
  if (typeof entree.id === 'string' && entree.id !== '') return entree.id
  if (typeof genererIdEpistemique !== 'function') {
    erreur(CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_ABSENT, 'genererIdEpistemique est requis.')
  }
  const id = genererIdEpistemique()
  if (typeof id !== 'string' || id === '') {
    erreur(CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_ABSENT, 'genererIdEpistemique doit retourner une chaine non vide.')
  }
  return id
}

function remplacerStatut(tableaux, faitId, statut, codeIntrouvable) {
  let trouve = false
  const resultat = {}
  for (const [cle, faits] of Object.entries(tableaux)) {
    resultat[cle] = faits.map(fait => {
      if ((fait.id !== faitId && fait.racineFaitId !== faitId) || fait.statut !== STATUTS_FAIT_EPISTEMIQUE.ACTIF) return fait
      trouve = true
      return { ...fait, statut }
    })
  }
  if (!trouve) erreur(codeIntrouvable, `fait cible introuvable ("${faitId}").`)
  return resultat
}

/** Mise a jour pure d'un etat epistemique prive a partir d'une perception. */
export function mettreAJourEtatEpistemique({
  participant,
  perception,
  evenementCanonique,
  etatPrive = {},
  genererId,
  genererIdEpistemique,
  genererIdRevision,
  genererIdVersionFait,
  date,
}) {
  const participantId = participant?.id
  if (typeof participantId !== 'string' || participantId === '') {
    erreur(CODES_ERREUR_EPISTEMIQUE.STRUCTURE_INVALIDE, 'participant invalide.')
  }
  validerEtatEpistemique(etatPrive.epistemique, participantId)
  const initial = etatPrive.epistemique ?? { connaissances: [], croyances: [] }
  const faitsCrees = []
  const faitsMisAJour = []
  const traces = []
  const structure = evenementCanonique?.metadata?.epistemique

  if (structure !== undefined) validerStructureEpistemique(structure)
  const expiration = appliquerExpirationsEpistemiques({
    participant, evenementCanonique, etatEpistemique: initial,
    genererId, genererIdRevision, genererIdVersionFait, date,
  })
  traces.push(...expiration.traces)
  let etatCourant = expiration.etatEpistemique

  if (structure === undefined) {
    const change = expiration.revisionsAppliquees.length > 0
    return { etatEpistemique: change ? etatCourant : etatPrive.epistemique, faitsCrees, faitsMisAJour, revisionsAppliquees: expiration.revisionsAppliquees, traces }
  }
  if (!perception?.perceptible || perception.precision === PRECISIONS_PERCEPTION.AUCUNE) {
    traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.AUCUNE_PERCEPTION, participantId, evenementId: evenementCanonique.id, genererId, date }))
    return { etatEpistemique: expiration.revisionsAppliquees.length ? etatCourant : etatPrive.epistemique, faitsCrees, faitsMisAJour, revisionsAppliquees: expiration.revisionsAppliquees, traces }
  }

  const revision = appliquerRevisionsEpistemiques({
    participant, perception, evenementCanonique, etatEpistemique: etatCourant,
    revisions: structure.revisions ?? [], genererId, genererIdRevision,
    genererIdVersionFait, date,
  })
  etatCourant = revision.etatEpistemique
  traces.push(...revision.traces)
  const revisionsAppliquees = [...expiration.revisionsAppliquees, ...revision.revisionsAppliquees]
  const propositions = structure.propositions ?? []
  if (propositions.length === 0) {
    traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.AUCUNE_PROPOSITION, participantId, evenementId: evenementCanonique.id, genererId, date }))
    const change = revisionsAppliquees.length > 0
    return { etatEpistemique: change ? etatCourant : etatPrive.epistemique, faitsCrees, faitsMisAJour, revisionsAppliquees, traces }
  }

  let tableaux = {
    ...etatCourant,
    connaissances: [...etatCourant.connaissances],
    croyances: [...etatCourant.croyances],
  }

  for (const entree of propositions) {
    if (Array.isArray(entree.participantsInformes) && !entree.participantsInformes.includes(participantId)) {
      traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.PROPOSITION_IGNOREE, participantId, evenementId: evenementCanonique.id, provenanceType: entree.provenanceType, genererId, date }))
      continue
    }
    const provenanceType = entree.provenanceType ?? TYPES_PROVENANCE_EPISTEMIQUE.PERCEPTION_DIRECTE
    const type = entree.type ?? (
      provenanceType === TYPES_PROVENANCE_EPISTEMIQUE.SYSTEME
        ? TYPES_FAIT_EPISTEMIQUE.CONNAISSANCE
        : TYPES_FAIT_EPISTEMIQUE.CROYANCE
    )
    const confiance = entree.confiance ?? confianceParDefaut(perception)
    if (confiance === undefined) continue
    validerConfiance(confiance)
    const faitId = identifierFait(entree, genererIdEpistemique)
    const perceptionSourceId = `${evenementCanonique.id}:${participantId}`
    const provenance = {
      type: provenanceType,
      sourceId: entree.participantSourceId ?? evenementCanonique.id,
      evenementId: evenementCanonique.id,
      participantSourceId: entree.participantSourceId ?? null,
      precisionPerception: perception.precision,
      confianceInitiale: confiance,
      date,
      metadata: { ...(entree.metadata ?? {}) },
    }

    const contredit = entree.metadata?.contreditFaitId
    const remplace = entree.metadata?.remplaceFaitId
    if (contredit) {
      tableaux = remplacerStatut(tableaux, contredit, STATUTS_FAIT_EPISTEMIQUE.CONTREDIT, CODES_ERREUR_EPISTEMIQUE.FAIT_CONTREDIT_INTROUVABLE)
      traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.FAIT_CONTREDIT, participantId, fait: { id: contredit, type, statut: STATUTS_FAIT_EPISTEMIQUE.CONTREDIT, confiance }, evenementId: evenementCanonique.id, provenanceType, genererId, date }))
    }
    if (remplace) {
      tableaux = remplacerStatut(tableaux, remplace, STATUTS_FAIT_EPISTEMIQUE.REMPLACE, CODES_ERREUR_EPISTEMIQUE.FAIT_REMPLACE_INTROUVABLE)
      traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.FAIT_REMPLACE, participantId, fait: { id: remplace, type, statut: STATUTS_FAIT_EPISTEMIQUE.REMPLACE, confiance }, evenementId: evenementCanonique.id, provenanceType, genererId, date }))
    }

    const cle = type === TYPES_FAIT_EPISTEMIQUE.CONNAISSANCE ? 'connaissances' : 'croyances'
    const index = tableaux[cle].findIndex(fait =>
      (fait.id === faitId || fait.racineFaitId === faitId) && fait.statut === STATUTS_FAIT_EPISTEMIQUE.ACTIF
    )
    if (index >= 0) {
      const precedent = tableaux[cle][index]
      const misAJour = {
        ...precedent,
        confiance: Math.max(precedent.confiance, confiance),
        provenance: [...precedent.provenance, provenance],
        evenementSourceIds: uniques([...precedent.evenementSourceIds, evenementCanonique.id]),
        perceptionSourceIds: uniques([...precedent.perceptionSourceIds, perceptionSourceId]),
        dateMiseAJour: date,
      }
      tableaux[cle] = tableaux[cle].map((fait, i) => i === index ? misAJour : fait)
      faitsMisAJour.push(misAJour)
      traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.FAIT_MIS_A_JOUR, participantId, fait: misAJour, evenementId: evenementCanonique.id, provenanceType, genererId, date }))
    } else {
      const fait = {
        id: faitId,
        participantId,
        proposition: entree.proposition,
        type,
        statut: STATUTS_FAIT_EPISTEMIQUE.ACTIF,
        confiance,
        provenance: [provenance],
        evenementSourceIds: [evenementCanonique.id],
        perceptionSourceIds: [perceptionSourceId],
        dateCreation: date,
        dateMiseAJour: date,
        metadata: { ...(entree.metadata ?? {}) },
      }
      tableaux[cle] = [...tableaux[cle], fait]
      faitsCrees.push(fait)
      traces.push(creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.FAIT_CREE, participantId, fait, evenementId: evenementCanonique.id, provenanceType, genererId, date }))
    }
  }

  return { etatEpistemique: tableaux, faitsCrees, faitsMisAJour, revisionsAppliquees, traces }
}

export {
  TYPES_FAIT_EPISTEMIQUE,
  STATUTS_FAIT_EPISTEMIQUE,
  TYPES_PROVENANCE_EPISTEMIQUE,
  OPERATIONS_REVISION_EPISTEMIQUE,
  appliquerExpirationsEpistemiques,
  appliquerRevisionsEpistemiques,
  selectionnerFaitsEpistemiquesActifs,
  validerRevisionsEpistemiques,
  CODES_ERREUR_EPISTEMIQUE,
  ErreurEpistemique,
  ETAPES_TRACE_EPISTEMIQUE,
}
