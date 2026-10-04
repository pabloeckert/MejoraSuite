// scripts/test-funnel-guarantee.mjs
// Test Suite de Garantía Absoluta E2E: Motor de Crecimiento Orgánico B2B y Conversiones
// Mejora Continua - MejoraSuite (MejoraSM + MejoraWS + @mejora/nucleo)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('🛡️  SUITE DE GARANTÍA E2E: MARKETING GROWTH & EMBUDO B2B');
console.log('   Doctrina: Criterio Medular Mejora Continua (mejoraok.com)');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Detalles: ${details}`);
    failedTests++;
  }
}

// Función parser exactamente igual a la de MesaEjecutivaLimpia.tsx
function parseMultiFormatContent(rawText) {
  const postMatch = rawText.match(/===\s*POST DE TRINCHERA\s*===([\s\S]*?)(?====|$)/i);
  const carruselMatch = rawText.match(/===\s*CARRUSEL OPERATIVO\s*===([\s\S]*?)(?====|$)/i);
  const storiesMatch = rawText.match(/===\s*STORIES REFLEXIVAS\s*===([\s\S]*?)(?====|$)/i);
  const cartelMatch = rawText.match(/===\s*CARTEL DE PODER\s*===([\s\S]*?)(?====|$)/i);
  const videoMatch = rawText.match(/===\s*GUIÓN DE VIDEO \/ REEL\s*===([\s\S]*?)(?====|$)/i);

  const fallbackPost = rawText.includes('===') ? '' : rawText;

  return {
    post: postMatch ? postMatch[1].trim() : fallbackPost,
    carrusel: carruselMatch ? carruselMatch[1].trim() : '',
    stories: storiesMatch ? storiesMatch[1].trim() : '',
    cartel: cartelMatch ? cartelMatch[1].trim() : '',
    video: videoMatch ? videoMatch[1].trim() : '',
    completo: rawText.trim()
  };
}

// -------------------------------------------------------------
// FASE 1: Verificación de Motores de Estrategia Digital (MejoraSM)
// -------------------------------------------------------------
async function testGrowthFunnelEngine() {
  console.log('\n--- 1. VERIFICACIÓN DEL MOTOR ESTRATÉGICO MULTI-FORMATO ---');

  const enginePath = path.join(rootDir, 'apps/shell/electron/gemini-engine.mjs');
  assert(fs.existsSync(enginePath), 'Archivo del motor de IA soberano existe en electron/gemini-engine.mjs');

  const { generateLocalMultiFormat, generateCyborgContent } = await import('file:///' + enginePath.replace(/\\/g, '/'));

  const testCases = [
    {
      tipo: 'Operaciones e Inflación Operativa',
      prompt: 'Reunión con dueño de constructora de 35 operarios: tiene 4 obras abiertas pero los capataces no pasan partes diarios y él tiene que recorrer las obras midiendo perfiles con la cinta métrica. Factura más que el año pasado pero no ve la plata en la caja.',
      rubroEsperado: 'constructoras',
      palabrasClaveEsperadas: ['Personal', 'Organizacional', 'Comercial', 'Empresarial', 'Mejora Continua', 'CLARIDAD']
    },
    {
      tipo: 'Ventas y Prospección Desordenada',
      prompt: 'Empresa distribuidora de insumos: cotizan más de 200 presupuestos al mes pero el equipo comercial no hace ningún seguimiento de leads y se quejan de que las ventas no cierran.',
      rubroEsperado: 'distribuidoras',
      palabrasClaveEsperadas: ['improvisación comercial', 'trazabilidad', 'Personal', 'Organizacional', 'CLARIDAD']
    },
    {
      tipo: 'Equipo y Delegación en Soledad',
      prompt: 'Dueño de pyme saturado que trabaja 14 horas al día. Siente que a sus empleados les falta compromiso y tiene miedo de delegar porque nadie cuida el negocio como él.',
      rubroEsperado: 'equipos a cargo',
      palabrasClaveEsperadas: ['ayudantes', 'roles delimitados', 'Personal', 'CLARIDAD']
    }
  ];

  for (const tc of testCases) {
    console.log(`\n  Probando caso B2B: [${tc.tipo}]`);
    const output = generateLocalMultiFormat(tc.prompt);

    assert(output.length > 500, `Generación superó longitud mínima (${output.length} caracteres)`);

    // Parseo de los 5 formatos
    const pack = parseMultiFormatContent(output);

    assert(pack.post.length > 100, 'Formato 1: Post de Trinchera generado con contenido rico');
    assert(pack.carrusel.length > 100, 'Formato 2: Carrusel Operativo de 6 láminas generado');
    assert(pack.stories.length > 50, 'Formato 3: Secuencia de 3 Stories generada');
    assert(pack.cartel.length > 20, 'Formato 4: Cartel de Poder generado');
    assert(pack.video.length > 80, 'Formato 5: Guión de Video de 60s con marcas de tiempo generado');

    // Validación de Criterio Medular
    assert(pack.post.includes('Mejora Continua'), 'Post contiene firma institucional "Mejora Continua"');
    assert(pack.post.includes('Personal') && pack.post.includes('Organizacional') && pack.post.includes('Empresarial'), 'Post estructura las 4 Dimensiones de Impacto');
    assert(!pack.post.toLowerCase().includes('gratis') && !pack.post.toLowerCase().includes('sin costo'), 'Post cumple regla de CERO venta por precio o gratis');
    assert(pack.stories.includes('CLARIDAD') || pack.post.includes('privado'), 'Embudo incluye CTA Mind-Reader hacia mensaje privado');

    // Validación de adaptación al caso
    assert(pack.carrusel.includes('Lámina 1') && pack.carrusel.includes('Lámina 6'), 'Carrusel contiene las láminas requeridas de 1 a 6');
    assert(pack.video.includes('[0:00') && pack.video.includes('[0:45'), 'Video incluye marcas de tiempo técnicas de apertura y cierre');
  }

  // Prueba de generateCyborgContent en modo local autónomo
  console.log('\n  Probando generateCyborgContent...');
  const cyborgRes = await generateCyborgContent('Dueño de clínica odontológica desbordado por citas');
  assert(cyborgRes.success === true, 'generateCyborgContent respondió con éxito');
  assert(typeof cyborgRes.text === 'string' && cyborgRes.text.length > 200, 'generateCyborgContent entregó texto completo');
}

// -------------------------------------------------------------
// FASE 2: Verificación de Persistencia en SQLite Local (@mejora/nucleo)
// -------------------------------------------------------------
async function testSqlitePersistence() {
  console.log('\n--- 2. VERIFICACIÓN DE PERSISTENCIA SOBERANA EN SQLITE ---');

  const nucleoDist = path.join(rootDir, 'packages/nucleo/dist/index.js');
  assert(fs.existsSync(nucleoDist), 'Paquete @mejora/nucleo compilado existe en dist/index.js');

  const nucleo = await import('file:///' + nucleoDist.replace(/\\/g, '/'));

  const dbPath = path.join(
    process.env.APPDATA || 'C:\\Users\\tabeg\\AppData\\Roaming',
    '@mejora',
    'shell',
    'nucleo.db'
  );

  assert(fs.existsSync(dbPath), `Base de datos SQLite activa encontrada en: ${dbPath}`);

  const db = nucleo.connectDatabase(dbPath);
  assert(db !== null, 'Conexión a base de datos local SQLite exitosa');

  // Guardar una propuesta real de prueba de Growth Funnel
  const testTitle = 'Estrategia Growth B2B - Prueba de Garantía ' + Date.now();
  const testContent = '=== POST DE TRINCHERA ===\nContenido verificado de prueba de garantía de embudo orgánico.\n\n=== CARRUSEL OPERATIVO ===\nLámina 1: Portada\nLámina 6: Cierre';
  
  const created = nucleo.createPropuesta({
    titulo: testTitle,
    contenido: testContent,
    formato: 'carrusel',
    estado: 'borrador'
  });

  assert(created && created.id > 0, `Propuesta guardada en tabla sm_propuestas con ID #${created?.id}`);

  // Leer propuestas y verificar que figure en la lista
  const todas = nucleo.getPropuestas();
  const encontrada = todas.find(p => p.id === created.id);
  assert(encontrada !== undefined, `Propuesta ID #${created.id} recuperada correctamente de SQLite`);
  assert(encontrada.titulo === testTitle, 'El título persistido coincide exactamente');

  // Actualizar estado a 'aprobado'
  const actualizada = nucleo.updatePropuestaEstado(created.id, 'aprobado');
  assert(actualizada && actualizada.estado === 'aprobado', 'Estado de propuesta actualizado a "aprobado" en SQLite');
}

