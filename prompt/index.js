/**
 * prompt/index.js
 *
 * Responsabilité unique : construire le prompt final destiné à l'IA.
 *
 * Rôle (source : Cycle de Vie étape 7 + Spécifications techniques §5) :
 *   - Assembler les directives issues de tous les modules précédents.
 *   - Produire un prompt cohérent, générique et indépendant du LLM cible.
 *   - Ne jamais exposer de variables, chiffres ou mécaniques internes au LLM.
 *
 * Ce module est la seule interface entre le moteur et l'IA externe.
 * Il ne connaît pas le modèle d'IA utilisé.
 *
 * Spécification §9 : Gabida doit pouvoir fonctionner avec n'importe quel LLM.
 * Spécification §7 : Le moteur ne connaît jamais les critères — uniquement leur type, famille et valeur.
 */

/**
 * buildPrompt(decision, etatEmotionnel, filtreRelationnel, fiches, etat)
 *
 * Construit le prompt final destiné à être envoyé au LLM.
 * Assemble les directives issues de tous les modules précédents.
 * Retourne une structure indépendante du fournisseur d'IA.
 *
 * Le prompt ne contient jamais : variables numériques, identifiants internes,
 * références à des mécaniques de moteur.
 *
 * @param {object} decision          — Décision du personnage (issu de decision.computeDecision).
 * @param {object} etatEmotionnel    — État émotionnel du tour (issu de emotions.computeEmotions).
 * @param {object} filtreRelationnel — Filtre relationnel du tour (issu de influences.computeInfluences).
 * @param {object} fiches            — Les 5 fiches validées.
 * @param {object} etat              — État courant de la session.
 *
 * @returns {Prompt}
 *
 * @typedef {object} Prompt
 * @property {string} systeme  — Bloc système destiné au LLM (identité, règles, directives).
 * @property {Array}  historique — Historique de la conversation formaté pour le LLM.
 * @property {string} instruction — Instruction de tour : ce que le personnage doit accomplir.
 *
 * NOTE ARCHITECTURE : la structure exacte du prompt (system / user / assistant)
 * dépend du format attendu par le module api.
 * Le contrat entre prompt et api nécessite une validation avant implémentation.
 */
export function buildPrompt(decision, etatEmotionnel, filtreRelationnel, fiches, etat) {
  // TODO : implémenter
  throw new Error('buildPrompt : non implémenté')
}
