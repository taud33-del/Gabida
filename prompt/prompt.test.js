/**
 * prompt/prompt.test.js
 *
 * Tests du module prompt (Sprint 25).
 * Le module est un ASSEMBLEUR pur et deterministe : lookup + concatenation +
 * formatage. Aucun raisonnement, aucune valeur numerique ni identifiant interne
 * ne doit apparaitre dans la sortie.
 */

import { jest } from '@jest/globals'
import {
  buildPrompt,
  PromptError,
  MissingDecisionError,
  MissingFichePersonnageError,
} from './index.js'
import {
  traduireObjectif,
  traduireAttitude,
  traduireDirection,
  LANGUE_DEFAUT,
} from './vocabulaire.js'
import { OBJECTIFS } from '../constants/Objectifs.js'
import { ATTITUDES } from '../constants/Attitudes.js'
import { DIRECTIONS_NARRATIVES } from '../constants/DirectionsNarratives.js'
import { ROLES_MESSAGE } from '../constants/RolesMessage.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePlayerMessage(texte = 'Bonjour Aldric.') {
  return { texte, tour: 1, sessionId: 's-1', timestamp: 0 }
}

function makeDecision(overrides = {}) {
  return {
    objectifImmediat: OBJECTIFS.RENFORCER_RELATION,
    attitude: ATTITUDES.OUVERTE,
    directionNarrative: DIRECTIONS_NARRATIVES.INVITER_JOUEUR,
    justification: {
      criteresActifs: ['communication'],
      axiomesAppliques: [4, 10, 20],
      explication: 'trace audit',
    },
    ...overrides,
  }
}

function makeFiches(overrides = {}) {
  return {
    personnage: { nom: 'Aldric', criteres: { communication: 0.6 } },
    univers: { nom: 'Hadelas' },
    aventure: { lieuDepart: 'Foret' },
    joueur: { nom: 'Joueur' },
    memoire: {},
    ...overrides,
  }
}

function makeRessenti() {
  return {
    dominants: [
      { critereId: 'communication', intensite: 0.6, origine: 'TRAIT' },
      { critereId: 'confiance', intensite: 0.3, origine: 'TRAIT' },
      { critereId: 'communication', intensite: 0, origine: 'TRAIT' },
    ],
    etatsTemporaires: [],
    traitsPermanents: [{ critereId: 'communication', valeur: 0.6 }],
  }
}

function makeEtat(overrides = {}) {
  return {
    sessionId: 's-1',
    tourCourant: 1,
    memoireVecue: {},
    historique: [],
    meta: { debutTimestamp: 0, langue: 'fr' },
    ...overrides,
  }
}

// ─── vocabulaire ──────────────────────────────────────────────────────────────

describe('vocabulaire : traduction identifiant → langage naturel', () => {
  test('traduit chaque objectif en phrase non vide', () => {
    for (const id of Object.values(OBJECTIFS)) {
      const phrase = traduireObjectif(id)
      expect(typeof phrase).toBe('string')
      expect(phrase.length).toBeGreaterThan(0)
    }
  })

  test('traduit chaque attitude en phrase non vide', () => {
    for (const id of Object.values(ATTITUDES)) {
      expect(traduireAttitude(id).length).toBeGreaterThan(0)
    }
  })

  test('traduit chaque direction en phrase non vide', () => {
    for (const id of Object.values(DIRECTIONS_NARRATIVES)) {
      expect(traduireDirection(id).length).toBeGreaterThan(0)
    }
  })

  test('retourne une chaine vide pour un identifiant inconnu', () => {
    expect(traduireObjectif('inconnu')).toBe('')
    expect(traduireAttitude('inconnu')).toBe('')
    expect(traduireDirection('inconnu')).toBe('')
  })

  test('repli sur la langue par defaut pour une langue non fournie', () => {
    expect(traduireObjectif(OBJECTIFS.RENFORCER_RELATION, 'xx')).toBe(
      traduireObjectif(OBJECTIFS.RENFORCER_RELATION, LANGUE_DEFAUT),
    )
  })

  test('aucune traduction ne contient de valeur numerique ni d\'identifiant', () => {
    const toutes = [
      ...Object.values(OBJECTIFS).map((id) => traduireObjectif(id)),
      ...Object.values(ATTITUDES).map((id) => traduireAttitude(id)),
      ...Object.values(DIRECTIONS_NARRATIVES).map((id) => traduireDirection(id)),
    ]
    for (const phrase of toutes) {
      expect(phrase).not.toMatch(/[0-9]/)
      expect(phrase).not.toMatch(/_/) // les identifiants du moteur contiennent des underscores
    }
  })
})

// ─── contrat de sortie ────────────────────────────────────────────────────────

