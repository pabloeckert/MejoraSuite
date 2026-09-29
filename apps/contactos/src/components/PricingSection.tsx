/**
 * Pricing — Free vs Pro (bring your own API keys).
 * Inline component, not a route — rendered in Index below settings.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Key, ExternalLink } from "lucide-react";

interface TierFeature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}

const features: TierFeature[] = [
  { label: "Contactos por lote", free: "500", pro: "Ilimitado" },
  { label: "Lotes por día", free: "3", pro: "Ilimitado" },
  { label: "Proveedores IA", free: "Compartidos", pro: "12 propios" },
  { label: "Pipeline 3 etapas", free: true, pro: true },
  { label: "Deduplicación", free: true, pro: true },
  { label: "Exportación (6 formatos)", free: true, pro: true },
  { label: "Google Contacts OAuth", free: true, pro: true },
  { label: "Historial + Undo", free: true, pro: true },
  { label: "Modo simple/avanzado", free: true, pro: true },
  { label: "PWA instalable", free: true, pro: true },
  { label: "Velocidad", free: "Estándar", pro: "Prioridad" },
  { label: "Soporte", free: "Comunidad", pro: "Email" },
];

export function PricingSection() {
  return (
    <div id="pricing-section" className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Precios</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          MejoraContactos es gratis. Traé tus propias API keys de IA y procesá sin límites.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        {/* Free tier */}
        <div className="relative rounded-xl border bg-card p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="text-3xl font-bold">$0</p>
            <p className="text-xs text-muted-foreground">Para probar y contactos chicos</p>
          </div>
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2">
                {typeof f.free === "boolean" ? (
                  f.free ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground w-4 text-center shrink-0">•</span>
                )}
                <span className="text-muted-foreground">
                  {f.label}
                  {typeof f.free === "string" && <span className="ml-1 font-medium text-foreground">{f.free}</span>}
                </span>
              </li>
            ))}
          </ul>
          <Badge variant="secondary" className="w-full justify-center">Plan actual</Badge>
        </div>

        {/* Pro tier */}
        <div className="relative rounded-xl border-2 border-primary bg-card p-6 space-y-4 shadow-lg">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
            Recomendado
          </Badge>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="text-3xl font-bold">Gratis</p>
            <p className="text-xs text-muted-foreground">Traé tus propias API keys</p>
          </div>
          <ul className="space-y-2 text-sm">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2">
                {typeof f.pro === "boolean" ? (
                  f.pro ? <Check className="h-4 w-4 text-green-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <span className="text-xs font-medium text-primary w-4 text-center shrink-0">∞</span>
                )}
                <span>
                  {f.label}
                  {typeof f.pro === "string" && <span className="ml-1 font-medium text-primary">{f.pro}</span>}
                </span>
              </li>
            ))}
          </ul>
          <Button
            className="w-full gap-2"
            onClick={() => {
              // Navigate to settings tab
              const settingsTab = document.querySelector('[value="settings"]') as HTMLElement | null;
              settingsTab?.click();
            }}
          >
            <Key className="h-4 w-4" />
            Configurar API keys
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>Las API keys se guardan cifradas (AES-256) en tu navegador. Nunca se envían a nuestros servidores.</p>
        <p>
          Proveedores gratuitos disponibles:{" "}
          <a href="https://console.groq.com" target="_blank" rel="noopener" className="underline hover:text-foreground inline-flex items-center gap-0.5">
            Groq <ExternalLink className="h-3 w-3" />
          </a>
          {", "}
          <a href="https://openrouter.ai" target="_blank" rel="noopener" className="underline hover:text-foreground inline-flex items-center gap-0.5">
            OpenRouter <ExternalLink className="h-3 w-3" />
          </a>
          {", "}
          <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="underline hover:text-foreground inline-flex items-center gap-0.5">
            Google AI Studio <ExternalLink className="h-3 w-3" />
          </a>
          {" y "}
          <a href="https://cloud.cerebras.ai" target="_blank" rel="noopener" className="underline hover:text-foreground inline-flex items-center gap-0.5">
            Cerebras <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
}
