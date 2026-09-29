/**
 * Cliente del bridge local de MejoraWS (Fase 4 de MejoraSuite — ver
 * mejorasuite/ESPECIFICACION.md). Copia deliberada, no un paquete
 * compartido: cada producto de la suite sigue siendo independiente (ver
 * mejorasuite/DECISIONES.md), así que este archivo es casi idéntico al de
 * MejoraContactos (src/lib/mejoraws-bridge.ts) pero con su propio cifrado
 * — no depende de nada de ese repo.
 *
 * El token se pega a mano una vez (botón "Copiar token de conexión" en
 * MejoraWS) y se guarda cifrado en localStorage con AES-GCM (Web Crypto).
 */

const BRIDGE_URL = "http://127.0.0.1:4180";
const TOKEN_STORAGE_KEY = "mejoraws_bridge_token_v1";
const ENC_KEY_STORAGE = "mejoracrm_mejoraws_enc_key_v1";
const FETCH_TIMEOUT_MS = 2500;

export interface BridgeStatus {
  connected: boolean;
  waStatus: string;
  campaignRunning: boolean;
  stopRequested: boolean;
  pauseRequested: boolean;
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(ENC_KEY_STORAGE);
  if (stored) {
    const jwk = JSON.parse(stored) as JsonWebKey;
    return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  localStorage.setItem(ENC_KEY_STORAGE, JSON.stringify(jwk));
  return key;
}

async function encryptString(plain: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.length);
  let binary = "";
  for (const byte of combined) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function decryptString(encoded: string): Promise<string> {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const key = await getOrCreateEncryptionKey();
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

export async function saveBridgeToken(token: string): Promise<void> {
  const encrypted = await encryptString(token.trim());
  localStorage.setItem(TOKEN_STORAGE_KEY, encrypted);
}

export async function loadBridgeToken(): Promise<string | null> {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return await decryptString(raw);
  } catch {
    return null;
  }
}

export function clearBridgeToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

/** Devuelve el estado o `null` si MejoraWS no está corriendo / no responde. */
export async function getBridgeStatus(token: string): Promise<BridgeStatus | null> {
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BRIDGE_URL}/status`, {
      headers: { "X-Bridge-Token": token },
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as BridgeStatus;
  } catch {
    return null;
  } finally {
    cancel();
  }
}

export interface BridgeMessageEvent {
  phone: string;
  text: string;
  recibidoEn: string;
}

/**
 * Suscribe a GET /events (SSE) del bridge. No se puede usar `EventSource`
 * nativo porque el bridge exige el header `X-Bridge-Token` en todas las
 * rutas (incluida /events) y esa API del browser no permite mandar headers
 * custom — por eso se parsea el stream a mano con `fetch` + `ReadableStream`.
 * Devuelve una función `unsubscribe()` para cortar la conexión.
 */
export function subscribeToBridgeMessages(
  token: string,
  onMessage: (evt: BridgeMessageEvent) => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/events`, {
        headers: { "X-Bridge-Token": token },
        signal: controller.signal,
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          let eventType = "message";
          let dataLine = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (eventType === "message" && dataLine) {
            try {
              onMessage(JSON.parse(dataLine) as BridgeMessageEvent);
            } catch {
              // frame corrupto o parcial, se ignora — el próximo frame sigue el flujo normal
            }
          }
        }
      }
    } catch {
      // conexión cortada (MejoraWS se cerró, o se llamó unsubscribe) — no reintenta acá,
      // el polling de /status ya cubre notar que MejoraWS dejó de responder
    }
  })();

  return () => controller.abort();
}

export const MEJORAWS_PROTOCOL_URL = "mejoraws://open";
export const MEJORACONTACTOS_URL = "https://pabloeckert.github.io/MejoraContactos/";
