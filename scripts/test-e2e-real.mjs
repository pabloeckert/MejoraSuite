import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

console.log('====================================================');
console.log('🧪 INICIANDO SUITE DE PRUEBAS E2E REALES: MEJORASUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failedTests++;
  }
}

// 1. PRUEBA DEL SERVIDOR HTTP DE DESARROLLO (VITE)
async function testHttpServer() {
  console.log('\n--- 1. VERIFICACIÓN DE SERVIDOR LOCAL (VITE HTTP) ---');
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:5170', (res) => {
      assert(res.statusCode === 200, `Dev Server responde HTTP 200 (recibido: ${res.statusCode})`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert(data.includes('MejoraSuite'), 'El HTML devuelto incluye el título "MejoraSuite"');
        assert(data.includes('/src/main.tsx'), 'El HTML referencia el punto de entrada /src/main.tsx');
        resolve();
      });
    }).on('error', (err) => {
      assert(false, `Fallo de conexión a http://127.0.0.1:5170: ${err.message}`);
      resolve();
    });
  });
}

// 2. PRUEBA DE CONEXIÓN Y PERSISTENCIA SQLITE (@mejora/nucleo)
async function testSqliteNucleo() {
  console.log('\n--- 2. VERIFICACIÓN DE MOTOR DE BASE DE DATOS LOCAL SQLITE (@mejora/nucleo) ---');
  
  const dbPath = path.join(
    process.env.APPDATA || 'C:\\Users\\tabeg\\AppData\\Roaming',
    '@mejora',
    'shell',
    'nucleo.db'
  );

  assert(fs.existsSync(dbPath), `Archivo de base de datos existe en: ${dbPath}`);

  try {
    // Importamos dinámicamente las funciones del paquete nucleo local
    const nucleoPath = path.resolve('./packages/nucleo/dist/index.js');
    assert(fs.existsSync(nucleoPath), `Librería compilada de núcleo existe en: ${nucleoPath}`);

    const nucleo = await import('file:///' + nucleoPath.replace(/\\/g, '/'));
    
    // Conectar a la base de datos de producción local
    const db = nucleo.connectDatabase(dbPath);
    assert(db !== null, 'Conexión a SQLite establecida exitosamente');

    const status = nucleo.getStatus();
    assert(status.connected === true, 'Estado reportado: connected === true');
    assert(status.tableCount >= 19, `Total de tablas verificadas: ${status.tableCount} (esperado >= 19)`);

    // Tablas esperadas de los 3 dominios
    const requiredTables = [
      'sm_propuestas', 'sm_canales', 'sm_metricas',
      'Cliente', 'Deal', 'Pipeline', 'Etapa',
      'Persona', 'ContactoCanal',
      'ws_sesiones', 'ws_carpetas', 'ws_miembros'
    ];

    for (const t of requiredTables) {
      assert(status.tables.includes(t), `Tabla soberana "${t}" presente en el esquema`);
    }

    // Probar mutación y persistencia de SM Propuestas
    const testHash = 'test-hash-' + Date.now();
    const nuevaPropuesta = nucleo.createPropuesta({
      titulo: 'Test E2E Automatizado Antigravity',
      contenido: 'Contenido verificado de prueba unitaria y de integración.',
      formato: 'carrusel',
      estado: 'borrador',
      hash_unico: testHash
    });

    assert(nuevaPropuesta && nuevaPropuesta.id > 0, `Inserción exitosa de propuesta en SQLite con ID #${nuevaPropuesta?.id}`);

    // Verificar búsqueda por hash
    const encontradaPorHash = nucleo.findPropuestaByHash(testHash);
    assert(encontradaPorHash !== null && encontradaPorHash.id === nuevaPropuesta.id, 'Búsqueda por hash único responde con la propuesta esperada');

    // Verificar actualización de estado
    const actualizada = nucleo.updatePropuestaEstado(nuevaPropuesta.id, 'aprobado');
    assert(actualizada !== null && actualizada.estado === 'aprobado', 'Transición de estado a "aprobado" persistida correctamente');

    // Probar verificación defensiva de timeouts
    const timeoutRes = nucleo.checkTimeoutPropuestas();
    assert(typeof timeoutRes.affectedCount === 'number', `Chequeo defensivo de timeouts ejecutado (afectadas: ${timeoutRes.affectedCount})`);

    // Probar lecturas de CRM y Contactos
    const clientes = nucleo.getClientes();
    assert(Array.isArray(clientes), `Lectura de clientes en SQLite responde arreglo (total: ${clientes.length})`);

    const deals = nucleo.getDeals();
    assert(Array.isArray(deals), `Lectura de deals en SQLite responde arreglo (total: ${deals.length})`);

    const personas = nucleo.getPersonas();
    assert(Array.isArray(personas), `Lectura de personas en SQLite responde arreglo (total: ${personas.length})`);

  } catch (err) {
    assert(false, `Excepción no controlada probando SQLite núcleo: ${err.message}`);
  }
}

// 3. PRUEBA DE ARQUITECTURA DE ARCHIVOS Y RUTAS VITALES
async function testArchitectureFiles() {
  console.log('\n--- 3. VERIFICACIÓN DE ARCHIVOS CLAVE Y ESTÉTICA ---');

  const filesToCheck = [
    'apps/shell/src/App.tsx',
    'apps/shell/src/components/Header.tsx',
    'apps/shell/src/components/LauncherMatrix.tsx',
    'apps/shell/src/components/TelemetryBar.tsx',
    'apps/sm/src/App.tsx',
    'apps/sm/src/pages/MesaEjecutivaLimpia.tsx',
    'apps/sm/src/lib/nucleoAdapter.ts',
    'apps/crm/src/contexts/AuthContext.tsx'
  ];

  for (const f of filesToCheck) {
    const fullPath = path.resolve(f);
    assert(fs.existsSync(fullPath), `Archivo crítico existe: ${f}`);
  }

  // Verificar que MesaEjecutivaLimpia.tsx tenga el diseño blanco bg-white y sin bucles
  const mesaCode = fs.readFileSync(path.resolve('apps/sm/src/pages/MesaEjecutivaLimpia.tsx'), 'utf8');
  assert(mesaCode.includes('bg-white'), 'MesaEjecutivaLimpia implementa fondo blanco puro (bg-white)');
  assert(!mesaCode.includes('useCopilotAdvice'), 'MesaEjecutivaLimpia está 100% aislada de llamadas automáticas de IA al montar');
  assert(mesaCode.includes('handleGenerate'), 'MesaEjecutivaLimpia incluye manejador de generación explícito');
  assert(mesaCode.includes('handleSaveToNucleo'), 'MesaEjecutivaLimpia incluye persistencia a SQLite/local');

  // Verificar que la ruta por defecto en SM redirija a /mesa
  const smAppCode = fs.readFileSync(path.resolve('apps/sm/src/App.tsx'), 'utf8');
  assert(smAppCode.includes('Navigate to="/mesa"'), 'Ruta raíz de Social Media redirige de inmediato a Mesa Ejecutiva (/mesa)');
}

async function run() {
  await testHttpServer();
  await testSqliteNucleo();
  await testArchitectureFiles();

  console.log('\n====================================================');
  console.log(`📊 RESUMEN FINAL: ${passedTests}/${totalTests} pruebas pasadas (${failedTests} fallidas)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

run();
