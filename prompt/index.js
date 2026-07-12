/**
 * prompt/index.js
 *
 * Responsabilite unique : ASSEMBLER le prompt final destine a l'IA.
 *
 * Role (source : Cycle de Vie etape 7 + Specifications techniques §5) :
 *   - Traduire les identifiants de la Decision en langage naturel (vocabulaire).
 *   - Assembler identite + regles + directives + message du joueur en un Prompt.
 *   - Produire une structure independante du LLM cible.
 *
 * PRINCIPE FONDAMENTAL (Sprint 25) :
 *   Le module prompt n'est PAS un generateur. C'est un ASSEMBLEUR.
 *     Decision → lookup vocabulaire → assemblage → Prompt
 *   Aucune decision narrative. Aucun raisonnement. Aucune composition
 *   intelligente. Uniquement : lookup, concatenation, formatage.
 *
 * Le module prompt est la frontiere entre le moteur cognitif et le langage.
 * Il ne revele JAMAIS de mecanique interne au LLM :
 *   pas de critereId, pas de dominant, pas d'axiome, pas de poids, pas de score,
 *   pas d'identifiant interne, aucune valeur numerique.
 *
 * Specification §9 : Gabida doit pouvoir fonctionner avec n'importe quel LLM.
 * Specification §7 : le moteur ne connait jamais les criteres — uniquement leur
 *   type, famille et valeur.
 *
 * Dependances autorisees : constants/, ./vocabulaire.js, ./PromptError.js.
 * Dependances interdites : core/, api/ & providers, influences/ (filtreRelationnel),
 *   reseau, aleatoire, date.
 *
 * @module prompt
 */

import { ROLES_MESSAGE } from '../constants/RolesMessage.js'
import {
  LANGUE_DEFAUT,
  traduireObjectif,
  traduireAttitude,
  traduireDirection,
} from './vocabulaire.js'
import {
  MissingDecisionError,
  MissingFichePersonnageError,
} from './PromptError.js'

// ─── Regles de comportement fixes (langage naturel, aucune mecanique) ─────────

/**
 * Regles de comportement invariables transmises a chaque tour.
 * Textes fixes — aucun identifiant interne, aucune valeur numerique.
 * @type {readonly string[]}
 */
const REGLES_COMPORTEMENT = Object.freeze([
  'Reste toujours dans la peau de ton personnage.',
  'Ne revele jamais que tu es une intelligence artificielle.',
  'Ne mentionne aucune mecanique de jeu ni aucun rouage interne.',
  'Reponds uniquement en langage naturel, comme dans une conversation reelle.',
  'Presente toujours ta reponse en deux temps : d\'abord ton action, puis ton dialogue.',
  'Ecris ton action (un geste, une attitude, ce que tu fais ou observes) entouree d\'asterisques, par exemple : *Elle recule d\'un pas, mefiante.*',
  'Ecris ensuite tes paroles sur une nouvelle ligne, en clair : ne les entoure jamais d\'asterisques.',
  'Les asterisques servent uniquement a delimiter l\'action ; le dialogue n\'est jamais entoure d\'asterisques.',
])

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Valide la Decision fournie. Leve MissingDecisionError si absente ou si son
 * contrat minimal n'est pas respecte.
 *
 * @param {import('../types/Decision.js').Decision} decision
 * @returns {void}
 * @throws {MissingDecisionError}
 */
function validerDecision(decision) {
  if (decision === null || typeof decision !== 'object') {
    throw new MissingDecisionError('decision absente ou invalide')
  }
  if (typeof decision.objectifImmediat !== 'string' || decision.objectifImmediat === '') {
    throw new MissingDecisionError('decision.objectifImmediat absent')
  }
  if (typeof decision.attitude !== 'string' || decision.attitude === '') {
    throw new MissingDecisionError('decision.attitude absent')
  }
  if (typeof decision.directionNarrative !== 'string' || decision.directionNarrative === '') {
    throw new MissingDecisionError('decision.directionNarrative absent')
  }
}

/**
 * Valide la fiche personnage (identite requise pour le bloc systeme).
 *
 * @param {object} fiches
 * @returns {void}
 * @throws {MissingFichePersonnageError}
 */
function validerFichePersonnage(fiches) {
  if (fiches === null || typeof fiches !== 'object') {
    throw new MissingFichePersonnageError('fiches absentes')
  }
  if (fiches.personnage === null || typeof fiches.personnage !== 'object') {
    throw new MissingFichePersonnageError('fiche personnage absente')
  }
}

// ─── Assemblage (lookup + concatenation + formatage, aucune logique) ──────────

/**
 * Assemble le bloc systeme : identite + univers + contexte + regles + directives.
 * Uniquement des lookups sur les fiches et le vocabulaire, puis concatenation.
 *
 * @param {object} fiches
 * @param {import('../types/Decision.js').Decision} decision
 * @param {string} langue
 * @returns {string}
 */
