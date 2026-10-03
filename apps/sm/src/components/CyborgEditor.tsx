import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  generateAiCyborgContent,
  createPropuestaInSqlite,
  updatePropuestaEstadoInSqlite,
} from "@/lib/nucleoAdapter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Loader2,
  FileEdit,
  CheckCircle2,
  Clock,
  Archive,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CyborgEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CyborgEditor({ open, onOpenChange, onSuccess }: CyborgEditorProps) {
  const queryClient = useQueryClient();

  // Columna Izquierda: IA
  const [prompt, setPrompt] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);

  // Columna Derecha: Quirófano Humano
  const [propuestaId, setPropuestaId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [hook, setHook] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [cta, setCta] = useState("");
  const [formato, setFormato] = useState("post");
  const [currentEstado, setCurrentEstado] = useState<"borrador" | "pendiente_revision" | "aprobado" | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Disparar generación con Gemini 1.5 Pro
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ingresá un tema o idea",
        description: "El prompt no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateAiCyborgContent(prompt);
      if (res.success && res.text) {
        setAiOutput(res.text);
        // Si el título está vacío, inferir uno del prompt
        if (!titulo.trim()) {
          setTitulo(prompt.slice(0, 50).trim() + (prompt.length > 50 ? "..." : ""));
        }
        toast({
          title: "Estructura Estratégica Generada",
          description: "Gemini 1.5 Pro devolvió el esqueleto y opciones de hooks.",
        });
      } else {
        toast({
          title: "Error al generar contenido",
          description: res.error || "No se pudo obtener respuesta del modelo.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error de comunicación",
        description: err.message || "Falla al conectar con el backend de Gemini.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAiOutput = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput);
    setCopiedAi(true);
    setTimeout(() => setCopiedAi(false), 2000);
    toast({ title: "Copiado al portapapeles" });
  };

  // Transferir contenido crudo de IA al cuerpo si está vacío
  const handleTransferToQuirófano = () => {
    if (!aiOutput) return;
    if (!cuerpo) {
      setCuerpo(aiOutput);
      toast({ title: "Contenido transferido al quirófano" });
    }
  };

  // Defensa de Estados: Guardar según estado requerido
  const handleSave = async (nuevoEstado: "borrador" | "pendiente_revision" | "aprobado") => {
    if (!titulo.trim()) {
      toast({
        title: "Falta el título",
        description: "Completá el título de la propuesta antes de guardar.",
        variant: "destructive",
      });
      return;
    }

    if (!hook.trim() && !cuerpo.trim()) {
      toast({
        title: "Contenido incompleto",
        description: "Definí al menos un hook o el cuerpo del mensaje en el quirófano.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const contenidoJson = JSON.stringify({
        hook: hook.trim(),
        body: cuerpo.trim(),
        cta: cta.trim(),
        hashtags: [],
      });

      if (propuestaId) {
        // Actualizar estado existente en SQLite
        await updatePropuestaEstadoInSqlite(propuestaId, nuevoEstado);
        setCurrentEstado(nuevoEstado);
        toast({
          title: `Estado Actualizado: ${nuevoEstado}`,
          description: `La propuesta #${propuestaId} pasó a estado ${nuevoEstado}.`,
        });
      } else {
        // Crear nueva propuesta en SQLite
        const nueva = await createPropuestaInSqlite({
          titulo: titulo.trim(),
          contenido: contenidoJson,
          formato,
          estado: nuevoEstado,
        });

        if (nueva && nueva.id) {
          setPropuestaId(nueva.id);
          setCurrentEstado(nuevoEstado);
          toast({
            title: `Propuesta Creada: ${nuevoEstado}`,
            description: `Se registró #${nueva.id} en la base de datos local con estado ${nuevoEstado}.`,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Error al persistir propuesta",
        description: err.message || "Falla al comunicarse con SQLite.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setPrompt("");
    setAiOutput("");
    setPropuestaId(null);
    setTitulo("");
    setHook("");
    setCuerpo("");
    setCta("");
    setFormato("post");
    setCurrentEstado(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Editor Cyborg B2B (Gemini 1.5 Pro)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Motor de Creación Híbrido: Gemini estructura; el humano decide y pule con rigor defensivo.
                </DialogDescription>
              </div>
            </div>
            {currentEstado && (
              <Badge
                variant={
                  currentEstado === "aprobado"
                    ? "default"
                    : currentEstado === "pendiente_revision"
                    ? "outline"
                    : "secondary"
                }
                className={cn(
                  "text-xs px-2.5 py-0.5 uppercase tracking-wider font-semibold",
                  currentEstado === "pendiente_revision" && "border-amber-500 bg-amber-500/10 text-amber-500",
                  currentEstado === "aprobado" && "bg-emerald-600 text-white"
                )}
              >
                {currentEstado === "pendiente_revision"
                  ? "Pendiente de Revisión"
                  : currentEstado === "aprobado"
                  ? "Aprobado Definitivo"
                  : "Borrador"}
                {propuestaId && ` (#${propuestaId})`}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Pantalla Dividida (Grid 2 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* COLUMNA IZQUIERDA: INPUT Y OUTPUT DE IA */}
          <div className="flex flex-col space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Motor Estratégico (Gemini)
              </span>
              <span className="text-[11px] text-muted-foreground">Verdad con Calidez</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">¿De qué hablamos hoy?</Label>
              <Textarea
                placeholder="Ej: La mayoría de las agencias B2B pierden deals por asumir requerimientos en vez de auditar la arquitectura real..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none bg-background text-sm"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando con Gemini 1.5 Pro...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar Estructura (Gemini)
                </>
              )}
            </Button>

            {/* Panel de Solo Lectura: Respuesta del LLM */}
            <div className="flex-1 flex flex-col space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Respuesta Estratégica (Esqueleto y Hooks)</Label>
                {aiOutput && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={handleCopyAiOutput}
                    >
                      {copiedAi ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      Copiar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1 text-indigo-500 hover:text-indigo-600"
                      onClick={handleTransferToQuirófano}
                    >
                      <ArrowRight className="h-3 w-3" />
                      Pasar al quirófano
                    </Button>
                  </div>
                )}
              </div>
              <div className="h-[280px] w-full rounded-md border border-border bg-background/80 p-3 overflow-y-auto text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                    <span>Invocando Gemini 1.5 Pro con directiva B2B...</span>
                  </div>
                ) : aiOutput ? (
                  aiOutput
                ) : (
                  <span className="text-muted-foreground/60 italic font-sans">
                    Ingresá el tema arriba y hacé clic en "Generar Estructura". Gemini te dará 3 opciones de ganchos y el esqueleto para pulir a la derecha.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: QUIRÓFANO HUMANO */}
          <div className="flex flex-col space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <FileEdit className="h-3.5 w-3.5" />
                Quirófano Humano
              </span>
              <div className="w-36">
                <Select value={formato} onValueChange={setFormato}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post Feed</SelectItem>
                    <SelectItem value="carrusel">Carrusel</SelectItem>
                    <SelectItem value="historia">Story</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título Interno de la Propuesta</Label>
              <Input
                placeholder="Título identificatorio..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hook / Gancho Principal</Label>
              <Textarea
                placeholder="El gancho que frena el scroll en los primeros 2 segundos..."
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                rows={2}
                className="resize-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cuerpo / Mensaje Central</Label>
              <Textarea
                placeholder="Desarrollo del post con valor concreto, lecciones y datos duros..."
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                rows={5}
                className="resize-none text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Llamado a la Acción (CTA)</Label>
              <Input
                placeholder="Ej: Comentá 'AUDITORIA' y revisamos tu infraestructura..."
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* DEFENSA DE ESTADOS: BOTONES INFERIORES */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 mt-2">
          <div className="text-xs text-muted-foreground">
            Defensa de estados en SQLite:
            <span className="ml-1 font-semibold text-foreground">
              {currentEstado ? currentEstado : "Nuevo"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Gris: Guardar como Borrador */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={() => handleSave("borrador")}
              className="gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-600"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              Guardar como Borrador
            </Button>

            {/* Botón Amarillo: Enviar a Revisión */}
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isSaving}
              onClick={() => handleSave("pendiente_revision")}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
              Enviar a Revisión
            </Button>

            {/* Botón Verde: Solo habilitado si el estado actual es pendiente_revision */}
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isSaving || currentEstado !== "pendiente_revision"}
              onClick={() => handleSave("aprobado")}
              className={cn(
                "gap-1.5 font-medium transition-colors",
                currentEstado === "pendiente_revision"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Aprobar Definitivo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
