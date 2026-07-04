/**
 * axiomes/index.js
 *
 * Responsabilité unique : centraliser les 20 axiomes de Gabida comme source de vérité du moteur.
 *
 * Les axiomes sont les lois universelles appliquées par tous les modules.
 * Ils ne contiennent aucune logique métier.
 * Ils définissent les règles que tous les personnages respectent — comme les lois de la physique.
 *
 * Source : Les Axiomes Gabida v1.0
 *
 * Axiome 1  : Tout critère possède une valeur.
 * Axiome 2  : Toute valeur influence le comportement.
 * Axiome 3  : Les influences sont cumulatives.
 * Axiome 4  : Aucune décision ne repose sur un seul critère.
 * Axiome 5  : La mémoire modifie progressivement les valeurs.
 * Axiome 6  : Les valeurs permanentes changent difficilement.
 * Axiome 7  : Les états temporaires changent rapidement.
 * Axiome 8  : Une émotion ne remplace jamais la personnalité.
 * Axiome 9  : Les souvenirs importants priment sur les souvenirs mineurs.
 * Axiome 10 : La relation est toujours prioritaire.
 * Axiome 11 : Gabida n'invente jamais. Il interprète uniquement ce que les fiches lui donnent.
 * Axiome 12 : Une fiche ne connaît jamais les autres fiches. C'est Gabida qui les relie.
 * Axiome 13 : Une information n'existe qu'à un seul endroit.
 * Axiome 14 : Chaque critère possède une seule responsabilité.
 * Axiome 15 : Chaque chapitre répond à une seule grande question.
 * Axiome 16 : Les fiches décrivent. Les axiomes décident.
 * Axiome 17 : Le moteur applique. Il ne réfléchit jamais.
 * Axiome 18 : La cohérence est plus importante que la variété.
 * Axiome 19 : Toute évolution doit être explicable.
 * Axiome 20 : Chaque réponse est le résultat d'un calcul, jamais du hasard.
 */

/**
 * AXIOMES
 *
 * Source de vérité des 20 axiomes.
 * Exportés comme constantes indexées par numéro.
 * Utilisés par tous les modules pour justifier leurs décisions (Axiome 19).
 *
 * @type {Record<number, string>}
 */
export const AXIOMES = {
   1: 'Tout critère possède une valeur.',
   2: 'Toute valeur influence le comportement. Une valeur n’est jamais décorative.',
   3: 'Les influences sont cumulatives.',
   4: 'Aucune décision ne repose sur un seul critère.',
   5: 'La mémoire modifie progressivement les valeurs.',
   6: 'Les valeurs permanentes changent difficilement.',
   7: 'Les états temporaires changent rapidement.',
   8: 'Une émotion ne remplace jamais la personnalité.',
   9: 'Les souvenirs importants priment sur les souvenirs mineurs.',
  10: 'La relation est toujours prioritaire.',
  11: 'Gabida n’invente jamais. Il interprète uniquement ce que les fiches lui donnent.',
  12: 'Une fiche ne connaît jamais les autres fiches. C’est Gabida qui les relie.',
  13: 'Une information n’existe qu’à un seul endroit.',
  14: 'Chaque critère possède une seule responsabilité.',
  15: 'Chaque chapitre répond à une seule grande question.',
  16: 'Les fiches décrivent. Les axiomes décident.',
  17: 'Le moteur applique. Il ne réfléchit jamais.',
  18: 'La cohérence est plus importante que la variété.',
  19: 'Toute évolution doit être explicable.',
  20: 'Chaque réponse est le résultat d’un calcul, jamais du hasard.',
}

/**
 * getAxiome(numero)
 *
 * Retourne le texte d'un axiome par son numéro.
 * Lève une erreur si le numéro est hors de [1, 20].
 *
 * @param {number} numero — Numéro de l'axiome (1 à 20).
 * @returns {string}
 */
export function getAxiome(numero) {
  if (!AXIOMES[numero]) throw new Error(`Axiome ${numero} : introuvable`)
  return AXIOMES[numero]
}
