/**
 * prompt/vocabulaire.js
 *
 * Traducteur d'identifiants du moteur vers du langage naturel (francais).
 *
 * C'est le SEUL endroit ou les identifiants cognitifs (OBJECTIFS / ATTITUDES /
 * DIRECTIONS_NARRATIVES) deviennent des directives en prose destinees au LLM.
 * La frontiere cognition ↔ langage passe ici (Axiome 17).
 *
 * IMPORTANT :
 *   - Aucune logique metier, aucun calcul, aucune decision.
 *   - Uniquement des tables deterministes identifiant → phrase.
 *   - Aucune valeur numerique, aucun critereId, aucun terme interne du moteur
 *     n'apparait dans les phrases produites.
 *
 * Structure prete pour un futur i18n : les tables sont regroupees par langue.
 * Sprint 25 : francais uniquement (LANGUE_DEFAUT = 'fr').
 *
 * Aucune dependance vers core/. Aucune dependance provider/reseau.
 */

import { OBJECTIFS } from '../constants/Objectifs.js'
import { ATTITUDES } from '../constants/Attitudes.js'
import { DIRECTIONS_NARRATIVES } from '../constants/DirectionsNarratives.js'

/**
 * Langue par defaut du sprint. La structure par langue est prete pour i18n,
 * mais une seule langue est fournie a ce stade.
 * @type {string}
 */
export const LANGUE_DEFAUT = 'fr'

/**
 * Directive naturelle pour chaque objectif immediat.
 * @type {Readonly<Record<string, string>>}
 */
const OBJECTIFS_FR = Object.freeze({
  [OBJECTIFS.RENFORCER_RELATION]:
    'Cherche a renforcer et reparer le lien avec le joueur.',
  [OBJECTIFS.PROTEGER_SOI]:
    'Protege-toi et garde une distance prudente face au joueur.',
  [OBJECTIFS.REPONDRE_SOLLICITATION]:
    'Reponds a la sollicitation directe du joueur.',
  [OBJECTIFS.FAIRE_AVANCER]:
    'Fais avancer la situation et la comprehension mutuelle.',
  [OBJECTIFS.MAINTENIR_POSITION]:
    'Maintiens ta position actuelle sans t\'engager davantage.',
})

/**
 * Directive naturelle pour chaque attitude.
 * @type {Readonly<Record<string, string>>}
 */
const ATTITUDES_FR = Object.freeze({
  [ATTITUDES.OUVERTE]:
    'Adopte un ton ouvert et disponible, sans mefiance.',
  [ATTITUDES.NEUTRE]:
    'Adopte un ton neutre, ni chaleureux ni distant.',
  [ATTITUDES.RESERVEE]:
    'Reste sur la reserve, avec une distance perceptible.',
  [ATTITUDES.DEFENSIVE]:
    'Reste sur la defensive et protege-toi face a la menace percue.',
})

/**
 * Directive naturelle pour chaque direction narrative.
 * @type {Readonly<Record<string, string>>}
 */
const DIRECTIONS_FR = Object.freeze({
  [DIRECTIONS_NARRATIVES.INVITER_JOUEUR]:
    'Invite le joueur a s\'exprimer davantage.',
  [DIRECTIONS_NARRATIVES.LAISSER_INITIATIVE]:
    'Laisse au joueur l\'initiative du prochain pas.',
  [DIRECTIONS_NARRATIVES.APPROFONDIR_LIEN]:
    'Approfondis le lien ou reviens sur un moment partage.',
  [DIRECTIONS_NARRATIVES.APAISER_TENSION]:
    'Desamorce la tension et apaise la situation.',
  [DIRECTIONS_NARRATIVES.CONCLURE_SITUATION]:
    'Conclus ou stabilise la situation en cours.',
})

/**
 * Tables de traduction regroupees par langue (structure i18n-ready).
 * @type {Readonly<Record<string, { objectifs: Record<string,string>, attitudes: Record<string,string>, directions: Record<string,string> }>>}
 */
const VOCABULAIRE = Object.freeze({
  [LANGUE_DEFAUT]: Object.freeze({
    objectifs: OBJECTIFS_FR,
    attitudes: ATTITUDES_FR,
    directions: DIRECTIONS_FR,
  }),
})

/**
 * Retourne les tables de la langue demandee, avec repli sur la langue par
 * defaut si la langue n'est pas (encore) disponible.
 *
 * @param {string} [langue]
 * @returns {{ objectifs: Record<string,string>, attitudes: Record<string,string>, directions: Record<string,string> }}
 */
function tablesPour(langue) {
  return VOCABULAIRE[langue] ?? VOCABULAIRE[LANGUE_DEFAUT]
}

/**
 * Traduit un identifiant d'objectif immediat en directive naturelle.
 *
 * @param {string} objectifId
 * @param {string} [langue]
 * @returns {string} Directive en langage naturel, ou chaine vide si inconnu.
 */
export function traduireObjectif(objectifId, langue = LANGUE_DEFAUT) {
  return tablesPour(langue).objectifs[objectifId] ?? ''
}

/**
 * Traduit un identifiant d'attitude en directive naturelle.
 *
 * @param {string} attitudeId
 * @param {string} [langue]
 * @returns {string} Directive en langage naturel, ou chaine vide si inconnu.
 */
export function traduireAttitude(attitudeId, langue = LANGUE_DEFAUT) {
  return tablesPour(langue).attitudes[attitudeId] ?? ''
}

/**
 * Traduit un identifiant de direction narrative en directive naturelle.
 *
 * @param {string} directionId
 * @param {string} [langue]
 * @returns {string} Directive en langage naturel, ou chaine vide si inconnu.
 */
export function traduireDirection(directionId, langue = LANGUE_DEFAUT) {
  return tablesPour(langue).directions[directionId] ?? ''
}
