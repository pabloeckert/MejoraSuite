import { useSyncExternalStore } from "react";

/**
 * Modo demostración como estado reactivo en runtime (Fase 7 de MejoraSuite),
 * no una constante de build como era `DEMO_MODE` antes. Persiste en
 * localStorage bajo la misma clave que usan los otros dos productos de la
 * suite (MejoraContactos, MejoraWS) y que setea el launcher de MejoraSuite
 * vía query param al abrir cada herramienta — así el toggle "maestro" del
 * launcher y el toggle propio de cada app comparten un solo valor de
 * verdad. Sin acceso a localStorage (SSR, tests) cae al valor por defecto.
 *
 * Basado en useSyncExternalStore (no Context) para que hooks de datos
 * (useClients, useInteractions, etc., que no son componentes) puedan leerlo
 * sin pasar por un Provider.
 */
const STORAGE_KEY = "mejorasuite_demo_mode";

function readInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
  } catch {
    // localStorage no disponible (tests, SSR) — sigue al default
  }
  // Por defecto: modo demo ACTIVO. Así una instalación nueva de MejoraSuite
  // (o el CRM abierto suelto, sin pasar por el launcher) arranca mostrando
  // datos ficticios en vez de una base vacía o pidiendo login real.
  return import.meta.env.VITE_DEMO_MODE !== "false";
}

function readUrlOverride(): boolean | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has("demo")) return null;
  const value = params.get("demo") === "true";
  // Limpia el query param de la URL para que un refresh no vuelva a forzar
  // el valor por sobre lo que el usuario haya tocado desde el toggle propio.
  params.delete("demo");
  const rest = params.toString();
  const cleanUrl = window.location.pathname + (rest ? `?${rest}` : "") + window.location.hash;
  window.history.replaceState(null, "", cleanUrl);
  return value;
}

let current = readUrlOverride() ?? readInitial();
if (typeof window !== "undefined") {
  try {
    localStorage.setItem(STORAGE_KEY, String(current));
  } catch {
    // no persiste, pero el estado en memoria de esta pestaña sigue andando
  }
}

const listeners = new Set<() => void>();

export function getDemoMode(): boolean {
  return current;
}

export function setDemoMode(value: boolean): void {
  if (value === current) return;
  current = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // no persiste, pero el estado en memoria de esta pestaña sigue andando
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Sincroniza entre pestañas/ventanas de la misma app (ej. dos pestañas del
// CRM abiertas) cuando el valor cambia en otra.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || e.newValue === null) return;
    const next = e.newValue === "true";
    if (next !== current) {
      current = next;
      listeners.forEach((listener) => listener());
    }
  });
}

export { subscribe as subscribeDemoMode };

/** Hook reactivo — re-renderiza el componente/hook llamante cuando cambia el modo demo. */
export function useDemoMode(): boolean {
  return useSyncExternalStore(subscribe, getDemoMode);
}
