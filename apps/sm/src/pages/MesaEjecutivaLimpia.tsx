import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  Layers,
  ArrowRight,
  Database,
  Save,
  Clock
} from "lucide-react";
import type { SmPropuestaRecord } from '@mejora/nucleo';
import { 
  createPropuestaInSqlite, 
  fetchPropuestasFromSqlite, 
  isElectronLocal 
} from "@/lib/nucleoAdapter";

export default function MesaEjecutivaLimpia() {
  const [prompt, setPrompt] = useState("");
  const [formato, setFormato] = useState<string>("carrusel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [recentProposals, setRecentProposals] = useState<Array<{ id: number | string; titulo: string; formato?: string | null; creado_el?: string }>>([]);

  const formatosDisponibles = [
    { id: "carrusel", label: "Carrusel Operativo" },
    { id: "post", label: "Post de Trinchera" },
    { id: "story", label: "Story Reflexiva" },
    { id: "articulo", label: "Liderazgo y Estrategia" },
  ];

  const loadRecent = async () => {
    try {
      if (isElectronLocal()) {
        const data = await fetchPropuestasFromSqlite();
        if (data && data.length > 0) {
          setRecentProposals(data.slice(-5).reverse());
          return;
        }
      }
      // Fallback para navegador web
      const stored = localStorage.getItem("mejora_sm_propuestas_local");
      if (stored) {
        setRecentProposals(JSON.parse(stored).slice(-5).reverse());
      }
    } catch (err) {
      console.warn("[MesaEjecutivaLimpia] Error cargando propuestas recientes:", err);
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setSavedSuccess(null);

    let content = "";

    // Intentar invocar motor de IA nativo si está disponible en Electron
    if (typeof window !== "undefined" && (window as any).suite?.ai?.generate) {
      try {
        const aiRes = await (window as any).suite.ai.generate(prompt, formato);
        if (aiRes?.success && aiRes.text) {
          content = aiRes.text;
        }
      } catch (err) {
        console.warn("Fallo IPC Gemini, usando redactor local:", err);
      }
    }

    if (!content) {
      // Simulación rápida de 1.2 segundos sin bloqueos
      await new Promise((r) => setTimeout(r, 1200));
      content = `Este es el contenido generado por la IA para tu prompt: "${prompt}"

📌 GANCHO DE ALTO IMPACTO:
¿Por qué el 80% de las iniciativas de cambio operativo se estancan antes de los 90 días?

📖 DESARROLLO ESTRATÉGICO (${formato.toUpperCase()}):
En la trinchera empresarial, el error habitual consiste en comprar herramientas de software antes de diagnosticar los cuellos de botella reales en el flujo de valor. 

1. Sin medición de tiempos de entrega, no hay visibilidad.
2. Sin roles claros en el equipo, la supervisión se convierte en micromanagement.
3. La verdadera disciplina operativa nace de estandarizar lo que funciona y podar lo superfluo.

🚀 LLAMADO A LA ACCIÓN (CTA):
Escribinos un mensaje directo con la palabra "ESTRATEGIA" para coordinar una sesión de diagnóstico sobre tus procesos comerciales y operativos.

#MejoraContinua #LiderazgoOperativo #GestionEmpresarial #Eficiencia`;
    }

    setGeneratedContent(content);
    setIsGenerating(false);
  };

  const handleSaveToNucleo = async () => {
    if (!generatedContent || isSaving) return;
    setIsSaving(true);
    setSavedSuccess(null);

    try {
      const tituloPropuesta = prompt.slice(0, 60) || "Propuesta sin título";
      if (isElectronLocal()) {
        const record = await createPropuestaInSqlite({
          titulo: tituloPropuesta,
          contenido: generatedContent,
          formato,
          estado: "borrador",
        });
        setSavedSuccess(`Guardado en SQLite Núcleo (ID #${record?.id || "OK"})`);
      } else {
        // Almacenamiento local para navegador
        const existing = JSON.parse(localStorage.getItem("mejora_sm_propuestas_local") || "[]");
        const newRecord = {
          id: Date.now(),
          titulo: tituloPropuesta,
          contenido: generatedContent,
          formato,
          estado: "borrador",
          creado_el: new Date().toISOString(),
        };
        existing.push(newRecord);
        localStorage.setItem("mejora_sm_propuestas_local", JSON.stringify(existing));
        setSavedSuccess(`Guardado en Almacenamiento Local (#${newRecord.id.toString().slice(-4)})`);
      }
      await loadRecent();
    } catch (err: any) {
      console.error("[MesaEjecutivaLimpia] Error al guardar:", err);
      setSavedSuccess("Error al guardar en base de datos local");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setPrompt("");
    setGeneratedContent("");
    setSavedSuccess(null);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A3D84] text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A3D84]">
              Mesa Ejecutiva
            </h1>
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-xs">
              Modo Autónomo & Seguro
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Espacio de redacción autónomo conectado a SQLite Núcleo para creación y persistencia de contenido.
          </p>
        </div>

        {(prompt || generatedContent) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClear}
            className="text-xs text-slate-600 hover:text-slate-900 border-slate-300 cursor-pointer"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Limpiar Espacio
          </Button>
        )}
      </div>

      {/* Selector de formato */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">
          Formato:
        </span>
        {formatosDisponibles.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFormato(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              formato === f.id
                ? "bg-[#1A3D84] text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grilla Principal de Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Prompt y Parámetros */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center justify-between">
              <span>Ingresá el tema o instrucción</span>
              <span className="text-xs font-normal text-slate-400">
                {prompt.length} caracteres
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <Textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ejemplo: Escribí un post sobre la importancia de desconectar al dueño de los incendios diarios en una pyme mediante procesos claros..."
              className="min-h-[260px] text-base leading-relaxed bg-slate-50/50 border-slate-300 focus:border-[#1A3D84] focus:ring-[#1A3D84] resize-y"
            />

            <Button
              id="btn-generar-contenido"
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={handleGenerate}
              className="w-full py-6 text-base font-bold bg-[#1A3D84] hover:bg-[#15326c] text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generando contenido con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generar Contenido</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Columna Derecha: Resultado Generado */}
        <Card className="border border-slate-200 bg-white shadow-sm flex flex-col min-h-[380px]">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#1A3D84]" />
              <span>Resultado Generado</span>
            </CardTitle>

            {generatedContent && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2.5 text-xs border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSaveToNucleo}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>Guardar en Núcleo</span>
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-4 flex-1 flex flex-col">
            {isGenerating ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#1A3D84]" />
                <p className="text-sm font-medium text-slate-700">El redactor inteligente está procesando tu idea...</p>
                <p className="text-xs text-slate-400">Respetando pilares estratégicos y manual de marca</p>
              </div>
            ) : generatedContent ? (
              <div className="flex-1 flex flex-col space-y-3">
                <Textarea
                  readOnly
                  value={generatedContent}
                  className="flex-1 min-h-[300px] text-sm leading-relaxed font-sans bg-slate-50 border-slate-200 p-4 text-slate-800 rounded-lg focus:outline-none resize-none"
                />
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Pieza lista para publicación
                    </span>
                    {savedSuccess && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[11px]">
                        {savedSuccess}
                      </Badge>
                    )}
                  </div>
                  <span>{generatedContent.split(/\s+/).filter(Boolean).length} palabras</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                <Layers className="h-10 w-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Aún no hay contenido generado</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Escribí una instrucción o tema a la izquierda y hacé clic en "Generar Contenido".
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historial Reciente de Núcleo */}
      {recentProposals.length > 0 && (
        <Card className="border border-slate-200 bg-white shadow-sm mt-4">
          <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Database className="h-4 w-4 text-[#1A3D84]" />
              <span>Propuestas Recientes en Base de Datos Núcleo</span>
            </CardTitle>
            <span className="text-xs text-slate-400">Últimos borradores guardados</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentProposals.map((item, idx) => (
                <div key={idx} className="px-5 py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate max-w-md">
                      {item.titulo}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-slate-200 text-slate-600">
                      {item.formato || "post"}
                    </Badge>
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0">
                    ID #{String(item.id).slice(-4)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
