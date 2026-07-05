/**
 * api/index.js
 *
 * Responsabilite unique : passerelle entre le Prompt generique de Gabida et un provider IA.
 *
 * Question : "Comment l'IA produit la reponse ?"
 *
 * Ce module est un adaptateur pur. Il ne contient aucune logique narrative.
 * Il ne sait pas ce que le prompt signifie.
 * Il ne sait pas ce que la reponse signifie.
 * Il convertit, transporte, normalise.
 *
 * Principe Rafale : Gabida n'est jamais concu pour les capacites technologiques du moment.
 * api/ est le seul module autorise a connaitre les providers IA.
 * Tous les autres modules ignorent totalement leur existence.
 *
 * Specification §9 : Le moteur ne depend jamais d'un fournisseur d'IA.
 *
 * Pipeline interne :
 *   callProvider(prompt, config)
 *     → construire ContexteApi (ctx)
 *     → preparerMessages(ctx)          pure, independante
 *     → preparerParametres(ctx)        pure, independante
 *     → executerAppel(ctx, ...)        async, seul effet de bord autorise
 *     → normaliserReponse(ctx, ...)    pure
 *     → ReponseIA
 *
 * Fonctions publiques (exception documentee au Pattern Module) :
 *   - callProvider    : passerelle principale du cycle
 *   - registerProvider : injection de dependance, appelee avant le cycle
 *
 * Le registre des adaptateurs est formalise par la classe ProviderRegistry
 * (api/ProviderRegistry.js). registerProvider/getProviders/callProvider ne sont
 * que de fines facades au-dessus de cet unique registre interne. La semantique
 * est stricte : un doublon de nom leve ProviderAlreadyRegisteredError et un
 * provider absent leve ProviderNotFoundError.
 *
 * Axiome applicable : Toute evolution doit etre explicable (Axiome 19).
 *
 * @module api
 */

import { ROLES_MESSAGE_INTERNE } from '../constants/RolesMessageInterne.js'
import { ProviderRegistry } from './ProviderRegistry.js'

// ─── Registre interne ────────────────────────────────────────────────────────

/**
 * Registre unique des adaptateurs enregistres par l'application hote.
 * Cle : identifiant provider (valeur de PROVIDERS). Valeur : fonction Adaptateur.
 *
 * @type {ProviderRegistry}
 */
const _registre = new ProviderRegistry()

// ─── Types internes ───────────────────────────────────────────────────────────

/**
 * @typedef {object} ContexteApi
 *
 * Objet immutable construit une seule fois dans callProvider.
 * Transmis a toutes les sous-fonctions. Aucune sous-fonction ne le modifie.
 *
 * @property {import('../types/Prompt.js').Prompt} prompt
 * @property {ProviderConfig} config
 * @property {string} nomProvider   -- Raccourci : config.provider
 * @property {Adaptateur} adaptateur -- Resolu depuis le registre une seule fois
 * @property {number} debutMs        -- Date.now() au moment de la construction
 * @property {string} systeme        -- Raccourci : prompt.systeme
 * @property {import('../types/Prompt.js').MessageHistorique[]} historique -- Raccourci : prompt.historique
 * @property {string} instruction    -- Raccourci : prompt.instruction
 */

/**
 * @typedef {object} MessageInterne
 *
 * Format interne de message utilise par api/ et les adaptateurs.
 * Independant de tout provider.
 *
 * @property {string} role    -- Valeur de ROLES_MESSAGE_INTERNE
 * @property {string} contenu -- Texte du message
 */

/**
 * @typedef {object} ParametresExecution
 *
 * Parametres d'execution normalises, independants du provider.
 * Chaque adaptateur les traduit en parametres techniques de son provider.
 *
 * @property {string} modele   -- Identifiant du modele
 * @property {number} timeout  -- Duree maximale en ms (defaut : 30000)
 * @property {object} options  -- Options supplementaires libres
 */

/**
 * @typedef {object} ReponseRaw
 *
 * Reponse normalisee retournee par tout adaptateur.
 * Format interne commun — independant du provider.
 *
 * @property {string} texte          -- Texte brut produit par le LLM
 * @property {number} tokensEntree   -- Tokens envoyes
 * @property {number} tokensSortie   -- Tokens recus
 */

/**
 * @typedef {Function} Adaptateur
 *
 * Contrat de tout adaptateur enregistrable dans api/.
 *
 * @param {MessageInterne[]} messages
 * @param {ParametresExecution} parametres
 * @param {ProviderConfig} config
 * @returns {Promise<ReponseRaw>}
 */

/**
 * @typedef {object} ProviderConfig
 *
 * Configuration du provider injectee par l'application hote.
 *
 * @property {string} provider  -- Valeur de PROVIDERS
 * @property {string} cleApi    -- Cle API — jamais loguee
 * @property {string} modele    -- Identifiant du modele
 * @property {number} [timeout] -- Optionnel. Defaut : 30000
 * @property {object} [options] -- Optionnel. Options libres
 */

// ─── Sous-fonctions internes ──────────────────────────────────────────────────

