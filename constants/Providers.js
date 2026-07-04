/**
 * constants/Providers.js
 *
 * Identifiants officiels des providers IA supportes par Gabida.
 * Utilises comme cles dans le registre de api/.
 *
 * Usage :
 *   registerProvider(PROVIDERS.OPENAI, openaiAdapter)
 *   callProvider(prompt, { provider: PROVIDERS.OPENAI, ... })
 *
 * Ces identifiants sont stables — ils ne dependent pas des noms de modeles
 * ni des versions des API des providers.
 */

export const PROVIDERS = Object.freeze({
  OPENAI    : 'openai',
  ANTHROPIC : 'anthropic',
  GEMINI    : 'gemini',
  MISTRAL   : 'mistral',
  LOCAL     : 'local',
})
