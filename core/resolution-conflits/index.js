import { TYPES_INTENTION_METIER } from '../../constants/TypesIntentionMetier.js'
import { TYPES_CONFLIT_ACTION } from '../../constants/TypesConflitAction.js'
import { STATUTS_RESOLUTION_ACTION } from '../../constants/StatutsResolutionAction.js'
import { comparerIntentionsMetier } from '../arbitrage/index.js'
import {
  CODES_ERREUR_RESOLUTION_CONFLIT,
  ErreurResolutionConflit,
} from './erreurs.js'

const CHAMPS_LISTES = [
  'idsIntentionsIncompatibles',
  'idsIntentionsRequises',
  'ordreApres',
  'ordreAvant',
]

function erreur(code, message, intentionId = null) {
  throw new ErreurResolutionConflit(code, `resolution conflits : ${message}`, intentionId)
}

function estObjet(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validerListeIds(value, champ, intentionId) {
  if (value === undefined) return
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || id === '') ||
      new Set(value).size !== value.length) {
    erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CONTRAINTE_INVALIDE,
      `${champ} doit contenir des identifiants uniques et non vides.`, intentionId)
  }
}

export function normaliserConfigurationResolutionConflits(configuration) {
  if (configuration === undefined) return { active: false }
  if (!estObjet(configuration) || typeof configuration.active !== 'boolean') {
    erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CONFIGURATION_INVALIDE,
      'la configuration explicite doit contenir un booleen active.')
  }
  if (!configuration.active) return { active: false }
  const ressources = configuration.ressourcesDisponibles ?? {}
  if (!estObjet(ressources)) {
    erreur(CODES_ERREUR_RESOLUTION_CONFLIT.RESSOURCE_INVALIDE,
      'ressourcesDisponibles doit etre un objet.')
  }
  for (const [id, capacite] of Object.entries(ressources)) {
    if (id === '' || !Number.isInteger(capacite) || capacite < 0) {
      erreur(CODES_ERREUR_RESOLUTION_CONFLIT.RESSOURCE_INVALIDE,
        `capacite invalide pour la ressource "${id}".`)
    }
  }
  return { active: true, ressourcesDisponibles: { ...ressources } }
}

export function validerEntreesResolution({ intentionsRetenues, planificationsExecution, ressourcesDisponibles = {} }) {
  if (!Array.isArray(intentionsRetenues) || !Array.isArray(planificationsExecution)) {
    erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CONFIGURATION_INVALIDE,
      'intentions et planifications doivent etre des tableaux.')
  }
  normaliserConfigurationResolutionConflits({ active: true, ressourcesDisponibles })
  const ids = new Set(intentionsRetenues.map(intention => intention.id))
  const planificationsParIntention = new Map()

  for (const planification of planificationsExecution) {
    if (!estObjet(planification) || typeof planification.intentionId !== 'string' ||
        !ids.has(planification.intentionId) || planificationsParIntention.has(planification.intentionId)) {
      erreur(CODES_ERREUR_RESOLUTION_CONFLIT.PLANIFICATION_INVALIDE,
        'chaque planification doit correspondre une seule fois a une intention retenue.',
        planification?.intentionId)
    }
    planificationsParIntention.set(planification.intentionId, planification)
  }

  for (const intention of intentionsRetenues) {
    if (intention.type !== TYPES_INTENTION_METIER.RENONCEMENT && !planificationsParIntention.has(intention.id)) {
      erreur(CODES_ERREUR_RESOLUTION_CONFLIT.PLANIFICATION_INVALIDE,
        'intention executable sans planification.', intention.id)
    }
    const contrainte = intention.metadata?.conflit
    if (contrainte === undefined) continue
    if (!estObjet(contrainte)) {
      erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CONTRAINTE_INVALIDE,
        'metadata.conflit doit etre un objet.', intention.id)
    }
    if (contrainte.cleExclusivite !== undefined &&
        (typeof contrainte.cleExclusivite !== 'string' || contrainte.cleExclusivite === '')) {
      erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CONTRAINTE_INVALIDE,
        'cleExclusivite doit etre non vide.', intention.id)
    }
    for (const champ of CHAMPS_LISTES) validerListeIds(contrainte[champ], champ, intention.id)
    const ressources = contrainte.ressourcesConsommees
    if (ressources !== undefined && (!Array.isArray(ressources) || ressources.some(item =>
      !estObjet(item) || typeof item.ressourceId !== 'string' || item.ressourceId === '' ||
      !Number.isInteger(item.quantite) || item.quantite <= 0
    ) || new Set(ressources.map(item => item.ressourceId)).size !== ressources.length)) {
      erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CONTRAINTE_INVALIDE,
        'ressourcesConsommees doit contenir des consommations uniques et positives.', intention.id)
    }
    for (const champ of [...CHAMPS_LISTES]) {
      for (const reference of contrainte[champ] ?? []) {
        if (!ids.has(reference)) {
          erreur(CODES_ERREUR_RESOLUTION_CONFLIT.REFERENCE_INTENTION_INCONNUE,
            `${champ} reference l intention inconnue "${reference}".`, intention.id)
        }
      }
    }
  }
}

