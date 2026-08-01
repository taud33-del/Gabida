#!/usr/bin/env node

import { createGabidaHttpServer } from '../server/http.js'

const port = Number.parseInt(process.env.PORT || '3001', 10)
const host = process.env.HOST || '127.0.0.1'
const server = createGabidaHttpServer()

server.listen(port, host, () => {
  console.log(`Serveur Gabida Culture disponible sur http://${host}:${port}`)
})
