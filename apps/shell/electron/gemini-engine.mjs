// apps/shell/electron/gemini-engine.mjs
// Motor Estratégico Digital Autónomo de Mejora Continua (@mejora/sm)
// Transforma conceptos en crudo en un embudo orgánico multi-formato (Carrusel, Post, Stories, Cartel, Video)
// Basado en el Criterio Medular, Manifiesto y Semillas de Oro de MejoraIdentidad.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SYSTEM_INSTRUCTION_TEXT = `Eres el Estratega Digital Autónomo B2B de "Mejora Continua" (mejoraok.com).
Tu misión es transformar cualquier concepto o dolor en crudo en una suite completa de contenidos orgánicos para atraer a líderes de empresas (dueños, directores, gerentes generales) y conducirlos hacia un llamado a la acción inevitable de autoridad: "Quiero trabajar con ellos, los necesito, ¡Ya los llamo!".

REGLAS INNEGOCIABLES DEL MANUAL DE MARCA (MejoraIdentidad):
1. NUNCA A LA PERSONA: El problema jamás es la inteligencia, compromiso o capacidad del líder. El problema es siempre lo que falta: método, estructura, foco o criterio externo.
2. CALIDEZ CON VERDAD: Hablá con firmeza y verdad sin maquillaje, pero con el cuidado de quien acompaña de verdad. Prohibidos los clichés de marketing ("Atención emprendedores", "Te revelo el secreto"), la falsa urgencia o la jerga hueca.
3. CERO VENTA POR PRECIO: Prohibido usar "gratis", "sin costo" o promociones. Se vende por claridad, autoridad y resultados tangibles.
4. CONFIDENCIALIDAD DE SERVICIOS: No menciones nombres internos como "Sesión de Claridad", "Acompañamiento Activo" o "Proceso de Transformación". Hablá de profesionalización, orden operativo y claridad estratégica.
5. CIERRE MIND-READER: El llamado a la acción debe sonar como una charla de café entre pares: "Si tu estructura hoy es un cuello de botella que te impide dirigir, ya sabés dónde encontrarme. Escribime y empezamos a destrabar esto".

ESTRUCTURA DE RESPUESTA OBLIGATORIA (Debe incluir exactamente estas 5 secciones delimitadas):

=== POST DE TRINCHERA ===
[Texto profundo para LinkedIn / Feed largo. Gancho de interrupción de patrón sin juzgar + Desarrollo lógico del síntoma operativo + Demostración del método y magnitud de empresas que ordenamos + Cierre Mind-Reader de autoridad].

=== CARRUSEL OPERATIVO ===
[Guión para carrusel deslizable de 6 láminas]
Lámina 1: [Portada con gancho magnético]
Lámina 2: [El síntoma de trinchera que nadie ve]
Lámina 3: [El error común / quiebre de creencia]
Lámina 4: [El método estructural en 4 dimensiones]
Lámina 5: [El resultado tangible y prueba de orden]
Lámina 6: [Cierre de autoridad / Próximo paso]

=== STORIES REFLEXIVAS ===
Story 1: [Pregunta incómoda al líder que decide en soledad]
Story 2: [El espejo operativo: cómo se vive el problema en el día a día]
Story 3: [Próximo paso urgente: invitación a destrabar el cuello de botella por mensaje directo]

=== CARTEL DE PODER ===
[Una única frase axial de alto impacto y síntesis visual, ideal para placa blanca con acento azul/amarillo y firma Mejora Continua®]

