// apps/shell/electron/gemini-engine.mjs
// Motor de Generación Asistida con Gemini 1.5 Pro para MejoraSuite (@mejora/sm)
// Integra el rol de Motor Estratégico de 'Mejora Continua' para creación híbrida B2B.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SYSTEM_INSTRUCTION_TEXT = `Rol y Objetivo:
Eres el Motor de Growth Marketing B2B de "Mejora Continua". Tu único objetivo es redactar contenido orgánico para atraer líderes (emprendedores saturados, empresarios que necesitan orden) y convertirlos en clientes.
Reglas Estrictas (Criterio Medular):
1. Nunca a la persona: Confronta la situación, jamás al individuo. El problema siempre es lo que falta (foco, estructura, criterio externo), nunca la capacidad del líder.
2. Calidez con verdad: Sé directo y profesional. Prohibidas las frases motivacionales vacías, la agresividad, la jerga o la falsa urgencia. Clarifica, no vendas humo.
3. Cero ganchos de precio: Jamás uses la palabra "gratis" o "sin costo" para intentar enganchar.
4. CONFIDENCIALIDAD DE SERVICIOS: Los términos "Sesión de Claridad", "Acompañamiento Activo" y "Proceso de Transformación" son de uso 100% interno para tu contexto. ESTÁ ESTRICTAMENTE PROHIBIDO mencionarlos en las publicaciones.
Estructura Obligatoria del Contenido:
- 3 Opciones de Gancho (Hook): Nombra el dolor del líder sin juzgarlo (ej. "estás resolviendo diez cosas a la vez", "decidís en soledad").
- Cuerpo: Quita la culpa personal y explica la raíz lógica ("esto funciona así, por eso pasa esto"). Conecta la solución con la "Profesionalización" y nuestras áreas de impacto (Personal, Organizacional, Comercial, Empresarial).
- 3. Llamado a la Acción (CTA Mind-Reader): ANIKILÁ el concepto tradicional de CTA. Prohibidos los imperativos de venta, órdenes transaccionales o falsa urgencia (ej. 'Comprá ahora', 'Hacé clic acá', 'Agendá hoy'). El cierre debe ser una conclusión inevitable de autoridad, como si estuvieran tomando un café frente a frente. Debe generar alivio, no presión. Ejemplos de estilo obligatorios: 'Si tu estructura hoy es un cuello de botella, ya sabés dónde encontrarme' o 'No tenés por qué seguir decidiendo en soledad. Escribime y empezamos a destrabar esto'. Clarificá, no vendas.`

function ensureEnvLoaded() {
  if (process.env.GEMINI_API_KEY) return

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
      } catch {
        // Ignorar errores de lectura
      }
      if (process.env.GEMINI_API_KEY) break
    }
  }
}

/**
 * Genera contenido estratégico B2B utilizando Gemini 1.5 Pro REST API con inyección de ADN ganador
 * @param {string} prompt - Tema o consulta inicial del usuario
 * @param {string} [contexto_historico=''] - Bloque de textos con los posts más exitosos para calibrar el patrón lógico y tono
 * @returns {Promise<{ success: boolean, text?: string, error?: string }>}
 */
export async function generateCyborgContent(prompt, contexto_historico = '') {
  ensureEnvLoaded()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      success: false,
      error: 'GEMINI_API_KEY no encontrada en variables de entorno locales ni en archivo .env'
    }
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`

  let promptFinal = prompt
  if (contexto_historico && typeof contexto_historico === 'string' && contexto_historico.trim().length > 0) {
    const bloqueHistorico = `Contexto de Rendimiento: Los siguientes 3 textos son nuestros posts más exitosos recientes. Analizá su patrón lógico, su tono y su ritmo. Generá la nueva propuesta basándote en este ADN ganador, sin copiarlos textualmente:\n${contexto_historico.trim()}\n\n`
    promptFinal = `${bloqueHistorico}${prompt}`
  }

  const requestBody = {
    system_instruction: {
      parts: [
        {
          text: SYSTEM_INSTRUCTION_TEXT
        }
      ]
    },
    contents: [
      {
        parts: [
          {
            text: promptFinal
          }
        ]
      }
    ]
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(45000)
    })

    let data = {}
    try {
      data = await res.json()
    } catch {
      // Ignorar fallo de parseo JSON si la respuesta no lo es
    }

    if (!res.ok) {
      const errorMsg = data?.error?.message || `HTTP ${res.status}: ${res.statusText}`
      return {
        success: false,
        error: `Error Gemini API (${res.status}): ${errorMsg}`
      }
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return {
        success: false,
        error: 'Gemini no devolvió texto en los candidatos de respuesta.'
      }
    }

    return {
      success: true,
      text
    }
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError'
    return {
      success: false,
      error: isTimeout
        ? 'Timeout de conexión (45s) esperando respuesta de Gemini AI'
        : `Falla de comunicación con Gemini: ${err.message}`
    }
  }
}
