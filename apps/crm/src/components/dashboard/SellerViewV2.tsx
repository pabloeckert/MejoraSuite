import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Clock, Calendar, ShoppingCart, Plus, AlertCircle,
  ChevronRight, Target, CheckCircle2, Flame,
} from "lucide-react";
import { isBefore, isToday, differenceInDays, startOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { RESULT_LABELS } from "@/lib/constants";
import type { Interaction } from "@/lib/types";
import { FocusDayWidget } from "./FocusDayWidget";

interface SellerViewV2Props {
  interactions: Interaction[];
  sellerName: string;
  monthlyTarget: number | null;
  navigate: (path: string) => void;
}

export function SellerViewV2({ interactions, sellerName, monthlyTarget, navigate }: SellerViewV2Props) {
  const monthStart = startOfMonth(new Date());
  const monthInts = interactions.filter((i) => new Date(i.interaction_date) >= monthStart);

  const ventas = monthInts.filter((i) => i.result === "venta");
  const presupuestos = monthInts.filter((i) => i.result === "presupuesto");
  const noInteresado = monthInts.filter((i) => i.result === "no_interesado");
  const seguimientos = monthInts.filter((i) => i.result === "seguimiento");

  const totalVentas = ventas.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalPresup = presupuestos.reduce((s: number, i: any) => s + (Number(i.total_amount) || 0), 0);
  const totalPerdido = noInteresado.reduce((s: number, i: any) => s + (Number(i.estimated_loss) || 0), 0);

  const today = interactions.filter((i) => i.follow_up_date && isToday(new Date(i.follow_up_date)));
  const overdue = interactions
    .filter(
      (i) => i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date()) && !isToday(new Date(i.follow_up_date))
    )
    .sort((a, b) => new Date(a.follow_up_date!).getTime() - new Date(b.follow_up_date!).getTime());
  const upcoming = interactions
    .filter((i) => i.follow_up_date && new Date(i.follow_up_date) > new Date())
    .sort((a: any, b: any) => new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime())
    .slice(0, 5);

  const todayInteractions = interactions.filter((i) => isToday(new Date(i.interaction_date)));

  // --- Ritmo de trabajo (mensaje automático) ---
  let ritmoMsg = "";
  let ritmoIcon = Target;
  if (todayInteractions.length === 0 && today.length > 0) {
    ritmoMsg = `Tenés ${today.length} seguimiento${today.length > 1 ? "s" : ""} para hoy. ¡Empecemos!`;
    ritmoIcon = Clock;
  } else if (todayInteractions.length > 0 && today.length === 0) {
    ritmoMsg = "Ya registraste tus interacciones del día 👏";
    ritmoIcon = CheckCircle2;
  } else if (overdue.length > 0) {
    ritmoMsg = `Hay ${overdue.length} seguimiento${overdue.length > 1 ? "s" : ""} vencido${overdue.length > 1 ? "s" : ""}. ¿Los revisamos?`;
    ritmoIcon = AlertCircle;
  } else if (ventas.some((v) => isToday(new Date(v.interaction_date)))) {
    ritmoMsg = "¡Venta registrada hoy! Buen trabajo 💪";
    ritmoIcon = Flame;
  } else if (monthInts.length > 10) {
    ritmoMsg = "Buen ritmo este mes. ¡Seguí así! 👍";
    ritmoIcon = Flame;
  }

  const RitmoIcon = ritmoIcon;

  // Color helpers for ventas section
  const ventasColor = ventas.length > 0 ? "text-success" : "text-muted-foreground";
  const ventasBg = ventas.length > 0 ? "bg-success/10" : "bg-muted";
  const presupColor = presupuestos.length > 0 ? "text-warning" : "text-muted-foreground";
  const presupBg = presupuestos.length > 0 ? "bg-warning/10" : "bg-muted";
  const perdidoColor = noInteresado.length > 0 ? "text-destructive" : "text-muted-foreground";
  const perdidoBg = noInteresado.length > 0 ? "bg-destructive/10" : "bg-muted";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Hola {sellerName.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">Tu actividad de {format(monthStart, "MMMM yyyy", { locale: es })}</p>
        </div>
        <Button onClick={() => navigate("/interactions")} className="h-10 px-5 text-sm font-semibold shadow-md">
          <Plus className="h-4 w-4 mr-1.5" /> Registrar interacción
        </Button>
      </div>

      {/* Mi Foco de Hoy */}
      <FocusDayWidget interactions={interactions} navigate={navigate} />

      {/* ──────────────────────────────────────────────
          SECCIÓN 1: Tus ventas (verde/naranja/rojo)
          ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" /> Tus ventas
        </h2>
        <div className={`grid grid-cols-1 gap-4 ${monthlyTarget !== null ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
          <Card className="animate-slide-up stagger-1 opacity-0 border-border/50 hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas logradas</p>
                  <p className={`text-2xl font-bold tracking-tight ${ventasColor}`}>${totalVentas.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{ventas.length} este mes</p>
                </div>
                <div className={`p-2.5 rounded-xl ${ventasBg}`}>
                  <ShoppingCart className={`h-5 w-5 ${ventasColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-2 opacity-0 border-border/50 hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventas en curso</p>
                  <p className={`text-2xl font-bold tracking-tight ${presupColor}`}>${totalPresup.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{presupuestos.length} presupuestos</p>
                </div>
                <div className={`p-2.5 rounded-xl ${presupBg}`}>
                  <FileText className={`h-5 w-5 ${presupColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up stagger-3 opacity-0 border-border/50 hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">No concretadas</p>
                  <p className={`text-2xl font-bold tracking-tight ${perdidoColor}`}>${totalPerdido.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{noInteresado.length} rechazos</p>
                </div>
                <div className={`p-2.5 rounded-xl ${perdidoBg}`}>
                  <AlertCircle className={`h-5 w-5 ${perdidoColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {monthlyTarget !== null && (() => {
            const pct = Math.min(Math.round((totalVentas / monthlyTarget) * 100), 100);
            const over = totalVentas >= monthlyTarget;
            const color = over ? "text-success" : pct >= 60 ? "text-warning" : "text-destructive";
            const bg = over ? "bg-success/10" : pct >= 60 ? "bg-warning/10" : "bg-destructive/10";
            const bar = over ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-destructive";
            return (
              <Card className="animate-slide-up stagger-4 opacity-0 border-border/50 hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 mr-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tu cuota</p>
                      <p className={`text-2xl font-bold tracking-tight ${color}`}>{pct}%</p>
                      <p className="text-xs text-muted-foreground">
                        ${totalVentas.toLocaleString()} de ${monthlyTarget.toLocaleString()}
                      </p>
                      <div className={`h-2 rounded-full mt-2 ${bg}`}>
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-xl shrink-0 ${bg}`}>
                      <Target className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                  {over && (
                    <p className="text-[10px] text-success font-semibold mt-2">¡Meta superada este mes!</p>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SECCIÓN 2: Tareas del día
          ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Tareas del día
          {(overdue.length + today.length) > 0 && (
            <Badge variant="destructive" className="text-xs">{overdue.length + today.length}</Badge>
          )}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seguimientos vencidos — prioridad máxima */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-destructive" /> Vencidos
              </CardTitle>
              <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Todo al día</p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {overdue.slice(0, 6).map((i) => (
                    <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer" onClick={() => navigate("/interactions")}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{i.next_step || "Pendiente"}</p>
                      </div>
                      <Badge variant="outline" className="text-xs text-destructive border-destructive/30 shrink-0">{differenceInDays(new Date(), new Date(i.follow_up_date))}d</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seguimientos hoy */}
          <Card className="border-border/50">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" /> Para hoy
              </CardTitle>
              <Badge variant="outline" className="text-xs">{today.length}</Badge>
            </CardHeader>
            <CardContent>
              {today.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin seguimientos para hoy</p>
              ) : (
                <div className="space-y-2">
                  {today.map((i) => (
                    <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 cursor-pointer transition-colors" onClick={() => navigate("/interactions")}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{i.next_step || "—"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contactos / Citas del día */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Contactos de hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayInteractions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Sin actividad registrada hoy</p>
              ) : (
                <div className="space-y-2">
                  {todayInteractions.slice(0, 5).map((i) => (
                    <div key={i.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                      <div className="min-w-0">
                        <p className="text-sm truncate"><span className="font-medium">{i.clients?.name}</span></p>
                        <p className="text-xs text-muted-foreground">{RESULT_LABELS[i.result]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ──────────────────────────────────────────────
          SECCIÓN 3: Resumen del mes
          ────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4" /> Resumen del mes
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{monthInts.length}</p>
              <p className="text-xs text-muted-foreground">Interacciones totales</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{ventas.length}</p>
              <p className="text-xs text-muted-foreground">Ventas cerradas</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{presupuestos.length}</p>
              <p className="text-xs text-muted-foreground">Presupuestos enviados</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-accent">{seguimientos.length}</p>
              <p className="text-xs text-muted-foreground">Seguimientos hechos</p>
            </CardContent>
          </Card>
        </div>

        {/* Próximos seguimientos */}
        {upcoming.length > 0 && (
          <Card className="border-border/50 mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Próximos seguimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcoming.map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer" onClick={() => navigate("/interactions")}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{i.clients?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{i.next_step || "—"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">{format(new Date(i.follow_up_date), "dd MMM", { locale: es })}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ──────────────────────────────────────────────
          SECCIÓN 4: Ritmo de trabajo
          ────────────────────────────────────────────── */}
      {ritmoMsg && (
        <Card className="border-border/50 bg-primary/5 border-primary/10">
          <CardContent className="py-4 px-5 flex items-center gap-3">
            <RitmoIcon className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium text-primary">{ritmoMsg}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
