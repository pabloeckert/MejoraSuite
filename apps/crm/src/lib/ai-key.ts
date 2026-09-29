/**
 * Guarda una clave de API de IA (para "Preguntale a tu CRM") cifrada en
 * localStorage con AES-GCM (Web Crypto), mismo mecanismo que ya usa
 * MejoraContactos en src/lib/api-keys.ts — duplicado acá a propósito, sin
 * paquete compartido (cada producto de la suite sigue siendo independiente,
 * ver mejorasuite/DECISIONES.md).
 *
 * Versión mínima a propósito (K.I.S.S.): una sola clave/proveedor a la vez,
 * sin rotación ni multi-key — a diferencia del sistema completo de
 * MejoraContactos, acá no hace falta.
 */

export interface AiKeyConfig {
  providerId: string;
  apiKey: string;
}

const STORAGE_KEY = "mejoracrm_ai_key_v1";
const ENC_KEY_STORAGE = "mejoracrm_ai_enc_key_v1";
const ENC_MARKER = "__enc__:";

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
  return ENC_MARKER + btoa(binary);
}

async function decryptString(encrypted: string): Promise<string> {
  if (!encrypted.startsWith(ENC_MARKER)) return encrypted;
  const b64 = encrypted.slice(ENC_MARKER.length);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const key = await getOrCreateEncryptionKey();
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

export async function saveAiKey(config: AiKeyConfig): Promise<void> {
  const encrypted = { providerId: config.providerId, apiKey: await encryptString(config.apiKey) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
}

export async function loadAiKey(): Promise<AiKeyConfig | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as AiKeyConfig;
    return { providerId: stored.providerId, apiKey: await decryptString(stored.apiKey) };
  } catch {
    return null;
  }
}

export function clearAiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}
