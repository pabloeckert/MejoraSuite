import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  Sparkles, 
  BookOpen, 
  FileCheck, 
  CalendarDays, 
  Settings, 
  LayoutDashboard,
  Layers
} from "lucide-react";

export function AppLayout() {
  const location = useLocation();

  const navItems = [
    { label: "Mesa Ejecutiva", path: "/mesa", icon: LayoutDashboard },
    { label: "Propuestas", path: "/propuestas", icon: FileCheck },
    { label: "Citas & Stories", path: "/citas", icon: Sparkles },
    { label: "Bóveda de Conocimiento", path: "/boveda", icon: BookOpen },
    { label: "Calendario", path: "/calendario", icon: CalendarDays },
    { label: "Configuración", path: "/configuracion", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Subnavegación horizontal compacta de MejoraSM (reemplaza el sidebar vertical redundante) */}
      <nav className="border-b border-slate-200 bg-slate-50/80 px-6 py-2 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/mesa" && location.pathname === "/");
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#1A3D84] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>SQLite Núcleo Activo</span>
        </div>
      </nav>

      {/* Área principal de trabajo con ancho completo garantizado */}
      <main className="flex-1 w-full bg-white text-slate-900 overflow-y-auto">
        <div className="w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
