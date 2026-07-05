/**
 * api/providers/simulation.js
 *
 * Provider IA entierement deterministe pour le developpement et les tests.
 *
 * Responsabilite : fournir un adaptateur conforme au contrat Adaptateur de api/,
 * sans aucun acces reseau, sans cle API, et 100 % deterministe : une meme entree
 * produit toujours exactement la meme sortie.
 *
 * Il permet de faire tourner tout le cycle de Gabida sans provider externe.
 *
 * Comme tout adaptateur, il s'enregistre via le ProviderRegistry exactement
 * comme OpenAI :
 *   import { registerProvider }          from '../index.js'
 *   import { simulationProvider }        from './simulation.js'
 *   import { PROVIDERS }                 from '../../constants/Providers.js'
 *   registerProvider(PROVIDERS.SIMULATION, simulationProvider)
 *
 * Le scenario est fige a la creation du provider (Option A) via une factory :
 *   registerProvider('sim-error', createSimulationProvider({ mode: SIMULATION_MODES.ERROR }))
 *
 * Ce fichier ne contient aucune logique metier narrative : les modes sont
 * purement techniques (succes, reponse vide, refus fixe, erreur).
 *
 * Aucune dependance sur core/, sur le Runtime, ni sur un provider reel.
 *
 * @module api/providers/simulation
 */

// ─── Modes de simulation ──────────────────────────────────────────────────────

/**
 * Scenarios techniques supportes par le SimulationProvider.
 * Aucun n'introduit de logique metier.
 */
export const SIMULATION_MODES = Object.freeze({
  SUCCESS : 'success',   // reponse deterministe derivee de l'entree
  EMPTY   : 'empty',     // reponse au texte vide
  REFUSAL : 'refusal',   // refus fixe et stable
  ERROR   : 'error',     // leve une SimulationProviderError
})

const REFUSAL_TEXT = '[simulation] Requete refusee.'

// ─── Erreur typee dediee ──────────────────────────────────────────────────────

export class SimulationProviderError extends Error {
  /** @param {string} [message] */
  constructor(message = 'Echec simule par le SimulationProvider.') {
    super(message)
    this.name = 'SimulationProviderError'
  }
}

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * dernierMessageUtilisateur(messages)
 *
 * Pure. Retourne le contenu du dernier message de la liste (l'instruction),
 * ou une chaine vide si la liste est vide.
 *
 * @param {import('../index.js').MessageInterne[]} messages
 * @returns {string}
 */
function dernierMessageUtilisateur(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return ''
  return messages[messages.length - 1].contenu ?? ''
}

/**
 * compterCaracteres(messages)
 *
 * Pure. Somme deterministe de la longueur des contenus (proxy stable de "tokens").
 *
 * @param {import('../index.js').MessageInterne[]} messages
 * @returns {number}
 */
function compterCaracteres(messages) {
  if (!Array.isArray(messages)) return 0
  return messages.reduce((total, msg) => total + (msg.contenu?.length ?? 0), 0)
}

/**
 * construireReponse(mode, messages)
 *
 * Pure. Construit la ReponseRaw deterministe correspondant au mode.
 *
 * @param {string} mode
 * @param {import('../index.js').MessageInterne[]} messages
 * @returns {import('../index.js').ReponseRaw}
 */
function construireReponse(mode, messages) {
  const tokensEntree = compterCaracteres(messages)

  if (mode === SIMULATION_MODES.EMPTY) {
    return { texte: '', tokensEntree, tokensSortie: 0 }
  }

  if (mode === SIMULATION_MODES.REFUSAL) {
    return { texte: REFUSAL_TEXT, tokensEntree, tokensSortie: REFUSAL_TEXT.length }
  }

  // SUCCESS : echo deterministe de l'instruction.
  const texte = `[simulation:success] ${dernierMessageUtilisateur(messages)}`
  return { texte, tokensEntree, tokensSortie: texte.length }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createSimulationProvider(options)
 *
 * Cree un adaptateur de simulation dont le scenario est fige a la creation.
 * L'adaptateur retourne est conforme au contrat Adaptateur de api/ :
 *   (messages, parametres, config) => Promise<ReponseRaw>
 *
 * @param {object} [options]
 * @param {string} [options.mode] -- Valeur de SIMULATION_MODES. Defaut : SUCCESS.
 * @returns {import('../index.js').Adaptateur}
 * @throws {SimulationProviderError} -- si le mode demande est inconnu
 */
export function createSimulationProvider({ mode = SIMULATION_MODES.SUCCESS } = {}) {
  const modes = Object.values(SIMULATION_MODES)
  if (!modes.includes(mode)) {
    throw new SimulationProviderError(
      `Mode de simulation inconnu : "${mode}". Modes valides : ${modes.join(', ')}.`
    )
  }

  /**
   * @param {import('../index.js').MessageInterne[]} messages
   * @param {import('../index.js').ParametresExecution} _parametres
   * @param {import('../index.js').ProviderConfig} _config
   * @returns {Promise<import('../index.js').ReponseRaw>}
   */
  return async function simulationAdapter(messages, _parametres, _config) {
    if (mode === SIMULATION_MODES.ERROR) {
      throw new SimulationProviderError()
    }
    return construireReponse(mode, messages)
  }
}

// ─── Provider par defaut ──────────────────────────────────────────────────────

/**
 * Adaptateur de simulation par defaut (mode SUCCESS).
 * S'enregistre exactement comme OpenAI :
 *   registerProvider(PROVIDERS.SIMULATION, simulationProvider)
 *
 * @type {import('../index.js').Adaptateur}
 */
export const simulationProvider = createSimulationProvider()