function detecterCycle(intentions, obtenirSuccesseurs, code) {
  const ids = new Set(intentions.map(item => item.id))
  const etat = new Map()
  function visiter(id) {
    if (etat.get(id) === 1) erreur(code, `cycle detecte autour de "${id}".`, id)
    if (etat.get(id) === 2) return
    etat.set(id, 1)
    for (const suivant of obtenirSuccesseurs(id)) if (ids.has(suivant)) visiter(suivant)
    etat.set(id, 2)
  }
  for (const id of ids) visiter(id)
}

function contraintes(intention) {
  return intention.metadata?.conflit ?? {}
}

function idConflit(type, ids) {
  return `conflit:${type}:${[...ids].sort().join(':')}`
}

function creerConflit(type, ids, gagnanteId, codeRaison, metadata = {}) {
  return {
    id: idConflit(type, ids), type, intentionIds: [...ids].sort(),
    intentionGagnanteId: gagnanteId ?? null, codeRaison, metadata: { ...metadata },
  }
}

function ajouterEcart(ecartees, conflits, intention, conflit) {
  ecartees.set(intention.id, {
    ...intention,
    statutResolution: STATUTS_RESOLUTION_ACTION.ECARTEE,
    conflitId: conflit.id,
    typeConflit: conflit.type,
    intentionGagnanteId: conflit.intentionGagnanteId,
    codeRaison: conflit.codeRaison,
  })
  conflits.push(conflit)
}

function trierTopologiquement(intentions) {
  const parId = new Map(intentions.map(item => [item.id, item]))
  const successeurs = new Map(intentions.map(item => [item.id, new Set()]))
  const degres = new Map(intentions.map(item => [item.id, 0]))
  const ajouterArc = (avant, apres) => {
    if (!parId.has(avant) || !parId.has(apres) || successeurs.get(avant).has(apres)) return
    successeurs.get(avant).add(apres)
    degres.set(apres, degres.get(apres) + 1)
  }
  for (const intention of intentions) {
    const regle = contraintes(intention)
    for (const id of regle.idsIntentionsRequises ?? []) ajouterArc(id, intention.id)
    for (const id of regle.ordreApres ?? []) ajouterArc(id, intention.id)
    for (const id of regle.ordreAvant ?? []) ajouterArc(intention.id, id)
  }
  const disponibles = intentions.filter(item => degres.get(item.id) === 0).sort(comparerIntentionsMetier)
  const resultat = []
  while (disponibles.length > 0) {
    const courant = disponibles.shift()
    resultat.push(courant)
    for (const suivant of successeurs.get(courant.id)) {
      degres.set(suivant, degres.get(suivant) - 1)
      if (degres.get(suivant) === 0) {
        disponibles.push(parId.get(suivant))
        disponibles.sort(comparerIntentionsMetier)
      }
    }
  }
  if (resultat.length !== intentions.length) {
    erreur(CODES_ERREUR_RESOLUTION_CONFLIT.CYCLE_ORDRE, 'cycle dans l ordre final.')
  }
  return resultat
}

