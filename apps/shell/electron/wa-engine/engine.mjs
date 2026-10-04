// Motor de WhatsApp (wa-engine) para MejoraSuite
// Reemplaza por completo el uso de lowdb por persistencia SQLite nativa en @mejora/nucleo.
// Utiliza @whiskeysockets/baileys con almacenamiento fisico de claves en userData/wa-auth.

import path from 'node:path'
import fs from 'node:fs'
import pino from 'pino'
import QRCode from 'qrcode'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys'

import {
  getWsSession,
  updateWsSession,
  getWsCarpetas,
  getWsCarpetaById,
  getWsCarpetaByNombre,
  createWsCarpeta,
  getWsMiembros,
  findWsMiembroByTelefono,
  createWsMiembro,
  getPersonas,
  createPersona
} from '@mejora/nucleo'

import { normalizePhone, extractText } from './pure.mjs'
import { startBridgeServer, stopBridgeServer } from './bridge.mjs'

const logger = pino({ level: 'silent' })

let sock = null
let waStatus = 'desconectado'
let bridge = null
let currentAuthDir = null
let isConnecting = false

const CARPETA_CONTACTOS_NOMBRE = 'Importados desde MejoraContactos'

/**
 * Retorna el estado en memoria y persistido del motor WhatsApp
 */
export function getWaEngineState() {
  const session = getWsSession('default') || {
    id: 1,
    session_name: 'default',
    status: waStatus,
    qr_code: null,
    phone: null
  }
  return {
    connected: waStatus === 'conectado',
    waStatus,
    phone: session.phone || null,
    qr: session.qr_code || null,
    session
  }
}

/**
 * Conecta o reconecta Baileys a WhatsApp Web.
 * Operacion asincrona no bloqueante.
 */
export async function connectWhatsApp() {
  if (isConnecting || waStatus === 'conectado') {
    return { ok: true, status: waStatus }
  }

  if (!currentAuthDir) {
    throw new Error('El motor wa-engine no ha sido inicializado con un directorio de autenticacion')
  }

  isConnecting = true
  waStatus = 'conectando'
  updateWsSession('default', { status: 'conectando' })
  bridge?.broadcastEvent('status', waStatus)

  try {
    fs.mkdirSync(currentAuthDir, { recursive: true })
    const { state, saveCreds } = await useMultiFileAuthState(currentAuthDir)
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['MejoraSuite', 'Desktop', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr)
          waStatus = 'escaneando_qr'
          updateWsSession('default', { status: 'escaneando_qr', qr_code: dataUrl })
          bridge?.broadcastEvent('qr', dataUrl)
          bridge?.broadcastEvent('status', waStatus)
        } catch {
          updateWsSession('default', { status: 'escaneando_qr', qr_code: qr })
          bridge?.broadcastEvent('qr', qr)
        }
      }

      if (connection === 'open') {
        isConnecting = false
        waStatus = 'conectado'
        const phone = sock?.user?.id ? normalizePhone(sock.user.id.split(':')[0] || sock.user.id.split('@')[0]) : null
        updateWsSession('default', { status: 'conectado', qr_code: null, phone })
        bridge?.broadcastEvent('status', waStatus)
        console.log('[wa-engine] WhatsApp conectado exitosamente. Telefono:', phone)
      }

      if (connection === 'close') {
        isConnecting = false
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        waStatus = shouldReconnect ? 'reconectando' : 'desconectado'
        updateWsSession('default', {
          status: waStatus,
          qr_code: null
        })
        bridge?.broadcastEvent('status', waStatus)
        console.log(`[wa-engine] WhatsApp desconectado (reconectar: ${shouldReconnect}, code: ${statusCode})`)

        if (shouldReconnect) {
          setTimeout(() => {
            connectWhatsApp().catch((err) => console.error('[wa-engine] Error en reconexion:', err.message))
          }, 3000)
        } else {
          sock = null
          // Credenciales invalidadas (logout): purgar archivos de clave fisicos locales
          try {
            if (fs.existsSync(currentAuthDir)) {
              fs.rmSync(currentAuthDir, { recursive: true, force: true })
            }
          } catch (err) {
            console.warn('[wa-engine] No se pudo purgar wa-auth:', err.message)
          }
        }
      }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const msg of messages || []) {
        if (msg.key.fromMe) continue
        const jid = msg.key.remoteJid || ''
        if (!jid.endsWith('@s.whatsapp.net')) continue

        const phone = normalizePhone(jid.split('@')[0])
        const text = extractText(msg)
        if (!phone || !text) continue

        bridge?.broadcastEvent('message', {
          phone,
          text,
          recibidoEn: new Date().toISOString()
        })
      }
    })

    return { ok: true, status: waStatus }
  } catch (err) {
    isConnecting = false
    waStatus = 'desconectado'
    updateWsSession('default', { status: 'desconectado' })
    bridge?.broadcastEvent('status', waStatus)
    console.error('[wa-engine] Error al inicializar socket Baileys:', err.message)
    return { ok: false, error: err.message }
  }
}

/**
 * Cierra la sesion actual de Baileys
 */
export async function logoutWhatsApp() {
  try {
    await sock?.logout()
  } catch {
    // Si la sesion ya esta cerrada, ignorar error
  }
  sock = null
  waStatus = 'desconectado'
  updateWsSession('default', { status: 'desconectado', qr_code: null })
  bridge?.broadcastEvent('status', waStatus)

  if (currentAuthDir && fs.existsSync(currentAuthDir)) {
    try {
      fs.rmSync(currentAuthDir, { recursive: true, force: true })
    } catch {}
  }
  return { ok: true }
}