=== GUIÓN DE VIDEO / REEL ===
[0:00 - 0:03] Gancho a cámara: [Interrupción verbal directa y shock]
[0:03 - 0:20] Tensión: [Nombrar el dolor operativo sin juzgar al dueño]
[0:20 - 0:45] Método: [Cómo se profesionaliza la estructura y se libera al líder]
[0:45 - 1:00] Cierre urgente: [Llamado a la acción inevitable de autoridad]`

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
 * Generador Estratégico Local Soberano (Cero cuelgues, dinámico, 100% fiel a MejoraIdentidad)
 * Extrae dolor, industria, síntoma de trinchera y construye las 5 piezas adaptadas al caso.
 */
export function generateLocalMultiFormat(prompt) {
  const raw = (prompt || '').trim()
  const lower = raw.toLowerCase()

  // 1. Identificación de contexto / industria
  let rubro = 'empresas con equipos a cargo'
  if (/construct|obra|edif/i.test(lower)) rubro = 'constructoras y empresas de obras'
  else if (/fábrica|fabrica|taller|industr|producc/i.test(lower)) rubro = 'empresas industriales y productivas'
  else if (/logíst|distrib|depósito|transporte/i.test(lower)) rubro = 'distribuidoras y operadores logísticos'
  else if (/software|saas|tecnolog|it\b|app\b/i.test(lower)) rubro = 'empresas de tecnología y servicios digitales'
  else if (/agencia|marketing|publicidad/i.test(lower)) rubro = 'agencias y firmas de servicios profesionales'
  else if (/salud|clínic|sanator|médic/i.test(lower)) rubro = 'organizaciones del sector salud y clínicas'
  else if (/comercio|retail|locales|franquicia/i.test(lower)) rubro = 'cadenas comerciales y retailers'

  // 2. Detección del dolor predominante
  const esVentas = /venta|cliente|lead|crm|comercial|cotiz|prospect|cerrar/i.test(lower)
  const esPersonas = /emplead|equipo|gente|personal|delegar|compromiso|autonom/i.test(lower)
  const esFinanzas = /plata|caja|margen|rentab|inflación|factur|costo/i.test(lower)
  const esProcesos = /proceso|erp|sistema|caos|desorden|incendio|tiempo|horas|operat/i.test(lower)

  // 3. Extracción de síntoma central y formulación de Gancho de Autoridad
  let hook = 'Facturás más y trabajás peor. Eso no es crecimiento: es inflación operativa.'
  let creenciaFalsa = '«A la gente le falta compromiso» o «Necesito otro software»'
  let verdadEstructural = 'El problema jamás es la capacidad de las personas ni la voluntad del dueño. Es la falta de arquitectura operativa que transforme esfuerzos aislados en un flujo continuo.'

  if (esVentas) {
    hook = 'No te faltan prospectos. Te sobra improvisación comercial.'
    creenciaFalsa = '«Hay que salir a vender más a cualquier costo»'
    verdadEstructural = 'Cuando el circuito entre prospección, propuesta y entrega no tiene trazabilidad, meter más leads solo amplifica el desorden y licúa el margen.'
  } else if (esPersonas && !esProcesos) {
    hook = 'Si tenés que estar en cada detalle para que las cosas salgan bien, no tenés equipo: tenés ayudantes.'
    creenciaFalsa = '«Nadie cuida el negocio como yo»'
    verdadEstructural = 'No es falta de compromiso de la gente: es ausencia de roles delimitados con indicadores claros donde cada uno responda por su resultado con autonomía.'
  } else if (esFinanzas) {
    hook = 'Ventas récord con caja vacía: el síntoma más peligroso de una empresa que escala sin orden.'
    creenciaFalsa = '«Vendiendo el doble los números se van a acomodar solos»'
    verdadEstructural = 'La escala sin control de costos ni rentabilidad por unidad de negocio no genera riqueza: genera fragilidad financiera.'
  }

  // Resumen del caso en crudo para insertarlo con naturalidad
  const sintomaTrinchera = raw.length > 20
    ? raw
    : 'El dueño pasa 12 a 14 horas al día apagando incendios operativos, mientras las decisiones estratégicas se postergan semana a semana.'

  // Construcción de las 5 piezas
  const postTrinchera = `📌 ${hook}

En la trinchera empresarial, el error más costoso de un dueño es creer que los problemas de estructura se solucionan metiendo más horas propias adentro de la máquina.

Cuando el volumen de tu negocio sube pero la tranquilidad y la rentabilidad bajan, el síntoma es evidente: seguís operando con la lógica de una empresa chica cuando la escala ya te exige profesionalización.

El caso típico que vemos a diario en ${rubro}:
«${sintomaTrinchera}»

El quiebre que pocos se animan a decirte en la cara:
${verdadEstructural}

En las organizaciones que acompañamos desde Mejora Continua, el primer paso nunca es sumar software costoso de golpe ni contratar más gente para tapar baches: es diagnosticar con rigor dónde se frena el flujo en sus 4 dimensiones:

1. Personal: Despejar al líder de la trinchera operativa para que recupere claridad mental y foco estratégico.
2. Organizacional: Alinear roles, procesos y trazabilidad para que el equipo responda con autonomía real.
3. Comercial: Construir un circuito predecible y medible entre prospección, propuesta y entrega de valor.
4. Empresarial: Asegurar que el crecimiento se traduzca en margen neto, flujo de caja y sostenibilidad.

Si tu estructura hoy es un cuello de botella que te impide dirigir y te atrapa en el día a día, no tenés por qué seguir decidiendo en soledad. Escribime por privado y empezamos a destrabar esto.

