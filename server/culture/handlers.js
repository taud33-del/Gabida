import {
  addCultureUserMessage,
  generateCharacterResponse,
  startCultureConversation,
} from '../../core/experiences/culture/index.js'
import { mapCultureHttpError } from './errors.js'

function publicAvailability(result) {
  return {
    conversationId: result.conversationId,
    availableSpeakers: result.availableSpeakers,
  }
}

export function createCultureHandlers(cultureEngine) {
  return Object.freeze({
    async start(payload) {
      return publicAvailability(await startCultureConversation(cultureEngine, payload))
    },
    async message(payload) {
      const result = await addCultureUserMessage(cultureEngine, payload)
      return { ...publicAvailability(result), conversationStatus: result.conversationStatus }
    },
    async response(payload) {
      const result = await generateCharacterResponse(cultureEngine, payload)
      return {
        ...publicAvailability(result),
        characterId: result.characterId,
        response: result.response,
        conversationStatus: 'active',
      }
    },
  })
}

export { mapCultureHttpError }
