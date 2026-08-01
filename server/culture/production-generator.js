const PLAN_KEYS = Object.freeze([
  'understood', 'intention', 'contribution', 'relevance', 'novelty',
  'complementarity', 'roleCompliance', 'personalityCompliance', 'timing',
  'estimatedLength', 'shouldSpeak', 'reason',
])

const PLAN_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: PLAN_KEYS,
  properties: {
    understood: { type: 'string' },
    intention: { type: 'string' },
    contribution: { type: 'string' },
    relevance: { type: 'number', minimum: 0, maximum: 1 },
    novelty: { type: 'number', minimum: 0, maximum: 1 },
    complementarity: { type: 'number', minimum: 0, maximum: 1 },
    roleCompliance: { type: 'number', minimum: 0, maximum: 1 },
    personalityCompliance: { type: 'number', minimum: 0, maximum: 1 },
    timing: { type: 'number', minimum: 0, maximum: 1 },
    estimatedLength: { type: 'string', enum: ['short', 'medium', 'long'] },
    shouldSpeak: { type: 'boolean' },
    reason: { type: 'string' },
  },
})

const RESPONSE_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['text', 'language'],
  properties: {
    text: { type: 'string' },
    language: { type: 'string' },
  },
})

export class CultureProductionGeneratorError extends Error {
  constructor(code, stage, message, cause) {
    super(message)
    this.name = 'CultureProductionGeneratorError'
    this.code = code
    this.stage = stage
    this.cause = cause
  }
}

function structuredRequest(name, schema) {
  return { text: { format: { type: 'json_schema', name, strict: true, schema } } }
}

function parseJson(content, stage) {
  if (typeof content !== 'string' || content.trim() === '') {
    throw new CultureProductionGeneratorError('EMPTY_MODEL_RESPONSE', stage, 'Le fournisseur a retourne une reponse vide.')
  }
  try {
    return JSON.parse(content)
  } catch (cause) {
    throw new CultureProductionGeneratorError('INVALID_STRUCTURED_OUTPUT', stage, 'La sortie structuree du fournisseur est invalide.', cause)
  }
}

function validatePlan(plan) {
  const keys = plan && !Array.isArray(plan) ? Object.keys(plan).sort() : []
  if (JSON.stringify(keys) !== JSON.stringify([...PLAN_KEYS].sort())) return false
  for (const key of ['understood', 'intention', 'contribution', 'reason']) {
    if (typeof plan[key] !== 'string') return false
  }
  for (const key of ['relevance', 'novelty', 'complementarity', 'roleCompliance', 'personalityCompliance', 'timing']) {
    if (!Number.isFinite(plan[key]) || plan[key] < 0 || plan[key] > 1) return false
  }
  return ['short', 'medium', 'long'].includes(plan.estimatedLength) && typeof plan.shouldSpeak === 'boolean'
}

function validateResponse(response, expectedLanguage) {
  return response
    && !Array.isArray(response)
    && Object.keys(response).sort().join(',') === 'language,text'
    && typeof response.text === 'string'
    && response.text.trim() !== ''
    && response.language === expectedLanguage
}

function contextPayload(input) {
  return JSON.stringify({ characterId: input.characterId, layers: input.context.layers })
}

function planPrompt(input) {
  const temporaryRole = input.context.layers[3].content
  const translatorRule = temporaryRole.role === 'translator'
    ? 'Ton plan doit porter uniquement sur la derniere intervention exacte du speaker: la traduire, en expliquer une nuance linguistique ou culturelle, ou rester silencieux si cela n apporte rien. Ne planifie jamais une seconde reponse independante a la demande utilisateur.'
    : 'Tu es le speaker du tour courant et tu reponds naturellement a la demande utilisateur dans ta langue temporaire, sans traduire ta propre reponse.'
  return [
    'Construis uniquement le plan interne du personnage au format JSON impose.',
    'Ne redige aucune reponse visible, aucun dialogue et aucun raisonnement detaille.',
    'Evalue la pertinence, la nouveaute, la complementarite, le role, la personnalite et le moment.',
    'Le personnage peut choisir de se taire.',
    translatorRule,
    contextPayload(input),
  ].join('\n\n')
}

