/** Cycle de vie deterministe et immuable des faits epistemiques (RFC-008). */

import { OPERATIONS_REVISION_EPISTEMIQUE } from '../../constants/OperationsRevisionEpistemique.js'
import { STATUTS_FAIT_EPISTEMIQUE } from '../../constants/StatutsFaitEpistemique.js'
import { CODES_ERREUR_EPISTEMIQUE, ErreurEpistemique, ETAPES_TRACE_EPISTEMIQUE } from './erreurs.js'

const operations = new Set(Object.values(OPERATIONS_REVISION_EPISTEMIQUE))
const estObjet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
const statutsRevisables = new Set([STATUTS_FAIT_EPISTEMIQUE.ACTIF, STATUTS_FAIT_EPISTEMIQUE.SUSPENDU])
const statutsNonTerminaux = new Set([STATUTS_FAIT_EPISTEMIQUE.ACTIF, STATUTS_FAIT_EPISTEMIQUE.SUSPENDU])

function erreur(code, message) {
  throw new ErreurEpistemique(code, `epistemique : ${message}`)
}

function dateValide(date) {
  return typeof date === 'string' && date !== '' && Number.isFinite(Date.parse(date))
}

function idGenere(generateur, code, nom) {
  if (typeof generateur !== 'function') erreur(code, `${nom} est requis.`)
  const id = generateur()
  if (typeof id !== 'string' || id === '') erreur(code, `${nom} doit retourner une chaine non vide.`)
  return id
}

function validerRevision(revision) {
  if (!estObjet(revision) || typeof revision.faitId !== 'string' || revision.faitId === '') {
    erreur(CODES_ERREUR_EPISTEMIQUE.REVISION_INVALIDE, 'faitId de revision requis.')
  }
  if (!operations.has(revision.operation)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.OPERATION_REVISION_INVALIDE, 'operation de revision inconnue.')
  }
  if (revision.id !== undefined && (typeof revision.id !== 'string' || revision.id === '')) {
    erreur(CODES_ERREUR_EPISTEMIQUE.REVISION_INVALIDE, 'id de revision invalide.')
  }
  if (revision.participantsConcernes !== undefined && (
    !Array.isArray(revision.participantsConcernes) || revision.participantsConcernes.some(id => typeof id !== 'string')
  )) erreur(CODES_ERREUR_EPISTEMIQUE.REVISION_INVALIDE, 'participantsConcernes invalide.')
  if (revision.raison !== undefined && typeof revision.raison !== 'string') {
    erreur(CODES_ERREUR_EPISTEMIQUE.REVISION_INVALIDE, 'raison de revision invalide.')
  }
  if (revision.metadata !== undefined && !estObjet(revision.metadata)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.REVISION_INVALIDE, 'metadata de revision invalide.')
  }
  if (revision.dateExpiration !== undefined && !dateValide(revision.dateExpiration)) {
    erreur(CODES_ERREUR_EPISTEMIQUE.DATE_EXPIRATION_INVALIDE, 'dateExpiration invalide.')
  }
  const confiance = revision.operation === OPERATIONS_REVISION_EPISTEMIQUE.RENFORCER ||
    revision.operation === OPERATIONS_REVISION_EPISTEMIQUE.AFFAIBLIR
  if (confiance && (
    typeof revision.valeur !== 'number' || !Number.isFinite(revision.valeur) || revision.valeur < 0 || revision.valeur > 1
  )) erreur(CODES_ERREUR_EPISTEMIQUE.VALEUR_REVISION_INVALIDE, 'valeur de revision attendue entre 0 et 1.')
}

export function validerRevisionsEpistemiques(revisions) {
  if (!Array.isArray(revisions)) erreur(CODES_ERREUR_EPISTEMIQUE.REVISION_INVALIDE, 'revisions doit etre un tableau.')
  revisions.forEach(validerRevision)
  return revisions
}

function trouverFait(etat, faitId) {
  for (const collection of ['connaissances', 'croyances']) {
    const index = etat[collection].findIndex(fait =>
      fait.id === faitId || (fait.racineFaitId === faitId && fait.statut !== STATUTS_FAIT_EPISTEMIQUE.REMPLACE)
    )
    if (index >= 0) return { collection, index, fait: etat[collection][index] }
  }
  return null
}

