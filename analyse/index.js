/**
 * analyse/index.js
 *
 * Responsabilite unique : transformer un PlayerMessage en Evenement.
 *
 * Role (source : Cycle de Vie etape 3 + Carnet v0.2 §27) :
 *   - Identifier l'intention du joueur.
 *   - Identifier les elements importants du message.
 *   - Identifier les criteres concernes dans les fiches.
 *   - Qualifier l'evenement vecu par le personnage.
 *
 * Principe fondamental :
 *   Une reponse du joueur est un evenement -- pas une commande.
 *   Le personnage doit d'abord comprendre, puis donner un sens, puis decider.
 *
 * Axiome 11 : Gabida n'invente jamais. Il interprete uniquement ce que les fiches lui donnent.
 * Axiome 17 : Le moteur applique. Il ne reflechit jamais.
 * Axiome 20 : Chaque reponse est le resultat d'un calcul, jamais du hasard.
 */

import { INTENTIONS } from '../constants/Intentions.js'
import { MOMENTS_NARRATIFS } from '../constants/MomentsNarratifs.js'

// -----------------------------------------------------------------------------
// ContexteAnalyse
// -----------------------------------------------------------------------------

/**
 * @typedef {object} ContexteAnalyse
 *
 * Objet unique regroupe en entree de toutes les fonctions internes du module.
 * Construit une seule fois dans analyzeEvent, transmis a chaque sous-fonction.
 *
 * Stabilise les signatures internes : ajouter un champ ici ne casse aucune
 * signature existante.
 *
 * @property {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 *   Message brut emis par le joueur.
 *
 * @property {string} texteOriginal
 *   Texte brut du message, casse conservee. Utilise pour l'extraction de fragments.
 *
 * @property {string} texteNormalise
 *   Texte en minuscules avec apostrophes normalisees. Utilise pour les recherches.
 *
 * @property {object} fiches
 *   Les 5 fiches validees issues de lecture.loadFiches.
 *
 * @property {import('../types/Etat.js').Etat} etat
 *   Etat courant de la session.
 */

// -----------------------------------------------------------------------------
// Normalisation du texte
// -----------------------------------------------------------------------------

/**
 * Normalise un texte pour la recherche de mots-cles.
 * Met en minuscules et normalise les apostrophes typographiques.
 *
 * @param {string} texte
 * @returns {string}
 */
export function normaliserTexte(texte) {
  return texte
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
}

// -----------------------------------------------------------------------------
// Detection d'intention
// -----------------------------------------------------------------------------

/**
 * Mots-cles associes a chaque intention, par ordre de priorite decroissante.
 * Le premier pattern dont un mot-cle est present dans le texte l'emporte.
 *
 * @type {Array<{ intention: string, motsCles: string[] }>}
 */
const INTENTION_PATTERNS = [
  {
    intention: INTENTIONS.QUESTION,
    motsCles: ['?', 'pourquoi', 'comment', 'quand', 'qui est', 'quoi', 'quel ', 'quelle ', 'est-ce que', 'sais-tu', 'connais-tu', 'dis-moi'],
  },
  {
    intention: INTENTIONS.DEMANDE,
    motsCles: ['aide-moi', 'aide moi', "j'ai besoin", 'peux-tu', 'pourrais-tu', 'veux-tu', 'voudrais-tu', "s'il te plait", 'stp', 'donne-moi', 'montre-moi'],
  },
  {
    intention: INTENTIONS.PROVOCATION,
    motsCles: ['tu mens', 'menteur', 'lache', 'incapable', "tu n'es pas", "j'en doute", 'prouve', 'peur de', 'ridicule', 'jamais tu ne', "n'oses pas"],
  },
  {
    intention: INTENTIONS.CONFIDENCE,
    motsCles: ["je t'avoue", 'je dois te dire', 'en realite', 'en verite', 'je te confie', 'personne ne sait', 'secret', "j'ai peur", "j'ai honte", 'je souffre'],
  },
  {
    intention: INTENTIONS.OBSERVATION,
    motsCles: ['je remarque', 'je vois', 'il y a', "c'est", 'voila', 'regarde', 'on dirait', 'apparemment', 'il semble', 'je constate'],
  },
]

