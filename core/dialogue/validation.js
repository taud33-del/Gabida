import { CODES_ERREUR_ETAT_DIALOGUE } from './constantes.js'
import { ErreurValidationEtatDialogue } from './erreurs.js'

const PROPRIETES_ETAT = Object.freeze([
  'faits',
  'objectifs',
  'questionsOuvertes',
  'decisions',
  'contraintes',
  'reponses',
  'faitsAConfirmer',
  'evenementSourceIds',
  'dateMiseAJour',
])

const CONTRATS_COLLECTIONS = Object.freeze({
  faits: Object.freeze({
    proprietes: Object.freeze(['id', 'contenu', 'evenementSourceIds', 'dateMiseAJour']),
    tableauxIdentifiants: Object.freeze([]),
    date: 'dateMiseAJour',
  }),
  objectifs: Object.freeze({
    proprietes: Object.freeze(['id', 'contenu', 'participantIds', 'evenementSourceIds', 'dateMiseAJour']),
    tableauxIdentifiants: Object.freeze(['participantIds']),
    date: 'dateMiseAJour',
  }),
  questionsOuvertes: Object.freeze({
    proprietes: Object.freeze(['id', 'contenu', 'auteurId', 'destinataireIds', 'evenementSourceIds', 'dateOuverture']),
    tableauxIdentifiants: Object.freeze(['destinataireIds']),
    date: 'dateOuverture',
  }),
  decisions: Object.freeze({
    proprietes: Object.freeze(['id', 'contenu', 'participantIds', 'evenementSourceIds', 'dateDecision']),
    tableauxIdentifiants: Object.freeze(['participantIds']),
    date: 'dateDecision',
  }),
  contraintes: Object.freeze({
    proprietes: Object.freeze(['id', 'contenu', 'participantIds', 'evenementSourceIds', 'dateMiseAJour']),
    tableauxIdentifiants: Object.freeze(['participantIds']),
    date: 'dateMiseAJour',
  }),
  reponses: Object.freeze({
    proprietes: Object.freeze(['id', 'questionId', 'contenu', 'auteurId', 'evenementSourceIds', 'dateReponse']),
    tableauxIdentifiants: Object.freeze([]),
    date: 'dateReponse',
  }),
  faitsAConfirmer: Object.freeze({
    proprietes: Object.freeze(['id', 'contenu', 'confirmationParticipantIds', 'evenementSourceIds', 'dateMiseAJour']),
    tableauxIdentifiants: Object.freeze(['confirmationParticipantIds']),
    date: 'dateMiseAJour',
  }),
})

const estObjet = valeur => valeur !== null && typeof valeur === 'object' && !Array.isArray(valeur)
const possede = (objet, propriete) => Object.prototype.hasOwnProperty.call(objet, propriete)

function erreur(code, message, chemin = null) {
  throw new ErreurValidationEtatDialogue(code, `dialogue : ${message}`, chemin)
}

function validerProprietesExactes(objet, proprietes, chemin) {
  for (const propriete of proprietes) {
    if (!possede(objet, propriete)) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_MANQUANTE,
        `propriete obligatoire manquante ("${chemin}.${propriete}").`,
        `${chemin}.${propriete}`
      )
    }
  }
  const autorisees = new Set(proprietes)
  for (const propriete of Object.keys(objet)) {
    if (!autorisees.has(propriete)) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_INCONNUE,
        `propriete inconnue ("${chemin}.${propriete}").`,
        `${chemin}.${propriete}`
      )
    }
  }
}

function validerChaine(valeur, chemin) {
  if (typeof valeur !== 'string' || valeur.trim() === '') {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.CHAINE_INVALIDE, `chaine non vide attendue ("${chemin}").`, chemin)
  }
}

function validerDate(valeur, chemin) {
  if (typeof valeur !== 'string' || valeur.trim() === '' || !Number.isFinite(Date.parse(valeur))) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.DATE_INVALIDE, `date ISO 8601 invalide ("${chemin}").`, chemin)
  }
}

function validerTableauIdentifiants(valeurs, chemin, nonVide = false) {
  if (!Array.isArray(valeurs)) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.TABLEAU_INVALIDE, `tableau attendu ("${chemin}").`, chemin)
  }
  if (nonVide && valeurs.length === 0) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.SOURCE_ABSENTE, `au moins une source est requise ("${chemin}").`, chemin)
  }
  const identifiants = new Set()
  for (let index = 0; index < valeurs.length; index += 1) {
    const identifiant = valeurs[index]
    validerChaine(identifiant, `${chemin}[${index}]`)
    if (identifiants.has(identifiant)) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.IDENTIFIANT_DUPLIQUE,
        `identifiant duplique ("${chemin}[${index}]").`,
        `${chemin}[${index}]`
      )
    }
    identifiants.add(identifiant)
  }
}

function validerObjetProjete(objet, contrat, chemin) {
  if (!estObjet(objet)) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.TYPE_INVALIDE, `objet attendu ("${chemin}").`, chemin)
  }
  validerProprietesExactes(objet, contrat.proprietes, chemin)
  for (const propriete of contrat.proprietes) {
    if (propriete !== contrat.date && propriete !== 'evenementSourceIds' && !contrat.tableauxIdentifiants.includes(propriete)) {
      validerChaine(objet[propriete], `${chemin}.${propriete}`)
    }
  }
  for (const propriete of contrat.tableauxIdentifiants) {
    validerTableauIdentifiants(objet[propriete], `${chemin}.${propriete}`)
  }
  validerTableauIdentifiants(objet.evenementSourceIds, `${chemin}.evenementSourceIds`, true)
  validerDate(objet[contrat.date], `${chemin}.${contrat.date}`)
}

function validerCollection(collection, nom, contrat) {
  if (!Array.isArray(collection)) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.TABLEAU_INVALIDE, `tableau attendu ("etatDialogue.${nom}").`, `etatDialogue.${nom}`)
  }
  const identifiants = new Set()
  collection.forEach((objet, index) => {
    const chemin = `etatDialogue.${nom}[${index}]`
    validerObjetProjete(objet, contrat, chemin)
    if (identifiants.has(objet.id)) {
      erreur(
        CODES_ERREUR_ETAT_DIALOGUE.IDENTIFIANT_DUPLIQUE,
        `identifiant duplique dans la collection "${nom}" ("${objet.id}").`,
        `${chemin}.id`
      )
    }
    identifiants.add(objet.id)
  })
}

export function validerEtatDialogue(etatDialogue) {
  if (etatDialogue === null || etatDialogue === undefined) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.ETAT_ABSENT, 'EtatDialogue est absent.', 'etatDialogue')
  }
  if (!estObjet(etatDialogue)) {
    erreur(CODES_ERREUR_ETAT_DIALOGUE.TYPE_INVALIDE, 'EtatDialogue doit etre un objet.', 'etatDialogue')
  }
  validerProprietesExactes(etatDialogue, PROPRIETES_ETAT, 'etatDialogue')
  for (const [nom, contrat] of Object.entries(CONTRATS_COLLECTIONS)) {
    validerCollection(etatDialogue[nom], nom, contrat)
  }
  validerTableauIdentifiants(etatDialogue.evenementSourceIds, 'etatDialogue.evenementSourceIds', true)
  validerDate(etatDialogue.dateMiseAJour, 'etatDialogue.dateMiseAJour')
  return etatDialogue
}
