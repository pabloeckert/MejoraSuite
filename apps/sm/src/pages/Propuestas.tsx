import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  CheckCircle,
  Clock,
  Loader2,
  Calendar,
  Copy,
  Check,
  FileText,
  LayoutTemplate,
  Plus,
  Pencil,
  Trash2,
  GitBranch,
  Send,
  XCircle,
  Recycle,
  AlertTriangle,
  ShieldAlert,
  RotateCcw,
  Info,
  Sparkles,
} from "lucide-react";
import { RecycleTab } from "@/components/RecycleTab";
import {
  useProposals,
  usePendingProposals,
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/hooks/useProposals";
import { useQueryClient } from "@tanstack/react-query";
import { checkTimeoutPropuestasInSqlite, forceZernioSyncInSqlite } from "@/lib/nucleoAdapter";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { toast } from "@/components/ui/use-toast";
import { PipelineBadge } from "@/components/PipelineBadge";
import { ProposalDetailDialog, type ProposalDetail } from "@/components/ProposalDetailDialog";
import { CyborgEditor } from "@/components/CyborgEditor";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// Filtro por tipo de posteo, sobre el campo proposals.format. "historia" es
// el valor real que usa el código (extractProposal en orchestrator/index.ts)
// para lo que acá se etiqueta "Story". La pestaña "Video" se sacó en Fase D
// (2026-08-31): nada la genera (ni orchestrator ni el pipeline) y
// proposals_format_check ni siquiera permite ese valor — era una categoría
// siempre vacía que solo agregaba ruido.
const FORMATOS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "post", label: "Post Feed" },
  { value: "carrusel", label: "Carrusel" },
  { value: "historia", label: "Story" },
];

const TEMPLATE_FORMATS = FORMATOS.filter((f) => f.value !== "all");

const STATUS_META: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  pendiente_revision: { label: "Pendiente", variant: "secondary" },
  borrador: { label: "Borrador", variant: "secondary" },
  approved: { label: "Aprobada", variant: "default" },
  aprobado: { label: "Aprobada", variant: "default" },
  rejected: { label: "Rechazada", variant: "destructive" },
  rechazado: { label: "Rechazada", variant: "destructive" },
  scheduled: { label: "Programada", variant: "outline" },
  programado: { label: "Programada", variant: "outline" },
  published: { label: "Publicada", variant: "default" },
  publicado: { label: "Publicada", variant: "default" },
  congelado_por_timeout: {
    label: "Congelado Timeout",
    variant: "outline",
    className: "border-amber-500 bg-amber-500/10 text-amber-500 font-semibold",
  },
  error_sincronizacion: {
    label: "Error Sincronización",
    variant: "destructive",
    className: "bg-rose-500/20 text-rose-400 border-rose-500/40 font-semibold",
  },
};

