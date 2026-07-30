import {
  CODES_ERREUR_ETAT_DIALOGUE,
  ErreurValidationEtatDialogue,
  validerEtatDialogueContextuel,
} from './index.js'
import { TYPES_REFERENCE_DIALOGUE } from './constantes.js'

const DATE_1 = '2026-07-30T08:00:00.000Z'
const DATE_2 = '2026-07-30T09:00:00.000Z'

function creerEvenement(id, date, extra = {}) {
  return {
    id,
    type: 'dialogue',
    emetteurId: null,
    destinataireIds: [],
    contenu: {},
    visibilite: 'publique',
    date,
    metadata: {},
    ...extra,
  }
}

function creerHistorique() {
  return [
    creerEvenement('evt-1', DATE_1),
    creerEvenement('evt-2', DATE_2),
  ]
}

function creerEtatDialogue() {
  return {
    faits: [{
      id: 'fait-1', contenu: 'Un fait.', evenementSourceIds: ['evt-2'], dateMiseAJour: DATE_2,
    }],
    objectifs: [{
      id: 'objectif-1', contenu: 'Un objectif.', participantIds: [],
      evenementSourceIds: ['evt-2'], dateMiseAJour: DATE_2,
    }],
    questionsOuvertes: [{
      id: 'question-1', contenu: 'Une question ?', auteurId: 'participant-1',
      destinataireIds: [], evenementSourceIds: ['evt-2'], dateOuverture: DATE_2,
    }],
    decisions: [{
      id: 'decision-1', contenu: 'Une decision.', participantIds: [],
      evenementSourceIds: ['evt-2'], dateDecision: DATE_2,
    }],
    contraintes: [{
      id: 'contrainte-1', contenu: 'Une contrainte.', participantIds: [],
      evenementSourceIds: ['evt-2'], dateMiseAJour: DATE_2,
    }],
    reponses: [{
      id: 'reponse-1', questionId: 'question-1', contenu: 'Une reponse.',
      auteurId: 'participant-2', evenementSourceIds: ['evt-2'], dateReponse: DATE_2,
    }],
    faitsAConfirmer: [{
      id: 'confirmation-1', contenu: 'A confirmer.', confirmationParticipantIds: [],
      evenementSourceIds: ['evt-2'], dateMiseAJour: DATE_2,
    }],
    evenementSourceIds: ['evt-1', 'evt-2'],
    dateMiseAJour: DATE_2,
  }
}

function attendreCode(etat, historique, code) {
  expect(() => validerEtatDialogueContextuel(etat, historique))
    .toThrow(expect.objectContaining({ code }))
}

function utiliserQuestionHistorique(etat, historique, referencesDialogue) {
  etat.questionsOuvertes = []
  etat.reponses[0].questionId = 'question-historique'
  if (referencesDialogue !== undefined) historique[0].referencesDialogue = referencesDialogue
}

