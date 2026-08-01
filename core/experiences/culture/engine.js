import { randomUUID } from 'node:crypto'
import {
  CULTURE_EXPERIENCE,
  CULTURE_ROLES,
  CULTURE_RULES,
  FUNDAMENTAL_RULES,
  ROLE_RULES,
} from './config.js'
import { loadCultureCharacter } from './character-loader.js'
import { ErreurValidation } from '../../index.js'

export class CultureValidationError extends ErreurValidation {
  constructor(message) {
    super(message)
    this.name = 'CultureValidationError'
  }
}

const isText = value => typeof value === 'string' && value.trim() !== ''
const clampScore = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0

export function validateCultureConfiguration(configuration) {
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) {
    throw new CultureValidationError('La configuration culture doit etre un objet.')
  }
  if (configuration.experience !== CULTURE_EXPERIENCE) {
    throw new CultureValidationError('experience doit valoir "culture".')
  }
  if (!isText(configuration.userLanguage)) throw new CultureValidationError('userLanguage est requis.')
  if (!isText(configuration.message)) throw new CultureValidationError('message est requis.')
  if (!Array.isArray(configuration.participants) || configuration.participants.length < 1 || configuration.participants.length > 2) {
    throw new CultureValidationError('L experience culture accepte un ou deux participants.')
  }

  const characterIds = new Set()
  const roles = new Set()
  for (const participant of configuration.participants) {
    if (!participant || !isText(participant.characterId)) throw new CultureValidationError('characterId est requis.')
    if (characterIds.has(participant.characterId)) throw new CultureValidationError('Les personnages doivent etre differents.')
    characterIds.add(participant.characterId)
    if (!CULTURE_ROLES.includes(participant.role)) throw new CultureValidationError(`Role culture invalide: "${participant.role}".`)
    if (roles.has(participant.role)) throw new CultureValidationError('Chaque role ne peut etre attribue qu une fois.')
    roles.add(participant.role)
    if (!isText(participant.language)) throw new CultureValidationError('Chaque participant doit avoir une langue temporaire.')
  }
  return configuration
}

export function buildCultureContext({ participant, character, state, lastUserMessage }) {
  const translationSource = participant.role === 'translator' && state.turn?.speakerResponse
    ? Object.freeze({
        speakerResponseId: state.turn.speakerResponseId,
        text: state.turn.speakerResponse.text,
        language: state.turn.speakerResponse.language,
        userMessage: state.turn.userMessage,
        explainedInformation: Object.freeze([...state.explainedInformation]),
      })
    : null
  return Object.freeze({
    layers: Object.freeze([
      Object.freeze({ priority: 1, type: 'fundamental', content: FUNDAMENTAL_RULES }),
      Object.freeze({ priority: 2, type: 'experience', content: CULTURE_RULES }),
      Object.freeze({ priority: 3, type: 'character', content: character }),
      Object.freeze({ priority: 4, type: 'temporary-role', content: Object.freeze({
        role: participant.role,
        language: participant.language,
        userLanguage: state.userLanguage,
        rules: ROLE_RULES[participant.role],
        translationSource,
      }) }),
      Object.freeze({ priority: 5, type: 'conversation-state', content: state }),
      Object.freeze({ priority: 6, type: 'last-user-message', content: lastUserMessage }),
    ]),
  })
}

function normalize(value) {
  return String(value ?? '').toLocaleLowerCase().replace(/[^a-z0-9\p{L}]+/gu, ' ').trim()
}

function isRedundant(plan, acceptedPlans) {
  const words = new Set(normalize(plan.contribution).split(' ').filter(word => word.length > 3))
  if (words.size === 0) return false
  return acceptedPlans.some(other => {
    const otherWords = new Set(normalize(other.contribution).split(' ').filter(word => word.length > 3))
    const common = [...words].filter(word => otherWords.has(word)).length
    return common / Math.min(words.size, Math.max(otherWords.size, 1)) >= 0.7
  })
}

export function evaluateCulturePlans(plans) {
  const accepted = []
  return plans.map(rawPlan => {
    const plan = {
      ...rawPlan,
      relevance: clampScore(rawPlan.relevance),
      novelty: clampScore(rawPlan.novelty),
      complementarity: clampScore(rawPlan.complementarity),
      roleCompliance: clampScore(rawPlan.roleCompliance),
      personalityCompliance: clampScore(rawPlan.personalityCompliance),
      timing: clampScore(rawPlan.timing),
    }
    const redundant = isRedundant(plan, accepted)
    const score = (
      plan.relevance + plan.novelty + plan.complementarity +
      plan.roleCompliance + plan.personalityCompliance + plan.timing
    ) / 6
    let status = 'available'
    let reason = plan.reason || 'Contribution pertinente et opportune.'
    if (!plan.shouldSpeak || plan.relevance < 0.35 || plan.roleCompliance < 0.5 || plan.personalityCompliance < 0.5) {
      status = 'rejected'
      reason = plan.reason || 'Contribution insuffisante ou incompatible avec le role.'
    } else if (redundant) {
      status = 'rejected'
      reason = 'Contribution redondante avec une intention deja disponible.'
    } else if (plan.timing < 0.5 || score < 0.55) {
      status = 'deferred'
      reason = plan.reason || 'Bonne contribution, mais trop tot dans l echange.'
    }
    const result = Object.freeze({ ...plan, score, status, reason })
    if (status === 'available') accepted.push(result)
    return result
  })
}

