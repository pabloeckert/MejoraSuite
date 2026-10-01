// apps/shell/electron/zernio-dispatcher.mjs
// Despachador de publicaciones hacia Zernio API para @mejora/sm
// Diseñado bajo política Zero Trust: las credenciales provienen exclusivamente
// de variables de entorno locales (.env o process.env), nunca hardcodeadas.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Intentar cargar variables desde apps/shell/.env o la raíz si no están ya en process.env
function ensureEnvLoaded() {
  if (process.env.ZERNIO_API_KEY) return

  const candidatePaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '..', '.env')
  ]

  for (const envFile of candidatePaths) {
    if (fs.existsSync(envFile)) {
      try {
        if (typeof process.loadEnvFile === 'function') {
          process.loadEnvFile(envFile)
        } else {
          const lines = fs.readFileSync(envFile, 'utf8').split('\n')
          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#')) {
              const eqIdx = trimmed.indexOf('=')
              if (eqIdx > 0) {
                const k = trimmed.slice(0, eqIdx).trim()
                const v = trimmed.slice(eqIdx + 1).trim()
                if (k && !process.env[k]) {
                  process.env[k] = v
                }
              }
            }
          }
        }
      } catch (e) {
        // Ignorar errores de parsing individuales
      }
      if (process.env.ZERNIO_API_KEY) break
    }
  }
}

/**
 * Verifica si las credenciales de Zernio están configuradas en el entorno local.
 */
export function isZernioConfigured() {
  ensureEnvLoaded()
  return Boolean(process.env.ZERNIO_API_KEY)
}

/**
 * Extrae texto canónico y multimedia de la propuesta (soporta tanto JSON como texto plano).
 */
function extractProposalContent(propuesta) {
  let content = propuesta.contenido || propuesta.titulo || ''
  let imageUrl = null

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === 'object') {
        const parts = [
          parsed.hook,
          parsed.body,
          parsed.cta,
          Array.isArray(parsed.hashtags) ? parsed.hashtags.join(' ') : parsed.hashtags
        ].filter(Boolean)

        if (parts.length > 0) {
          content = parts.join('\n\n')
        }
        imageUrl = parsed.rendered_image_path || parsed.image_url || null
      }
    } catch {
      // Es texto plano o markdown
    }
  }

  return { content, imageUrl }
}

/**
 * Despacha una propuesta programada a la API de Zernio.
 * @param {Object} propuesta - Registro de sm_propuestas de SQLite
 * @returns {Promise<{ success: boolean, status: number, zernioPostId?: string, error?: string, data?: any }>}
 */
export async function dispatchPropuestaZernio(propuesta) {
  ensureEnvLoaded()

  const apiKey = process.env.ZERNIO_API_KEY
  if (!apiKey) {
    return {
      success: false,
      status: 401,
      error: 'ZERNIO_API_KEY no encontrada en variables de entorno locales ni en archivo .env'
    }
  }

  const endpoint = process.env.ZERNIO_API_URL || 'https://zernio.com/api/v1/posts'
  const { content, imageUrl } = extractProposalContent(propuesta)

  // Configuración de plataformas destinatarias
  const platforms = []
  if (process.env.ZERNIO_INSTAGRAM_ACCOUNT_ID) {
    platforms.push({ platform: 'instagram', accountId: process.env.ZERNIO_INSTAGRAM_ACCOUNT_ID })
  }
  if (process.env.ZERNIO_FACEBOOK_ACCOUNT_ID) {
    platforms.push({ platform: 'facebook', accountId: process.env.ZERNIO_FACEBOOK_ACCOUNT_ID })
  }
  if (platforms.length === 0) {
    platforms.push({ platform: 'instagram' }, { platform: 'facebook' })
  }

  const mediaItems = []
  if (imageUrl) {
    mediaItems.push({ type: 'image', url: imageUrl })
  }

  const payload = {
    content,
    mediaItems,
    platforms,
    publishNow: true
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000)
    })

    let data = {}
    try {
      data = await res.json()
    } catch {
      // Respuesta no JSON (ej. HTML o 502)
    }

    if (res.status === 200 || res.status === 201) {
      const zernioPostId = data.post?.id || data.id || data.postId || null
      return {
        success: true,
        status: res.status,
        zernioPostId,
        data
      }
    }

    const errorMessage = data.message || data.error || `HTTP ${res.status} ${res.statusText}`
    return {
      success: false,
      status: res.status,
      error: `Error Zernio (${res.status}): ${errorMessage}`,
      data
    }
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError'
    return {
      success: false,
      status: isTimeout ? 408 : 0,
      error: isTimeout
        ? 'Timeout de conexión (30s) al intentar despachar a Zernio'
        : `Falla de red al conectar con Zernio: ${err.message}`
    }
  }
}
