import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS, DEMO_CLIENTS, DEMO_PROFILES } from "@/demo/demoData";
import type { DashboardData } from "@/lib/types";

/**
 * Dashboard data via single RPC call.
 * In demo mode, returns mock data instead.
 * In local Electron suite mode, queries SQLite directly.
 */
export function useDashboardData() {
  const demoMode = useDemoMode();
  return useQuery<DashboardData>({
    queryKey: ["dashboard-data", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) {
        return {
          interactions: DEMO_INTERACTIONS as any,
          clients: DEMO_CLIENTS as any,
          profiles: DEMO_PROFILES as any,
        } as DashboardData;
      }

      // Bypass hacia SQLite en entorno local Electron
      if (typeof window !== "undefined" && Boolean((window as any).suite?.db)) {
        try {
          const clientesSqlite = (window as any).suite.db.crm?.getClientes
            ? await (window as any).suite.db.crm.getClientes()
            : await (window as any).suite.db.getClientes();
          const dealsSqlite = (window as any).suite.db.crm?.getDeals
            ? await (window as any).suite.db.crm.getDeals()
            : [];

          const clients = (clientesSqlite || []).map((c: any) => ({
            id: String(c.id),
            name: c.nombre || "Sin Nombre",
            phone: c.whatsapp,
            instagram: c.instagram_tiktok,
            company: c.empresa,
            position: c.cargo,
            segment: c.tag || "ocasional",
            notes: c.notas,
            status: "activo",
            created_at: new Date().toISOString(),
          })) as any;

          const interactions = (dealsSqlite || []).map((d: any) => ({
            id: String(d.id),
            client_id: d.cliente_id ? String(d.cliente_id) : null,
            interaction_type: "presupuesto",
            status: d.estado === "ganado" ? "concretada" : "pendiente",
            amount: d.valor || 0,
            notes: d.titulo + (d.notas ? ` - ${d.notas}` : ""),
            interaction_date: d.creado_el || new Date().toISOString(),
            clients: { name: d.titulo },
            interaction_lines: [],
          })) as any;

          return {
            interactions,
            clients,
            profiles: DEMO_PROFILES as any,
          } as DashboardData;
        } catch (sqliteErr) {
          console.warn("[CRM useDashboardData] Error en bypass SQLite:", sqliteErr);
        }
      }

      const { data, error } = await supabase.rpc("get_dashboard_data");
      if (error) throw error;

      return (data as unknown as DashboardData) ?? {
        interactions: [],
        clients: [],
        profiles: [],
      };
    },
  });
}
