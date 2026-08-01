import { createServer } from 'node:http'
import { createCultureHandlers, mapCultureHttpError } from './culture/handlers.js'
import { cultureRuntime } from './culture/runtime.js'

const ROUTES = Object.freeze({
  '/api/v2/culture/start': 'start',
  '/api/v2/culture/message': 'message',
  '/api/v2/culture/response': 'response',
})

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

async function readJson(request) {
  if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    const error = new TypeError('Content-Type application/json requis.')
    error.httpStatus = 415
    throw error
  }
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (body.length > 1_000_000) {
      const error = new TypeError('Payload trop volumineux.')
      error.httpStatus = 413
      throw error
    }
  }
  try {
    return JSON.parse(body)
  } catch {
    const error = new TypeError('JSON invalide.')
    error.httpStatus = 400
    throw error
  }
}

export function createGabidaHttpServer({ runtime = cultureRuntime } = {}) {
  const handlers = createCultureHandlers(runtime.cultureEngine)
  return createServer(async (request, response) => {
    const operation = ROUTES[new URL(request.url, 'http://localhost').pathname]
    if (!operation) return sendJson(response, 404, { error: { code: 'ROUTE_NOT_FOUND', message: 'Route introuvable.' } })
    if (request.method !== 'POST') return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } })
    try {
      sendJson(response, 200, await handlers[operation](await readJson(request)))
    } catch (error) {
      if (error.httpStatus) return sendJson(response, error.httpStatus, { error: { code: 'INVALID_HTTP_REQUEST', message: error.message } })
      const mapped = mapCultureHttpError(error)
      sendJson(response, mapped.status, { error: mapped.error })
    }
  })
}