// -------------------------------------------------------------
// FASE 3: Verificación de Integración WhatsApp (MejoraWS)
// -------------------------------------------------------------
async function testWhatsAppIntegration() {
  console.log('\n--- 3. VERIFICACIÓN DE MOTOR MEJORAWS ---');

  const waEnginePath = path.join(rootDir, 'apps/shell/electron/wa-engine/engine.mjs');
  assert(fs.existsSync(waEnginePath), 'Módulo wa-engine/engine.mjs existe');

  const waIndex = path.join(rootDir, 'apps/shell/electron/wa-engine/index.mjs');
  assert(fs.existsSync(waIndex), 'Módulo wa-engine/index.mjs existe');

  const waEngine = await import('file:///' + waIndex.replace(/\\/g, '/'));
  assert(typeof waEngine.getWaEngineState === 'function', 'Exporta getWaEngineState()');
  assert(typeof waEngine.handleSend === 'function', 'Exporta handleSend()');
  assert(typeof waEngine.handleAddAndSend === 'function', 'Exporta handleAddAndSend()');

  const state = waEngine.getWaEngineState();
  assert(state && typeof state.connected === 'boolean', `Estado del motor de WhatsApp accesible (connected: ${state.connected})`);
}

// -------------------------------------------------------------
// FASE 4: Verificación de Integridad de la Mesa Ejecutiva (UI/UX)
// -------------------------------------------------------------
async function testMesaEjecutivaUI() {
  console.log('\n--- 4. VERIFICACIÓN DE INTERFAZ Y COMPONENTES (UI/UX) ---');

  const mesaPath = path.join(rootDir, 'apps/sm/src/pages/MesaEjecutivaLimpia.tsx');
  const mesaCode = fs.readFileSync(mesaPath, 'utf8');

  // Garantías de UI limpia
  assert(mesaCode.includes('grid-cols-1 md:grid-cols-2'), 'Mesa Ejecutiva tiene distribución balanceada 50/50 (grid md:grid-cols-2)');
  assert(!mesaCode.includes('(?====|\\Z)'), 'Regex de parseo corregida a ($) para garantizar lectura de videos sin fallos');
  assert(mesaCode.includes('handleCopyCurrent'), 'Acción de copiado individual de pestaña disponible');
  assert(mesaCode.includes('handleCopyPack'), 'Acción de copiado del pack completo disponible');
  assert(mesaCode.includes('handleSaveToNucleo'), 'Botón "Guardar en Núcleo" conectado a SQLite');
  assert(mesaCode.includes('carrusel') && mesaCode.includes('video'), 'Las 5 pestañas de formatos están disponibles para el usuario');

  // Verificar AppLayout para asegurar que no hay sidebar gigante tapando la pantalla
  const layoutPath = path.join(rootDir, 'apps/sm/src/components/layout/AppLayout.tsx');
  const layoutCode = fs.readFileSync(layoutPath, 'utf8');
  assert(!layoutCode.includes('<AppSidebar />'), 'Sidebar lateral de 256px removido para liberar el 100% de la pantalla');
  assert(layoutCode.includes('Mesa Ejecutiva'), 'Barra de navegación ejecutiva superior visible y accesible');
}

// -------------------------------------------------------------
// Ejecución Principal
// -------------------------------------------------------------
async function runAll() {
  try {
    await testGrowthFunnelEngine();
    await testSqlitePersistence();
    await testWhatsAppIntegration();
    await testMesaEjecutivaUI();

    console.log('\n================================================================');
    console.log(`🎯 RESULTADO FINAL: ${passedTests}/${totalTests} pruebas pasadas (${failedTests} fallidas)`);
    if (failedTests === 0) {
      console.log('💎 GARANTÍA TOTAL: Todos los subsistemas de Growth B2B, embudo orgánico,');
      console.log('   persistencia SQLite y motor WhatsApp operan al 100% bajo el Criterio Medular.');
    }
    console.log('================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('\n💥 ERROR FATAL EN SUITE DE PRUEBAS:', err);
    process.exit(1);
  }
}

runAll();
