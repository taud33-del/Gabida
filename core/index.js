/**
 * core/index.js
 *
 * Point d'entree officiel du moteur Gabida.
 * Responsabilite unique : coordonner l'execution complete d'un tour narratif.
 *
 * Question : "Dans quel ordre les modules doivent-ils etre executes
 *             pour produire un nouveau tour de dialogue ?"
 *
 * Ce module ne contient aucune logique metier.
 * Il appelle uniquement les interfaces publiques des modules.
 * Toutes les decisions restent prises dans leurs modules respectifs.
 *
 * Cycle v1.0 — chaque etape repond a une seule question :
 *
 *   1. analyse/    — Que dit le joueur ?                          → Evenement
 *   2. influences/ — Quelles informations influencent le personnage ? → FiltreRelationnel
 *   3. ressenti/   — Que ressent le personnage ?                  → Ressenti
 *   4. decision/   — Que decide le personnage ?                   → Decision
 *   5. prompt/     — Comment exprime-t-il cette decision ?        → Prompt
 *   6. api/        — Comment l'IA produit la reponse ?            → ReponseIA
 *   7. memoire/    — Que faut-il conserver de cette interaction ?  → MiseAJourMemoire
 *
 * Regle absolue : FiltreRelationnel est consomme par ressenti/
 *                 et n'est JAMAIS transmis a decision/ ni a buildPrompt/.
 *
 * Axiome 19 : Toute evolution doit etre explicable.
 *             TurnResult contient toutes les sorties intermediaires pour l'audit.
 *
 * @module core
 */

import { analyzeEvent }      from '../analyse/index.js'
import { computeInfluences } from '../influences/index.js'
import { computeRessenti }   from '../ressenti/index.js'
import { computeDecision }   from '../decision/index.js'
import { buildPrompt }       from '../prompt/index.js'
import { callProvider }      from '../api/index.js'
import { updateMemory, appliquerMiseAJour } from '../memoire/index.js'
import { ajouterEchange }    from '../conversation/index.js'

// ─── Erreurs ─────────────────────────────────────────────────────────────────

/**
 * Erreur de base du moteur Gabida.
 * Ne pas instancier directement — utiliser les sous-classes.
 */
export class ErreurGabida extends Error {
  constructor(message) {
    super(message)
    this.name = 'ErreurGabida'
  }
}

/**
 * Precondition d'entree non respectee (donnees invalides ou manquantes).
 * Levee avant le debut du pipeline.
 */
export class ErreurValidation extends ErreurGabida {
  constructor(message) {
    super(message)
    this.name = 'ErreurValidation'
  }
}

/**
 * Echec d'un module interne pendant le pipeline.
 * Contient le nom de l'etape fautive pour la tracabilite.
 */
export class ErreurPipeline extends ErreurGabida {
  /**
   * @param {string} etape -- Nom de l'etape (ex. : 'computeRessenti')
   * @param {Error} cause  -- Erreur originale
   */
  constructor(etape, cause) {
    super(`Echec etape ${etape} : ${cause.message}`)
    this.name  = 'ErreurPipeline'
    this.etape = etape
    this.cause = cause
  }
}

/**
 * Echec de l'appel au provider IA (reseau, quota, timeout, HTTP).
 */
export class ErreurProvider extends ErreurGabida {
  constructor(message, cause) {
    super(message)
    this.name  = 'ErreurProvider'
    this.cause = cause
  }
}

// ─── Types internes ───────────────────────────────────────────────────────────

/**
 * @typedef {object} TurnResult
 *
 * Resultat complet d'un tour de dialogue.
 * Retourne par executeTurn a l'application hote.
 * Toutes les proprietes sont obligatoires.
 *
 * @property {string} action
 *   Action narrative produite par le personnage.
 *
 * @property {string} dialogue
 *   Paroles prononcees par le personnage.
 *
 * @property {import('../types/Etat.js').Etat} etatMisAJour
 *   Nouvel etat complet apres mise a jour memoire, historique et tour.
 *
 * @property {import('../types/Evenement.js').Evenement} evenement
 *   Resultat du module analyse/ — audit et tracabilite.
 *
 * @property {import('../types/FiltreRelationnel.js').FiltreRelationnel} filtreRelationnel
 *   Resultat du module influences/ — audit uniquement, jamais reinjecte.
 *
 * @property {import('../types/Ressenti.js').Ressenti} ressenti
 *   Resultat du module ressenti/.
 *
 * @property {import('../types/Decision.js').Decision} decision
 *   Resultat du module decision/.
 *
 * @property {import('../types/ReponseIA.js').ReponseIA} reponseIA
 *   Resultat structure du module api/ (action, dialogue + meta transport).
 *
 * @property {import('../memoire/types.js').MiseAJourMemoire} miseAJourMemoire
 *   Resultat du module memoire/ (ajoutes, oublies, conserves).
 */