function publicSpeakers(state) {
  return state.activeIntentions
    .filter(intention => intention.status === 'available')
    .map(({ characterId, status }) => ({ characterId, status }))
}

function cloneState(state) {
  return { ...state, participants: [...state.participants], messages: [...state.messages], activeIntentions: [...state.activeIntentions], deferredIntentions: [...state.deferredIntentions], explainedInformation: [...state.explainedInformation], openQuestions: [...state.openQuestions], turn: state.turn ? { ...state.turn, speakerResponse: state.turn.speakerResponse ? { ...state.turn.speakerResponse } : null } : null }
}

function participantForRole(state, role) {
  return state.participants.find(participant => participant.role === role)
}

function beginTurn(state, message) {
  const sequence = (state.turnSequence ?? 0) + 1
  state.turnSequence = sequence
  state.turn = {
    turnId: `${state.conversationId}:turn:${sequence}`,
    userMessageId: `${state.conversationId}:user:${sequence}`,
    userMessage: message,
    phase: participantForRole(state, 'speaker') ? 'waiting-for-speaker' : 'completed',
    speakerResponseId: null,
    translatorResponseId: null,
    speakerResponse: null,
  }
}

function keepEvaluatedIntentions(state, evaluated) {
  state.activeIntentions = evaluated.filter(plan => plan.status !== 'deferred')
  state.deferredIntentions = evaluated.filter(plan => plan.status === 'deferred')
}

function publicConversationState(state) {
  return {
    conversationId: state.conversationId,
    experience: state.experience,
    userLanguage: state.userLanguage,
    participants: state.participants.map(participant => ({ ...participant })),
    messages: state.messages.map(message => ({ ...message })),
    availableSpeakers: publicSpeakers(state),
    lastSpeakerId: state.lastSpeakerId,
    explainedInformation: [...state.explainedInformation],
    openQuestions: [...state.openQuestions],
    status: state.status,
  }
}