describe('buildPrompt : contrat de sortie', () => {
  test('produit systeme/historique/instruction', () => {
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(typeof prompt.systeme).toBe('string')
    expect(prompt.systeme.length).toBeGreaterThan(0)
    expect(Array.isArray(prompt.historique)).toBe(true)
    expect(typeof prompt.instruction).toBe('string')
    expect(prompt.instruction.length).toBeGreaterThan(0)
  })

  test('le systeme contient l\'identite du personnage et l\'univers', () => {
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(prompt.systeme).toContain('Aldric')
    expect(prompt.systeme).toContain('Hadelas')
  })

  test('le systeme contient les directives traduites de la Decision', () => {
    const decision = makeDecision({
      objectifImmediat: OBJECTIFS.PROTEGER_SOI,
      attitude: ATTITUDES.DEFENSIVE,
      directionNarrative: DIRECTIONS_NARRATIVES.APAISER_TENSION,
    })
    const prompt = buildPrompt(
      makePlayerMessage(),
      decision,
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(prompt.systeme).toContain(traduireObjectif(OBJECTIFS.PROTEGER_SOI))
    expect(prompt.systeme).toContain(traduireAttitude(ATTITUDES.DEFENSIVE))
    expect(prompt.systeme).toContain(
      traduireDirection(DIRECTIONS_NARRATIVES.APAISER_TENSION),
    )
  })

  test('l\'instruction inclut le message brut du joueur', () => {
    const prompt = buildPrompt(
      makePlayerMessage('Peux-tu m\'aider ?'),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(prompt.instruction).toContain('Peux-tu m\'aider ?')
  })

  test('impose le contrat JSON action/dialogue sans convention Markdown', () => {
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(prompt.systeme).toContain('objet JSON valide')
    expect(prompt.systeme).toContain('"action"')
    expect(prompt.systeme).toContain('"dialogue"')
    expect(prompt.systeme).not.toContain('asterisque')
  })

  test('gere le silence quand le message joueur est vide', () => {
    const prompt = buildPrompt(
      makePlayerMessage(''),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(prompt.instruction.length).toBeGreaterThan(0)
    expect(prompt.instruction.toLowerCase()).toContain('silence')
  })
})

// ─── historique (passe-plat) ──────────────────────────────────────────────────

describe('buildPrompt : historique', () => {
  test('vide au premier tour', () => {
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat({ historique: [] }),
    )
    expect(prompt.historique).toEqual([])
  })

  test('reproduit l\'historique de l\'etat sans transformation', () => {
    const historique = [
      { role: ROLES_MESSAGE.USER, contenu: 'Salut.' },
      { role: ROLES_MESSAGE.ASSISTANT, contenu: 'Bonjour a toi.' },
    ]
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat({ historique }),
    )
    expect(prompt.historique).toEqual(historique)
  })

  test('n\'inclut pas le message du tour courant dans l\'historique', () => {
    const prompt = buildPrompt(
      makePlayerMessage('message du tour'),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat({ historique: [] }),
    )
    expect(prompt.historique).toEqual([])
  })
})

// ─── frontiere cognition ↔ langage (aucune fuite interne) ─────────────────────

describe('buildPrompt : aucune fuite de mecanique interne', () => {
  test('ne revele aucun identifiant ni valeur numerique au LLM', () => {
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    const texteExpose = prompt.systeme + '\n' + prompt.instruction
    // identifiants internes de la Decision
    expect(texteExpose).not.toContain(OBJECTIFS.RENFORCER_RELATION)
    expect(texteExpose).not.toContain(ATTITUDES.OUVERTE)
    expect(texteExpose).not.toContain(DIRECTIONS_NARRATIVES.INVITER_JOUEUR)
    // critereId
    expect(texteExpose).not.toContain('communication')
    // pas d'axiome/poids/score
    expect(texteExpose.toLowerCase()).not.toContain('axiome')
    expect(texteExpose.toLowerCase()).not.toContain('critere')
  })
})

// ─── determinisme et purete ───────────────────────────────────────────────────

describe('buildPrompt : determinisme et purete', () => {
  test('meme entree → meme sortie', () => {
    const args = [
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    ]
    expect(buildPrompt(...args)).toEqual(buildPrompt(...args))
  })

  test('ne mute aucune entree', () => {
    const playerMessage = makePlayerMessage()
    const decision = makeDecision()
    const ressenti = makeRessenti()
    const fiches = makeFiches()
    const etat = makeEtat({
      historique: [{ role: ROLES_MESSAGE.USER, contenu: 'Salut.' }],
    })
    const snapshot = JSON.stringify({ playerMessage, decision, ressenti, fiches, etat })

    buildPrompt(playerMessage, decision, ressenti, fiches, etat)

    expect(JSON.stringify({ playerMessage, decision, ressenti, fiches, etat })).toBe(
      snapshot,
    )
  })

  test('n\'appelle jamais Date.now (aucune dependance temporelle)', () => {
    const spy = jest.spyOn(Date, 'now')
    buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      makeFiches(),
      makeEtat(),
    )
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})

// ─── erreurs typees ───────────────────────────────────────────────────────────

describe('buildPrompt : erreurs typees', () => {
  test('MissingDecisionError si decision absente', () => {
    expect(() =>
      buildPrompt(makePlayerMessage(), null, makeRessenti(), makeFiches(), makeEtat()),
    ).toThrow(MissingDecisionError)
  })

  test('MissingDecisionError si un identifiant de decision manque', () => {
    const decision = makeDecision({ attitude: '' })
    expect(() =>
      buildPrompt(makePlayerMessage(), decision, makeRessenti(), makeFiches(), makeEtat()),
    ).toThrow(MissingDecisionError)
  })

  test('MissingFichePersonnageError si fiche personnage absente', () => {
    const fiches = makeFiches({ personnage: undefined })
    expect(() =>
      buildPrompt(makePlayerMessage(), makeDecision(), makeRessenti(), fiches, makeEtat()),
    ).toThrow(MissingFichePersonnageError)
  })

  test('les erreurs specialisees heritent de PromptError', () => {
    expect(new MissingDecisionError('x')).toBeInstanceOf(PromptError)
    expect(new MissingFichePersonnageError('x')).toBeInstanceOf(PromptError)
    expect(new MissingDecisionError('x')).toBeInstanceOf(Error)
  })

  test('produit un prompt valide meme sans univers ni aventure', () => {
    const fiches = { personnage: { nom: 'Aldric' } }
    const prompt = buildPrompt(
      makePlayerMessage(),
      makeDecision(),
      makeRessenti(),
      fiches,
      makeEtat(),
    )
    expect(prompt.systeme).toContain('Aldric')
    expect(prompt.instruction.length).toBeGreaterThan(0)
  })
})
