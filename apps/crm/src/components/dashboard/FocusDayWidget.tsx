import { differenceInDays, differenceInHours, isToday, isBefore } from "date-fns";
import { Zap, Clock, Calendar, Timer, ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AGING_THRESHOLDS, CURRENCY_SYMBOLS } from "@/lib/constants";
import type { Interaction } from "@/lib/types";

type Urgency = "vencido" | "hoy" | "caliente";

interface FocusItem {
  interaction: Interaction;
  urgency: Urgency;
  daysOverdue?: number;
  hoursAging?: number;
}

const OPEN_RESULTS = new Set(["presupuesto", "seguimiento", "sin_respuesta"]);

const URGENCY_CONFIG: Record<Urgency, { label: string; badgeClass: string; Icon: typeof Clock }> = {
  vencido: { label: "Vencido", badgeClass: "bg-destructive/10 text-destructive border-destructive/30", Icon: Clock },
  hoy:     { label: "Para hoy", badgeClass: "bg-accent/20 text-amber-800 border-accent/40", Icon: Calendar },
  caliente:{ label: "Caliente", badgeClass: "bg-orange-50 text-orange-700 border-orange-300/50", Icon: Timer },
};

export function buildFocusItems(interactions: Interaction[], maxItems = 5): FocusItem[] {
  const now = new Date();
  const items: FocusItem[] = [];

  // P1 — seguimientos vencidos, más urgente primero
  const vencidos = interactions
    .filter((i) => i.follow_up_date && isBefore(new Date(i.follow_up_date), now) && !isToday(new Date(i.follow_up_date)))
    .map((i) => ({ interaction: i, urgency: "vencido" as Urgency, daysOverdue: differenceInDays(now, new Date(i.follow_up_date!)) }))
    .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));
  items.push(...vencidos);

  if (items.length >= maxItems) return items.slice(0, maxItems);

  // P2 — seguimientos para hoy, mayor monto primero
  const todayIds = new Set(items.map((f) => f.interaction.id));
  const hoy = interactions
    .filter((i) => i.follow_up_date && isToday(new Date(i.follow_up_date)) && !todayIds.has(i.id))
    .map((i) => ({ interaction: i, urgency: "hoy" as Urgency }))
    .sort((a, b) => (Number(b.interaction.total_amount) || 0) - (Number(a.interaction.total_amount) || 0));
  items.push(...hoy);

  if (items.length >= maxItems) return items.slice(0, maxItems);

  // P3 — presupuestos/seguimientos calientes (>= 48h sin actividad), mayor monto primero
  const existingIds = new Set(items.map((f) => f.interaction.id));
  const calientes = interactions
    .filter((i) => !existingIds.has(i.id) && OPEN_RESULTS.has(i.result))
    .map((i) => ({ interaction: i, urgency: "caliente" as Urgency, hoursAging: differenceInHours(now, new Date(i.interaction_date)) }))
    .filter((f) => (f.hoursAging ?? 0) >= AGING_THRESHOLDS.AMBER_HOURS)
    .sort((a, b) => {
      const amtDiff = (Number(b.interaction.total_amount) || 0) - (Number(a.interaction.total_amount) || 0);
      return amtDiff !== 0 ? amtDiff : (b.hoursAging ?? 0) - (a.hoursAging ?? 0);
    });
  items.push(...calientes);

  return items.slice(0, maxItems);
}

function formatAmount(i: Interaction): string | null {
  const amt = Number(i.total_amount) || 0;
  if (amt <= 0) return null;
  const sym = CURRENCY_SYMBOLS[i.currency ?? "ARS"] ?? i.currency ?? "$";
  return `${sym} ${amt.toLocaleString()}`;
}

interface FocusDayWidgetProps {
  interactions: Interaction[];
  navigate: (path: string) => void;
}

export function FocusDayWidget({ interactions, navigate }: FocusDayWidgetProps) {
  const items = buildFocusItems(interactions);

  return (
    <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent fill-accent" />
            Mi Foco de Hoy
          </CardTitle>
          {items.length > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs tabular-nums">
              {items.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-4">
        {items.length === 0 ? (
          <div className="flex items-center gap-3 py-4 text-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Estás al día. Sin oportunidades urgentes ahora mismo.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((f) => {
              const cfg = URGENCY_CONFIG[f.urgency];
              const UIcon = cfg.Icon;
              const amount = formatAmount(f.interaction);
              const sub = f.interaction.next_step || f.interaction.followup_motive || null;

              return (
                <li
                  key={f.interaction.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors group"
                  onClick={() => navigate("/interactions")}
                >
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0.5 shrink-0 flex items-center gap-1 ${cfg.badgeClass}`}
                  >
                    <UIcon className="h-2.5 w-2.5" />
                    {cfg.label}
                    {f.urgency === "vencido" && f.daysOverdue && f.daysOverdue > 0 && (
                      <span className="font-bold">{f.daysOverdue}d</span>
                    )}
                    {f.urgency === "caliente" && f.hoursAging && (
                      <span className="font-bold">
                        {f.hoursAging >= 24 ? `${Math.floor(f.hoursAging / 24)}d` : `${f.hoursAging}h`}
                      </span>
                    )}
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{f.interaction.clients?.name ?? "—"}</p>
                    {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
                  </div>

                  {amount && (
                    <p className="text-xs font-bold tabular-nums text-foreground shrink-0">{amount}</p>
                  )}

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
