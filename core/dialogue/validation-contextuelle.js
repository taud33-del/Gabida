import { validerEtatDialogue } from './validation.js'
import {
  CODES_ERREUR_ETAT_DIALOGUE,
  TYPES_REFERENCE_DIALOGUE,
} from './constantes.js'
import { ErreurValidationEtatDialogue } from './erreurs.js'

const COLLECTIONS_PROJETEES = Object.freeze({
  faits: 'dateMiseAJour',
  objectifs: 'dateMiseAJour',
  questionsOuvertes: 'dateOuverture',
  decisions: 'dateDecision',
  contraintes: 'dateMiseAJour',
  reponses: 'dateReponse',
  faitsAConfirmer: 'dateMiseAJour',
})

const CATEGORIES_REFERENCE = Object.freeze(Object.values(TYPES_REFERENCE_DIALOGUE))
const PROPRIETES_REFERENCE = Object.freeze(['categorie', 'id'])
const estObjet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
const possede = (objet, propriete) => Object.prototype.hasOwnProperty.call(objet, propriete)

function erreur(code, message, chemin = null) {
  throw new ErreurValidationEtatDialogue(code, `dialogue contextuel : ${message}`, chemin)
}

function construireIndexHistorique(historique) {
  if (historique === null || historique === undefined) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_ABSENT, 'historique absent.', 'historique')
  }
  if (!Array.isArray(historique)) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_INVALIDE, 'historique doit etre un tableau.', 'historique')
  }
  const index = new Map()
  historique.forEach((evenement, position) => {
    const chemin = `historique[${position}]`
    if (!estObjet(evenement) || typeof evenement.id !== 'string' || evenement.id.trim() === '') {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_INVALIDE, `identifiant evenement invalide ("${chemin}.id").`, `${chemin}.id`)
    }
    if (typeof evenement.date !== 'string' || evenement.date.trim() === '' || !Number.isFinite(Date.parse(evenement.date))) {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_INVALIDE, `date evenement invalide ("${chemin}.date").`, `${chemin}.date`)
    }
    if (index.has(evenement.id)) {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.EVENEMENT_DUPLIQUE, `identifiant evenement duplique ("${evenement.id}").`, `${chemin}.id`)
    }
    index.set(evenement.id, evenement)
  })
  return index
}

function resoudreSources(ids, indexHistorique, chemin) {
  return ids.map((id, position) => {
    const evenement = indexHistorique.get(id)
    if (!evenement) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.EVENEMENT_SOURCE_INTROUVABLE,
        `evenement source introuvable ("${id}").`,
        `${chemin}[${position}]`
      )
    }
    return evenement
  })
}

function validerDateProjection(dateProjection, evenements, chemin) {
  const instantProjection = Date.parse(dateProjection)
  for (let position = 0; position < evenements.length; position += 1) {
    if (Date.parse(evenements[position].date) > instantProjection) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.DATE_PROJECTION_INCOHERENTE,
        `evenement source posterieur a la date de projection ("${chemin}").`,
        chemin
      )
    }
  }
  const dernierEvenement = evenements[evenements.length - 1]
  if (Date.parse(dernierEvenement.date) !== instantProjection) {
    erreur(
      CODES_ERREUR_ETAT_DIALOGUE.DATE_PROJECTION_INCOHERENTE,
      `date de projection differente du dernier evenement source ("${chemin}").`,
      chemin
    )
  }
}

function validerOrdreChronologique(evenements) {
  for (let position = 1; position < evenements.length; position += 1) {
    if (Date.parse(evenements[position].date) < Date.parse(evenements[position - 1].date)) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.ORDRE_CHRONOLOGIQUE_INVALIDE,
        'evenementSourceIds racine n est pas ordonne chronologiquement.',
        `etatDialogue.evenementSourceIds[${position}]`
      )
    }
  }
}

function validerProjections(etatDialogue, indexHistorique) {
  for (const [collection, champDate] of Object.entries(COLLECTIONS_PROJETEES)) {
    etatDialogue[collection].forEach((objet, position) => {
      const chemin = `etatDialogue.${collection}[${position}]`
      const sources = resoudreSources(objet.evenementSourceIds, indexHistorique, `${chemin}.evenementSourceIds`)
      validerDateProjection(objet[champDate], sources, `${chemin}.${champDate}`)
    })
  }
}

function validerReferencesDialogue(references, chemin) {
  if (!Array.isArray(references)) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `tableau attendu ("${chemin}").`, chemin)
  }
  const couples = new Set()
  references.forEach((reference, position) => {
    const cheminReference = `${chemin}[${position}]`
    if (!estObjet(reference)) {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `objet attendu ("${cheminReference}").`, cheminReference)
    }
    for (const propriete of PROPRIETES_REFERENCE) {
      if (!possede(reference, propriete)) {
        erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `propriete manquante ("${cheminReference}.${propriete}").`, `${cheminReference}.${propriete}`)
      }
    }
    for (const propriete of Object.keys(reference)) {
      if (!PROPRIETES_REFERENCE.includes(propriete)) {
        erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `propriete inconnue ("${cheminReference}.${propriete}").`, `${cheminReference}.${propriete}`)
      }
    }
    if (!CATEGORIES_REFERENCE.includes(reference.categorie)) {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `categorie inconnue ("${cheminReference}.categorie").`, `${cheminReference}.categorie`)
    }
    if (typeof reference.id !== 'string' || reference.id.trim() === '') {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `identifiant invalide ("${cheminReference}.id").`, `${cheminReference}.id`)
    }
    const couple = `${reference.categorie}\u0000${reference.id}`
    if (couples.has(couple)) {
      erreur(CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE, `reference dupliquee ("${cheminReference}").`, cheminReference)
    }
    couples.add(couple)
  })
}

function validerQuestionsReponses(etatDialogue, historique) {
  const questionsOuvertes = new Set(etatDialogue.questionsOuvertes.map(question => question.id))
  for (let positionReponse = 0; positionReponse < etatDialogue.reponses.length; positionReponse += 1) {
    const reponse = etatDialogue.reponses[positionReponse]
    if (questionsOuvertes.has(reponse.questionId)) continue
    let trouvee = false
    for (let positionEvenement = 0; positionEvenement < historique.length; positionEvenement += 1) {
      const evenement = historique[positionEvenement]
      if (!possede(evenement, 'referencesDialogue')) continue
      validerReferencesDialogue(evenement.referencesDialogue, `historique[${positionEvenement}].referencesDialogue`)
      if (evenement.referencesDialogue.some(reference =>
        reference.categorie === TYPES_REFERENCE_DIALOGUE.QUESTION && reference.id === reponse.questionId
      )) trouvee = true
    }
    if (!trouvee) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.QUESTION_HISTORIQUE_INTROUVABLE,
        `question historique introuvable ("${reponse.questionId}").`,
        `etatDialogue.reponses[${positionReponse}].questionId`
      )
    }
  }
}

export function validerEtatDialogueContextuel(etatDialogue, historique) {
  validerEtatDialogue(etatDialogue)
  const indexHistorique = construireIndexHistorique(historique)
  const sourcesRacine = resoudreSources(
    etatDialogue.evenementSourceIds,
    indexHistorique,
    'etatDialogue.evenementSourceIds'
  )
  validerOrdreChronologique(sourcesRacine)
  validerDateProjection(etatDialogue.dateMiseAJour, sourcesRacine, 'etatDialogue.dateMiseAJour')
  validerProjections(etatDialogue, indexHistorique)
  validerQuestionsReponses(etatDialogue, historique)
  return etatDialogue
}
