// Toggle maestro de modo demostración (Fase 7 de MejoraSuite). Se guarda
// localStorage propio de este launcher (no comparte storage con las otras
// apps — son procesos/orígenes distintos) solo para recordar la última
// elección entre lanzamientos. El valor real se propaga a cada herramienta
// como query param al abrirla (ver electron/main.mjs, suite:open) — cada
// una decide qué hacer con eso por su cuenta.
const DEMO_STORAGE_KEY = "mejorasuite_launcher_demo_mode";

function loadDemoMode() {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

function saveDemoMode(value) {
  localStorage.setItem(DEMO_STORAGE_KEY, String(value));
}

let demoMode = loadDemoMode();

const demoToggle = document.getElementById("demo-toggle");
const demoHint = document.getElementById("demo-toggle-hint");

function renderDemoToggle() {
  demoToggle.setAttribute("aria-checked", String(demoMode));
  demoHint.textContent = demoMode
    ? "Al abrir cualquier herramienta, arranca con datos de ejemplo."
    : "Al abrir cualquier herramienta, arranca con tus datos reales.";
}

demoToggle.addEventListener("click", () => {
  demoMode = !demoMode;
  saveDemoMode(demoMode);
  renderDemoToggle();
});

renderDemoToggle();

document.querySelectorAll(".tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    window.suite.open(tile.dataset.target, demoMode);
  });
});

const wsStatus = document.getElementById("ws-status");

async function refreshWsStatus() {
  const up = await window.suite.checkMejoraWs();
  wsStatus.dataset.state = up ? "up" : "down";
  wsStatus.textContent = up ? "Conectado" : "No detectado";
}

refreshWsStatus();
setInterval(refreshWsStatus, 15000);

// --- Telemetría y Mando Unificado (Día 7) ---
const gatewayDot = document.getElementById("gateway-dot");
const gatewayText = document.getElementById("gateway-text");
const gatewaySub = document.getElementById("gateway-sub");
const telemetryCounter = document.getElementById("telemetry-counter");
const syncDot = document.getElementById("sync-dot");
const syncLabel = document.getElementById("sync-label");

const MODULE_KEYS = [
  { id: "badge-web", name: "Mejoraok" },
  { id: "badge-diagnostico", name: "MejoraDiagnostico" },
  { id: "badge-crm", name: "MejoraCRM" },
  { id: "badge-ws", name: "MejoraWS" },
  { id: "badge-sm", name: "MejoraSM" },
  { id: "badge-app", name: "MejoraApp" },
];

function updateTelemetryUI(data) {
  if (!data) return;

  if (data.online) {
    if (gatewayDot) gatewayDot.dataset.state = "online";
    if (gatewayText) gatewayText.textContent = "Online";
    if (gatewaySub) gatewaySub.textContent = "Conexión activa · Supabase";
    if (telemetryCounter) telemetryCounter.textContent = Number(data.total_contactos).toLocaleString("es-AR");
    if (syncDot) syncDot.dataset.state = "online";

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    if (syncLabel) syncLabel.textContent = `Actualizado ${hh}:${mm}:${ss}`;
  } else {
    if (gatewayDot) gatewayDot.dataset.state = "offline";
    if (gatewayText) gatewayText.textContent = "Offline";
    if (gatewaySub) gatewaySub.textContent = data.error || "Sin respuesta del motor";
    if (telemetryCounter) telemetryCounter.textContent = "—";
    if (syncDot) syncDot.dataset.state = "offline";
    if (syncLabel) syncLabel.textContent = "Desconectado";
  }

  const sistemasConectados = Array.isArray(data.sistemas_conectados) ? data.sistemas_conectados : [];
  const detalles = Array.isArray(data.detalles_sistemas) ? data.detalles_sistemas : [];

  MODULE_KEYS.forEach(({ id, name }) => {
    const el = document.getElementById(id);
    if (!el) return;

    const estaConectado = data.online && sistemasConectados.includes(name);
    const detalle = detalles.find((d) => d.sistema === name);
    const esActivo = estaConectado && (detalle ? detalle.activo : true);

    if (esActivo) {
      el.dataset.status = "active";
      let tooltip = `${name}: Activo en Supabase`;
      if (detalle && detalle.ultimo_uso_en) {
        const d = new Date(detalle.ultimo_uso_en);
        const fecha = d.toLocaleDateString("es-AR", { day: '2-digit', month: '2-digit' });
        const hora = d.toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' });
        tooltip += ` · Última act: ${fecha} ${hora}`;
      }
      el.title = tooltip;
    } else {
      el.dataset.status = "inactive";
      el.title = `${name}: No detectado o inactivo`;
    }
  });
}

if (window.suite && typeof window.suite.getTelemetry === "function") {
  window.suite.getTelemetry().then(updateTelemetryUI).catch((err) => {
    console.warn("Fallo en telemetría inicial:", err);
    updateTelemetryUI({ online: false, error: err.message });
  });

  if (typeof window.suite.onTelemetryUpdate === "function") {
    window.suite.onTelemetryUpdate((data) => {
      updateTelemetryUI(data);
    });
  }
}

