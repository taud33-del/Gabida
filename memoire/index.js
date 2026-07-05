/**
 * memoire/index.js
 *
 * Responsabilite unique : mettre a jour la memoire vecue du personnage apres un tour.
 *
 * Question : "Que doit retenir durablement le personnage de ce tour ?"
 *
 * Ce module analyse ce qui vient de se passer, selectionne ce qui merite d'etre
 * conserve, consolide la memoire existante et applique l'oubli si necessaire.
 *
 * Il ne decide jamais d'un comportement.
 * Il ne produit jamais de texte narratif.
 * Il ne modifie jamais la memoire permanente (definie par la fiche personnage).
 *
 * Pipeline interne :
 *   updateMemory(evenement, decision, reponseIA, fiches, etat)
 *     -> construire ContexteMemoire (ctx)
 *     -> detecterSouvenirsCandidats(ctx)       independante
 *     -> selectionnerSouvenirsPermanents(ctx)  independante
 *     -> fusionnerEtPrioriser(ctx, ...)        assemble les deux resultats
 *     -> appliquerOubli(ctx, fusion)
 *     -> assemblerMiseAJour(ctx, ...)
 *     -> MiseAJourMemoire
 *
 * Axiome 5 : La memoire modifie progressivement les valeurs.
 * Axiome 9 : Les souvenirs importants priment sur les souvenirs mineurs.
 * Axiome 19 : Toute evolution doit etre explicable.
 *
 * Types metier de ce module : voir memoire/types.js
 *   - Souvenir
 *   - MemoireVecue
 *   - MiseAJourMemoire
 *
 * @module memoire
 */

import { TYPES_SOUVENIR }       from '../constants/TypesSouvenir.js'
import { INTENTIONS }           from '../constants/Intentions.js'
import { MOMENTS_NARRATIFS }    from '../constants/MomentsNarratifs.js'
import { IMPORTANCES_MEMOIRE }  from '../constants/ImportancesMemoire.js'

// ─── Constante locale ─────────────────────────────────────────────────────────

const CAPACITE_MEMOIRE_DEFAUT = 20

// ─── Types internes ───────────────────────────────────────────────────────────

/**
 * @typedef {object} ContexteMemoire
 *
 * Objet immutable construit une seule fois dans updateMemory.
 * Transmis a toutes les sous-fonctions. Aucune ne le modifie.
 *
 * @property {import('../types/Evenement.js').Evenement} evenement
 * @property {import('../types/Decision.js').Decision} decision
 * @property {import('../types/ReponseIA.js').ReponseIA} reponseIA
 * @property {object} fiches
 * @property {import('../types/Etat.js').Etat} etat
 * @property {string} intention            -- Raccourci : evenement.intention
 * @property {string[]} elementsImportants -- Raccourci : evenement.elementsImportants
 * @property {string[]} criteresConernes   -- Raccourci : evenement.criteresConernes
 * @property {string} momentNarratif       -- Raccourci : evenement.contexte.moment
 * @property {string} objectifDecision     -- Raccourci : decision.objectifImmediat
 * @property {string} directionNarrative   -- Raccourci : decision.directionNarrative
 * @property {string[]} criteresDecision   -- Raccourci : decision.justification.criteresActifs
 * @property {string} texteReponse         -- Raccourci : reponseIA.texte
 * @property {number} tourCourant          -- Raccourci : etat.tourCourant
 * @property {import('./types.js').Souvenir[]} souvenirsCourants -- etat.memoireVecue?.souvenirs ?? []
 * @property {number} capaciteMax          -- fiches.personnage?.capaciteMemoire ?? CAPACITE_MEMOIRE_DEFAUT
 * @property {string} sessionId            -- Raccourci : etat.sessionId
 */

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * bornerImportance(valeur)
 *
 * Pure. Borne une importance entre 0 et 1 inclus.
 *
 * @param {number} valeur
 * @returns {number}
 */
function bornerImportance(valeur) {
  return Math.min(1, Math.max(0, valeur))
}

/**
 * amplifierImportance(importance, momentNarratif)
 *
 * Pure. Applique le multiplicateur narratif si applicable.
 *
 * @param {number} importance
 * @param {string} momentNarratif
 * @returns {number}
 */
