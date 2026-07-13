import { jest } from '@jest/globals'
import { openaiAdapter } from './openai.js'
import { ROLES_MESSAGE_INTERNE } from '../../constants/RolesMessageInterne.js'

const messages = [
  { role: ROLES_MESSAGE_INTERNE.SYSTEM, contenu: 'Reponds en JSON.' },
  { role: ROLES_MESSAGE_INTERNE.USER, contenu: 'Bonjour.' },
]
const parametres = {
  modele: 'gpt-test',
  timeout: 1000,
  options: { temperature: 0.7 },
}
const config = { cleApi: 'test-key' }

function reponseOpenAI(contenu) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: contenu } }],
      usage: { prompt_tokens: 12, completion_tokens: 7 },
    }),
  }
}

describe('openaiAdapter', () => {
  const fetchOriginal = globalThis.fetch
  let logSpy

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    globalThis.fetch = fetchOriginal
    logSpy.mockRestore()
  })

  test('demande le mode JSON et retourne le contrat canonique', async () => {
    globalThis.fetch = jest.fn(async () =>
      reponseOpenAI(JSON.stringify({ action: 'Elle avance.', dialogue: 'Bonjour.' }))
    )

    const reponse = await openaiAdapter(messages, parametres, config)
    const corps = JSON.parse(globalThis.fetch.mock.calls[0][1].body)

    expect(corps.response_format).toEqual({ type: 'json_object' })
    expect(reponse).toEqual({
      action: 'Elle avance.',
      dialogue: 'Bonjour.',
      tokensEntree: 12,
      tokensSortie: 7,
    })
  })

  test('rejette un contenu qui n est pas du JSON valide', async () => {
    globalThis.fetch = jest.fn(async () => reponseOpenAI('Elle avance.'))

    await expect(openaiAdapter(messages, parametres, config))
      .rejects.toThrow('reponse JSON invalide')
  })

  test('rejette un objet qui ne contient pas exactement action et dialogue', async () => {
    globalThis.fetch = jest.fn(async () =>
      reponseOpenAI(JSON.stringify({ action: 'Elle avance.', dialogue: 'Bonjour.', extra: true }))
    )

    await expect(openaiAdapter(messages, parametres, config))
      .rejects.toThrow('exactement deux chaines')
  })
})
