import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, MessageCircle, AlertCircle, RefreshCw, List, LayoutGrid } from "lucide-react";
import { Constants } from "@/integrations/supabase/types";
import { ListSkeleton } from "@/components/skeletons";
import { useInteractionsInfinite, flattenInteractionPages, useDeleteInteraction } from "@/hooks/useInteractions";
import { useClientsMinimal } from "@/hooks/useClients";
import { useActiveProducts } from "@/hooks/useProducts";
import { useClientPresupuestos } from "@/hooks/useInteractions";
import { InteractionCard, InteractionForm, PipelineKanban, RESULT_LABELS, type Result } from "@/components/interactions";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { startOfMonth, subMonths, startOfWeek, startOfDay } from "date-fns";

type ViewMode = "list" | "kanban";
const VIEW_KEY = "interactions_view";

type Period = "all" | "hoy" | "semana" | "mes" | "trimestre" | "semestre" | "año";

const PERIOD_LABELS: Record<Period, string> = {
  all: "Todos",
  hoy: "Hoy",
  semana: "Esta semana",
  mes: "Este mes",
  trimestre: "Trimestre",
  semestre: "Semestre",
  año: "Año",
};

function getPeriodStart(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "hoy": return startOfDay(now);
    case "semana": return startOfWeek(now, { weekStartsOn: 1 });
    case "mes": return startOfMonth(now);
    case "trimestre": return subMonths(now, 3);
    case "semestre": return subMonths(now, 6);
    case "año": return new Date(now.getFullYear(), 0, 1);
    default: return null;
  }
}

export default function Interactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [period, setPeriod] = useState<Period>("all");
  const [formClientId, setFormClientId] = useState<string | undefined>();
  const [formResult, setFormResult] = useState<string | undefined>();
  const [presetClientId, setPresetClientId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem(VIEW_KEY) as ViewMode) ?? "list"
  );

  // FAB contextual: BottomNav navega acá con la oportunidad top del día
  // (ver FocusDayWidget/buildFocusItems) para abrir el form ya con el cliente cargado.
  useEffect(() => {
    const state = location.state as { openForm?: boolean; presetClientId?: string } | null;
    if (state?.openForm) {
      setPresetClientId(state.presetClientId);
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewMode = (mode: ViewMode) => {
    localStorage.setItem(VIEW_KEY, mode);
    setViewMode(mode);
  };

  const { data: interactionsInfinite, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInteractionsInfinite();
  const deleteMutation = useDeleteInteraction();
  const interactions = flattenInteractionPages(interactionsInfinite);
  const { data: clients = [] } = useClientsMinimal();
  const { data: products = [] } = useActiveProducts();
  const { data: presupuestos = [] } = useClientPresupuestos(
    formClientId && (formResult === "venta" || formResult === "seguimiento") ? formClientId : undefined
  );

  const periodStart = getPeriodStart(period);

  const filtered = useMemo(() => {
    return interactions.filter((i: any) => {
      const matchSearch = !search || i.clients?.name?.toLowerCase().includes(search.toLowerCase());
      const matchResult = resultFilter === "all" || i.result === resultFilter;
      const matchPeriod = !periodStart || new Date(i.interaction_date) >= periodStart;
      return matchSearch && matchResult && matchPeriod;
    });
  }, [interactions, search, resultFilter, periodStart]);

  const overdueCount = interactions.filter((i: any) => i.follow_up_date && new Date(i.follow_up_date) < new Date()).length;

  if (isLoading) return <ListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-3 rounded-full bg-destructive/10"><AlertCircle className="h-8 w-8 text-destructive" /></div>
        <div>
          <h2 className="text-lg font-semibold">Error al cargar interacciones</h2>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-1" /> Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Interacciones</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} registros
            {overdueCount > 0 && <span className="text-destructive ml-2 font-medium">• {overdueCount} seguimientos vencidos</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"}`}
              onClick={() => handleViewMode("list")}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"}`}
              onClick={() => handleViewMode("kanban")}
              title="Vista pipeline"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nueva interacción
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Period filter pills */}
        <div className="flex gap-1 flex-wrap">
          {(["all", "hoy", "semana", "mes", "trimestre", "semestre", "año"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "Todos" : PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
      </div>

      {/* Result filter */}
      <div className="flex gap-2">
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Resultados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los resultados</SelectItem>
            {Constants.public.Enums.interaction_result.map((r) => (
              <SelectItem key={r} value={r}>{RESULT_LABELS[r as Result]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === "kanban" ? (
        <PipelineKanban
          interactions={filtered}
          onEdit={(interaction) => {
            setEditingInteraction(interaction);
            setDialogOpen(true);
          }}
        />
      ) : (
        <>
          <div className="space-y-2">
            {filtered.map((i: any, idx: number) => (
              <InteractionCard
                key={i.id}
                interaction={i}
                index={idx}
                onNavigate={navigate}
                onEdit={(interaction) => {
                  setEditingInteraction(interaction);
                  setDialogOpen(true);
                }}
                onDelete={(interaction) => deleteMutation.mutate(interaction.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sin interacciones encontradas</p>
              </div>
            )}
          </div>
          <InfiniteScrollTrigger
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </>
      )}

      <InteractionForm
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditingInteraction(null);
            setPresetClientId(undefined);
            setFormClientId(undefined);
            setFormResult(undefined);
          }
          setDialogOpen(open);
        }}
        clients={clients}
        products={products}
        presupuestos={presupuestos}
        interaction={editingInteraction}
        initialClientId={presetClientId}
        onClientChange={setFormClientId}
        onResultChange={setFormResult}
      />
    </div>
  );
}
