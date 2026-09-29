import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/AuthContext";
import { MEMORY_DEMO_PROFILES, setDemoTarget } from "@/demo/demoData";
import type { ProfileWithTarget } from "@/lib/types";

export function useProfiles() {
  const demoMode = useDemoMode();
  return useQuery<ProfileWithTarget[]>({
    queryKey: ["profiles", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) {
        return MEMORY_DEMO_PROFILES.map((p) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          monthly_target: p.monthly_target ?? null,
        }));
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, monthly_target");
      if (error) throw error;
      // Cast necesario: monthly_target no está en types.ts auto-generado hasta regenerar
      return (data ?? []) as unknown as ProfileWithTarget[];
    },
  });
}

export function useUpdateTarget() {
  const qc = useQueryClient();
  const demoMode = useDemoMode();
  return useMutation({
    mutationFn: async ({
      user_id,
      monthly_target,
    }: {
      user_id: string;
      monthly_target: number | null;
    }) => {
      if (demoMode) {
        setDemoTarget(user_id, monthly_target);
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({ monthly_target } as any)
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
