/**
 * api/providers/openai.js
 *
 * Adaptateur de reference pour le provider OpenAI.
 *
 * Responsabilite : convertir les types internes Gabida (MessageInterne, ParametresExecution)
 * vers le format attendu par l'API OpenAI, executer l'appel, et retourner une ReponseRaw.
 *
 * Ce fichier est le seul endroit du moteur Gabida qui connait le format OpenAI.
 *
 * Enregistrement (depuis l'application hote) :
 *   import { registerProvider } from '../api/index.js'
 *   import { openaiAdapter }    from '../api/providers/openai.js'
 *   import { PROVIDERS }        from '../constants/Providers.js'
 *   registerProvider(PROVIDERS.OPENAI, openaiAdapter)
 *
 * Modeles compatibles : gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo, o1, o3-mini...
 *
 * @module api/providers/openai
 */

import { ROLES_MESSAGE_INTERNE } from '../../constants/RolesMessageInterne.js'

// ─── Constantes locales ───────────────────────────────────────────────────────

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const ROLE_MAP = Object.freeze({
  [ROLES_MESSAGE_INTERNE.SYSTEM]    : 'system',
  [ROLES_MESSAGE_INTERNE.USER]      : 'user',
  [ROLES_MESSAGE_INTERNE.ASSISTANT] : 'assistant',
})

// ─── Helpers purs ─────────────────────────────────────────────────────────────

/**
 * convertirMessages(messages)
 *
 * Pure. Convertit les MessageInterne Gabida vers le format messages OpenAI.
 *
 * @param {import('../index.js').MessageInterne[]} messages
 * @returns {{ role: string, content: string }[]}
 */
function convertirMessages(messages) {
  return messages.map(msg => ({
    role    : ROLE_MAP[msg.role] ?? msg.role,
    content : msg.contenu,
  }))
}

/**
 * construireCorps(messages, parametres)
 *
 * Pure. Construit le corps JSON de la requete OpenAI.
 *
 * @param {{ role: string, content: string }[]} messages
 * @param {import('../index.js').ParametresExecution} parametres
 * @returns {object}
 */
function construireCorps(messages, parametres) {
  return {
    model    : parametres.modele,
    messages,
    ...parametres.options,
  }
}

/**
 * extraireReponseRaw(data)
 *
 * Pure. Extrait les champs normalises depuis la reponse JSON OpenAI.
 *
 * @param {object} data -- Corps JSON parse de la reponse OpenAI
 * @returns {import('../index.js').ReponseRaw}
 */
function extraireReponseRaw(data) {
  const texte = data.choices?.[0]?.message?.content ?? ''

  console.log('========== RAW OPENAI ==========')
  console.log(texte)
  console.log('================================')

  return {
    texte,
    tokensEntree  : data.usage?.prompt_tokens     ?? 0,
    tokensSortie  : data.usage?.completion_tokens ?? 0,
  }
}

// ─── Adaptateur ───────────────────────────────────────────────────────────────

/**
 * openaiAdapter(messages, parametres, config)
 *
 * Adaptateur OpenAI conforme au contrat Adaptateur de api/.
 * Convertit les types internes Gabida vers le format OpenAI.
 * Effectue l'appel HTTP. Retourne une ReponseRaw normalisee.
 *
 * @param {import('../index.js').MessageInterne[]} messages
 * @param {import('../index.js').ParametresExecution} parametres
 * @param {import('../index.js').ProviderConfig} config
 * @returns {Promise<import('../index.js').ReponseRaw>}
 */
export async function openaiAdapter(messages, parametres, config) {
  const messagesConverts = convertirMessages(messages)
  const corps            = construireCorps(messagesConverts, parametres)

  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), parametres.timeout)

  let reponse
  try {
    reponse = await fetch(OPENAI_API_URL, {
      method  : 'POST',
      headers : {
        'Content-Type'  : 'application/json',
        'Authorization' : `Bearer ${config.cleApi}`,
      },
      body   : JSON.stringify(corps),
      signal : controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!reponse.ok) {
    const erreur = await reponse.text().catch(() => '(corps illisible)')
    throw new Error(
      `api.openaiAdapter : echec HTTP ${reponse.status} — ${erreur}`
    )
  }

  const data = await reponse.json()
  return extraireReponseRaw(data)
}
