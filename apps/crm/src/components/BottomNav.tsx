import { LayoutGrid, Users, MessageSquare, Plus, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotificationsData } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { buildFocusItems } from "@/components/dashboard/FocusDayWidget";

const NAV_ITEMS = [
  { icon: LayoutGrid, label: "Inicio", url: "/" },
  { icon: Users, label: "Clientes", url: "/clients" },
  { icon: MessageSquare, label: "Historial", url: "/interactions" },
  { icon: MoreHorizontal, label: "Más", url: "/settings" },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { data } = useNotificationsData();

  const totalAlerts =
    (data?.interactions ?? []).filter(
      (i) => i.follow_up_date && new Date(i.follow_up_date) < new Date()
    ).length;

  // FAB contextual: para vendedores, precarga el cliente de la oportunidad
  // más urgente (misma priorización que "Mi Foco de Hoy") en vez de un form vacío.
  const isSeller = role !== "admin" && role !== "supervisor";
  const myInteractions = isSeller
    ? (data?.interactions ?? []).filter((i) => i.user_id === user?.id)
    : [];
  const topFocusClientId = isSeller ? buildFocusItems(myInteractions, 1)[0]?.interaction.client_id : undefined;

  // Hide inside the interaction wizard or auth
  const hidden = ["/auth", "/privacy", "/terms"].includes(location.pathname);
  if (hidden) return null;

  function isActive(url: string) {
    return url === "/" ? location.pathname === "/" : location.pathname.startsWith(url);
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Left two items */}
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 transition-colors ${
              isActive(item.url)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className={`h-6 w-6 ${isActive(item.url) ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </button>
        ))}

        {/* FAB central */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => navigate("/interactions", { state: { openForm: true, presetClientId: topFocusClientId } })}
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center -mt-5 active:scale-95 transition-transform"
            aria-label="Registrar interacción"
          >
            <Plus className="h-7 w-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Right two items */}
        {NAV_ITEMS.slice(2).map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 transition-colors ${
              isActive(item.url)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <item.icon className={`h-6 w-6 ${isActive(item.url) ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            {item.url === "/interactions" && totalAlerts > 0 && (
              <span className="absolute top-2 right-1/4 h-2 w-2 rounded-full bg-destructive" />
            )}
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