// ─── Sous-fonctions d'orchestration ──────────────────────────────────────────

/**
 * preparerTour(playerMessage, fiches, etat)
 *
 * Valide les preconditions d'entree strictes avant le pipeline.
 * Leve ErreurValidation si une condition n'est pas respectee.
 * Ne contient aucune logique metier.
 *
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 * @param {object} fiches
 * @param {import('../types/Etat.js').Etat} etat
 * @returns {{ playerMessage: object, fiches: object, etat: object }}
 */
export function preparerTour(playerMessage, fiches, etat) {
  if (!playerMessage || typeof playerMessage.texte !== 'string' || playerMessage.texte.trim() === '') {
    throw new ErreurValidation('core.preparerTour : playerMessage.texte est absent ou vide.')
  }

  if (!playerMessage.sessionId) {
    throw new ErreurValidation('core.preparerTour : playerMessage.sessionId est absent.')
  }

  if (!etat) {
    throw new ErreurValidation('core.preparerTour : etat est absent.')
  }

  if (playerMessage.sessionId !== etat.sessionId) {
    throw new ErreurValidation(
      `core.preparerTour : sessionId incoherent — ` +
      `playerMessage.sessionId="${playerMessage.sessionId}" ` +
      `etat.sessionId="${etat.sessionId}".`
    )
  }

  if (!fiches || typeof fiches !== 'object') {
    throw new ErreurValidation('core.preparerTour : fiches est absent.')
  }

  const fichesCles = ['personnage', 'aventure', 'univers', 'joueur', 'memoire']
  for (const cle of fichesCles) {
    if (!fiches[cle]) {
      throw new ErreurValidation(`core.preparerTour : fiche "${cle}" manquante.`)
    }
  }

  return { playerMessage, fiches, etat }
}

/**
 * executerPipeline(playerMessage, fiches, etat, providerConfig)
 *
 * Enchaine les 7 modules dans l'ordre strict du cycle Gabida.
 * Chaque resultat est transmis aux etapes suivantes selon le contrat de donnees.
 * Aucune logique metier. Leve ErreurPipeline ou ErreurProvider si un module echoue.
 *
 * Regle absolue : filtreRelationnel n'est transmis qu'a computeRessenti.
 *
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 * @param {object} fiches
 * @param {import('../types/Etat.js').Etat} etat
 * @param {import('../api/index.js').ProviderConfig} providerConfig
 * @returns {Promise<object>}
 */
export async function executerPipeline(playerMessage, fiches, etat, providerConfig) {
  let evenement
  try {
    evenement = analyzeEvent(playerMessage, fiches, etat)
  } catch (e) {
    throw new ErreurPipeline('analyzeEvent', e)
  }

  let filtreRelationnel
  try {
    filtreRelationnel = computeInfluences(evenement, fiches, etat)
  } catch (e) {
    throw new ErreurPipeline('computeInfluences', e)
  }

  let ressenti
  try {
    ressenti = computeRessenti(evenement, filtreRelationnel, fiches, etat)
  } catch (e) {
    throw new ErreurPipeline('computeRessenti', e)
  }

  let decision
  try {
    decision = computeDecision(evenement, ressenti, fiches, etat)
  } catch (e) {
    throw new ErreurPipeline('computeDecision', e)
  }

  let prompt
  try {
    prompt = buildPrompt(playerMessage, decision, ressenti, fiches, etat)
  } catch (e) {
    throw new ErreurPipeline('buildPrompt', e)
  }

  let reponseIA
  try {
    reponseIA = await callProvider(prompt, providerConfig)
  } catch (e) {
    if (e.name === 'ErreurProvider') throw e
    throw new ErreurProvider(`Echec appel provider : ${e.message}`, e)
  }

  let miseAJourMemoire
  try {
    miseAJourMemoire = updateMemory(evenement, decision, reponseIA, fiches, etat)
  } catch (e) {
    throw new ErreurPipeline('updateMemory', e)
  }

  return { evenement, filtreRelationnel, ressenti, decision, prompt, reponseIA, miseAJourMemoire }
}

