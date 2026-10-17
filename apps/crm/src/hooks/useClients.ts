import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/AuthContext";
import { DEMO_CLIENTS as INITIAL_DEMO_CLIENTS } from "@/demo/demoData";
import type { Client } from "@/lib/types";

const PAGE_SIZE = 50;

/**
 * Empuja un cliente hacia contactos_finales (MejoraContactos) vía la Edge
 * Function push-contacto. Best-effort a propósito: nunca lanza, nunca
 * bloquea al caller -- si contactos-api todavía no está configurada
 * (caso normal hoy) o la red falla, queda logueado del lado del backend
 * (contactos_sync_log) y el alta/edición del cliente en MejoraCRM igual
 * se considera exitosa. Ver INFORME-SINCRONIZACION-CONTACTOS.md.
 */
export function pushContactoBestEffort(clientId: string): void {
  supabase.functions
    .invoke("push-contacto", { body: { client_id: clientId } })
    .then(({ error }) => {
      if (error) console.warn("[push-contacto] sincronización con MejoraContactos falló (no bloqueante):", error);
    })
    .catch((e) => console.warn("[push-contacto] sincronización con MejoraContactos falló (no bloqueante):", e));
}

// In-memory store for demo mode to support "create and see" during session
let MEMORY_DEMO_CLIENTS = [...INITIAL_DEMO_CLIENTS] as Client[];

export const addDemoClient = (c: Partial<Client>) => {
  const newClient = {
    ...c,
    id: `demo-${Math.random().toString(36).substr(2, 9)}`,
    status: c.status || "potencial",
    created_at: new Date().toISOString(),
  } as Client;
  MEMORY_DEMO_CLIENTS = [newClient, ...MEMORY_DEMO_CLIENTS];
  return newClient;
};

/**
 * Infinite scroll hook for clients.
 * Returns: { data (flat array), fetchNextPage, hasNextPage, isFetchingNextPage, ... }
 */
export function useClientsInfinite() {
  const demoMode = useDemoMode();
  return useInfiniteQuery<Client[]>({
    queryKey: ["clients-infinite", demoMode ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (demoMode) return [...MEMORY_DEMO_CLIENTS];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name")
        .range(from, to);
      if (error) throw error;
      return (data as Client[]) ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (demoMode) return undefined; // No pagination in demo
      if (lastPage.length < PAGE_SIZE) return undefined; // No more pages
      return allPages.length; // Next page index
    },
    initialPageParam: 0,
    staleTime: 30_000,
  });
}

/**
 * Flatten infinite query pages into a single array.
 */
export function flattenClientPages(data: { pages: Client[][] } | undefined): Client[] {
  if (!data?.pages) return [];
  return data.pages.flat();
}

export function useDeactivateClient() {
  const queryClient = useQueryClient();
  const demoMode = useDemoMode();
  return useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        MEMORY_DEMO_CLIENTS = MEMORY_DEMO_CLIENTS.map(c => 
          c.id === id ? { ...c, status: "inactivo" } : c
        );
        return;
      }
      const { error } = await supabase.from("clients").update({ status: "inactivo" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      toast.success("Cliente marcado como inactivo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Keep existing hooks for compatibility
export { useClientsPaginated, useAllClients, useClientsMinimal };

function useClientsPaginated() {
  // Legacy — prefer useClientsInfinite
  const demoMode = useDemoMode();
  return useInfiniteQuery<Client[]>({
    queryKey: ["clients-infinite", demoMode ? "demo" : "live"],
    queryFn: async ({ pageParam = 0 }) => {
      if (demoMode) return [...MEMORY_DEMO_CLIENTS];
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase.from("clients").select("*").order("name").range(from, to);
      if (error) throw error;
      return (data as Client[]) ?? [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (demoMode) return undefined;
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
  });
}

import { useQuery } from "@tanstack/react-query";

function useAllClients() {
  const demoMode = useDemoMode();
  return useQuery<Client[]>({
    queryKey: ["clients", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) return [...MEMORY_DEMO_CLIENTS];
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return (data as Client[]) ?? [];
    },
  });
}

function useClientsMinimal() {
  const demoMode = useDemoMode();
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["clients-min", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) return MEMORY_DEMO_CLIENTS.map((c) => ({ id: c.id, name: c.name }));
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return (data as { id: string; name: string }[]) ?? [];
    },
  });
}