function amplifierImportance(importance, momentNarratif) {
  if (momentNarratif === MOMENTS_NARRATIFS.TENSION) {
    return bornerImportance(importance * IMPORTANCES_MEMOIRE.AMPLIFICATION_TENSION)
  }
  if (momentNarratif === MOMENTS_NARRATIFS.EPILOGUE) {
    return bornerImportance(importance * IMPORTANCES_MEMOIRE.AMPLIFICATION_EPILOGUE)
  }
  return importance
}

/**
 * creerSouvenir(type, contenu, importance, tour)
 *
 * Cree un nouveau Souvenir avec un id unique.
 * Seule source d'impurete documentee du module (crypto.randomUUID).
 *
 * @param {string} type
 * @param {string} contenu
 * @param {number} importance
 * @param {number} tour
 * @returns {import('./types.js').Souvenir}
 */
function creerSouvenir(type, contenu, importance, tour) {
  return {
    id         : crypto.randomUUID(),
    type,
    contenu,
    importance : bornerImportance(importance),
    tour,
  }
}

/**
 * contientEngagement(elementsImportants)
 *
 * Pure. Detecte si les elements importants contiennent un engagement explicite.
 *
 * @param {string[]} elementsImportants
 * @returns {boolean}
 */
function contientEngagement(elementsImportants) {
  const mots = ['promesse', 'jure', 'jamais', 'toujours', 'engagement', 'te trahir', 'ne trahirai']
  return elementsImportants.some(el =>
    mots.some(mot => el.toLowerCase().includes(mot))
  )
}

/**
 * contientMensonge(elementsImportants)
 *
 * Pure. Detecte si les elements importants contiennent un mensonge ou ecart.
 *
 * @param {string[]} elementsImportants
 * @returns {boolean}
 */
function contientMensonge(elementsImportants) {
  const mots = ['ment', 'faux', 'tromperie', 'contradiction', 'contredit', 'fausse']
  return elementsImportants.some(el =>
    mots.some(mot => el.toLowerCase().includes(mot))
  )
}

// ─── Sous-fonctions internes ──────────────────────────────────────────────────

/**
 * detecterSouvenirsCandidats(ctx)
 *
 * Pure (sauf generation d'id via crypto.randomUUID — seule impurete documentee).
 * Analyse le tour courant et produit les souvenirs candidats a la retention.
 *
 * Un tour ordinaire sans signal fort retourne un tableau vide.
 *
 * @param {ContexteMemoire} ctx
 * @returns {import('./types.js').Souvenir[]}
 */
export function detecterSouvenirsCandidats(ctx) {
  const candidats = []
  const { intention, elementsImportants, momentNarratif, tourCourant } = ctx

  if (contientMensonge(elementsImportants)) {
    const importance = amplifierImportance(IMPORTANCES_MEMOIRE.IMPORTANCE_MENSONGE, momentNarratif)
    const contenu    = `Mensonge ou contradiction detecte : "${elementsImportants.join(', ')}"`
    candidats.push(creerSouvenir(TYPES_SOUVENIR.MENSONGE, contenu, importance, tourCourant))
  }

  if (contientEngagement(elementsImportants)) {
    const importance = amplifierImportance(IMPORTANCES_MEMOIRE.IMPORTANCE_PROMESSE, momentNarratif)
    const contenu    = `Engagement exprime : "${elementsImportants.join(', ')}"`
    candidats.push(creerSouvenir(TYPES_SOUVENIR.PROMESSE, contenu, importance, tourCourant))
  }

  if (intention === INTENTIONS.CONFIDENCE) {
    const importance = amplifierImportance(IMPORTANCES_MEMOIRE.IMPORTANCE_CONFIDENCE, momentNarratif)
    const contenu    = `Confidence recue du joueur ce tour.`
    candidats.push(creerSouvenir(TYPES_SOUVENIR.DIALOGUE, contenu, importance, tourCourant))
  }

  if (intention === INTENTIONS.PROVOCATION && elementsImportants.length > 0) {
    const importance = amplifierImportance(IMPORTANCES_MEMOIRE.IMPORTANCE_PROVOCATION, momentNarratif)
    const contenu    = `Provocation recue : "${elementsImportants.join(', ')}"`
    candidats.push(creerSouvenir(TYPES_SOUVENIR.DIALOGUE, contenu, importance, tourCourant))
  }

  if (ctx.directionNarrative && elementsImportants.length > 0) {
    const importance = amplifierImportance(IMPORTANCES_MEMOIRE.IMPORTANCE_EVENEMENT, momentNarratif)
    const contenu    = `Element narratif note : "${elementsImportants[0]}"`
    candidats.push(creerSouvenir(TYPES_SOUVENIR.EVENEMENT, contenu, importance, tourCourant))
  }

  if (ctx.objectifDecision && ctx.criteresDecision.length > 0) {
    const importance = amplifierImportance(IMPORTANCES_MEMOIRE.IMPORTANCE_DECISION, momentNarratif)
    const contenu    = `Decision prise ce tour : "${ctx.objectifDecision}"`
    candidats.push(creerSouvenir(TYPES_SOUVENIR.DECISION, contenu, importance, tourCourant))
  }

  return candidats
}

