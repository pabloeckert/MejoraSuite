import { LayoutGrid, Users, MessageSquare, Package, LogOut, Settings, Search, BarChart3, MessageCircle, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoImg from "@/assets/branding/MC_Logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Vista General", url: "/", icon: LayoutGrid },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Interacciones", url: "/interactions", icon: MessageSquare },
  { title: "Reportes", url: "/reports", icon: BarChart3, roles: ["admin", "supervisor"] },
  { title: "Productos", url: "/products", icon: Package, roles: ["admin", "supervisor"] },
  { title: "Link WhatsApp", url: "/whatsapp-link", icon: MessageCircle, roles: ["admin", "supervisor"] },
  { title: "Campañas WhatsApp", url: "/whatsapp-campanas", icon: MessageCircle, roles: ["admin", "supervisor"] },
  { title: "Contactos", url: "/contactos", icon: Users, roles: ["admin", "supervisor"] },
  { title: "Configuración", url: "/settings", icon: Settings, roles: ["admin", "supervisor"] },
  { title: "Modo demostración", url: "/demo", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, role, signOut, user } = useAuth();

  const visibleItems = items.filter((i) => !i.roles || (role && i.roles.includes(role)));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className={`flex flex-col items-center px-3 py-4 ${collapsed ? "" : "gap-1"}`}>
            <div className={`bg-white rounded-lg flex items-center justify-center shrink-0 ${collapsed ? "h-8 w-8 p-0.5" : "h-12 w-12 p-1"}`}>
              <img src={logoImg} alt="Mejora Continua" className="object-contain w-full h-full" />
            </div>
            {!collapsed && (
              <p
                className="text-[11px] font-bold text-sidebar-accent-foreground tracking-[0.25em] uppercase"
                style={{ fontFamily: "'League Spartan', sans-serif" }}
              >
                CRM
              </p>
            )}
          </div>
          <SidebarGroupContent>
            {/* Search trigger */}
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                document.dispatchEvent(event);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 mb-1 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <Search className="h-4 w-4" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Buscar...</span>
                  <kbd className="hidden sm:inline text-[10px] bg-sidebar-accent/50 px-1.5 py-0.5 rounded font-mono">Ctrl+K</kbd>
                </>
              )}
            </button>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        aria-label={item.title}
                        className={`transition-all duration-200 rounded-lg ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary font-semibold"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className={`mr-2 h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        {user && !collapsed && (
          <div className="px-1 text-xs">
            <p className="font-medium text-sidebar-accent-foreground truncate">{profile?.full_name || user.email}</p>
            <p className="text-sidebar-foreground/50 capitalize">{role || "—"}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 h-8"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {!collapsed && <span className="text-xs">Cerrar sesión</span>}
            </Button>
          )}
        </div>
        <div className={`text-[10px] text-sidebar-foreground/30 ${collapsed ? "text-center" : "px-1"}`}>
          {collapsed ? "v2" : "Mejora CRM v2.0"}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