describe('RFC-018.2 - validation contextuelle de EtatDialogue', () => {
  test('accepte un EtatDialogue et un historique valides', () => {
    expect(() => validerEtatDialogueContextuel(creerEtatDialogue(), creerHistorique())).not.toThrow()
  })

  test('retourne exactement la reference EtatDialogue recue', () => {
    const etat = creerEtatDialogue()
    expect(validerEtatDialogueContextuel(etat, creerHistorique())).toBe(etat)
  })

  test('ne mute pas EtatDialogue', () => {
    const etat = creerEtatDialogue()
    const avant = structuredClone(etat)
    validerEtatDialogueContextuel(etat, creerHistorique())
    expect(etat).toEqual(avant)
  })

  test('ne mute pas historique', () => {
    const historique = creerHistorique()
    const avant = structuredClone(historique)
    validerEtatDialogueContextuel(creerEtatDialogue(), historique)
    expect(historique).toEqual(avant)
  })

  test('rejette un historique absent', () => {
    attendreCode(creerEtatDialogue(), undefined, CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_ABSENT)
  })

  test('rejette un historique de type invalide', () => {
    attendreCode(creerEtatDialogue(), {}, CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_INVALIDE)
  })

  test('rejette un evenement sans id valide', () => {
    const historique = creerHistorique()
    historique[0].id = ' '
    attendreCode(creerEtatDialogue(), historique, CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_INVALIDE)
  })

  test('rejette un evenement sans date valide', () => {
    const historique = creerHistorique()
    historique[0].date = 'date-invalide'
    attendreCode(creerEtatDialogue(), historique, CODES_ERREUR_ETAT_DIALOGUE.HISTORIQUE_INVALIDE)
  })

  test('rejette un doublon id evenement', () => {
    const historique = creerHistorique()
    historique[1].id = historique[0].id
    attendreCode(creerEtatDialogue(), historique, CODES_ERREUR_ETAT_DIALOGUE.EVENEMENT_DUPLIQUE)
  })

  test('rejette une source racine inexistante avec son chemin', () => {
    const etat = creerEtatDialogue()
    etat.evenementSourceIds[1] = 'evt-absent'
    expect(() => validerEtatDialogueContextuel(etat, creerHistorique())).toThrow(expect.objectContaining({
      code: CODES_ERREUR_ETAT_DIALOGUE.EVENEMENT_SOURCE_INTROUVABLE,
      chemin: 'etatDialogue.evenementSourceIds[1]',
    }))
  })

  test('rejette une source objet projeté inexistante', () => {
    const etat = creerEtatDialogue()
    etat.objectifs[0].evenementSourceIds = ['evt-absent']
    attendreCode(etat, creerHistorique(), CODES_ERREUR_ETAT_DIALOGUE.EVENEMENT_SOURCE_INTROUVABLE)
  })

  test('accepte un ordre chronologique racine valide', () => {
    expect(() => validerEtatDialogueContextuel(creerEtatDialogue(), creerHistorique())).not.toThrow()
  })

  test('accepte deux dates evenement identiques', () => {
    const historique = creerHistorique()
    historique[0].date = DATE_2
    expect(() => validerEtatDialogueContextuel(creerEtatDialogue(), historique)).not.toThrow()
  })

  test('rejette un ordre chronologique racine invalide', () => {
    const etat = creerEtatDialogue()
    etat.evenementSourceIds = ['evt-2', 'evt-1']
    etat.dateMiseAJour = DATE_1
    attendreCode(etat, creerHistorique(), CODES_ERREUR_ETAT_DIALOGUE.ORDRE_CHRONOLOGIQUE_INVALIDE)
  })

  test('accepte la date racine egale au dernier evenement', () => {
    expect(() => validerEtatDialogueContextuel(creerEtatDialogue(), creerHistorique())).not.toThrow()
  })

  test('rejette une date racine incoherente', () => {
    const etat = creerEtatDialogue()
    etat.dateMiseAJour = DATE_1
    attendreCode(etat, creerHistorique(), CODES_ERREUR_ETAT_DIALOGUE.DATE_PROJECTION_INCOHERENTE)
  })

  test.each([
    ['faits', 'dateMiseAJour'],
    ['objectifs', 'dateMiseAJour'],
    ['questionsOuvertes', 'dateOuverture'],
    ['decisions', 'dateDecision'],
    ['contraintes', 'dateMiseAJour'],
    ['reponses', 'dateReponse'],
    ['faitsAConfirmer', 'dateMiseAJour'],
  ])('accepte la date coherente de %s', (collection, champDate) => {
    const etat = creerEtatDialogue()
    expect(etat[collection][0][champDate]).toBe(DATE_2)
    expect(() => validerEtatDialogueContextuel(etat, creerHistorique())).not.toThrow()
  })

  test('rejette la date incoherente d un objet projete', () => {
    const etat = creerEtatDialogue()
    etat.faits[0].dateMiseAJour = DATE_1
    attendreCode(etat, creerHistorique(), CODES_ERREUR_ETAT_DIALOGUE.DATE_PROJECTION_INCOHERENTE)
  })

  test('rejette explicitement une source posterieure a la date objet', () => {
    const etat = creerEtatDialogue()
    etat.objectifs[0].evenementSourceIds = ['evt-1', 'evt-2']
    etat.objectifs[0].dateMiseAJour = DATE_1
    attendreCode(etat, creerHistorique(), CODES_ERREUR_ETAT_DIALOGUE.DATE_PROJECTION_INCOHERENTE)
  })

  test('accepte deux dates ISO representant le meme instant', () => {
    const etat = creerEtatDialogue()
    etat.dateMiseAJour = '2026-07-30T11:00:00+02:00'
    expect(() => validerEtatDialogueContextuel(etat, creerHistorique())).not.toThrow()
  })

  test('accepte questionId presente dans questionsOuvertes', () => {
    expect(() => validerEtatDialogueContextuel(creerEtatDialogue(), creerHistorique())).not.toThrow()
  })

  test('accepte questionId historique via referencesDialogue', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [{
      categorie: TYPES_REFERENCE_DIALOGUE.QUESTION,
      id: 'question-historique',
    }])
    expect(() => validerEtatDialogueContextuel(etat, historique)).not.toThrow()
  })

  test('rejette questionId absente partout', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [])
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.QUESTION_HISTORIQUE_INTROUVABLE)
  })

  test('accepte un evenement ancien sans referencesDialogue si aucune preuve n est necessaire', () => {
    expect(() => validerEtatDialogueContextuel(creerEtatDialogue(), creerHistorique())).not.toThrow()
  })

  test('un evenement ancien sans referencesDialogue ne prouve pas une question resolue', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique)
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.QUESTION_HISTORIQUE_INTROUVABLE)
  })

  test('rejette referencesDialogue non-tableau lorsqu elle est consultee', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, {})
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE)
  })

  test('rejette une reference non-objet', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [null])
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE)
  })

  test('rejette une categorie inconnue', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [{ categorie: 'inconnue', id: 'question-historique' }])
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE)
  })

  test('rejette un id reference vide', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [{ categorie: TYPES_REFERENCE_DIALOGUE.QUESTION, id: ' ' }])
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE)
  })

  test('rejette une propriete inconnue dans une reference', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [{
      categorie: TYPES_REFERENCE_DIALOGUE.QUESTION,
      id: 'question-historique',
      effet: 'resout',
    }])
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE)
  })

  test('rejette un doublon du couple categorie et id', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    const reference = { categorie: TYPES_REFERENCE_DIALOGUE.QUESTION, id: 'question-historique' }
    utiliserQuestionHistorique(etat, historique, [reference, { ...reference }])
    attendreCode(etat, historique, CODES_ERREUR_ETAT_DIALOGUE.REFERENCE_DIALOGUE_INVALIDE)
  })

  test('accepte le meme id avec deux categories differentes', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    utiliserQuestionHistorique(etat, historique, [
      { categorie: TYPES_REFERENCE_DIALOGUE.QUESTION, id: 'question-historique' },
      { categorie: TYPES_REFERENCE_DIALOGUE.FAIT, id: 'question-historique' },
    ])
    expect(() => validerEtatDialogueContextuel(etat, historique)).not.toThrow()
  })

  test('accepte plusieurs evenements et plusieurs objets projetes valides', () => {
    const etat = creerEtatDialogue()
    const historique = creerHistorique()
    etat.faits.push({
      id: 'fait-2', contenu: 'Un autre fait.', evenementSourceIds: ['evt-1'], dateMiseAJour: DATE_1,
    })
    etat.objectifs.push({
      id: 'objectif-2', contenu: 'Un autre objectif.', participantIds: ['participant-1'],
      evenementSourceIds: ['evt-1', 'evt-2'], dateMiseAJour: DATE_2,
    })
    expect(() => validerEtatDialogueContextuel(etat, historique)).not.toThrow()
  })
})
