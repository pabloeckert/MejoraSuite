import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search, Users, MessageSquare, Package, LayoutGrid, Settings,
  UserPlus, Plus, FileText,
} from "lucide-react";
import { useAllClients } from "@/hooks/useClients";
import { useAllInteractions } from "@/hooks/useInteractions";
import { RESULT_LABELS } from "@/lib/constants";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: clients = [] } = useAllClients();
  const { data: interactions = [] } = useAllInteractions();

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Reset query when closing
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const goTo = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate]
  );

  // Build command items
  const items: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", label: "Vista general", icon: LayoutGrid, action: () => goTo("/"), category: "Navegación" },
    { id: "nav-clients", label: "Clientes", icon: Users, action: () => goTo("/clients"), category: "Navegación" },
    { id: "nav-interactions", label: "Interacciones", icon: MessageSquare, action: () => goTo("/interactions"), category: "Navegación" },
    { id: "nav-products", label: "Productos", icon: Package, action: () => goTo("/products"), category: "Navegación" },
    { id: "nav-settings", label: "Configuración", icon: Settings, action: () => goTo("/settings"), category: "Navegación" },

    // Quick actions
    { id: "action-new-client", label: "Nuevo cliente", icon: UserPlus, action: () => goTo("/clients"), category: "Acciones" },
    { id: "action-new-interaction", label: "Nueva interacción", icon: Plus, action: () => goTo("/interactions"), category: "Acciones" },

    // Clients (dynamic) — search by name, company, province, segment
    ...clients.slice(0, 30).map((c) => ({
      id: `client-${c.id}`,
      label: c.name,
      description: [c.company, c.province, c.segment].filter(Boolean).join(" · ") || undefined,
      icon: Users,
      action: () => goTo("/clients"),
      category: "Clientes",
    })),

    // Recent interactions (dynamic) — search by client name, result, notes
    ...interactions.slice(0, 15).map((i: any) => ({
      id: `interaction-${i.id}`,
      label: i.clients?.name || "Interacción",
      description: `${RESULT_LABELS[i.result] || i.result} · ${new Date(i.interaction_date).toLocaleDateString()}${i.notes ? ` · ${i.notes.slice(0, 40)}` : ""}`,
      icon: FileText,
      action: () => goTo("/interactions"),
      category: "Interacciones recientes",
    })),
  ];

  // Filter by query — search across label, description, and category
  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.description || "").toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Buscar clientes, interacciones, páginas..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono shrink-0">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {Object.entries(grouped).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin resultados para "{query}"</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5">
                  {category}
                </p>
                {items.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-muted/50 transition-colors"
                    onClick={item.action}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="border-t px-4 py-2 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <span>↑↓ navegar</span>
          <span>↵ seleccionar</span>
          <span>ESC cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
