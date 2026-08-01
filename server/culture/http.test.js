import { createGabidaHttpServer } from '../http.js'
import { createCultureRuntime } from './runtime.js'
import { createCultureSimulationGenerator } from './simulation-generator.js'

const configuration = {
  experience: 'culture',
  userLanguage: 'fr',
  participants: [
    { characterId: 'solene-han', role: 'speaker', language: 'sv' },
    { characterId: 'sonia-nadir', role: 'translator', language: 'sv' },
  ],
  message: 'Bonjour, j’aimerais découvrir la culture suédoise.',
}

function post(baseUrl, path, body, headers = { 'Content-Type': 'application/json' }) {
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
}

describe('serveur HTTP Culture', () => {
  let server
  let baseUrl

  beforeAll(async () => {
    const runtime = createCultureRuntime({ generator: createCultureSimulationGenerator() })
    server = createGabidaHttpServer({ runtime })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    baseUrl = `http://127.0.0.1:${server.address().port}`
  })

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve))
  })

  test('demarre une conversation valide en JSON', async () => {
    const response = await post(baseUrl, '/api/v2/culture/start', configuration)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/^application\/json/)
    expect(typeof body.conversationId).toBe('string')
    expect(body.availableSpeakers).toEqual([{ characterId: 'solene-han', status: 'available' }])
  })

  test('conserve la meme conversation et instance pendant le cycle complet', async () => {
    const started = await (await post(baseUrl, '/api/v2/culture/start', configuration)).json()
    const solene = await (await post(baseUrl, '/api/v2/culture/response', {
      conversationId: started.conversationId, characterId: 'solene-han',
    })).json()
    expect(solene.conversationId).toBe(started.conversationId)
    expect(solene.response).toMatch(/^Hej!/)

    const messageResponse = await post(baseUrl, '/api/v2/culture/message', {
      conversationId: started.conversationId,
      message: 'Pouvez-vous expliquer ce que signifie fika ?',
    })
    const message = await messageResponse.json()
    expect(message.conversationId).toBe(started.conversationId)
    expect(message.conversationStatus).toBe('active')
    expect(message).not.toHaveProperty('response')
    expect(message.availableSpeakers).toEqual([{ characterId: 'solene-han', status: 'available' }])

    const blockedTranslator = await post(baseUrl, '/api/v2/culture/response', {
      conversationId: started.conversationId, characterId: 'sonia-nadir',
    })
    expect(blockedTranslator.status).toBe(409)

    await post(baseUrl, '/api/v2/culture/response', {
      conversationId: started.conversationId, characterId: 'solene-han',
    })

    const sonia = await (await post(baseUrl, '/api/v2/culture/response', {
      conversationId: started.conversationId, characterId: 'sonia-nadir',
    })).json()
    expect(sonia.conversationId).toBe(started.conversationId)
    expect(sonia.response).toMatch(/^Le fika/)
    expect(sonia.conversationStatus).toBe('active')
  })

  test('ne divulgue ni plans ni fiches dans aucune sortie publique', async () => {
    const started = await (await post(baseUrl, '/api/v2/culture/start', configuration)).json()
    const generated = await (await post(baseUrl, '/api/v2/culture/response', {
      conversationId: started.conversationId, characterId: 'solene-han',
    })).json()
    for (const output of [started, generated]) {
      const serialized = JSON.stringify(output)
      expect(serialized).not.toMatch(/activeIntentions|deferredIntentions|characterSheets|permanentProfile|contribution|score/)
    }
  })

  test('refuse un payload invalide avec 400', async () => {
    const response = await post(baseUrl, '/api/v2/culture/start', { experience: 'culture' })
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('CULTURE_INVALID_REQUEST')
  })

  test('refuse une conversation inconnue avec 404', async () => {
    const response = await post(baseUrl, '/api/v2/culture/message', { conversationId: 'inconnue', message: 'Bonjour' })
    expect(response.status).toBe(404)
    expect((await response.json()).error).toEqual({ code: 'CULTURE_CONVERSATION_NOT_FOUND', message: 'Conversation introuvable.' })
  })

  test('refuse un personnage non disponible avec 409', async () => {
    const started = await (await post(baseUrl, '/api/v2/culture/start', configuration)).json()
    await post(baseUrl, '/api/v2/culture/response', { conversationId: started.conversationId, characterId: 'solene-han' })
    const response = await post(baseUrl, '/api/v2/culture/response', { conversationId: started.conversationId, characterId: 'solene-han' })
    expect(response.status).toBe(409)
    expect((await response.json()).error.code).toBe('CULTURE_SPEAKER_NOT_AVAILABLE')
  })

  test('exige application/json sans configurer de CORS navigateur', async () => {
    const response = await post(baseUrl, '/api/v2/culture/start', configuration, { 'Content-Type': 'text/plain' })
    expect(response.status).toBe(415)
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  test('refuse une methode autre que POST', async () => {
    const response = await fetch(`${baseUrl}/api/v2/culture/start`)
    expect(response.status).toBe(405)
  })

  test('laisse les routes inconnues isolees des experiences existantes', async () => {
    const response = await post(baseUrl, '/api/v2/question', {})
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('ROUTE_NOT_FOUND')
  })
})

test('les trois handlers partagent exactement la meme instance injectee', async () => {
  const calls = []
  const engine = {
    async startCultureConversation(payload) {
      calls.push(['start', this, payload])
      return { conversationId: 'shared', availableSpeakers: [] }
    },
    async addCultureUserMessage(payload) {
      calls.push(['message', this, payload])
      return { conversationId: 'shared', availableSpeakers: [], conversationStatus: 'active' }
    },
    async generateCharacterResponse(payload) {
      calls.push(['response', this, payload])
      return { conversationId: 'shared', characterId: payload.characterId, response: 'ok', availableSpeakers: [] }
    },
  }
  const server = createGabidaHttpServer({ runtime: { cultureEngine: engine } })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`
  await post(baseUrl, '/api/v2/culture/start', {})
  await post(baseUrl, '/api/v2/culture/message', {})
  await post(baseUrl, '/api/v2/culture/response', { characterId: 'x' })
  await new Promise(resolve => server.close(resolve))
  expect(calls.map(([operation]) => operation)).toEqual(['start', 'message', 'response'])
  expect(calls.every(([, instance]) => instance === engine)).toBe(true)
})
