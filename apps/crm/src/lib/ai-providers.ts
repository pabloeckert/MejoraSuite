/**
 * Proveedores de IA compatibles con el formato de chat completions de
 * OpenAI, para "Preguntale a tu CRM". Subconjunto del listado más completo
 * de MejoraContactos (src/lib/providers.ts) — acá alcanza con unos pocos,
 * todos con free tier, para no abrumar con opciones.
 */

export interface AiProviderInfo {
  id: string;
  name: string;
  url: string;
  signupUrl: string;
  model: string;
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  { id: "groq", name: "Groq Cloud", url: "https://api.groq.com/openai/v1/chat/completions", signupUrl: "https://console.groq.com/keys", model: "llama-3.3-70b-versatile" },
  { id: "openrouter", name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", signupUrl: "https://openrouter.ai/keys", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { id: "gemini", name: "Google AI Studio (Gemini)", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", signupUrl: "https://aistudio.google.com/app/apikey", model: "gemini-2.0-flash-exp" },
  { id: "mistral", name: "Mistral AI", url: "https://api.mistral.ai/v1/chat/completions", signupUrl: "https://console.mistral.ai/api-keys/", model: "mistral-small-latest" },
];

export function getProvider(id: string): AiProviderInfo | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}