/**
 * Detecte l'intention dominante depuis contexteAnalyse.texteNormalise.
 * Retourne SILENCE si le texte est vide.
 * Retourne OBSERVATION si aucun pattern ne matche.
 *
 * @param {ContexteAnalyse} ctx
 * @returns {string} -- Une valeur de INTENTIONS.
 */
export function detecterIntention(ctx) {
  const t = ctx.texteNormalise
  if (!t || t.trim().length === 0) {
    return INTENTIONS.SILENCE
  }

  for (const { intention, motsCles } of INTENTION_PATTERNS) {
    for (const motCle of motsCles) {
      if (t.includes(motCle)) {
        return intention
      }
    }
  }

  return INTENTIONS.OBSERVATION
}

// -----------------------------------------------------------------------------
// Extraction des elements importants
// -----------------------------------------------------------------------------

/**
 * Marqueurs narratifs signalant qu'un element important suit dans le texte.
 *
 * @type {string[]}
 */
const MARQUEURS_ELEMENTS = [
  'je promets', 'je jure', "je t'ai menti", "j'ai menti",
  'je te donne', 'je renonce', "j'abandonne",
  'je choisis', 'je decide', 'je refuse', "j'accepte",
]

/**
 * Extrait les elements importants depuis contexteAnalyse.
 * Capture jusqu'a 60 caracteres suivant chaque marqueur narratif trouve.
 * Retourne un tableau vide si aucun marqueur n'est detecte.
 *
 * @param {ContexteAnalyse} ctx
 * @returns {string[]}
 */
export function extraireElementsImportants(ctx) {
  const elements = []

  for (const marqueur of MARQUEURS_ELEMENTS) {
    const index = ctx.texteNormalise.indexOf(marqueur)
    if (index !== -1) {
      const debut = index + marqueur.length
      const fragment = ctx.texteOriginal.slice(debut, debut + 60).trim()
      if (fragment.length > 0) {
        elements.push(fragment)
      }
    }
  }

  return elements
}

// -----------------------------------------------------------------------------
// Identification des criteres concernes
// -----------------------------------------------------------------------------

/**
 * Association chapitres de la fiche personnage / mots-cles declencheurs.
 * Les identifiants correspondent aux 12 chapitres de la fiche personnage v1.0.
 *
 * @type {Array<{ critereId: string, motsCles: string[] }>}
 */
const CRITERES_PATTERNS = [
  {
    critereId: 'personnalite',
    motsCles: ['caractere', 'nature', 'temperament', 'comportement', 'bizarre', 'etrange', 'different'],
  },
  {
    critereId: 'emotions',
    motsCles: ['ressens', 'sentiment', 'emotion', 'colere', 'joie', 'tristesse', 'peur', 'honte', 'jalousie', 'amour', 'haine', 'souffre'],
  },
  {
    critereId: 'relations',
    motsCles: ['ami', 'amie', 'ennemi', 'confiance', 'trahison', 'loyaute', 'famille', 'frere', 'soeur', 'pere', 'mere', 'compagnon', 'allie'],
  },
  {
    critereId: 'valeurs',
    motsCles: ['honneur', 'justice', 'verite', 'mensonge', 'bien', 'mal', 'juste', 'injuste', 'moral', 'devoir', 'interdit'],
  },
  {
    critereId: 'motivations',
    motsCles: ['objectif', 'but', 'quete', 'cherches', 'reve', 'ambition', 'desir', 'pourquoi tu'],
  },
  {
    critereId: 'histoire',
    motsCles: ['passe', 'avant', 'jadis', 'autrefois', 'enfance', 'origine', 'viens de', "d'ou", 'il y a longtemps', 'souviens'],
  },
  {
    critereId: 'decision',
    motsCles: ['choix', 'decision', 'choisir', 'decider', 'hesites', 'que vas-tu faire', 'que feras-tu'],
  },
  {
    critereId: 'communication',
    motsCles: ['parle', 'explique', 'raconte', 'reponds', 'ecoute', 'entends', 'comprends'],
  },
]

