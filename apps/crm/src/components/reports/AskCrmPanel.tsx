import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, ExternalLink, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { AI_PROVIDERS, getProvider } from "@/lib/ai-providers";
import { loadAiKey, saveAiKey, clearAiKey } from "@/lib/ai-key";
import { askCrm } from "@/lib/askCrm";
import type { PeriodKPIs, WhatsAppStats } from "@/lib/businessLogic";

interface AskCrmPanelProps {
  periodLabel: string;
  kpis: PeriodKPIs;
  avgCycle: number;
  resultData: Array<{ name: string; value: number }>;
  topProducts: Array<{ name: string; value: number }>;
  waStats: WhatsAppStats;
}

function buildContextSummary(props: AskCrmPanelProps): string {
  const { periodLabel, kpis, avgCycle, resultData, topProducts, waStats } = props;
  const lines = [
    `Período: ${periodLabel}`,
    `Ventas logradas: $${kpis.ventasLogradas.toLocaleString()} (${kpis.cantidadVentas} ventas)`,
    `Ventas en curso: $${kpis.ventasEnCurso.toLocaleString()} (${kpis.cantidadPresupuestos} presupuestos)`,
    `Win rate: ${kpis.winRate}%`,
    `Ciclo promedio presupuesto→venta: ${avgCycle > 0 ? `${avgCycle} días` : "sin datos"}`,
    `Revenue perdido (no interesados): $${kpis.ventasNoConcretadas.toLocaleString()} (${kpis.cantidadNoInteresado} casos)`,
    `Distribución de resultados: ${resultData.map((r) => `${r.name}: ${r.value}`).join(", ") || "sin datos"}`,
    `Top productos por revenue: ${topProducts.map((p) => `${p.name}: $${p.value.toLocaleString()}`).join(", ") || "sin datos"}`,
    `WhatsApp — respuestas detectadas: ${waStats.total} (${waStats.automaticas} automáticas)`,
  ];
  return lines.join("\n");
}

export function AskCrmPanel(props: AskCrmPanelProps) {
  const [providerId, setProviderId] = useState("groq");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAiKey().then((config) => {
      if (config) {
        setProviderId(config.providerId);
        setHasKey(true);
      }
    });
  }, []);

  const provider = getProvider(providerId);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    await saveAiKey({ providerId, apiKey: apiKey.trim() });
    setHasKey(true);
    setApiKey("");
    toast.success("Clave guardada (cifrada en este navegador)");
  };

  const handleClearKey = () => {
    clearAiKey();
    setHasKey(false);
    setAnswer(null);
    toast.success("Clave borrada");
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    const config = await loadAiKey();
    if (!config) {
      toast.error("Guardá una clave de API primero");
      return;
    }
    setLoading(true);
    setAnswer(null);
    const result = await askCrm(config.providerId, config.apiKey, buildContextSummary(props), question.trim());
    setLoading(false);
    if (result.ok) {
      setAnswer(result.answer!);
    } else {
      toast.error(result.error || "No se pudo responder la pregunta");
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Preguntale a tu CRM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasKey ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Necesita una clave de API de un proveedor de IA — se guarda cifrada en este navegador, nunca en el servidor.
              {provider && (
                <> Conseguí una gratis en{" "}
                  <a href={provider.signupUrl} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
                    {provider.name} <ExternalLink className="h-3 w-3" />
                  </a>.
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="password"
                placeholder="Pegá tu clave de API"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 min-w-[180px] h-9"
              />
              <Button size="sm" className="h-9" onClick={handleSaveKey} disabled={!apiKey.trim()}>
                <KeyRound className="h-4 w-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: ¿cómo nos fue este mes con las ventas?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAsk()}
                className="flex-1 h-9"
              />
              <Button size="sm" className="h-9" onClick={handleAsk} disabled={loading || !question.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preguntar"}
              </Button>
            </div>
            {answer && (
              <div className="p-3 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap">{answer}</div>
            )}
            <button onClick={handleClearKey} className="text-[10px] text-muted-foreground underline">
              Borrar clave guardada ({provider?.name})
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