export default function Propuestas() {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={150}>
        <PropuestasContent />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

function PropuestasContent() {
  const { data: allProposals, isLoading } = useProposals();
  const { data: pendingProposals } = usePendingProposals();

  // Se guarda el id, no el objeto — así el modal siempre muestra el estado
  // real después de aprobar/reprogramar/convertir sin cerrarlo (antes
  // quedaba mostrando el snapshot viejo de cuando se abrió, aunque la
  // mutación ya hubiera pegado en Supabase).
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [isCyborgOpen, setIsCyborgOpen] = useState(false);

  // Interconexión entre secciones: /propuestas?id=<uuid> abre el detalle
  // directo — lo usa Monitor (y cualquier otro lado que enlace a una pieza
  // puntual) para poder seguirla de punta a punta sin tener que buscarla a
  // mano en la lista.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) setSelectedProposalId(id);
  }, [searchParams]);

  const selectedProposal: ProposalDetail | null = selectedProposalId
    ? (allProposals || []).find((p: ProposalDetail) => p.id === selectedProposalId) ?? null
    : null;

  const handleCopy = (proposal: ProposalDetail) => {
    const text = [proposal.hook, "", proposal.body, "", proposal.cta, "", ...(proposal.hashtags || [])]
      .filter((l) => l !== null && l !== undefined)
      .join("\n");
    // Hallazgo real: writeText() devuelve una promesa que puede rechazar (el
    // navegador bloquea el portapapeles fuera de un contexto seguro, o sin
    // permiso) — sin chequearla, el tilde de "copiado" se mostraba igual
    // aunque nada se hubiera copiado de verdad. Mismo criterio que ya usa
    // ProposalDetailDialog.handleCopy.
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedId(proposal.id);
        setTimeout(() => setCopiedId(null), 2000);
      },
      () => toast({ title: "No se pudo copiar", description: "El navegador bloqueó el portapapeles.", variant: "destructive" })
    );
  };

  const matchesFormat = (p: ProposalDetail) => formatFilter === "all" || p.format === formatFilter;
  const filteredProposals: ProposalDetail[] = (allProposals || []).filter(matchesFormat);
  const filteredPending: ProposalDetail[] = (pendingProposals || []).filter(matchesFormat);

  const approved = filteredProposals.filter((p) => p.status === "approved" || p.status === "aprobado");
  const scheduled = filteredProposals.filter((p) => p.status === "scheduled" || p.status === "programado");
  const attentionRequired = filteredProposals.filter(
    (p) => p.status === "congelado_por_timeout" || p.status === "error_sincronizacion"
  );

  const queryClient = useQueryClient();
  const [defensiveTelemetry, setDefensiveTelemetry] = useState<{
    message: string;
    cause: string;
    timestamp: string;
  } | null>(null);
  const [isVerifyingTimeouts, setIsVerifyingTimeouts] = useState(false);

  // Verificación y blindaje defensivo de timeouts en SQLite al montar
  useEffect(() => {
    let mounted = true;
    checkTimeoutPropuestasInSqlite()
      .then((res) => {
        if (mounted && res && res.congeladas > 0) {
          queryClient.invalidateQueries({ queryKey: ["proposals"] });
          setDefensiveTelemetry({
            message: `Blindaje de consistencia: se detectaron ${res.congeladas} propuestas cuya fecha de ejecución expiró sin estar aprobadas.`,
            cause: `Mecanismo de timeout activado. Registros congelados preventivamente: ${res.detalles.join(" | ")}`,
            timestamp: new Date().toLocaleTimeString("es-AR"),
          });
          toast({
            title: "Blindaje Defensivo Activado",
            description: `Se congelaron ${res.congeladas} propuestas vencidas para evitar publicaciones o despachos accidentales.`,
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        if (mounted) {
          setDefensiveTelemetry({
            message: "Falla al verificar integridad de propuestas en la base de datos local.",
            cause: err instanceof Error ? err.message : String(err),
            timestamp: new Date().toLocaleTimeString("es-AR"),
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [queryClient]);

  const handleManualTimeoutCheck = async () => {
    setIsVerifyingTimeouts(true);
    try {
      const res = await checkTimeoutPropuestasInSqlite();
      if (res && res.congeladas > 0) {
        queryClient.invalidateQueries({ queryKey: ["proposals"] });
        setDefensiveTelemetry({
          message: `Auditoría completada: se congelaron ${res.congeladas} propuestas vencidas.`,
          cause: res.detalles.join(" | "),
          timestamp: new Date().toLocaleTimeString("es-AR"),
        });
        toast({
          title: "Control de Timeouts Ejecutado",
          description: `Se congelaron ${res.congeladas} propuestas expiradas.`,
        });
      } else {
        toast({
          title: "Consistencia Verificada",
          description: "No se encontraron propuestas programadas expiradas pendientes de congelamiento.",
        });
      }
    } catch (err) {
      setDefensiveTelemetry({
        message: "Error durante la ejecución del control de timeouts.",
        cause: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toLocaleTimeString("es-AR"),
      });
      toast({
        title: "Error de Verificación",
        description: "No se pudo completar el control de timeouts.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingTimeouts(false);
    }
  };

  const [isSyncingZernio, setIsSyncingZernio] = useState(false);

  const handleForceZernioSync = async () => {
    setIsSyncingZernio(true);
    try {
      const res = await forceZernioSyncInSqlite();
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      if (res && res.success) {
        if (res.procesadas === 0) {
          toast({
            title: "Sincronización Zernio",
            description: "No hay propuestas programadas listas para publicar en este momento.",
          });
        } else {
          toast({
            title: "Sincronización Zernio Completada",
            description: `${res.publicadas} publicadas exitosamente, ${res.fallidas} con error de despacho.`,
            variant: res.fallidas && res.fallidas > 0 ? "destructive" : "default",
          });
          if (res.fallidas && res.fallidas > 0) {
            setDefensiveTelemetry({
              message: `Despacho Zernio con inconsistencias: ${res.fallidas} de ${res.procesadas} propuestas no pudieron publicarse.`,
              cause:
                res.detalles
                  ?.filter((d) => d.estado === "error_sincronizacion")
                  .map((d) => `ID #${d.id}: ${d.error}`)
                  .join(" | ") || "Falla devuelta por el API de Zernio.",
              timestamp: new Date().toLocaleTimeString("es-AR"),
            });
          }
        }
      } else {
        const errorMsg = res?.error || "Falla al comunicar con el motor despachador Zernio.";
        setDefensiveTelemetry({
          message: "No se pudo sincronizar con Zernio.",
          cause: errorMsg,
          timestamp: new Date().toLocaleTimeString("es-AR"),
        });
        toast({
          title: "Falla de Sincronización",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err) {
      setDefensiveTelemetry({
        message: "Error de conexión al forzar sincronización con Zernio.",
        cause: err instanceof Error ? err.message : String(err),
        timestamp: new Date().toLocaleTimeString("es-AR"),
      });
      toast({
        title: "Error Inesperado",
        description: "Ocurrió una excepción al despachar a Zernio.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingZernio(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propuestas de Contenido</h1>
          <p className="mt-1 text-muted-foreground">
            Los posts y carruseles de feed se agendan y publican solos (mirá el badge "Se publica solo" en cada
            pieza). Esta pantalla es el monitor: click en cualquier pieza abre el detalle, con todas las acciones
            reales — aprobar, rechazar, agendar, editar, borrar o convertir formato.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 self-start sm:self-center">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
            onClick={() => setIsCyborgOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Nueva Propuesta Cyborg
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleForceZernioSync}
            disabled={isSyncingZernio}
          >
            {isSyncingZernio ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Forzar Sincronización Zernio
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleManualTimeoutCheck}
            disabled={isVerifyingTimeouts}
          >
            {isVerifyingTimeouts ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Auditar Timeouts
          </Button>
        </div>
      </div>

      {defensiveTelemetry && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-500">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Modo Defensivo Activado — Telemetría Local</p>
                <p className="text-xs text-muted-foreground">{defensiveTelemetry.message}</p>
                <p className="font-mono text-[11px] bg-background/80 text-foreground rounded px-2 py-1 border border-border inline-block">
                  Causa: {defensiveTelemetry.cause}
                </p>
                <p className="text-[10px] text-muted-foreground">Registrado a las {defensiveTelemetry.timestamp}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-500/30 hover:bg-amber-500/20"
              onClick={() => setDefensiveTelemetry(null)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FORMATOS.map((f) => (
          <Button
            key={f.value}
            type="button"
            size="sm"
            variant={formatFilter === f.value ? "default" : "outline"}
            onClick={() => setFormatFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Pendientes
            {filteredPending.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {filteredPending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle className="h-3.5 w-3.5" />
            Aprobadas
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Calendar className="h-3.5 w-3.5" />
            Programadas
          </TabsTrigger>
          <TabsTrigger value="attention" className="gap-1.5">
            <ShieldAlert
              className={cn("h-3.5 w-3.5", attentionRequired.length > 0 ? "text-amber-500" : "text-muted-foreground")}
            />
            Atención
            {attentionRequired.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px] bg-amber-600">
                {attentionRequired.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Línea de tiempo
          </TabsTrigger>
          <TabsTrigger value="recycle" className="gap-1.5">
            <Recycle className="h-3.5 w-3.5" />
            Reciclar
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Plantillas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPending.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              text={
                formatFilter === "all"
                  ? "No hay propuestas pendientes"
                  : `No hay propuestas pendientes de tipo "${FORMATOS.find((f) => f.value === formatFilter)?.label}"`
              }
              sub="Cuando los agentes generen contenido, aparecerá acá para tu aprobación."
            />
          ) : (
            <div className="space-y-3">
              {filteredPending.map((p) => (
                <ProposalListItem
                  key={p.id}
                  proposal={p}
                  onOpen={() => setSelectedProposalId(p.id)}
                  onCopy={() => handleCopy(p)}
                  copied={copiedId === p.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approved.length === 0 ? (
            <EmptyState icon={FileText} text="No hay propuestas aprobadas aún." />
          ) : (
            <div className="space-y-3">
              {approved.map((p) => (
                <ProposalListItem
                  key={p.id}
                  proposal={p}
                  onOpen={() => setSelectedProposalId(p.id)}
                  onCopy={() => handleCopy(p)}
                  copied={copiedId === p.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <p className="mb-4 text-xs text-muted-foreground">
            Los posts y carruseles se agendan solos apenas los aprueba el Crítico en Mesa de Diálogo. Abrí la
            pieza para reprogramarla o cancelarla antes de que salga.
          </p>
          {scheduled.length === 0 ? (
            <EmptyState icon={Calendar} text="No hay propuestas programadas." />
          ) : (
            <div className="space-y-3">
              {scheduled.map((p) => (
                <ProposalListItem
                  key={p.id}
                  proposal={p}
                  onOpen={() => setSelectedProposalId(p.id)}
                  onCopy={() => handleCopy(p)}
                  copied={copiedId === p.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attention" className="mt-6">
          <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500 flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Blindaje Defensivo y Prevención de Errores Masivos</p>
              <p className="text-muted-foreground mt-0.5">
                Las propuestas en esta sección requieren revisión manual porque su tiempo programado caducó sin aprobación o sufrieron un error al despacharse. Los reintentos masivos están deshabilitados preventivamente: abrí cada pieza individualmente para reactivarla o corregirla.
              </p>
            </div>
          </div>
          {attentionRequired.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              text="No hay propuestas que requieran atención defensiva."
              sub="Todo el contenido programado y en cola se encuentra dentro de sus plazos nominales."
            />
          ) : (
            <div className="space-y-3">
              {attentionRequired.map((p) => (
                <ProposalListItem
                  key={p.id}
                  proposal={p}
                  onOpen={() => setSelectedProposalId(p.id)}
                  onCopy={() => handleCopy(p)}
                  copied={copiedId === p.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {filteredProposals.length === 0 ? (
            <EmptyState
              icon={FileText}
              text={
                formatFilter === "all"
                  ? "No hay propuestas todavía."
                  : `No hay propuestas de tipo "${FORMATOS.find((f) => f.value === formatFilter)?.label}" todavía.`
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredProposals.map((p) => (
                <ProposalListItem
                  key={p.id}
                  proposal={p}
                  onOpen={() => setSelectedProposalId(p.id)}
                  onCopy={() => handleCopy(p)}
                  copied={copiedId === p.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineView
            proposals={filteredProposals}
            isLoading={isLoading}
            onOpen={(id) => setSelectedProposalId(id)}
            onCopy={handleCopy}
            copiedId={copiedId}
          />
        </TabsContent>

        <TabsContent value="recycle" className="mt-6">
          <RecycleTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <TemplatesSection />
        </TabsContent>
      </Tabs>

      <ProposalDetailDialog
        proposal={selectedProposal}
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposalId(null)}
      />

      <CyborgEditor
        open={isCyborgOpen}
        onOpenChange={setIsCyborgOpen}
      />
    </div>
  );
}

// Línea de tiempo — el ciclo de vida completo de cada pieza en una sola
// vista, agrupado por etapa (reemplaza la "línea de tiempo" que vivía en la
// Biblioteca, sacada el 2026-09-01). Cada pieza abre su detalle real.
const TIMELINE_STAGES: {
  key: string;
  label: string;
  icon: typeof FileText;
  match: (s: string | null | undefined) => boolean;
  dateOf: (p: ProposalDetail) => string | null;
}[] = [
  {
    key: "revision",
    label: "En revisión",
    icon: Clock,
    match: (s) => s === "pending" || s === "pendiente_revision" || s === "borrador" || s === "needs_review" || !s,
    dateOf: (p) => p.created_at ?? null,
  },
  {
    key: "aprobada",
    label: "Aprobadas — esperando agenda",
    icon: CheckCircle,
    match: (s) => s === "approved" || s === "aprobado",
    dateOf: (p) => p.created_at ?? null,
  },
  {
    key: "programada",
    label: "Programadas",
    icon: Calendar,
    match: (s) => s === "scheduled" || s === "programado",
    dateOf: (p) => p.scheduled_at ?? p.created_at ?? null,
  },
  {
    key: "congelada",
    label: "Congeladas por Timeout",
    icon: Clock,
    match: (s) => s === "congelado_por_timeout",
    dateOf: (p) => p.scheduled_at ?? p.created_at ?? null,
  },
  {
    key: "error_sync",
    label: "Error de Sincronización",
    icon: AlertTriangle,
    match: (s) => s === "error_sincronizacion",
    dateOf: (p) => p.created_at ?? null,
  },
  {
    key: "publicada",
    label: "Publicadas",
    icon: Send,
    match: (s) => s === "published" || s === "publicado",
    dateOf: (p) => p.published_at ?? p.scheduled_at ?? p.created_at ?? null,
  },
  {
    key: "frenada",
    label: "Frenadas",
    icon: XCircle,
    match: (s) => s === "rejected" || s === "rechazado",
    dateOf: (p) => p.created_at ?? null,
  },
];

function TimelineView({
  proposals,
  isLoading,
  onOpen,
  onCopy,
  copiedId,
}: {
  proposals: ProposalDetail[];
  isLoading: boolean;
  onOpen: (id: string) => void;
  onCopy: (p: ProposalDetail) => void;
  copiedId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (proposals.length === 0) {
    return <EmptyState icon={GitBranch} text="Todavía no hay piezas para mostrar." />;
  }

  const groups = TIMELINE_STAGES.map((stage) => ({
    stage,
    items: proposals
      .filter((p) => stage.match(p.status))
      .sort((a, b) => new Date(stage.dateOf(b) ?? 0).getTime() - new Date(stage.dateOf(a) ?? 0).getTime()),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      {groups.map(({ stage, items }) => (
        <div key={stage.key}>
          <div className="mb-3 flex items-center gap-2">
            <stage.icon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{stage.label}</h2>
            <span className="text-xs text-muted-foreground/60">{items.length}</span>
          </div>
          <div className="space-y-3 border-l-2 border-border pl-4">
            {items.map((p) => (
              <ProposalListItem
                key={p.id}
                proposal={p}
                onOpen={() => onOpen(p.id)}
                onCopy={() => onCopy(p)}
                copied={copiedId === p.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }: { icon: typeof FileText; text: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12">
        <Icon className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{text}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground/70">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function ProposalListItem({
  proposal,
  onOpen,
  onCopy,
  copied,
}: {
  proposal: ProposalDetail;
  onOpen: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const status = STATUS_META[proposal.status || "pending"] || {
    label: proposal.status || "Pendiente",
    variant: "secondary" as const,
  };
  const isTimeout = proposal.status === "congelado_por_timeout";
  const isSyncError = proposal.status === "error_sincronizacion";

  return (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/40",
        isTimeout && "border-amber-500/40 bg-amber-500/[0.04]",
        isSyncError && "border-rose-500/40 bg-rose-500/[0.04]"
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <PipelineBadge format={proposal.format} />
            <Badge variant="outline" className="text-[10px]">
              {proposal.format || "post"}
            </Badge>
            <Badge variant={status.variant} className={cn("text-[10px]", status.className)}>
              {status.label}
            </Badge>
            {isTimeout && (
              <span className="flex items-center text-[10px] text-amber-500 font-medium">
                <Clock className="mr-1 h-3 w-3" />
                Vencida sin aprobación
              </span>
            )}
            {isSyncError && (
              <span className="flex items-center text-[10px] text-rose-500 font-medium">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Error de sincronización
              </span>
            )}
          </div>
          <p className="truncate text-sm font-semibold">{proposal.hook || proposal.title || "Sin título"}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{proposal.body}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {proposal.scheduled_at
              ? `Programada: ${new Date(proposal.scheduled_at).toLocaleDateString("es-AR")}`
              : proposal.created_at
              ? `Creada: ${new Date(proposal.created_at).toLocaleDateString("es-AR")}`
              : null}
          </p>
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
// PLANTILLAS — solo estructura (listar/crear/editar), sin motor de render
// (ver migración 010_templates.sql). Se conecta a futuro con
// templates/post-template.html y templates/story-template.html.
// ═══════════════════════════════════════

interface TemplateRecord {
  id: string;
  name: string;
  format: string;
  notes: string | null;
}

function TemplatesSection() {
  const { data: templates, isLoading } = useTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [editing, setEditing] = useState<TemplateRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null);
  const [form, setForm] = useState({ name: "", format: "post", notes: "" });

  const openCreate = () => {
    setForm({ name: "", format: "post", notes: "" });
    setEditing(null);
    setIsCreating(true);
  };

  const openEdit = (t: TemplateRecord) => {
    setForm({ name: t.name, format: t.format, notes: t.notes || "" });
    setEditing(t);
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, fields: form },
        {
          onSuccess: () => {
            setIsCreating(false);
            toast({ title: "Plantilla actualizada" });
          },
          onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: () => {
          setIsCreating(false);
          toast({ title: "Plantilla creada" });
        },
        onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast({ title: "Plantilla borrada" });
      },
      onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Estructura de plantillas reutilizables — todavía sin motor de render (eso viene después). Real, no de
          mentira: se guardan en Supabase.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nueva plantilla
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !templates || templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} text="Sin plantillas todavía." sub="Creá la primera con el botón de arriba." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t: TemplateRecord) => (
            <Card key={t.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {t.format}
                    </Badge>
                  </div>
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  {t.notes && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteTarget(t)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                rows={3}
                placeholder="Dirección visual, cuándo usarla, etc."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                {editing ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="¿Borrar esta plantilla?"
        description="No se puede deshacer."
        confirmText="Borrar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
