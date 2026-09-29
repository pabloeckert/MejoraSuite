import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/AuthContext";
import { DEMO_PRODUCTS } from "@/demo/demoData";
import type { Product } from "@/lib/types";

// Store en memoria para demo mode — mismo patrón que MEMORY_DEMO_CLIENTS /
// MEMORY_DEMO_INTERACTIONS. Sin esto, Products.tsx no tenía NINGÚN gate de
// demo mode en sus mutaciones (bug encontrado en auditoría, preexistente a
// la Fase 8): crear/editar/importar un producto escribía siempre a la
// Supabase real, incluso con el toggle de demo prendido.
export let MEMORY_DEMO_PRODUCTS = [...DEMO_PRODUCTS] as Product[];

export const addDemoProduct = (p: Partial<Product>) => {
  const newProduct = {
    ...p,
    id: `demo-prod-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Product;
  MEMORY_DEMO_PRODUCTS = [...MEMORY_DEMO_PRODUCTS, newProduct];
  return newProduct;
};

export const updateDemoProduct = (id: string, patch: Partial<Product>) => {
  MEMORY_DEMO_PRODUCTS = MEMORY_DEMO_PRODUCTS.map((p) =>
    p.id === id ? { ...p, ...patch, updated_at: new Date().toISOString() } : p
  );
};

export function useProducts() {
  const demoMode = useDemoMode();
  return useQuery<Product[]>({
    queryKey: ["products", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) return [...MEMORY_DEMO_PRODUCTS];
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return (data as Product[]) ?? [];
    },
  });
}

export function useActiveProducts() {
  const demoMode = useDemoMode();
  return useQuery<{ id: string; name: string; unit_label: string | null; currency: string | null; price: number | null }[]>({
    queryKey: ["products-active", demoMode ? "demo" : "live"],
    queryFn: async () => {
      if (demoMode) {
        return MEMORY_DEMO_PRODUCTS.filter((p) => p.active).map((p) => ({
          id: p.id,
          name: p.name,
          unit_label: p.unit_label ?? (p as unknown as { unit?: string }).unit ?? null,
          currency: p.currency,
          price: p.price,
        }));
      }
      const { data, error } = await supabase
        .from("products")
        .select("id, name, unit_label, currency, price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data as { id: string; name: string; unit_label: string | null; currency: string | null; price: number | null }[]) ?? [];
    },
  });
}