/**
 * selectionnerSouvenirsPermanents(ctx)
 *
 * Pure. Evalue les souvenirs existants et retourne ceux qui sont proteges ce tour.
 *
 * Regles de protection :
 *   - importance >= SEUIL_PROTECTION       : protege inconditionnellement (Axiome 9)
 *   - tour >= tourCourant - 2              : trop recent pour etre oublie
 *   - type === TYPES_SOUVENIR.PROMESSE     : toujours protege
 *
 * @param {ContexteMemoire} ctx
 * @returns {import('./types.js').Souvenir[]}
 */
export function selectionnerSouvenirsPermanents(ctx) {
  return ctx.souvenirsCourants.filter(s =>
    s.importance >= IMPORTANCES_MEMOIRE.SEUIL_PROTECTION ||
    s.tour >= ctx.tourCourant - 2 ||
    s.type === TYPES_SOUVENIR.PROMESSE
  )
}

/**
 * fusionnerEtPrioriser(ctx, candidats, permanents)
 *
 * Pure. Combine souvenirs proteges, non-proteges et candidats en une liste triee.
 * Deduplique les candidats dont le type et le contenu couvrent un souvenir existant.
 *
 * @param {ContexteMemoire} ctx
 * @param {import('./types.js').Souvenir[]} candidats
 * @param {import('./types.js').Souvenir[]} permanents
 * @returns {import('./types.js').Souvenir[]}
 */
export function fusionnerEtPrioriser(ctx, candidats, permanents) {
  const permanentsIds = new Set(permanents.map(s => s.id))

  const nonProteges = ctx.souvenirsCourants.filter(s => !permanentsIds.has(s.id))

  const tousExistants = [...permanents, ...nonProteges]
  const existantsIds  = new Set(tousExistants.map(s => s.id))

  const candidatsUniques = candidats.filter(candidat => {
    const doublon = tousExistants.find(
      s => s.type === candidat.type &&
           s.contenu.slice(0, 40) === candidat.contenu.slice(0, 40)
    )
    if (doublon) {
      doublon.importance = bornerImportance(Math.max(doublon.importance, candidat.importance))
      return false
    }
    return !existantsIds.has(candidat.id)
  })

  const fusion = [...tousExistants, ...candidatsUniques]

  fusion.sort((a, b) => b.importance - a.importance)

  return fusion
}

/**
 * appliquerOubli(ctx, fusion)
 *
 * Pure. Ecrete la liste si elle depasse ctx.capaciteMax.
 * Les souvenirs de plus faible importance sont supprimes en premier.
 * Les souvenirs proteges ne sont jamais supprimes.
 *
 * @param {ContexteMemoire} ctx
 * @param {import('./types.js').Souvenir[]} fusion
 * @returns {{ conserves: import('./types.js').Souvenir[], oublies: string[] }}
 */
export function appliquerOubli(ctx, fusion) {
  if (fusion.length <= ctx.capaciteMax) {
    return { conserves: fusion, oublies: [] }
  }

  const proteges = new Set(
    fusion
      .filter(s =>
        s.importance >= IMPORTANCES_MEMOIRE.SEUIL_PROTECTION ||
        s.tour >= ctx.tourCourant - 2 ||
        s.type === TYPES_SOUVENIR.PROMESSE
      )
      .map(s => s.id)
  )

  const conserves = []
  const oublies   = []

  for (const souvenir of fusion) {
    if (proteges.has(souvenir.id)) {
      conserves.push(souvenir)
      continue
    }
    if (conserves.length < ctx.capaciteMax) {
      conserves.push(souvenir)
    } else {
      oublies.push(souvenir.id)
    }
  }

  return { conserves, oublies }
}