function transition(fait, instruction, date) {
  const operation = instruction.operation
  let nouveauStatut = fait.statut
  let nouvelleConfiance = fait.confiance

  if ([OPERATIONS_REVISION_EPISTEMIQUE.RENFORCER, OPERATIONS_REVISION_EPISTEMIQUE.AFFAIBLIR].includes(operation)) {
    if (!statutsRevisables.has(fait.statut)) erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'confiance revisable uniquement pour un fait actif ou suspendu.')
    nouvelleConfiance = operation === OPERATIONS_REVISION_EPISTEMIQUE.RENFORCER
      ? Math.min(1, fait.confiance + instruction.valeur)
      : Math.max(0, fait.confiance - instruction.valeur)
  } else if (operation === OPERATIONS_REVISION_EPISTEMIQUE.SUSPENDRE) {
    if (fait.statut !== STATUTS_FAIT_EPISTEMIQUE.ACTIF) erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'seul un fait actif peut etre suspendu.')
    nouveauStatut = STATUTS_FAIT_EPISTEMIQUE.SUSPENDU
  } else if (operation === OPERATIONS_REVISION_EPISTEMIQUE.REACTIVER) {
    if (fait.statut !== STATUTS_FAIT_EPISTEMIQUE.SUSPENDU) erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'seul un fait suspendu peut etre reactive.')
    nouveauStatut = STATUTS_FAIT_EPISTEMIQUE.ACTIF
  } else if (operation === OPERATIONS_REVISION_EPISTEMIQUE.RENDRE_OBSOLETE) {
    if (!statutsRevisables.has(fait.statut)) erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'seul un fait actif ou suspendu peut devenir obsolete.')
    nouveauStatut = STATUTS_FAIT_EPISTEMIQUE.OBSOLETE
  } else if (operation === OPERATIONS_REVISION_EPISTEMIQUE.EXPIRER) {
    if (!statutsRevisables.has(fait.statut)) erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'seul un fait actif ou suspendu peut expirer.')
    const dateExpiration = instruction.dateExpiration ?? fait.dateExpiration
    if (!dateValide(dateExpiration)) erreur(CODES_ERREUR_EPISTEMIQUE.DATE_EXPIRATION_INVALIDE, 'expiration explicite requise.')
    if (!dateValide(date) || Date.parse(date) < Date.parse(dateExpiration)) {
      erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'date d expiration non atteinte.')
    }
    nouveauStatut = STATUTS_FAIT_EPISTEMIQUE.EXPIRE
  } else if (operation === OPERATIONS_REVISION_EPISTEMIQUE.INVALIDER) {
    if (!statutsNonTerminaux.has(fait.statut)) erreur(CODES_ERREUR_EPISTEMIQUE.TRANSITION_INTERDITE, 'seul un fait non terminal peut etre invalide.')
    nouveauStatut = STATUTS_FAIT_EPISTEMIQUE.INVALIDE
  }
  return { nouveauStatut, nouvelleConfiance }
}

const etapeOperation = Object.freeze({
  [OPERATIONS_REVISION_EPISTEMIQUE.RENFORCER]: ETAPES_TRACE_EPISTEMIQUE.CONFIANCE_RENFORCEE,
  [OPERATIONS_REVISION_EPISTEMIQUE.AFFAIBLIR]: ETAPES_TRACE_EPISTEMIQUE.CONFIANCE_AFFAIBLIE,
  [OPERATIONS_REVISION_EPISTEMIQUE.SUSPENDRE]: ETAPES_TRACE_EPISTEMIQUE.FAIT_SUSPENDU,
  [OPERATIONS_REVISION_EPISTEMIQUE.REACTIVER]: ETAPES_TRACE_EPISTEMIQUE.FAIT_REACTIVE,
  [OPERATIONS_REVISION_EPISTEMIQUE.RENDRE_OBSOLETE]: ETAPES_TRACE_EPISTEMIQUE.FAIT_OBSOLETE,
  [OPERATIONS_REVISION_EPISTEMIQUE.EXPIRER]: ETAPES_TRACE_EPISTEMIQUE.FAIT_EXPIRE,
  [OPERATIONS_REVISION_EPISTEMIQUE.INVALIDER]: ETAPES_TRACE_EPISTEMIQUE.FAIT_INVALIDE,
})

function creerTrace({ etape, participantId, revision, fait, nouveau, evenementId, raison, genererId, date }) {
  return {
    id: genererId('trace'), participantId, etape,
    donnees: {
      revisionId: revision.id, faitId: fait.id,
      racineFaitId: nouveau.racineFaitId, operation: revision.operation,
      ancienStatut: fait.statut, nouveauStatut: nouveau.statut,
      ancienneConfiance: fait.confiance, nouvelleConfiance: nouveau.confiance,
      evenementId, raison: raison ?? null,
    },
    date,
  }
}