/**
 * Despacha un envio de WhatsApp para un miembro existente en SQLite
 */
export async function handleSend(telefono, carpetaId, mensajePersonalizado) {
  if (!sock || waStatus !== 'conectado') {
    return { error: 'WhatsApp no esta conectado' }
  }

  const normPhone = normalizePhone(telefono)
  if (!normPhone) {
    return { error: 'Telefono invalido' }
  }

  // Resolver carpeta en SQLite
  let carpeta = null
  if (carpetaId) {
    carpeta = getWsCarpetaById(Number(carpetaId))
  }
  if (!carpeta) {
    const todas = getWsCarpetas()
    carpeta = todas[0] || null
  }
  if (!carpeta) {
    return { error: 'No existen carpetas de WhatsApp configuradas en SQLite' }
  }

  // Verificar si es miembro en SQLite, o darlo de alta en la carpeta
  let miembro = findWsMiembroByTelefono(carpeta.id, normPhone)
  if (!miembro) {
    try {
      miembro = createWsMiembro({
        carpeta_id: carpeta.id,
        telefono: normPhone
      })
    } catch {
      // Continuar con el envío
    }
  }

  const jid = `${normPhone}@s.whatsapp.net`
  const texto = mensajePersonalizado || 'Hola, mensaje desde MejoraSuite.'

  try {
    const sent = await sock.sendMessage(jid, { text: texto })
    return {
      started: true,
      msgId: sent?.key?.id || null,
      telefono: normPhone,
      carpeta: carpeta.nombre
    }
  } catch (err) {
    return { error: `Error enviando mensaje WhatsApp: ${err.message}` }
  }
}

/**
 * Da de alta en SQLite (Persona + Carpeta + Miembro) y despacha el envio
 */
export async function handleAddAndSend(telefono, nombre, mensajePersonalizado) {
  const normPhone = normalizePhone(telefono)
  if (!normPhone) {
    return { error: 'Telefono invalido' }
  }

  // 1. Obtener o crear carpeta dedicada en SQLite
  let carpeta = getWsCarpetaByNombre(CARPETA_CONTACTOS_NOMBRE)
  if (!carpeta) {
    carpeta = createWsCarpeta({
      nombre: CARPETA_CONTACTOS_NOMBRE,
      color: '#3b82f6'
    })
  }

  // 2. Obtener o crear Persona en Contactos SQLite
  let persona = null
  try {
    const personas = getPersonas()
    persona = personas.find((p) => p.nombre.toLowerCase() === (nombre || normPhone).toLowerCase())
    if (!persona) {
      persona = createPersona({
        nombre: nombre || normPhone,
        notas: 'Importado automaticamente desde MejoraContactos via wa-engine'
      })
    }
  } catch (pErr) {
    console.warn('[wa-engine] No se pudo vincular Persona en SQLite:', pErr.message)
  }

  // 3. Obtener o crear WsMiembro en SQLite
  let miembro = findWsMiembroByTelefono(carpeta.id, normPhone)
  if (!miembro) {
    miembro = createWsMiembro({
      carpeta_id: carpeta.id,
      persona_id: persona?.id || null,
      telefono: normPhone
    })
  }

  // 4. Delegar en handleSend
  return handleSend(normPhone, carpeta.id, mensajePersonalizado)
}

/**
 * Arranca silenciosamente el motor de WhatsApp y el puente HTTP.
 * No bloquea el hilo principal de Electron.
 */
export function startWaEngine({ userDataDir, waAuthDir, autoConnect = false }) {
  const resolvedUserData = userDataDir || process.cwd()
  currentAuthDir = waAuthDir || path.join(resolvedUserData, 'wa-auth')

  // Inicializar estado persistido en SQLite
  try {
    const sess = getWsSession('default')
    if (!sess) {
      updateWsSession('default', { status: 'desconectado' })
    } else {
      waStatus = sess.status === 'conectado' ? 'reconectando' : 'desconectado'
    }
  } catch (dbErr) {
    console.error('[wa-engine] Error al sincronizar sesion con SQLite:', dbErr.message)
  }

  // Iniciar servidor bridge en 127.0.0.1:4180
  bridge = startBridgeServer(
    resolvedUserData,
    getWaEngineState,
    handleSend,
    handleAddAndSend
  )

  // Si existen credenciales previas en disco o se solicita autoConnect, conectar en segundo plano
  const hasSavedCreds = fs.existsSync(path.join(currentAuthDir, 'creds.json'))
  if (autoConnect || hasSavedCreds) {
    console.log('[wa-engine] Credenciales detectadas en wa-auth. Iniciando conexion en segundo plano...')
    setTimeout(() => {
      connectWhatsApp().catch((err) => {
        console.warn('[wa-engine] Fallo intento inicial de auto-conexion:', err.message)
      })
    }, 1000)
  }

  return {
    connect: connectWhatsApp,
    logout: logoutWhatsApp,
    getState: getWaEngineState,
    stop: stopWaEngine
  }
}

/**
 * Detiene el motor y el servidor bridge
 */
export function stopWaEngine() {
  stopBridgeServer()
  try {
    sock?.end()
  } catch {}
  sock = null
  waStatus = 'desconectado'
}
