#!/usr/bin/env node

import { createGabidaHttpServer } from '../server/http.js'

const server = createGabidaHttpServer()
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const baseUrl = `http://127.0.0.1:${server.address().port}`

async function post(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json()
  if (!response.ok) throw new Error(`${response.status}: ${body.error?.message}`)
  return body
}

try {
  const started = await post('/api/v2/culture/start', {
    experience: 'culture',
    userLanguage: 'fr',
    participants: [
      { characterId: 'solene-han', role: 'speaker', language: 'sv' },
      { characterId: 'sonia-nadir', role: 'translator', language: 'sv' },
    ],
    message: 'Bonjour, j’aimerais découvrir la culture suédoise.',
  })
  console.log('START', JSON.stringify(started, null, 2))

  const solene = await post('/api/v2/culture/response', {
    conversationId: started.conversationId,
    characterId: 'solene-han',
  })
  console.log('SOLENE', JSON.stringify(solene, null, 2))

  const message = await post('/api/v2/culture/message', {
    conversationId: started.conversationId,
    message: 'Pouvez-vous expliquer ce que signifie fika ?',
  })
  console.log('MESSAGE', JSON.stringify(message, null, 2))

  const sonia = await post('/api/v2/culture/response', {
    conversationId: started.conversationId,
    characterId: 'sonia-nadir',
  })
  console.log('SONIA', JSON.stringify(sonia, null, 2))
} finally {
  await new Promise(resolve => server.close(resolve))
}
