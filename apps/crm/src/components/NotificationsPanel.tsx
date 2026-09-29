import { Bell, AlertTriangle, UserX, Clock, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { useNotificationsData } from "@/hooks/useNotifications";

export function NotificationsPanel() {
  const navigate = useNavigate();

  const { data, isLoading } = useNotificationsData();
  const interactions = data?.interactions ?? [];
  const clients = data?.clients ?? [];
  const profiles = data?.profiles ?? [];

  // Overdue follow-ups
  const overdueFollowups = interactions.filter(
    (i) => i.follow_up_date && new Date(i.follow_up_date) < new Date()
  );

  // Contactos sin seguimiento (>5 días)
  const contactosSinSeguimiento = clients.filter((c) => {
    if (c.status !== "potencial") return false;
    const clientInts = interactions.filter((i) => i.client_id === c.id);
    if (clientInts.length === 0) return true;
    const lastInt = clientInts.sort(
      (a: any, b: any) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime()
    )[0];
    return differenceInDays(new Date(), new Date(lastInt.interaction_date)) > 5;
  });

  // Sellers without recent activity (>3 days)
  const sellerActivity: Record<string, Date> = {};
  interactions.forEach((i) => {
    const d = new Date(i.interaction_date);
    if (!sellerActivity[i.user_id] || d > sellerActivity[i.user_id]) {
      sellerActivity[i.user_id] = d;
    }
  });
  const inactiveSellers = profiles.filter((p) => {
    const lastActivity = sellerActivity[p.user_id];
    if (!lastActivity) return true;
    return differenceInDays(new Date(), lastActivity) > 3;
  });

  const totalAlerts = overdueFollowups.length + contactosSinSeguimiento.length + inactiveSellers.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center animate-pulse">
              {totalAlerts > 9 ? "9+" : totalAlerts}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b bg-muted/30">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Alertas y notificaciones
            {totalAlerts > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5">{totalAlerts}</Badge>
            )}
          </h3>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y">
          {/* Overdue follow-ups */}
          {overdueFollowups.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Seguimientos vencidos ({overdueFollowups.length})
              </p>
              {overdueFollowups.slice(0, 4).map((i) => (
                <button
                  key={i.id}
                  className="w-full text-left p-2 rounded-md hover:bg-destructive/5 transition-colors flex items-center justify-between group"
                  onClick={() => navigate("/interactions")}
                >
                  <div>
                    <p className="text-xs font-medium">{i.clients?.name || "Cliente"}</p>
                    <p className="text-[10px] text-muted-foreground">{i.next_step || "Pendiente"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 shrink-0">
                    {differenceInDays(new Date(), new Date(i.follow_up_date))}d
                  </Badge>
                </button>
              ))}
            </div>
          )}

          {/* Contactos sin seguimiento */}
          {contactosSinSeguimiento.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-accent uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Contactos sin seguimiento ({contactosSinSeguimiento.length})
              </p>
              {contactosSinSeguimiento.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  className="w-full text-left p-2 rounded-md hover:bg-accent/10 transition-colors flex items-center justify-between"
                  onClick={() => navigate("/clients")}
                >
                  <div>
                    <p className="text-xs font-medium">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.company || c.segment || "—"}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Inactive sellers */}
          {inactiveSellers.length > 0 && (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                <UserX className="h-3 w-3" /> Vendedores sin actividad ({inactiveSellers.length})
              </p>
              {inactiveSellers.slice(0, 4).map((p) => (
                <div key={p.user_id} className="p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <p className="text-xs font-medium">{p.full_name || "Sin nombre"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sellerActivity[p.user_id]
                      ? `Última actividad: ${format(sellerActivity[p.user_id], "dd MMM", { locale: es })}`
                      : "Sin actividad registrada"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {totalAlerts === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              🎉 ¡Todo al día! No hay alertas.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
