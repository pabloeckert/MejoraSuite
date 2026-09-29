import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS, DEMO_CLIENTS, DEMO_PROFILES } from "@/demo/demoData";
import type { DashboardData } from "@/lib/types";

export function useNotificationsData() {
  const demoMode = useDemoMode();
  return useQuery<DashboardData>({
    queryKey: ["notifications-data", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) {
        return {
          interactions: DEMO_INTERACTIONS as any,
          clients: DEMO_CLIENTS as any,
          profiles: DEMO_PROFILES as any,
        } as DashboardData;
      }

      const { data, error } = await supabase.rpc("get_notifications_data");
      if (error) throw error;

      return (data as unknown as DashboardData) ?? {
        interactions: [],
        clients: [],
        profiles: [],
      };
    },
  });
}
