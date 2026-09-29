import { differenceInDays, differenceInHours, isBefore, isToday, format } from "date-fns";
import { es } from "date-fns/locale";
import { Timer, FileText, Clock, AlertCircle, ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MEDIUM_LABELS, AGING_THRESHOLDS, CURRENCY_SYMBOLS } from "@/lib/constants";
import type { Interaction } from "@/lib/types";

interface PipelineKanbanProps {
  interactions: Interaction[];
  onEdit: (i: Interaction) => void;
}

const COLUMNS = [
  {
    id: "presupuesto" as const,
    label: "Presupuesto",
    topBorder: "border-t-amber-400",
    countStyle: "bg-amber-100 text-amber-800",
    amountStyle: "text-amber-700",
    Icon: FileText,
    emptyMsg: "Sin presupuestos abiertos",
  },
  {
    id: "seguimiento" as const,
    label: "En seguimiento",
    topBorder: "border-t-primary",
    countStyle: "bg-primary/10 text-primary",
    amountStyle: "text-primary",
    Icon: Clock,
    emptyMsg: "Sin seguimientos activos",
  },
  {
    id: "sin_respuesta" as const,
    label: "Sin respuesta",
    topBorder: "border-t-slate-400",
    countStyle: "bg-slate-100 text-slate-600",
    amountStyle: "text-slate-600",
    Icon: AlertCircle,
    emptyMsg: "Sin deals en espera",
  },
  {
    id: "venta" as const,
    label: "Ganado",
    topBorder: "border-t-success",
    countStyle: "bg-success/10 text-success",
    amountStyle: "text-success",
    Icon: ShoppingCart,
    emptyMsg: "Sin ventas en el período",
  },
  {
    id: "no_interesado" as const,
    label: "Perdido",
    topBorder: "border-t-destructive",
    countStyle: "bg-destructive/10 text-destructive",
    amountStyle: "text-destructive",
    Icon: X,
    emptyMsg: "Sin rechazos en el período",
  },
] as const;

const OPEN_RESULTS = new Set(["presupuesto", "seguimiento", "sin_respuesta"]);

function getCardAmount(i: Interaction): number {
  return i.result === "no_interesado"
    ? (Number(i.estimated_loss) || Number(i.total_amount) || 0)
    : (Number(i.total_amount) || 0);
}

function sortCards(cards: Interaction[]): Interaction[] {
  return [...cards].sort((a, b) => {
    const aOverdue = a.follow_up_date && isBefore(new Date(a.follow_up_date), new Date()) && !isToday(new Date(a.follow_up_date));
    const bOverdue = b.follow_up_date && isBefore(new Date(b.follow_up_date), new Date()) && !isToday(new Date(b.follow_up_date));
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    // Among same urgency tier: sort by amount descending
    const amountDiff = getCardAmount(b) - getCardAmount(a);
    if (amountDiff !== 0) return amountDiff;
    // Tiebreaker: oldest interaction first
    return new Date(a.interaction_date).getTime() - new Date(b.interaction_date).getTime();
  });
}

function formatColumnTotals(cards: Interaction[]): string {
  const totals: Record<string, number> = {};
  for (const i of cards) {
    const amt = getCardAmount(i);
    if (amt <= 0) continue;
    const cur = i.currency || "ARS";
    totals[cur] = (totals[cur] ?? 0) + amt;
  }
  return Object.entries(totals)
    .map(([cur, val]) => `${CURRENCY_SYMBOLS[cur] ?? cur} ${val.toLocaleString()}`)
    .join("  ·  ");
}

function KanbanCard({ i, onEdit }: { i: Interaction; onEdit: (i: Interaction) => void }) {
  const isOverdue =
    !!i.follow_up_date &&
    isBefore(new Date(i.follow_up_date), new Date()) &&
    !isToday(new Date(i.follow_up_date));
  const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(i.follow_up_date!)) : 0;
  const hoursAging = OPEN_RESULTS.has(i.result)
    ? differenceInHours(new Date(), new Date(i.interaction_date))
    : 0;
  const daysAging = Math.floor(hoursAging / 24);
  const showAgingBadge = hoursAging >= AGING_THRESHOLDS.AMBER_HOURS && !isOverdue;
  const isRedAging = hoursAging >= AGING_THRESHOLDS.RED_HOURS;
  const agingLabel = daysAging >= 1 ? `${daysAging}d` : `${hoursAging}h`;

  const displayAmount = getCardAmount(i);

  return (
    <Card
      className={`hover:shadow-md cursor-pointer transition-all duration-150 border-border/50 ${
        isOverdue ? "border-l-2 border-l-destructive bg-destructive/[0.02]" : ""
      }`}
      onClick={() => onEdit(i)}
    >
      <CardContent className="p-3 space-y-1.5">
        {/* Client + amount */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug truncate flex-1">{i.clients?.name}</p>
          {displayAmount > 0 && (
            <p className="text-xs font-bold tabular-nums whitespace-nowrap">
              {i.currency || ""} {displayAmount.toLocaleString()}
            </p>
          )}
        </div>

        {/* Next step */}
        {i.next_step && (
          <p className="text-xs text-muted-foreground line-clamp-1">→ {i.next_step}</p>
        )}

        {/* Footer row */}
        <div className="flex items-center gap-1 flex-wrap pt-0.5">
          {i.follow_up_date && (
            <span
              className={`text-xs ${
                isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
              }`}
            >
              {isOverdue
                ? `${daysOverdue}d vencido`
                : format(new Date(i.follow_up_date), "dd MMM", { locale: es })}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {MEDIUM_LABELS[i.medium] ?? i.medium}
          </span>
          {showAgingBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 h-4 cursor-default ${
                    isRedAging
                      ? "text-destructive border-destructive/40"
                      : "text-amber-600 border-amber-400/40"
                  }`}
                >
                  <Timer className="h-2.5 w-2.5 mr-0.5" />
                  {agingLabel}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48 text-center text-xs">
                {isRedAging ? "Acción urgente" : "Requiere seguimiento"} — sin actividad hace {agingLabel}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineKanban({ interactions, onEdit }: PipelineKanbanProps) {
  return (
    <div className="overflow-x-auto pb-4 -mx-1 px-1">
      <div className="flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const cards = sortCards(interactions.filter((i) => i.result === col.id));
          const columnTotals = formatColumnTotals(cards);
          const overdueInCol = cards.filter(
            (i) =>
              i.follow_up_date &&
              isBefore(new Date(i.follow_up_date), new Date()) &&
              !isToday(new Date(i.follow_up_date))
          ).length;

          return (
            <div
              key={col.id}
              className={`w-72 shrink-0 flex flex-col rounded-xl border border-border/50 bg-muted/20 border-t-4 ${col.topBorder}`}
            >
              {/* Column header */}
              <div className="p-3 border-b border-border/30 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <col.Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {overdueInCol > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                        {overdueInCol}v
                      </Badge>
                    )}
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${col.countStyle}`}>
                      {cards.length}
                    </span>
                  </div>
                </div>
                {columnTotals && (
                  <p className={`text-xs font-medium mt-1 tabular-nums ${col.amountStyle}`}>
                    {columnTotals}
                  </p>
                )}
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: "calc(100vh - 300px)" }}>
                {cards.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-10">{col.emptyMsg}</p>
                ) : (
                  cards.map((i) => <KanbanCard key={i.id} i={i} onEdit={onEdit} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