export function createCultureEngine({
  generator,
  characterLoader = loadCultureCharacter,
  idFactory = randomUUID,
  debug = false,
  logger = console,
  conversationStore = new Map(),
} = {}) {
  if (!generator || typeof generator.plan !== 'function' || typeof generator.respond !== 'function') {
    throw new CultureValidationError('Le generateur culture doit fournir plan() et respond().')
  }
  if (!(conversationStore instanceof Map)) {
    throw new CultureValidationError('conversationStore doit etre une Map.')
  }
  const conversations = conversationStore
  const log = (event, data) => { if (debug) logger.debug?.('[culture]', event, data) }

  async function planParticipants(state, participants, lastUserMessage) {
    const plans = []
    for (const participant of participants) {
      const character = state.characterSheets[participant.characterId]
      const context = buildCultureContext({ participant, character, state, lastUserMessage })
      log('context', { characterId: participant.characterId, context })
      const proposed = await generator.plan({ characterId: participant.characterId, context })
      plans.push({ characterId: participant.characterId, ...proposed })
    }
    log('plans', plans)
    const evaluated = evaluateCulturePlans(plans)
    log('evaluation', evaluated)
    return evaluated
  }

  async function startCultureConversation(configuration) {
    try {
      validateCultureConfiguration(configuration)
    } catch (error) {
      log('role-or-language-error', { name: error.name, message: error.message })
      throw error
    }
    const sheets = await Promise.all(configuration.participants.map(p => characterLoader(p.characterId)))
    const characterSheets = Object.fromEntries(sheets.map(sheet => [sheet.id, sheet]))
    const state = {
      conversationId: idFactory(), experience: CULTURE_EXPERIENCE,
      userLanguage: configuration.userLanguage,
      participants: configuration.participants.map(p => ({ ...p })),
      messages: [{ role: 'user', content: configuration.message }],
      activeIntentions: [], deferredIntentions: [], lastSpeakerId: null,
      explainedInformation: [], openQuestions: [], status: 'active', characterSheets,
    }
    beginTurn(state, configuration.message)
    const speaker = participantForRole(state, 'speaker')
    const evaluated = speaker ? await planParticipants(state, [speaker], configuration.message) : []
    keepEvaluatedIntentions(state, evaluated)
    conversations.set(state.conversationId, state)
    return { conversationId: state.conversationId, availableSpeakers: publicSpeakers(state) }
  }

  async function generateCharacterResponse({ conversationId, characterId }) {
    const current = conversations.get(conversationId)
    if (!current) throw new CultureValidationError('Conversation culture introuvable.')
    const participant = current.participants.find(item => item.characterId === characterId)
    if (!participant) throw new CultureValidationError('Ce personnage ne participe pas a la conversation.')
    if (participant.role === 'translator' && current.turn?.phase !== 'waiting-for-translator') {
      throw new CultureValidationError('Le translator ne peut pas intervenir avant la reponse du speaker.')
    }
    if (participant.role === 'speaker' && current.turn?.phase !== 'waiting-for-speaker') {
      throw new CultureValidationError('Le speaker ne peut pas intervenir dans cette phase du tour.')
    }
    const intention = current.activeIntentions.find(item => item.characterId === characterId && item.status === 'available')
    if (!intention) throw new CultureValidationError('Ce personnage ne possede pas d intention disponible.')
    const context = buildCultureContext({ participant, character: current.characterSheets[characterId], state: current, lastUserMessage: current.messages.findLast(m => m.role === 'user')?.content ?? '' })
    log('selected-character', { characterId })
    const generated = await generator.respond({ characterId, intention, context })
    if (!generated || !isText(generated.text)) throw new CultureValidationError('Le generateur a retourne une reponse vide.')

    const next = cloneState(current)
    const responseLanguage = isText(generated.language)
      ? generated.language
      : participant.role === 'translator' ? next.userLanguage : participant.language
    next.messages.push({ role: 'character', characterId, content: generated.text, language: responseLanguage })
    next.lastSpeakerId = characterId
    next.activeIntentions = next.activeIntentions.filter(item => item.characterId !== characterId)
    if (Array.isArray(generated.explainedInformation)) next.explainedInformation.push(...generated.explainedInformation)
    if (Array.isArray(generated.openQuestions)) next.openQuestions = [...generated.openQuestions]

    let reevaluated = []
    if (participant.role === 'speaker') {
      next.turn.phase = 'waiting-for-translator'
      next.turn.speakerResponseId = `${next.turn.turnId}:speaker`
      next.turn.speakerResponse = { text: generated.text, language: responseLanguage }
      const translator = participantForRole(next, 'translator')
      reevaluated = translator
        ? await planParticipants(next, [translator], next.turn.userMessage)
        : []
      log('translator-reevaluation', reevaluated)
      keepEvaluatedIntentions(next, reevaluated)
      if (!reevaluated.some(plan => plan.status === 'available')) next.turn.phase = 'completed'
    } else {
      next.turn.translatorResponseId = `${next.turn.turnId}:translator`
      next.turn.phase = 'completed'
      next.activeIntentions = []
      next.deferredIntentions = []
    }
    conversations.set(conversationId, next)
    return { conversationId, characterId, response: generated.text, availableSpeakers: publicSpeakers(next), reevaluatedIntentions: reevaluated.map(({ characterId: id, status }) => ({ characterId: id, status })) }
  }

  async function addCultureUserMessage(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new CultureValidationError('Les parametres du message utilisateur sont requis.')
    }
    const { conversationId, message } = input
    if (!isText(conversationId)) throw new CultureValidationError('conversationId est requis.')
    const current = conversations.get(conversationId)
    if (!current) throw new CultureValidationError('Conversation culture introuvable.')
    if (current.status !== 'active') throw new CultureValidationError('La conversation culture est inactive.')
    if (!isText(message)) throw new CultureValidationError('Le message utilisateur doit etre une chaine non vide.')

    const next = cloneState(current)
    next.messages.push({ role: 'user', content: message })
    const previousIntentions = [...next.activeIntentions, ...next.deferredIntentions]
    next.activeIntentions = []
    next.deferredIntentions = []
    log('intentions-to-reevaluate', previousIntentions)

    beginTurn(next, message)
    const speaker = participantForRole(next, 'speaker')
    const evaluated = speaker ? await planParticipants(next, [speaker], message) : []
    keepEvaluatedIntentions(next, evaluated)
    conversations.set(conversationId, next)
    return {
      conversationId,
      availableSpeakers: publicSpeakers(next),
      conversationStatus: next.status,
    }
  }

  return Object.freeze({
    startCultureConversation,
    generateCharacterResponse,
    addCultureUserMessage,
    getConversationState(conversationId) {
      const state = conversations.get(conversationId)
      return state ? publicConversationState(state) : undefined
    },
  })
}

export function addCultureUserMessage(cultureEngine, input) {
  if (!cultureEngine || typeof cultureEngine.addCultureUserMessage !== 'function') {
    throw new CultureValidationError('Une instance du moteur Culture est requise.')
  }
  return cultureEngine.addCultureUserMessage(input)
}

export function startCultureConversation(cultureEngine, input) {
  if (!cultureEngine || typeof cultureEngine.startCultureConversation !== 'function') {
    throw new CultureValidationError('Une instance du moteur Culture est requise.')
  }
  return cultureEngine.startCultureConversation(input)
}

export function generateCharacterResponse(cultureEngine, input) {
  if (!cultureEngine || typeof cultureEngine.generateCharacterResponse !== 'function') {
    throw new CultureValidationError('Une instance du moteur Culture est requise.')
  }
  return cultureEngine.generateCharacterResponse(input)
}