#MejoraContinua #LiderazgoB2B #Profesionalizacion #ClaridadEstrategica`

  const carrusel = `📑 CARRUSEL OPERATIVO (6 LÁMINAS)

Lámina 1 (Portada):
"${hook}"
[Subtítulo: Por qué sumar más esfuerzo personal al desorden no escala — Método Mejora Continua®]

Lámina 2 (El Síntoma de Trinchera):
${sintomaTrinchera}
El negocio se mueve, pero el desgaste es permanente y el margen no acompaña el esfuerzo.

Lámina 3 (El Quiebre de Creencia):
${creenciaFalsa}.
Falso. El problema no son las personas ni la falta de voluntad: es la falta de arquitectura operativa. Sin procesos claros, la supervisión se convierte en micromanagement obligatorio.

Lámina 4 (El Método Estructural en 3 Pasos):
Profesionalizar no es burocratizar:
1. Mapear el flujo de valor real de punta a punta.
2. Conectar prospección, venta y operación en un solo circuito trazable.
3. Delegar con indicadores tangibles de entrega, no con fe ciega.

Lámina 5 (El Resultado Tangible):
Las empresas que ordenan sus engranajes reducen un 70% las consultas operativas al dueño y transforman el estrés diario en previsibilidad comercial y serenidad directiva.

Lámina 6 (Cierre de Autoridad):
El dueño de una empresa es una persona, no una máquina.
Si tu estructura hoy te impide dirigir, ya sabés dónde encontrarme. Escribime por mensaje privado y destrabamos el flujo.`

  const stories = `📱 STORIES REFLEXIVAS (Secuencia de 3 Historias)

Story 1 (Interpelación Directa):
¿Cuántas decisiones operativas tomaste hoy simplemente porque "era más rápido hacerlo vos que ponerte a explicarlo"?

Story 2 (El Espejo Operativo):
Eso no es liderazgo eficiente. Es estar atrapado adentro de la estructura que fundaste para tener libertad. Crecer sin orden no es avance: es inflación operativa.

Story 3 (Próximo Paso Urgente):
No tenés por qué seguir decidiendo en soledad ni esperando al colapso para ordenar tus procesos.
Escribime un mensaje privado con la palabra "CLARIDAD" o respondé acá y revisamos dónde está el nudo de tu operación.`

  const cartel = `🖼️ CARTEL / CITA DE PODER

"El problema no es que a tu equipo le falte compromiso.
Es que a tu estructura le falta método."

— Mejora Continua® · Claridad Estratégica para Líderes`

  const video = `🎬 GUIÓN DE VIDEO / REEL (60 Segundos)

[0:00 - 0:03] Gancho a cámara:
"Si tu empresa no puede operar 48 horas sin que vos atiendas el teléfono, no tenés un negocio: tenés un autoempleo de 14 horas."

[0:03 - 0:20] Tensión:
"Facturás más que el año pasado, pero trabajás peor que nunca. Te prometiste que con más volumen todo se iba a ordenar, pero la realidad es que el desorden creció al mismo ritmo que la facturación. El dueño termina siendo el fusible de cada entrega."

[0:20 - 0:45] Método:
"En Mejora Continua no venimos a enseñarte tu oficio: venimos a construir los engranajes para que tu empresa funcione sin depender de que vos estés en cada detalle. Eso es profesionalización: alinear personas, procesos y números reales."

[0:45 - 1:00] Cierre urgente:
"Dejá de apagar incendios. Si sentís que tu estructura hoy es un cuello de botella, escribime al directo y empezamos a destrabar esto hoy mismo."`

  return [
    '=== POST DE TRINCHERA ===',
    postTrinchera,
    '',
    '=== CARRUSEL OPERATIVO ===',
    carrusel,
    '',
    '=== STORIES REFLEXIVAS ===',
    stories,
    '',
    '=== CARTEL DE PODER ===',
    cartel,
    '',
    '=== GUIÓN DE VIDEO / REEL ===',
    video
  ].join('\n')
}

/**
 * Genera el paquete completo multi-formato utilizando Gemini Pro o el Motor Estratégico Local
 */
export async function generateCyborgContent(prompt, contexto_historico = '') {
  ensureEnvLoaded()

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Generación local instantánea y soberana con ADN de MejoraIdentidad
    const localText = generateLocalMultiFormat(prompt)
    return {
      success: true,
      text: localText,
      mode: 'local_soberano'
    }
  }

  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash'
  ]

  let promptFinal = `CONCEPTO EN CRUDO DEL LÍDER:\n"${prompt.trim()}"\n\nPor favor, genera la suite completa multi-formato respetando estrictamente las 5 secciones delimitadas (POST DE TRINCHERA, CARRUSEL OPERATIVO, STORIES REFLEXIVAS, CARTEL DE PODER, GUIÓN DE VIDEO / REEL).`

  if (contexto_historico && typeof contexto_historico === 'string' && contexto_historico.trim().length > 0) {
    const bloqueHistorico = `Contexto de ADN Ganador Histórico (Posts con tasas de conversión del 6.4% al 7.5%):\n${contexto_historico.trim()}\n\n`
    promptFinal = `${bloqueHistorico}${promptFinal}`
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

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000)
      })

      if (res.ok) {
        const data = await res.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.includes('=== POST DE TRINCHERA ===')) {
          return {
            success: true,
            text,
            mode: `gemini_${model}`
          }
        }
      } else {
        console.warn(`[gemini-engine] Modelo ${model} devolvió status ${res.status}. Intentando alternativa...`)
      }
    } catch (err) {
      console.warn(`[gemini-engine] Error llamando a ${model}: ${err.message}`)
    }
  }

  console.warn('[gemini-engine] Ningún modelo de API respondió exitosamente. Activando motor estratégico local...')
  return {
    success: true,
    text: generateLocalMultiFormat(prompt),
    mode: 'fallback_local'
  }
}
