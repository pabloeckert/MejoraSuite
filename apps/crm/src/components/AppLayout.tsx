import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { DemoRoleToggle } from "@/components/DemoRoleToggle";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { BottomNav } from "@/components/BottomNav";
import { useLocation } from "react-router-dom";

const PAGE_TITLES: Record<string, string> = {
  "/": "Vista General",
  "/clients": "Clientes",
  "/interactions": "Interacciones",
  "/products": "Productos",
  "/whatsapp-link": "Link WhatsApp",
  "/whatsapp-campanas": "Campañas WhatsApp",
  "/contactos": "Contactos",
  "/settings": "Configuración",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-4 shrink-0 sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger />
              <span className="ml-3 text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            <div className="flex items-center gap-2">
              <DemoModeToggle />
              <DemoRoleToggle />
              <NotificationsPanel />
            </div>
          </header>
          <main className="flex-1 p-4 pb-20 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </SidebarProvider>
  );
}