/**
 * assemblerMiseAJour(ctx, conserves, oublies, candidats)
 *
 * Aucune logique. Construit le MiseAJourMemoire officiel.
 *
 * @param {ContexteMemoire} ctx
 * @param {import('./types.js').Souvenir[]} conserves
 * @param {string[]} oublies
 * @param {import('./types.js').Souvenir[]} candidats
 * @returns {import('./types.js').MiseAJourMemoire}
 */
export function assemblerMiseAJour(ctx, conserves, oublies, candidats) {
  const candidatsIds = new Set(candidats.map(s => s.id))

  const ajoutes  = conserves.filter(s => candidatsIds.has(s.id))
  const gardes   = conserves.filter(s => !candidatsIds.has(s.id))

  return {
    ajoutes,
    oublies,
    conserves : gardes,
  }
}

// ─── Interface publique ───────────────────────────────────────────────────────

/**
 * updateMemory(evenement, decision, reponseIA, fiches, etat)
 *
 * Met a jour la memoire vecue du personnage apres un tour.
 * Repond a la question : "Que doit retenir durablement le personnage de ce tour ?"
 *
 * Ne modifie jamais la memoire permanente (definie par la fiche personnage).
 * Ne prend jamais de decision narrative.
 * Ne produit jamais de texte.
 *
 * @param {import('../types/Evenement.js').Evenement} evenement
 * @param {import('../types/Decision.js').Decision} decision
 * @param {import('../types/ReponseIA.js').ReponseIA} reponseIA
 * @param {object} fiches -- Les 5 fiches validees.
 * @param {import('../types/Etat.js').Etat} etat
 *
 * @returns {import('./types.js').MiseAJourMemoire}
 */
export function updateMemory(evenement, decision, reponseIA, fiches, etat) {
  const ctx = Object.freeze({
    evenement,
    decision,
    reponseIA,
    fiches,
    etat,

    intention           : evenement.intention,
    elementsImportants  : evenement.elementsImportants ?? [],
    criteresConernes    : evenement.criteresConernes   ?? [],
    momentNarratif      : evenement.contexte?.moment   ?? '',

    objectifDecision    : decision.objectifImmediat,
    directionNarrative  : decision.directionNarrative,
    criteresDecision    : decision.justification?.criteresActifs ?? [],

    texteReponse        : reponseIA.texte,

    tourCourant         : etat.tourCourant,
    souvenirsCourants   : etat.memoireVecue?.souvenirs ?? [],
    capaciteMax         : fiches?.personnage?.capaciteMemoire ?? CAPACITE_MEMOIRE_DEFAUT,
    sessionId           : etat.sessionId,
  })

  const candidats  = detecterSouvenirsCandidats(ctx)
  const permanents = selectionnerSouvenirsPermanents(ctx)
  const fusion     = fusionnerEtPrioriser(ctx, candidats, permanents)
  const { conserves, oublies } = appliquerOubli(ctx, fusion)

  return assemblerMiseAJour(ctx, conserves, oublies, candidats)
}

/**
 * appliquerMiseAJour(miseAJourMemoire)
 *
 * Aucune logique metier. Construit la nouvelle MemoireVecue en appliquant un
 * MiseAJourMemoire deja calcule par updateMemory : les souvenirs conserves et
 * les souvenirs ajoutes sont fusionnes puis tries par importance decroissante.
 * Les oublies ont deja ete exclus en amont ; ils ne sont pas reinjectes ici.
 *
 * Pure et deterministe : aucune mutation des entrees, aucun effet de bord.
 *
 * @param {import('./types.js').MiseAJourMemoire} miseAJourMemoire
 * @returns {import('./types.js').MemoireVecue}
 */
export function appliquerMiseAJour(miseAJourMemoire) {
  const souvenirs = [
    ...miseAJourMemoire.conserves,
    ...miseAJourMemoire.ajoutes,
  ].sort((a, b) => b.importance - a.importance)

  return { souvenirs }
}
