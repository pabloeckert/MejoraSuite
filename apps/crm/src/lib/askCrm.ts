import { getProvider } from "@/lib/ai-providers";

export interface AskCrmResult {
  ok: boolean;
  answer?: string;
  error?: string;
}

const TIMEOUT_MS = 30_000;

/**
 * Llama directo desde el browser al proveedor de IA elegido (formato de
 * chat completions de OpenAI, todos los proveedores de ai-providers.ts lo
 * soportan) con un resumen de KPIs ya calculados + la pregunta libre. Sin
 * backend propio — la clave del usuario nunca sale del navegador salvo
 * hacia el proveedor que él mismo eligió, mismo criterio que el resto de
 * la suite (cada producto es independiente, sin infraestructura
 * compartida nueva). No ejecuta SQL ni tiene memoria entre preguntas: es
 * una capa de lenguaje natural sobre datos ya agregados, nada más.
 */
export async function askCrm(providerId: string, apiKey: string, contextSummary: string, question: string): Promise<AskCrmResult> {
  const provider = getProvider(providerId);
  if (!provider) return { ok: false, error: "Proveedor de IA desconocido" };
  if (!apiKey.trim()) return { ok: false, error: "Falta la clave de API" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Sos un asistente que responde preguntas sobre el desempeño comercial de una empresa, usando SOLO los datos agregados que se te dan a continuación. Respondé en español rioplatense, corto y directo (2-4 oraciones), sin inventar números que no estén en los datos. Si la pregunta no se puede responder con estos datos, decilo.\n\nDatos del período:\n" +
              contextSummary,
          },
          { role: "user", content: question },
        ],
      }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || `El proveedor respondió ${res.status}`;
      return { ok: false, error: typeof msg === "string" ? msg : "El proveedor de IA devolvió un error" };
    }
    const answer = data?.choices?.[0]?.message?.content;
    if (!answer) return { ok: false, error: "El proveedor no devolvió una respuesta" };
    return { ok: true, answer };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, error: "El proveedor tardó demasiado en responder" };
    }
    return { ok: false, error: "No se pudo conectar con el proveedor de IA" };
  } finally {
    clearTimeout(timeout);
  }
}
