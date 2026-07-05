/**
 * core/stages/__tests__/CognitivePipeline.test.js
 *
 * Tests du Sprint 26 — branchement de la chaine cognitive complete :
 *   Analyse -> Influences -> Ressenti -> Decision -> Prompt -> Provider
 *
 * Principe de verification : chaque stage est un pur adaptateur — sa sortie est
 * STRICTEMENT egale a l'appel direct de la fonction metier correspondante
 * (preuve qu'aucun algorithme n'est modifie). L'integration produit le premier
 * dialogue complet, deterministe, via SimulationProvider (sans reseau).
 */

import { RessentiStage } from '../RessentiStage.js'
import { DecisionStage } from '../DecisionStage.js'
import { PromptStage }   from '../PromptStage.js'
import { ProviderStage } from '../ProviderStage.js'
import { buildNarrativePipeline } from '../NarrativePipeline.js'
import { STAGE_KEYS, STAGE_NAMES } from '../StageKeys.js'
import { MissingContextInputError } from '../StageError.js'

import { Context }         from '../../context/Context.js'
import { Runtime }         from '../../runtime/Runtime.js'

import { analyzeEvent }      from '../../../analyse/index.js'
import { computeInfluences } from '../../../influences/index.js'
import { computeRessenti }   from '../../../ressenti/index.js'
import { computeDecision }   from '../../../decision/index.js'
import { buildPrompt }       from '../../../prompt/index.js'
import { registerProvider, createSimulationProvider, SIMULATION_MODES } from '../../../api/index.js'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PROVIDER_SIM = 'sim-sprint26'

beforeAll(() => {
  registerProvider(PROVIDER_SIM, createSimulationProvider({ mode: SIMULATION_MODES.SUCCESS }))
})

const playerMessage = { texte: 'Pourquoi ressens-tu de la colere ?', tour: 1, sessionId: 's1', timestamp: 0 }

const fiches = {
  personnage: { nom: 'Aldric', criteres: { emotions: 0.8, communication: 0.5 }, capaciteMemoire: 20 },
  aventure:   { dureeEstimee: 20, lieuDepart: 'Taverne' },
  univers:    { nom: 'Hadelas' },
  joueur:     { nom: 'Joueur' },
  memoire:    {},
}

const etat = {
  sessionId    : 's1',
  tourCourant  : 1,
  memoireVecue : { souvenirs: [] },
  historique   : [],
  meta         : { lieuCourant: 'Taverne', langue: 'fr' },
}

const providerConfig = { provider: PROVIDER_SIM, cleApi: 'x', modele: 'sim-model' }

function contexteEntree() {
  return new Context({
    [STAGE_KEYS.PLAYER_MESSAGE]  : playerMessage,
    [STAGE_KEYS.FICHES]          : fiches,
    [STAGE_KEYS.ETAT]            : etat,
    [STAGE_KEYS.PROVIDER_CONFIG] : providerConfig,
  })
}

// Etats intermediaires calcules directement (references d'egalite).
const evenementRef        = analyzeEvent(playerMessage, fiches, etat)
const filtreRef           = computeInfluences(evenementRef, fiches, etat)
const ressentiRef         = computeRessenti(evenementRef, filtreRef)
const decisionRef         = computeDecision(evenementRef, ressentiRef, fiches, etat)
const promptRef           = buildPrompt(playerMessage, decisionRef, ressentiRef, fiches, etat)

function contexteApresInfluences() {
  return new Context({
    [STAGE_KEYS.PLAYER_MESSAGE]  : playerMessage,
    [STAGE_KEYS.FICHES]          : fiches,
    [STAGE_KEYS.ETAT]            : etat,
    [STAGE_KEYS.PROVIDER_CONFIG] : providerConfig,
    [STAGE_KEYS.EVENEMENT]       : evenementRef,
    [STAGE_KEYS.FILTRE_RELATIONNEL] : filtreRef,
    [STAGE_KEYS.RESSENTI]        : ressentiRef,
    [STAGE_KEYS.DECISION]        : decisionRef,
    [STAGE_KEYS.PROMPT]          : promptRef,
  })
}

