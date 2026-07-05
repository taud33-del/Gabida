/**
 * core/stages/__tests__/NarrativeStages.test.js
 *
 * Tests du Lot 1 de la phase metier (Sprint 22) :
 *   - AnalyseStage / InfluencesStage en tant que PipelineStage
 *   - bridge via Context (sac generique), algorithmes metier inchanges
 *   - integration Pipeline + Runtime : User -> Analyse -> Influences
 *
 * Principe de verification : la sortie d'un stage est STRICTEMENT egale a l'appel
 * direct de la fonction metier correspondante -> preuve qu'aucun algorithme n'est
 * modifie par l'adaptation.
 */

import { AnalyseStage }    from '../AnalyseStage.js'
import { InfluencesStage } from '../InfluencesStage.js'
import { STAGE_KEYS }      from '../StageKeys.js'
import { MissingContextInputError } from '../StageError.js'

import { Context }         from '../../context/Context.js'
import { PipelineBuilder } from '../../pipeline/PipelineBuilder.js'
import { Runtime }         from '../../runtime/Runtime.js'

import { analyzeEvent }     from '../../../analyse/index.js'
import { computeInfluences } from '../../../influences/index.js'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const playerMessage = { texte: 'Pourquoi ressens-tu de la colere ?', sessionId: 's1' }

const fiches = {
  personnage: { criteres: { emotions: 0.8, communication: 0.5 }, capaciteMemoire: 20 },
  aventure:   { dureeEstimee: 20, lieuDepart: 'Taverne' },
  univers:    {},
  joueur:     {},
  memoire:    {},
}

const etat = {
  sessionId    : 's1',
  tourCourant  : 1,
  memoireVecue : { souvenirs: [] },
  meta         : { lieuCourant: 'Taverne' },
}

function contexteEntree() {
  return new Context({
    [STAGE_KEYS.PLAYER_MESSAGE] : playerMessage,
    [STAGE_KEYS.FICHES]         : fiches,
    [STAGE_KEYS.ETAT]           : etat,
  })
}

// ─── AnalyseStage ─────────────────────────────────────────────────────────────

describe('AnalyseStage', () => {
  test('porte le nom "analyse"', () => {
    expect(new AnalyseStage().name).toBe('analyse')
  })

  test('ecrit un Evenement identique a analyzeEvent (algorithme inchange)', async () => {
    const stage   = new AnalyseStage()
    const sortie  = await stage.execute(contexteEntree())
    expect(sortie.get(STAGE_KEYS.EVENEMENT)).toEqual(analyzeEvent(playerMessage, fiches, etat))
  })

  test('ne mute pas le Context recu (write-as-copy)', async () => {
    const entree = contexteEntree()
    const sortie = await new AnalyseStage().execute(entree)
    expect(entree.has(STAGE_KEYS.EVENEMENT)).toBe(false)
    expect(sortie.has(STAGE_KEYS.EVENEMENT)).toBe(true)
    expect(sortie).not.toBe(entree)
  })

  test('leve MissingContextInputError si playerMessage absent', async () => {
    const ctx = new Context({ [STAGE_KEYS.FICHES]: fiches, [STAGE_KEYS.ETAT]: etat })
    await expect(new AnalyseStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })
})

// ─── InfluencesStage ──────────────────────────────────────────────────────────

describe('InfluencesStage', () => {
  test('porte le nom "influences"', () => {
    expect(new InfluencesStage().name).toBe('influences')
  })

  test('ecrit un FiltreRelationnel identique a computeInfluences (algorithme inchange)', async () => {
    const evenement = analyzeEvent(playerMessage, fiches, etat)
    const ctx = new Context({
      [STAGE_KEYS.EVENEMENT] : evenement,
      [STAGE_KEYS.FICHES]    : fiches,
      [STAGE_KEYS.ETAT]      : etat,
    })
    const sortie = await new InfluencesStage().execute(ctx)
    expect(sortie.get(STAGE_KEYS.FILTRE_RELATIONNEL))
      .toEqual(computeInfluences(evenement, fiches, etat))
  })

  test('leve MissingContextInputError si evenement absent', async () => {
    const ctx = new Context({ [STAGE_KEYS.FICHES]: fiches, [STAGE_KEYS.ETAT]: etat })
    await expect(new InfluencesStage().execute(ctx)).rejects.toThrow(MissingContextInputError)
  })
})

// ─── Integration Pipeline ──────────────────────────────────────────────────────

describe('Pipeline : Analyse -> Influences', () => {
  test('produit evenement puis filtreRelationnel dans le Context final', async () => {
    const pipeline = new PipelineBuilder()
      .add(new AnalyseStage())
      .add(new InfluencesStage())
      .build()

    const final = await pipeline.execute(contexteEntree())

    const evenementAttendu = analyzeEvent(playerMessage, fiches, etat)
    expect(final.get(STAGE_KEYS.EVENEMENT)).toEqual(evenementAttendu)
    expect(final.get(STAGE_KEYS.FILTRE_RELATIONNEL))
      .toEqual(computeInfluences(evenementAttendu, fiches, etat))
  })

  test('est deterministe (meme entree -> meme sortie)', async () => {
    const build = () => new PipelineBuilder().add(new AnalyseStage()).add(new InfluencesStage()).build()
    const r1 = await build().execute(contexteEntree())
    const r2 = await build().execute(contexteEntree())
    expect(r1.get(STAGE_KEYS.FILTRE_RELATIONNEL)).toEqual(r2.get(STAGE_KEYS.FILTRE_RELATIONNEL))
  })
})

// ─── Integration Runtime ────────────────────────────────────────────────────────

describe('Runtime.execute : Analyse -> Influences', () => {
  test('execute le pipeline narratif via le Runtime', async () => {
    const pipeline = new PipelineBuilder()
      .add(new AnalyseStage())
      .add(new InfluencesStage())
      .build()

    const runtime = new Runtime({ pipeline })
    await runtime.start()
    const final = await runtime.execute(contexteEntree())
    await runtime.stop()

    expect(final.get(STAGE_KEYS.EVENEMENT).intention).toBeDefined()
    expect(final.get(STAGE_KEYS.FILTRE_RELATIONNEL).synthese).toBeDefined()
  })
})
