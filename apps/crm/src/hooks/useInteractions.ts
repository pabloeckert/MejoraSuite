import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/AuthContext";
import { DEMO_INTERACTIONS as INITIAL_DEMO_INTERACTIONS } from "@/demo/demoData";
import { toast } from "sonner";
import type { Interaction } from "@/lib/types";

const PAGE_SIZE = 50;

const INTERACTIONS_SELECT =
  "*, clients(name, province, segment, country), interaction_lines(quantity, unit_price, line_total, products(name, unit_label))";

// In-memory store for demo mode to support "create and see" during session
export let MEMORY_DEMO_INTERACTIONS = [...INITIAL_DEMO_INTERACTIONS] as Interaction[];

export const addDemoInteraction = (i: Partial<Interaction>) => {
  const newInteraction = {
    ...i,
    id: `demo-int-${Math.random().toString(36).substr(2, 9)}`,
    interaction_date: new Date().toISOString(),
    interaction_lines: i.interaction_lines || [],
  } as Interaction;
  MEMORY_DEMO_INTERACTIONS = [newInteraction, ...MEMORY_DEMO_INTERACTIONS];
  return newInteraction;
};

/**
 * Infinite scroll hook for interactions.
 */
export function useInteractionsInfinite() {
  const demoMode = useDemoMode();
  return useInfiniteQuery<Interaction[]>({
    queryKey: ["interactions-infinite", demoMode ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (demoMode) return [...MEMORY_DEMO_INTERACTIONS];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data as unknown as Interaction[]) ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (demoMode) return undefined;
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 30_000,
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  const demoMode = useDemoMode();
  return useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        MEMORY_DEMO_INTERACTIONS = MEMORY_DEMO_INTERACTIONS.filter(i => i.id !== id);
        return;
      }
      const { error } = await supabase.from("interactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["interactions-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Interacción eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function flattenInteractionPages(data: { pages: Interaction[][] } | undefined): Interaction[] {
  if (!data?.pages) return [];
  return data.pages.flat();
}

export { useInteractionsPaginated, useAllInteractions, useClientPresupuestos };

function useInteractionsPaginated() {
  const demoMode = useDemoMode();
  return useInfiniteQuery<Interaction[]>({
    queryKey: ["interactions-infinite", demoMode ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (demoMode) return [...MEMORY_DEMO_INTERACTIONS];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data as unknown as Interaction[]) ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (demoMode) return undefined;
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });
}

function useAllInteractions() {
  const demoMode = useDemoMode();
  return useQuery<Interaction[]>({
    queryKey: ["interactions", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) return [...MEMORY_DEMO_INTERACTIONS];
      const { data, error } = await supabase
        .from("interactions")
        .select(INTERACTIONS_SELECT)
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return (data as unknown as Interaction[]) ?? [];
    },
  });
}

function useClientPresupuestos(clientId: string | undefined) {
  const demoMode = useDemoMode();
  return useQuery<{ id: string; interaction_date: string; total_amount: number | null; currency: string | null }[]>({
    queryKey: ["interactions-presupuestos", clientId, demoMode ? "demo" : "live"],
    enabled: !!clientId,
    queryFn: async () => {
      if (demoMode) {
        return MEMORY_DEMO_INTERACTIONS.filter(
          (i) => i.client_id === clientId && i.result === "presupuesto"
        ).map((i) => ({ id: i.id, interaction_date: i.interaction_date, total_amount: i.total_amount, currency: i.currency }));
      }
      const { data, error } = await supabase
        .from("interactions")
        .select("id, interaction_date, total_amount, currency")
        .eq("client_id", clientId!)
        .eq("result", "presupuesto")
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return (data as { id: string; interaction_date: string; total_amount: number | null; currency: string | null }[]) ?? [];
    },
  });
}