// ─── RessentiStage ─────────────────────────────────────────────────────────────

describe('RessentiStage', () => {
  test('porte le nom "ressenti"', () => {
    expect(new RessentiStage().name).toBe(STAGE_NAMES.RESSENTI)
  })

  test('ecrit un Ressenti identique a computeRessenti (algorithme inchange)', async () => {
    const sortie = await new RessentiStage().execute(contexteApresInfluences())
    expect(sortie.get(STAGE_KEYS.RESSENTI)).toEqual(computeRessenti(evenementRef, filtreRef))
  })

  test('ne mute pas le Context recu (write-as-copy)', async () => {
    const entree = new Context({
      [STAGE_KEYS.EVENEMENT]: evenementRef,
      [STAGE_KEYS.FILTRE_RELATIONNEL]: filtreRef,
    })
    const sortie = await new RessentiStage().execute(entree)
    expect(entree.has(STAGE_KEYS.RESSENTI)).toBe(false)
    expect(sortie.has(STAGE_KEYS.RESSENTI)).toBe(true)
    expect(sortie).not.toBe(entree)
  })

  test('leve MissingContextInputError si filtreRelationnel absent', async () => {
    const ctx = new Context({ [STAGE_KEYS.EVENEMENT]: evenementRef })
    await expect(new RessentiStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })
})

// ─── DecisionStage ─────────────────────────────────────────────────────────────

describe('DecisionStage', () => {
  test('porte le nom "decision"', () => {
    expect(new DecisionStage().name).toBe(STAGE_NAMES.DECISION)
  })

  test('ecrit une Decision identique a computeDecision (algorithme inchange)', async () => {
    const sortie = await new DecisionStage().execute(contexteApresInfluences())
    expect(sortie.get(STAGE_KEYS.DECISION)).toEqual(computeDecision(evenementRef, ressentiRef, fiches, etat))
  })

  test('ne lit jamais le filtreRelationnel (absorbe par ressenti)', async () => {
    // Sans filtreRelationnel dans le Context, DecisionStage doit tout de meme reussir.
    const ctx = new Context({
      [STAGE_KEYS.EVENEMENT] : evenementRef,
      [STAGE_KEYS.RESSENTI]  : ressentiRef,
      [STAGE_KEYS.FICHES]    : fiches,
      [STAGE_KEYS.ETAT]      : etat,
    })
    const sortie = await new DecisionStage().execute(ctx)
    expect(sortie.get(STAGE_KEYS.DECISION)).toEqual(decisionRef)
  })

  test('leve MissingContextInputError si ressenti absent', async () => {
    const ctx = new Context({
      [STAGE_KEYS.EVENEMENT]: evenementRef, [STAGE_KEYS.FICHES]: fiches, [STAGE_KEYS.ETAT]: etat,
    })
    await expect(new DecisionStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })
})

// ─── PromptStage ───────────────────────────────────────────────────────────────

describe('PromptStage', () => {
  test('porte le nom "prompt"', () => {
    expect(new PromptStage().name).toBe(STAGE_NAMES.PROMPT)
  })

  test('ecrit un Prompt identique a buildPrompt (algorithme inchange)', async () => {
    const sortie = await new PromptStage().execute(contexteApresInfluences())
    expect(sortie.get(STAGE_KEYS.PROMPT))
      .toEqual(buildPrompt(playerMessage, decisionRef, ressentiRef, fiches, etat))
  })

  test('leve MissingContextInputError si decision absente', async () => {
    const ctx = new Context({
      [STAGE_KEYS.PLAYER_MESSAGE]: playerMessage, [STAGE_KEYS.RESSENTI]: ressentiRef,
      [STAGE_KEYS.FICHES]: fiches, [STAGE_KEYS.ETAT]: etat,
    })
    await expect(new PromptStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })
})

// ─── ProviderStage ─────────────────────────────────────────────────────────────

describe('ProviderStage', () => {
  test('porte le nom "provider"', () => {
    expect(new ProviderStage().name).toBe(STAGE_NAMES.PROVIDER)
  })

  test('ecrit une ReponseIA produite par callProvider', async () => {
    const sortie = await new ProviderStage().execute(contexteApresInfluences())
    const reponse = sortie.get(STAGE_KEYS.REPONSE_IA)
    expect(typeof reponse.texte).toBe('string')
    expect(reponse.texte.length).toBeGreaterThan(0)
    expect(reponse.meta.provider).toBe(PROVIDER_SIM)
  })

  test('leve MissingContextInputError si prompt absent', async () => {
    const ctx = new Context({ [STAGE_KEYS.PROVIDER_CONFIG]: providerConfig })
    await expect(new ProviderStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })

  test('leve MissingContextInputError si providerConfig absent', async () => {
    const ctx = new Context({ [STAGE_KEYS.PROMPT]: promptRef })
    await expect(new ProviderStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })
})

// ─── Integration : premier dialogue complet ─────────────────────────────────────

describe('Pipeline cognitif complet (buildNarrativePipeline)', () => {
  test('assemble les 6 stages dans l ordre canonique', () => {
    const pipeline = buildNarrativePipeline()
    expect(pipeline.size()).toBe(6)
    expect(pipeline.getAll().map((s) => s.name)).toEqual([
      STAGE_NAMES.ANALYSE,
      STAGE_NAMES.INFLUENCES,
      STAGE_NAMES.RESSENTI,
      STAGE_NAMES.DECISION,
      STAGE_NAMES.PROMPT,
      STAGE_NAMES.PROVIDER,
    ])
  })

  test('message joueur -> ... -> reponse IA (bout en bout)', async () => {
    const final = await buildNarrativePipeline().execute(contexteEntree())

    expect(final.get(STAGE_KEYS.EVENEMENT)).toEqual(evenementRef)
    expect(final.get(STAGE_KEYS.FILTRE_RELATIONNEL)).toEqual(filtreRef)
    expect(final.get(STAGE_KEYS.RESSENTI)).toEqual(ressentiRef)
    expect(final.get(STAGE_KEYS.DECISION)).toEqual(decisionRef)
    expect(final.get(STAGE_KEYS.PROMPT)).toEqual(promptRef)

    const reponse = final.get(STAGE_KEYS.REPONSE_IA)
    expect(reponse.texte.length).toBeGreaterThan(0)
    expect(reponse.meta.provider).toBe(PROVIDER_SIM)
  })

  test('est deterministe (meme entree -> meme reponse)', async () => {
    const r1 = await buildNarrativePipeline().execute(contexteEntree())
    const r2 = await buildNarrativePipeline().execute(contexteEntree())
    expect(r1.get(STAGE_KEYS.REPONSE_IA).texte).toBe(r2.get(STAGE_KEYS.REPONSE_IA).texte)
    expect(r1.get(STAGE_KEYS.DECISION)).toEqual(r2.get(STAGE_KEYS.DECISION))
  })

  test('ne mute pas le Context d entree', async () => {
    const entree = contexteEntree()
    await buildNarrativePipeline().execute(entree)
    expect(entree.has(STAGE_KEYS.REPONSE_IA)).toBe(false)
    expect(entree.has(STAGE_KEYS.EVENEMENT)).toBe(false)
  })
})

// ─── Integration Runtime ─────────────────────────────────────────────────────────

describe('Runtime.execute : chaine cognitive complete', () => {
  test('produit une reponse IA via le Runtime', async () => {
    const runtime = new Runtime({ pipeline: buildNarrativePipeline() })
    await runtime.start()
    const final = await runtime.execute(contexteEntree())
    await runtime.stop()

    expect(final.get(STAGE_KEYS.REPONSE_IA).texte.length).toBeGreaterThan(0)
    expect(final.get(STAGE_KEYS.PROMPT).systeme).toContain('Aldric')
  })
})
