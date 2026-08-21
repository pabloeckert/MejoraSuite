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