export function appliquerRevisionsEpistemiques({
  participant, perception, evenementCanonique, etatEpistemique,
  revisions, genererId, genererIdRevision, genererIdVersionFait, date,
}) {
  const participantId = participant.id
  validerRevisionsEpistemiques(revisions)
  if (revisions.length === 0) return { etatEpistemique, revisionsAppliquees: [], traces: [] }
  if (!perception?.perceptible) return { etatEpistemique, revisionsAppliquees: [], traces: [] }

  let travail = {
    ...etatEpistemique,
    connaissances: [...etatEpistemique.connaissances],
    croyances: [...etatEpistemique.croyances],
    revisions: [...(etatEpistemique.revisions ?? [])],
  }
  const plans = []
  const tracesIgnorees = []

  for (const instruction of revisions) {
    if (instruction.participantsConcernes && !instruction.participantsConcernes.includes(participantId)) {
      const revisionId = instruction.id ?? idGenere(genererIdRevision, CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_REVISION_ABSENT, 'genererIdRevision')
      tracesIgnorees.push({
        id: genererId('trace'), participantId, etape: ETAPES_TRACE_EPISTEMIQUE.REVISION_IGNOREE,
        donnees: {
          revisionId, faitId: instruction.faitId, racineFaitId: instruction.faitId,
          operation: instruction.operation, ancienStatut: null, nouveauStatut: null,
          ancienneConfiance: null, nouvelleConfiance: null,
          evenementId: evenementCanonique?.id ?? null, raison: 'participant_non_concerne',
        },
        date,
      })
      continue
    }
    const cible = trouverFait(travail, instruction.faitId)
    if (!cible) erreur(CODES_ERREUR_EPISTEMIQUE.FAIT_REVISION_INTROUVABLE, `fait cible introuvable ("${instruction.faitId}").`)
    const resultat = transition(cible.fait, instruction, date)
    const revisionId = instruction.id ?? idGenere(genererIdRevision, CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_REVISION_ABSENT, 'genererIdRevision')
    const versionId = idGenere(genererIdVersionFait, CODES_ERREUR_EPISTEMIQUE.GENERATEUR_ID_VERSION_ABSENT, 'genererIdVersionFait')
    const racineFaitId = cible.fait.racineFaitId ?? cible.fait.id
    const revisionIds = [...new Set([...(cible.fait.revisionIds ?? []), revisionId])]
    const nouveau = {
      ...cible.fait,
      id: versionId,
      statut: resultat.nouveauStatut,
      confiance: resultat.nouvelleConfiance,
      version: (cible.fait.version ?? 1) + 1,
      faitPrecedentId: cible.fait.id,
      racineFaitId,
      dateExpiration: instruction.dateExpiration ?? cible.fait.dateExpiration ?? null,
      revisionIds,
      dateMiseAJour: date,
    }
    const historique = { ...cible.fait, statut: STATUTS_FAIT_EPISTEMIQUE.REMPLACE }
    travail[cible.collection] = travail[cible.collection].map((fait, index) => index === cible.index ? historique : fait)
    travail[cible.collection].push(nouveau)
    plans.push({ instruction: { ...instruction, id: revisionId }, cible: cible.fait, nouveau })
  }

  if (plans.length === 0) return { etatEpistemique, revisionsAppliquees: [], traces: tracesIgnorees }

  const revisionsAppliquees = plans.map(({ instruction, cible, nouveau }) => ({
    id: instruction.id,
    participantId,
    faitId: cible.id,
    operation: instruction.operation,
    ancienneConfiance: cible.confiance,
    nouvelleConfiance: nouveau.confiance,
    ancienStatut: cible.statut,
    nouveauStatut: nouveau.statut,
    raison: instruction.raison ?? null,
    evenementId: evenementCanonique?.id ?? null,
    date,
    metadata: { ...(instruction.metadata ?? {}) },
  }))
  travail.revisions.push(...revisionsAppliquees)
  const traces = [...tracesIgnorees, ...plans.flatMap(({ instruction, cible, nouveau }) => [
    creerTrace({ etape: ETAPES_TRACE_EPISTEMIQUE.REVISION_APPLIQUEE, participantId, revision: instruction, fait: cible, nouveau, evenementId: evenementCanonique?.id ?? null, raison: instruction.raison, genererId, date }),
    creerTrace({ etape: etapeOperation[instruction.operation], participantId, revision: instruction, fait: cible, nouveau, evenementId: evenementCanonique?.id ?? null, raison: instruction.raison, genererId, date }),
  ])]
  return { etatEpistemique: travail, revisionsAppliquees, traces }
}

export function appliquerExpirationsEpistemiques(params) {
  const { etatEpistemique, date } = params
  if (!etatEpistemique || !dateValide(date)) return { etatEpistemique, revisionsAppliquees: [], traces: [] }
  const dues = [...etatEpistemique.connaissances, ...etatEpistemique.croyances]
    .filter(fait => statutsRevisables.has(fait.statut) && dateValide(fait.dateExpiration) && Date.parse(date) >= Date.parse(fait.dateExpiration))
    .map(fait => ({ faitId: fait.id, operation: OPERATIONS_REVISION_EPISTEMIQUE.EXPIRER, dateExpiration: fait.dateExpiration, raison: 'date_expiration_atteinte' }))
  if (dues.length === 0) return { etatEpistemique, revisionsAppliquees: [], traces: [] }
  return appliquerRevisionsEpistemiques({ ...params, revisions: dues, perception: { perceptible: true }, evenementCanonique: params.evenementCanonique ?? null })
}

export function selectionnerFaitsEpistemiquesActifs(etatEpistemique) {
  return {
    connaissancesActives: (etatEpistemique?.connaissances ?? []).filter(fait => fait.statut === STATUTS_FAIT_EPISTEMIQUE.ACTIF),
    croyancesActives: (etatEpistemique?.croyances ?? []).filter(fait => fait.statut === STATUTS_FAIT_EPISTEMIQUE.ACTIF),
  }
}
