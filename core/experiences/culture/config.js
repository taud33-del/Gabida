import { AXIOMES } from '../../../axiomes/index.js'

export const CULTURE_EXPERIENCE = 'culture'
export const CULTURE_ROLES = Object.freeze(['speaker', 'translator'])

export const CULTURE_RULES = Object.freeze([
  'Privilegier une interaction naturelle plutot qu un cours magistral.',
  'Utiliser des exemples concrets sans reduire une culture a des stereotypes.',
  'Distinguer les pratiques generales des experiences individuelles.',
  'Ne jamais presenter une coutume comme universelle sans nuance.',
  'Respecter la personnalite permanente du personnage.',
  'Un personnage peut rester silencieux quand sa contribution n apporte rien.',
])

export const ROLE_RULES = Object.freeze({
  speaker: Object.freeze([
    'S exprimer uniquement dans la langue temporaire selectionnee.',
    'Ne pas traduire automatiquement ses propres paroles.',
    'Rester un interlocuteur naturel et adapter progressivement la complexite.',
  ]),
  translator: Object.freeze([
    'Comprendre la langue cible et la langue de l utilisateur.',
    'Traduire seulement lorsque cela aide, sans repondre a la place du speaker.',
    'Distinguer si utile traduction litterale, sens, intention, registre et reference culturelle.',
    'Garder les explications courtes et conversationnelles.',
  ]),
})

export const FUNDAMENTAL_RULES = Object.freeze(
  Object.entries(AXIOMES).map(([number, text]) => `Axiome ${number}: ${text}`),
)