/**
 * preparerMessages(ctx)
 *
 * Pure. Convertit les champs narratifs du Prompt en tableau de MessageInterne.
 * Format independant du provider — l'adaptateur traduit ensuite.
 *
 * @param {ContexteApi} ctx
 * @returns {MessageInterne[]}
 */
export function preparerMessages(ctx) {
  const messages = [
    { role: ROLES_MESSAGE_INTERNE.SYSTEM, contenu: ctx.systeme },
  ]

  for (const msg of ctx.historique) {
    messages.push({ role: msg.role, contenu: msg.contenu })
  }

  messages.push({ role: ROLES_MESSAGE_INTERNE.USER, contenu: ctx.instruction })

  return messages
}

/**
 * preparerParametres(ctx)
 *
 * Pure. Extrait et normalise les parametres d'execution depuis ctx.config.
 * Applique les valeurs par defaut pour les champs optionnels manquants.
 *
 * @param {ContexteApi} ctx
 * @returns {ParametresExecution}
 */
export function preparerParametres(ctx) {
  return {
    modele  : ctx.config.modele,
    timeout : ctx.config.timeout ?? 30000,
    options : ctx.config.options ?? {},
  }
}

/**
 * executerAppel(ctx, messages, parametres)
 *
 * Async. Seul effet de bord autorise dans le module.
 * Delegue a l'adaptateur enregistre.
 * Ne contient aucune logique narrative.
 *
 * @param {ContexteApi} ctx
 * @param {MessageInterne[]} messages
 * @param {ParametresExecution} parametres
 * @returns {Promise<ReponseRaw>}
 */
export async function executerAppel(ctx, messages, parametres) {
  return ctx.adaptateur(messages, parametres, ctx.config)
}

/**
 * normaliserReponse(ctx, reponseRaw)
 *
 * Pure. Construit le ReponseIA officiel depuis la reponse brute de l'adaptateur.
 * Calcule la duree du transport depuis ctx.debutMs.
 *
 * @param {ContexteApi} ctx
 * @param {ReponseRaw} reponseRaw
 * @returns {import('../types/ReponseIA.js').ReponseIA}
 */
export function normaliserReponse(ctx, reponseRaw) {
  return {
    texte : reponseRaw.texte,
    meta  : {
      provider      : ctx.nomProvider,
      tokensEntree  : reponseRaw.tokensEntree,
      tokensSortie  : reponseRaw.tokensSortie,
      dureeMs       : Date.now() - ctx.debutMs,
    },
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * callProvider(prompt, config)
 *
 * Passerelle principale du cycle.
 * Transforme un Prompt generique en ReponseIA via le provider enregistre.
 *
 * Ne contient aucune logique narrative.
 * Ne modifie jamais prompt.
 * Le provider doit etre enregistre via registerProvider() avant l'appel.
 *
 * @param {import('../types/Prompt.js').Prompt} prompt
 * @param {ProviderConfig} config
 * @returns {Promise<import('../types/ReponseIA.js').ReponseIA>}
 */
export async function callProvider(prompt, config) {
  const adaptateur = _registre.get(config.provider)

  const ctx = Object.freeze({
    prompt,
    config,
    nomProvider  : config.provider,
    adaptateur,
    debutMs      : Date.now(),
    systeme      : prompt.systeme,
    historique   : prompt.historique,
    instruction  : prompt.instruction,
  })

  const messages    = preparerMessages(ctx)
  const parametres  = preparerParametres(ctx)
  const reponseRaw  = await executerAppel(ctx, messages, parametres)

  return normaliserReponse(ctx, reponseRaw)
}

/**
 * registerProvider(nom, adaptateur)
 *
 * Enregistre un adaptateur LLM dans le registre interne.
 * Appelee par l'application hote avant le premier cycle.
 * Leve ProviderAlreadyRegisteredError si le nom est deja enregistre (aucun
 * ecrasement silencieux) et InvalidProviderError si l'adaptateur n'est pas une
 * fonction.
 *
 * Le moteur Gabida ne connait jamais directement OpenAI, Anthropic, Gemini
 * ou tout autre provider — uniquement des adaptateurs enregistres ici.
 *
 * @param {string} nom           -- Valeur de PROVIDERS
 * @param {Adaptateur} adaptateur
 * @returns {void}
 * @throws {import('./ProviderError.js').InvalidProviderError}
 * @throws {import('./ProviderError.js').ProviderAlreadyRegisteredError}
 */
export function registerProvider(nom, adaptateur) {
  _registre.register(nom, adaptateur)
}

/**
 * getProviders()
 *
 * Retourne la liste des noms de providers actuellement enregistres.
 * Utile pour les tests et le debug — pas pour la logique du cycle.
 *
 * @returns {string[]}
 */
export function getProviders() {
  return _registre.list()
}

// ─── Re-exports ────────────────────────────────────────────────────────────────

export { ProviderRegistry } from './ProviderRegistry.js'
export {
  ProviderError,
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
  InvalidProviderError,
} from './ProviderError.js'
