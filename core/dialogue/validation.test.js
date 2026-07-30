import {
  CODES_ERREUR_ETAT_DIALOGUE,
  ErreurValidationEtatDialogue,
  validerEtatDialogue,
} from './index.js'
import { ErreurValidation } from '../index.js'

const DATE = '2026-07-30T12:00:00.000Z'

function creerEtatDialogue() {
  return {
    faits: [{
      id: 'fait-1',
      contenu: 'Le rendez-vous est fixe.',
      evenementSourceIds: ['evt-fait'],
      dateMiseAJour: DATE,
    }],
    objectifs: [{
      id: 'objectif-1',
      contenu: 'Fixer un lieu.',
      participantIds: ['participant-1'],
      evenementSourceIds: ['evt-objectif'],
      dateMiseAJour: DATE,
    }],
    questionsOuvertes: [{
      id: 'question-1',
      contenu: 'Ou se retrouver ?',
      auteurId: 'participant-1',
      destinataireIds: ['participant-2'],
      evenementSourceIds: ['evt-question'],
      dateOuverture: DATE,
    }],
    decisions: [{
      id: 'decision-1',
      contenu: 'Se retrouver demain.',
      participantIds: ['participant-1', 'participant-2'],
      evenementSourceIds: ['evt-decision'],
      dateDecision: DATE,
    }],
    contraintes: [{
      id: 'contrainte-1',
      contenu: 'Terminer avant midi.',
      participantIds: [],
      evenementSourceIds: ['evt-contrainte'],
      dateMiseAJour: DATE,
    }],
    reponses: [{
      id: 'reponse-1',
      questionId: 'question-1',
      contenu: 'A la gare.',
      auteurId: 'participant-2',
      evenementSourceIds: ['evt-reponse'],
      dateReponse: DATE,
    }],
    faitsAConfirmer: [{
      id: 'confirmation-1',
      contenu: 'La gare ouvre a huit heures.',
      confirmationParticipantIds: [],
      evenementSourceIds: ['evt-confirmation'],
      dateMiseAJour: DATE,
    }],
    evenementSourceIds: ['evt-racine-1', 'evt-racine-2'],
    dateMiseAJour: DATE,
  }
}

function attendreCode(etat, code) {
  expect(() => validerEtatDialogue(etat)).toThrow(expect.objectContaining({ code }))
}

describe('RFC-018 - validation structurelle de EtatDialogue', () => {
  test('accepte un EtatDialogue complet valide', () => {
    expect(() => validerEtatDialogue(creerEtatDialogue())).not.toThrow()
  })

  test('retourne exactement la reference recue', () => {
    const etat = creerEtatDialogue()
    expect(validerEtatDialogue(etat)).toBe(etat)
  })

  test('rejette null avec une erreur dediee appartenant aux erreurs de validation', () => {
    try {
      validerEtatDialogue(null)
    } catch (error) {
      expect(error).toBeInstanceOf(ErreurValidationEtatDialogue)
      expect(error).toBeInstanceOf(ErreurValidation)
      expect(error).toMatchObject({ code: CODES_ERREUR_ETAT_DIALOGUE.ETAT_ABSENT, chemin: 'etatDialogue' })
    }
  })

  test('rejette un tableau comme racine', () => {
    attendreCode([], CODES_ERREUR_ETAT_DIALOGUE.TYPE_INVALIDE)
  })

  test('rejette un champ racine manquant', () => {
    const etat = creerEtatDialogue()
    delete etat.faits
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_MANQUANTE)
  })

  test('rejette une propriete racine inconnue', () => {
    attendreCode({ ...creerEtatDialogue(), inconnue: true }, CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_INCONNUE)
  })

  test('rejette une collection non-tableau', () => {
    attendreCode({ ...creerEtatDialogue(), objectifs: {} }, CODES_ERREUR_ETAT_DIALOGUE.TABLEAU_INVALIDE)
  })

  test('rejette une chaine vide', () => {
    const etat = creerEtatDialogue()
    etat.faits[0].contenu = ''
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.CHAINE_INVALIDE)
  })

  test('rejette une chaine composee uniquement d espaces', () => {
    const etat = creerEtatDialogue()
    etat.reponses[0].questionId = '   '
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.CHAINE_INVALIDE)
  })

  test('rejette une date invalide', () => {
    const etat = creerEtatDialogue()
    etat.decisions[0].dateDecision = 'date-invalide'
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.DATE_INVALIDE)
  })

  test('rejette un evenementSourceIds vide', () => {
    const etat = creerEtatDialogue()
    etat.objectifs[0].evenementSourceIds = []
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.SOURCE_ABSENTE)
  })

  test('rejette un identifiant source invalide', () => {
    const etat = creerEtatDialogue()
    etat.evenementSourceIds = ['evt-1', ' ']
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.CHAINE_INVALIDE)
  })

  test('rejette un doublon dans un tableau d identifiants', () => {
    const etat = creerEtatDialogue()
    etat.questionsOuvertes[0].destinataireIds = ['participant-2', 'participant-2']
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.IDENTIFIANT_DUPLIQUE)
  })

  test('rejette un element interne non-objet', () => {
    const etat = creerEtatDialogue()
    etat.contraintes[0] = null
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.TYPE_INVALIDE)
  })

  test('rejette un champ interne manquant', () => {
    const etat = creerEtatDialogue()
    delete etat.faitsAConfirmer[0].contenu
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_MANQUANTE)
  })

  test('rejette une propriete interne inconnue', () => {
    const etat = creerEtatDialogue()
    etat.reponses[0].inconnue = true
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_INCONNUE)
  })

  test.each([
    'faits',
    'objectifs',
    'questionsOuvertes',
    'decisions',
    'contraintes',
    'reponses',
    'faitsAConfirmer',
  ])('rejette un id duplique dans la collection %s', collection => {
    const etat = creerEtatDialogue()
    etat[collection].push(structuredClone(etat[collection][0]))
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.IDENTIFIANT_DUPLIQUE)
  })

  test.each([
    ['objectifs', 'participantIds'],
    ['questionsOuvertes', 'destinataireIds'],
    ['decisions', 'participantIds'],
    ['contraintes', 'participantIds'],
    ['faitsAConfirmer', 'confirmationParticipantIds'],
  ])('accepte %s.%s vide', (collection, propriete) => {
    const etat = creerEtatDialogue()
    etat[collection][0][propriete] = []
    expect(() => validerEtatDialogue(etat)).not.toThrow()
  })

  test('accepte une reponse dont questionId ne correspond a aucune question ouverte', () => {
    const etat = creerEtatDialogue()
    etat.reponses[0].questionId = 'question-historique'
    expect(() => validerEtatDialogue(etat)).not.toThrow()
  })

  test('ne mute jamais l objet valide', () => {
    const etat = creerEtatDialogue()
    const avant = structuredClone(etat)
    validerEtatDialogue(etat)
    expect(etat).toEqual(avant)
  })

  test('accepte le meme id dans deux collections distinctes', () => {
    const etat = creerEtatDialogue()
    etat.decisions[0].id = etat.faits[0].id
    expect(() => validerEtatDialogue(etat)).not.toThrow()
  })

  test('rejette evenementSourceIds racine vide', () => {
    const etat = creerEtatDialogue()
    etat.evenementSourceIds = []
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.SOURCE_ABSENTE)
  })

  test('rejette une propriete inconnue avant de valider sa valeur', () => {
    const etat = creerEtatDialogue()
    etat.faits[0].extra = undefined
    attendreCode(etat, CODES_ERREUR_ETAT_DIALOGUE.PROPRIETE_INCONNUE)
  })
})