/**
 * mettreAJourEtat(etat, reponseIA, miseAJourMemoire, playerMessage)
 *
 * Construit un NOUVEL objet Etat depuis l'etat precedent.
 * Ne modifie jamais l'objet etat recu.
 *
 * Operations (assemblage uniquement — chaque logique vit dans son module) :
 *   1. memoireVecue : delegue a memoire.appliquerMiseAJour(miseAJourMemoire)
 *   2. historique   : delegue a conversation.ajouterEchange(...)
 *   3. Incrementer tourCourant
 *
 * @param {import('../types/Etat.js').Etat} etat
 * @param {import('../types/ReponseIA.js').ReponseIA} reponseIA
 * @param {import('../memoire/types.js').MiseAJourMemoire} miseAJourMemoire
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 * @returns {import('../types/Etat.js').Etat}
 */
export function mettreAJourEtat(etat, reponseIA, miseAJourMemoire, playerMessage) {
  return {
    ...etat,
    tourCourant  : etat.tourCourant + 1,
    historique   : ajouterEchange(etat.historique, playerMessage, reponseIA),
    memoireVecue : appliquerMiseAJour(miseAJourMemoire),
  }
}

/**
 * construireResultat(reponseIA, etatMisAJour, pipeline)
 *
 * Aucune logique. Assemble TurnResult depuis toutes les sorties du pipeline.
 *
 * @param {import('../types/ReponseIA.js').ReponseIA} reponseIA
 * @param {import('../types/Etat.js').Etat} etatMisAJour
 * @param {object} pipeline -- Sorties de executerPipeline
 * @returns {TurnResult}
 */
export function construireResultat(reponseIA, etatMisAJour, pipeline) {
  return {
    action            : reponseIA.action,
    dialogue          : reponseIA.dialogue,
    etatMisAJour,
    evenement        : pipeline.evenement,
    filtreRelationnel: pipeline.filtreRelationnel,
    ressenti         : pipeline.ressenti,
    decision         : pipeline.decision,
    reponseIA,
    miseAJourMemoire : pipeline.miseAJourMemoire,
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * executeTurn(playerMessage, providerConfig, fiches, etat)
 *
 * Point d'entree officiel du moteur Gabida.
 * Coordonne l'execution complete d'un tour narratif.
 *
 * Ne contient aucune logique metier.
 * Appelle uniquement les interfaces publiques des modules.
 *
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 * @param {import('../api/index.js').ProviderConfig} providerConfig
 * @param {object} fiches -- Les 5 fiches chargees et validees
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {Promise<TurnResult>}
 */
export async function executeTurn(playerMessage, providerConfig, fiches, etat) {
  const entrees = preparerTour(playerMessage, fiches, etat)

  const pipeline = await executerPipeline(
    entrees.playerMessage,
    entrees.fiches,
    entrees.etat,
    providerConfig
  )

  const etatMisAJour = mettreAJourEtat(
    entrees.etat,
    pipeline.reponseIA,
    pipeline.miseAJourMemoire,
    entrees.playerMessage
  )

  return construireResultat(pipeline.reponseIA, etatMisAJour, pipeline)
}

/**
 * runCycle(input)
 *
 * Alias de compatibilite pour executeTurn.
 * Conserve la signature de l'ancienne API.
 *
 * @param {object} input
 * @param {import('../types/PlayerMessage.js').PlayerMessage} input.playerMessage
 * @param {import('../api/index.js').ProviderConfig} input.providerConfig
 * @param {object} input.fiches
 * @param {import('../types/Etat.js').Etat} input.etat
 *
 * @returns {Promise<TurnResult>}
 */
export async function runCycle(input) {
  return executeTurn(input.playerMessage, input.providerConfig, input.fiches, input.etat)
}