function responsePrompt(input, expectedLanguage) {
  const temporaryRole = input.context.layers[3].content
  const roleRule = temporaryRole.role === 'speaker'
    ? `Reponds uniquement en ${temporaryRole.language}, sans traduction automatique.`
    : [
        `Reponds par defaut en ${temporaryRole.userLanguage}.`,
        'Instruction prioritaire: ta reponse doit porter sur la derniere intervention du speaker.',
        'Tu ne dois pas repondre directement a la demande utilisateur comme un second interlocuteur independant.',
        'Traduis cette intervention ou explique seulement une nuance linguistique, une reference culturelle ou un passage difficile, sans repetition ni lecon systematique.',
        `Source exacte a traiter: ${JSON.stringify(temporaryRole.translationSource)}.`,
      ].join(' ')
  return [
    'Genere uniquement la reponse visible du personnage choisi.',
    roleRule,
    'Reste naturel, concis et fidele a la fiche, aux valeurs, aux limites et au style de communication.',
    `Langue de sortie declaree obligatoire: ${expectedLanguage}.`,
    JSON.stringify({ characterId: input.characterId, intention: input.intention, layers: input.context.layers }),
  ].join('\n\n')
}

export function createProductionCultureGenerator({ clientGeneration, timeoutMs = 30000, logger = console } = {}) {
  if (!clientGeneration || typeof clientGeneration.generer !== 'function') {
    throw new CultureProductionGeneratorError('MODEL_NOT_CONFIGURED', 'runtime', 'Le client de generation Culture est absent.')
  }

  async function generateStructured({ prompt, schema, name, stage, repair = false }) {
    const startedAt = Date.now()
    try {
      const result = await clientGeneration.generer(
        { contenu: prompt },
        { request: structuredRequest(name, schema), timeoutMs },
      )
      return result.contenu
    } catch (cause) {
      const code = cause?.name === 'AbortError' || /timeout/i.test(cause?.message || '')
        ? 'MODEL_TIMEOUT'
        : 'MODEL_PROVIDER_ERROR'
      logger.error?.('[culture-production]', {
        stage,
        code,
        repair,
        durationMs: Date.now() - startedAt,
        providerType: cause?.name,
        providerStatus: cause?.status,
        providerCode: cause?.code,
      })
      throw new CultureProductionGeneratorError(code, stage, 'Echec du fournisseur de generation.', cause)
    }
  }

  return Object.freeze({
    async plan(input) {
      const prompt = planPrompt(input)
      let content = await generateStructured({ prompt, schema: PLAN_SCHEMA, name: 'culture_plan', stage: 'plan' })
      let parsed
      try {
        parsed = parseJson(content, 'plan')
        if (!validatePlan(parsed)) throw new CultureProductionGeneratorError('INVALID_STRUCTURED_OUTPUT', 'plan', 'Le plan Culture est incomplet.')
      } catch (firstError) {
        const repairPrompt = `${prompt}\n\nLa sortie precedente etait invalide. Retourne une seule fois un JSON strictement conforme, sans texte additionnel.`
        content = await generateStructured({ prompt: repairPrompt, schema: PLAN_SCHEMA, name: 'culture_plan_repair', stage: 'plan', repair: true })
        parsed = parseJson(content, 'plan')
        if (!validatePlan(parsed)) throw new CultureProductionGeneratorError('INVALID_STRUCTURED_OUTPUT', 'plan', 'Le plan Culture reste invalide apres reparation.', firstError)
      }
      return Object.freeze(parsed)
    },

    async respond(input) {
      const temporaryRole = input.context.layers[3].content
      const expectedLanguage = temporaryRole.role === 'speaker'
        ? temporaryRole.language
        : temporaryRole.userLanguage
      const content = await generateStructured({
        prompt: responsePrompt(input, expectedLanguage),
        schema: RESPONSE_SCHEMA,
        name: 'culture_response',
        stage: 'respond',
      })
      const parsed = parseJson(content, 'respond')
      if (!validateResponse(parsed, expectedLanguage)) {
        throw new CultureProductionGeneratorError('LANGUAGE_OR_RESPONSE_INVALID', 'respond', 'La reponse visible ou sa langue est invalide.')
      }
      return Object.freeze(parsed)
    },
  })
}

export { PLAN_SCHEMA, RESPONSE_SCHEMA }
