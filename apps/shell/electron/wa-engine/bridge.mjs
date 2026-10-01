// Bridge HTTP local para que las aplicaciones de MejoraSuite (CRM, Contactos, Shell)
// puedan consultar el estado de WhatsApp y disparar envios en tiempo real.
//
// Solo escucha en 127.0.0.1 (nunca 0.0.0.0) y exige un token compartido
// por header (X-Bridge-Token) — generado y guardado en userData.

import http from 'node:http'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const PORT = 4180
const HOST = '127.0.0.1'

let server = null
const sseClients = new Set()

function safeTokenEquals(provided, expected) {
  if (typeof provided !== 'string') return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function loadOrCreateToken(userDataDir) {
  const tokenFile = path.join(userDataDir, 'bridge-token.txt')
  if (fs.existsSync(tokenFile)) {
    const existing = fs.readFileSync(tokenFile, 'utf8').trim()
    if (existing) return existing
  }
  const token = crypto.randomBytes(24).toString('hex')
  try {
    fs.mkdirSync(userDataDir, { recursive: true })
    fs.writeFileSync(tokenFile, token, 'utf8')
  } catch (err) {
    console.warn('[bridge] No se pudo persistir bridge-token.txt en disco:', err.message)
  }
  return token
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 32768) req.destroy()
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('JSON invalido'))
      }
    })
    req.on('error', reject)
  })
}

function withCommonHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Bridge-Token')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  // Private Network Access (Chromium spec)
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
}

/**
 * Arranca el servidor HTTP puente. No bloquea el hilo principal.
 * @param {string} userDataDir Directorio de datos del usuario
 * @param {Function} getState Funcion sincrona/asincrona que retorna el estado actual
 * @param {Function} handleSend Funcion para enviar a un miembro existente
 * @param {Function} handleAddAndSend Funcion para dar de alta y enviar
 * @returns {{ server: http.Server, token: string, broadcastEvent: (tipo: string, data: any) => void }}
 */
export function startBridgeServer(userDataDir, getState, handleSend, handleAddAndSend) {
  if (server) {
    return { server, token: loadOrCreateToken(userDataDir), broadcastEvent }
  }

  const token = loadOrCreateToken(userDataDir)

  server = http.createServer(async (req, res) => {
    withCommonHeaders(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    // El endpoint /status en GET es publico para chequeos de health local de la suite,
    // o requiere token si viene con header
    const providedToken = req.headers['x-bridge-token']
    const isPublicHealth = req.method === 'GET' && req.url === '/status'

    if (!isPublicHealth && !safeTokenEquals(providedToken, token)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Token invalido o faltante (header X-Bridge-Token)' }))
      return
    }

    if (req.method === 'GET' && req.url === '/status') {
      try {
        const state = typeof getState === 'function' ? await getState() : {}
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(state))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
      return
    }

    if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      try {
        const initialState = typeof getState === 'function' ? await getState() : {}
        res.write(`event: hello\ndata: ${JSON.stringify(initialState)}\n\n`)
      } catch {}
      sseClients.add(res)
      req.on('close', () => sseClients.delete(res))
      return
    }

    if (req.method === 'POST' && req.url === '/send') {
      let body
      try {
        body = await readJsonBody(req)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'JSON invalido' }))
        return
      }
      if (!body.telefono) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Falta "telefono" en el body' }))
        return
      }
      try {
        const result = await handleSend(body.telefono, body.carpetaId, body.mensaje)
        res.writeHead(result?.error ? 400 : 200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
      return
    }

    if (req.method === 'POST' && req.url === '/add-and-send') {
      let body
      try {
        body = await readJsonBody(req)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'JSON invalido' }))
        return
      }
      if (!body.telefono) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Falta "telefono" en el body' }))
        return
      }
      try {
        const result = await handleAddAndSend(body.telefono, body.nombre, body.mensaje)
        res.writeHead(result?.error ? 400 : 200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(result))
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      }
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
  })

  server.on('error', (err) => {
    console.error('[bridge] Error en servidor HTTP puente:', err.message)
  })

  server.listen(PORT, HOST, () => {
    console.log(`[wa-engine/bridge] Escuchando en http://${HOST}:${PORT} (token en ${path.join(userDataDir, 'bridge-token.txt')})`)
  })

  function broadcastEvent(tipo, data) {
    const payload = `event: ${tipo}\ndata: ${JSON.stringify(data)}\n\n`
    for (const client of sseClients) {
      try {
        client.write(payload)
      } catch {
        sseClients.delete(client)
      }
    }
  }

  return { server, token, broadcastEvent }
}

export function stopBridgeServer() {
  for (const client of sseClients) {
    try { client.end() } catch {}
  }
  sseClients.clear()
  if (server) {
    server.close()
    server = null
  }
}