/**
 * Identifie les criteres de la fiche personnage concernes par le message.
 * Garantit au minimum un critere retourne ('communication' par defaut).
 *
 * @param {ContexteAnalyse} ctx
 * @returns {string[]} -- Tableau non vide d'identifiants de criteres.
 */
export function identifierCriteresConcernes(ctx) {
  const concernes = []

  for (const { critereId, motsCles } of CRITERES_PATTERNS) {
    for (const motCle of motsCles) {
      if (ctx.texteNormalise.includes(motCle)) {
        concernes.push(critereId)
        break
      }
    }
  }

  if (concernes.length === 0) {
    concernes.push('communication')
  }

  return concernes
}

// -----------------------------------------------------------------------------
// Deduction du moment narratif
// -----------------------------------------------------------------------------

/**
 * Deduit le moment narratif depuis contexteAnalyse.etat et contexteAnalyse.fiches.
 *
 * Seuils (duree estimee N, defaut = 20 tours) :
 *   tours 1-2     -> OUVERTURE
 *   tours 3-N-2   -> DEVELOPPEMENT
 *   tour  N-1     -> TENSION
 *   tour  N       -> RESOLUTION
 *   tour  N+1 et+ -> EPILOGUE
 *
 * @param {ContexteAnalyse} ctx
 * @returns {string} -- Une valeur de MOMENTS_NARRATIFS.
 */
export function deduireMomentNarratif(ctx) {
  const tourCourant  = ctx.etat.tourCourant
  const dureeEstimee = ctx.fiches.aventure?.dureeEstimee ?? 20

  if (tourCourant <= 2)                return MOMENTS_NARRATIFS.OUVERTURE
  if (tourCourant >= dureeEstimee + 1) return MOMENTS_NARRATIFS.EPILOGUE
  if (tourCourant >= dureeEstimee)     return MOMENTS_NARRATIFS.RESOLUTION
  if (tourCourant >= dureeEstimee - 1) return MOMENTS_NARRATIFS.TENSION

  return MOMENTS_NARRATIFS.DEVELOPPEMENT
}

// -----------------------------------------------------------------------------
// Extraction du lieu
// -----------------------------------------------------------------------------

/**
 * Retourne le lieu courant depuis contexteAnalyse.etat ou la fiche aventure.
 * Retourne null si aucun lieu identifiable.
 *
 * @param {ContexteAnalyse} ctx
 * @returns {string|null}
 */
export function extraireLieu(ctx) {
  if (ctx.etat?.meta?.lieuCourant)             return ctx.etat.meta.lieuCourant
  if (ctx.fiches.aventure?.lieuDepart)         return ctx.fiches.aventure.lieuDepart
  return null
}

// -----------------------------------------------------------------------------
// Interface publique
// -----------------------------------------------------------------------------

/**
 * analyzeEvent(playerMessage, fiches, etat)
 *
 * Transforme un PlayerMessage en Evenement.
 * Construit le contexteAnalyse interne, puis orchestre les sous-fonctions.
 *
 * Interface publique stable -- ne change pas.
 *
 * @param {import('../types/PlayerMessage.js').PlayerMessage} playerMessage
 * @param {object} fiches -- Les 5 fiches validees (issues de lecture.loadFiches).
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {import('../types/Evenement.js').Evenement}
 */
export function analyzeEvent(playerMessage, fiches, etat) {
  const ctx = {
    playerMessage,
    texteOriginal:  playerMessage.texte,
    texteNormalise: normaliserTexte(playerMessage.texte),
    fiches,
    etat,
  }

  return {
    intention:          detecterIntention(ctx),
    criteresConernes:   identifierCriteresConcernes(ctx),
    elementsImportants: extraireElementsImportants(ctx),
    contexte: {
      lieu:   extraireLieu(ctx),
      moment: deduireMomentNarratif(ctx),
    },
  }
}