export function resoudreConflitsActions({
  intentionsRetenues,
  planificationsExecution,
  ressourcesDisponibles = {},
}) {
  validerEntreesResolution({ intentionsRetenues, planificationsExecution, ressourcesDisponibles })
  const candidates = intentionsRetenues
    .filter(item => item.type !== TYPES_INTENTION_METIER.RENONCEMENT)
    .map(item => ({ ...item, metadata: { ...item.metadata } }))
    .sort(comparerIntentionsMetier)
  const parId = new Map(candidates.map(item => [item.id, item]))
  detecterCycle(candidates, id => contraintes(parId.get(id)).idsIntentionsRequises ?? [],
    CODES_ERREUR_RESOLUTION_CONFLIT.CYCLE_DEPENDANCES)
  detecterCycle(candidates, id => [
    ...(contraintes(parId.get(id)).ordreApres ?? []),
    ...candidates.filter(item => (contraintes(item).ordreAvant ?? []).includes(id)).map(item => item.id),
  ], CODES_ERREUR_RESOLUTION_CONFLIT.CYCLE_ORDRE)

  const retenues = []
  const ecartes = new Map()
  const conflits = []
  const exclusivites = new Map()
  const ressourcesRestantes = { ...ressourcesDisponibles }

  for (const intention of candidates) {
    const regle = contraintes(intention)
    let conflit = null
    if (regle.cleExclusivite && exclusivites.has(regle.cleExclusivite)) {
      const gagnante = exclusivites.get(regle.cleExclusivite)
      conflit = creerConflit(TYPES_CONFLIT_ACTION.CIBLE_EXCLUSIVE,
        [gagnante.id, intention.id], gagnante.id, 'cle_exclusivite_occupee',
        { cleExclusivite: regle.cleExclusivite })
    }
    if (!conflit) {
      const gagnante = retenues.find(item =>
        (regle.idsIntentionsIncompatibles ?? []).includes(item.id) ||
        (contraintes(item).idsIntentionsIncompatibles ?? []).includes(intention.id))
      if (gagnante) conflit = creerConflit(TYPES_CONFLIT_ACTION.MUTUELLEMENT_EXCLUSIVES,
        [gagnante.id, intention.id], gagnante.id, 'intentions_incompatibles')
    }
    if (!conflit) {
      const consommationImpossible = (regle.ressourcesConsommees ?? []).find(item =>
        !Object.hasOwn(ressourcesRestantes, item.ressourceId) ||
        ressourcesRestantes[item.ressourceId] < item.quantite)
      if (consommationImpossible) conflit = creerConflit(TYPES_CONFLIT_ACTION.RESSOURCE_INSUFFISANTE,
        [intention.id], null, 'capacite_ressource_insuffisante',
        { ressourceId: consommationImpossible.ressourceId, quantite: consommationImpossible.quantite })
    }
    if (conflit) {
      ajouterEcart(ecartes, conflits, intention, conflit)
      continue
    }
    retenues.push(intention)
    if (regle.cleExclusivite) exclusivites.set(regle.cleExclusivite, intention)
    for (const consommation of regle.ressourcesConsommees ?? []) {
      ressourcesRestantes[consommation.ressourceId] -= consommation.quantite
    }
  }

  let modifie = true
  while (modifie) {
    modifie = false
    for (let index = retenues.length - 1; index >= 0; index -= 1) {
      const intention = retenues[index]
      const requiseAbsente = (contraintes(intention).idsIntentionsRequises ?? [])
        .find(id => !retenues.some(item => item.id === id))
      if (!requiseAbsente) continue
      retenues.splice(index, 1)
      const conflit = creerConflit(TYPES_CONFLIT_ACTION.DEPENDANCE_NON_SATISFAITE,
        [requiseAbsente, intention.id], null, 'intention_requise_non_executable',
        { intentionRequiseId: requiseAbsente })
      ajouterEcart(ecartes, conflits, intention, conflit)
      modifie = true
    }
  }

  const ordre = trierTopologiquement(retenues)
  const plans = new Map(planificationsExecution.map(item => [item.intentionId, item]))
  const planificationsFinales = ordre.map((intention, ordreExecution) => ({
    ...plans.get(intention.id), ordreExecution,
  }))
  return {
    intentionsExecutables: ordre.map(item => ({
      ...item, statutResolution: STATUTS_RESOLUTION_ACTION.EXECUTABLE,
    })),
    intentionsEcarteesParConflit: candidates.filter(item => ecartes.has(item.id)).map(item => ecartes.get(item.id)),
    conflitsDetectes: conflits,
    planificationsFinales,
    ordreExecutionFinal: ordre.map(item => item.id),
  }
}

export {
  CODES_ERREUR_RESOLUTION_CONFLIT,
  ErreurResolutionConflit,
  STATUTS_RESOLUTION_ACTION,
  TYPES_CONFLIT_ACTION,
}