function assembleSysteme(fiches, decision, langue) {
  const personnage = fiches.personnage ?? {}
  const univers = fiches.univers ?? {}
  const aventure = fiches.aventure ?? {}

  const lignes = []

  // Identite du personnage
  const nom = typeof personnage.nom === 'string' ? personnage.nom : ''
  lignes.push(nom !== '' ? `Tu es ${nom}.` : 'Tu es le personnage.')

  // Univers
  if (typeof univers.nom === 'string' && univers.nom !== '') {
    lignes.push(`Univers : ${univers.nom}.`)
  }

  // Contexte narratif
  if (typeof aventure.lieuDepart === 'string' && aventure.lieuDepart !== '') {
    lignes.push(`Lieu : ${aventure.lieuDepart}.`)
  }

  // Regles de comportement fixes
  for (const regle of REGLES_COMPORTEMENT) {
    lignes.push(regle)
  }

  // Directives de tour (traduction des identifiants de la Decision)
  const directiveObjectif = traduireObjectif(decision.objectifImmediat, langue)
  const directiveAttitude = traduireAttitude(decision.attitude, langue)
  const directiveDirection = traduireDirection(decision.directionNarrative, langue)

  if (directiveObjectif !== '') lignes.push(directiveObjectif)
  if (directiveAttitude !== '') lignes.push(directiveAttitude)
  if (directiveDirection !== '') lignes.push(directiveDirection)

  return lignes.join('\n')
}

/**
 * Assemble l'instruction de tour : directives condensees + message du joueur.
 * Uniquement lookup + concatenation.
 *
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 * @param {import('../types/Decision.js').Decision} decision
 * @param {string} langue
 * @returns {string}
 */
function assembleInstruction(playerMessage, decision, langue) {
  const texteJoueur =
    playerMessage !== null &&
    typeof playerMessage === 'object' &&
    typeof playerMessage.texte === 'string'
      ? playerMessage.texte
      : ''

  const directiveObjectif = traduireObjectif(decision.objectifImmediat, langue)
  const directiveDirection = traduireDirection(decision.directionNarrative, langue)

  const lignes = []
  if (directiveObjectif !== '') lignes.push(directiveObjectif)
  if (directiveDirection !== '') lignes.push(directiveDirection)

  lignes.push(
    texteJoueur !== ''
      ? `Le joueur vient de dire : "${texteJoueur}". Reponds-lui.`
      : 'Le joueur n\'a rien dit. Reagis a ce silence.',
  )

  return lignes.join('\n')
}

/**
 * Copie defensive de l'historique au format MessageHistorique.
 * Passe-plat depuis etat.historique ; tableau vide au premier tour.
 * Aucune interpretation, aucun tri, aucune transformation.
 *
 * @param {object} etat
 * @returns {import('../types/Prompt.js').MessageHistorique[]}
 */
function assembleHistorique(etat) {
  const source =
    etat !== null && typeof etat === 'object' && Array.isArray(etat.historique)
      ? etat.historique
      : []

  return source.map((m) => ({ role: m.role, contenu: m.contenu }))
}

/**
 * Determine la langue de mise en forme depuis l'etat, avec repli sur la langue
 * par defaut. Aucun effet de bord.
 *
 * @param {object} etat
 * @returns {string}
 */
function resoudreLangue(etat) {
  const langue =
    etat !== null &&
    typeof etat === 'object' &&
    etat.meta !== null &&
    typeof etat.meta === 'object' &&
    typeof etat.meta.langue === 'string' &&
    etat.meta.langue !== ''
      ? etat.meta.langue
      : LANGUE_DEFAUT
  return langue
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * buildPrompt(playerMessage, decision, ressenti, fiches, etat)
 *
 * Assemble le Prompt final destine au LLM. Module pur et deterministe :
 * uniquement lookup (vocabulaire/fiches) + concatenation + formatage.
 *
 * Le message brut du joueur entre dans la chaine ICI et nulle part avant : les
 * modules precedents ne manipulent que des representations metier.
 *
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 *   Message brut du joueur pour le tour courant.
 * @param {import('../types/Decision.js').Decision} decision
 *   Decision du personnage (identifiants stables issus de decision/).
 * @param {import('../types/Ressenti.js').Ressenti} ressenti
 *   Synthese psychologique du tour. Fait partie du contrat de la chaine
 *   cognitive ; non consomme pour l'assemblage afin de preserver le role
 *   strict d'assembleur (aucun raisonnement a partir du ressenti).
 * @param {object} fiches
 *   Les fiches validees (identite du personnage, univers, aventure).
 * @param {object} etat
 *   Etat courant de la session (historique, meta.langue).
 *
 * @returns {import('../types/Prompt.js').Prompt}
 *
 * @throws {MissingDecisionError}
 * @throws {MissingFichePersonnageError}
 */
export function buildPrompt(playerMessage, decision, ressenti, fiches, etat) {
  validerDecision(decision)
  validerFichePersonnage(fiches)

  const langue = resoudreLangue(etat)

  return {
    systeme: assembleSysteme(fiches, decision, langue),
    historique: assembleHistorique(etat),
    instruction: assembleInstruction(playerMessage, decision, langue),
  }
}

export { ROLES_MESSAGE }
export {
  PromptError,
  MissingDecisionError,
  MissingFichePersonnageError,
} from './PromptError.js'
