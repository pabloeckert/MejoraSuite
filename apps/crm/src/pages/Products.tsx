import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useDemoMode } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { parseCSV, findHeader, getField } from "@/lib/csvParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Upload, Download } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useProducts, addDemoProduct, updateDemoProduct } from "@/hooks/useProducts";
import { UNITS } from "@/lib/constants";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { ProductImportDialog, type ProductImportItem } from "@/components/products/ProductImportDialog";
import { ProductsTable } from "@/components/products/ProductsTable";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export default function Products() {
  const { role } = useAuth();
  const demoMode = useDemoMode();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<ProductInsert>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ProductImportItem[]>([]);
  const [importDuplicates, setImportDuplicates] = useState(0);

  const canManage = role === "admin" || role === "supervisor";
  const { data: products = [] } = useProducts();

  const upsertMutation = useMutation({
    mutationFn: async (p: ProductInsert & { id?: string }) => {
      if (demoMode) {
        if (p.id) {
          updateDemoProduct(p.id, p);
          return { ...p };
        }
        return addDemoProduct(p);
      }
      if (p.id) {
        const { id, ...rest } = p;
        const { error } = await supabase.from("products").update(rest).eq("id", id);
        if (error) throw error;
        return { ...rest, id };
      } else {
        const { data, error } = await supabase.from("products").insert(p).select().single();
        if (error) throw error;
        return data;
      }
    },
    onMutate: async (p) => {
      const key = ["products", demoMode ? "demo" : "live"];
      await queryClient.cancelQueries({ queryKey: key });
      const snapshot = queryClient.getQueryData<Product[]>(key);
      queryClient.setQueryData<Product[]>(key, (old = []) => {
        if (p.id) return old.map((item) => (item.id === p.id ? { ...item, ...p } : item));
        return [...old, { ...p, id: "optimistic-" + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Product];
      });
      return { snapshot, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) queryClient.setQueryData(context.key, context.snapshot);
      toast.error(_err instanceof Error ? _err.message : "Error al guardar");
    },
    onSuccess: () => {
      setDialogOpen(false);
      setForm({});
      setEditing(null);
      toast.success(editing ? "Producto actualizado" : "Producto creado");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (items: ProductImportItem[]) => {
      const toInsert = items
        .filter((i) => !i.isDuplicate)
        .map(({ isDuplicate, ...rest }) => rest);
      if (toInsert.length === 0) return;
      if (demoMode) {
        toInsert.forEach((item) => addDemoProduct(item));
        return;
      }
      const { error } = await supabase.from("products").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setImportDialogOpen(false);
      setImportPreview([]);
      const count = importPreview.filter((i) => !i.isDuplicate).length;
      toast.success(`${count} producto${count !== 1 ? "s" : ""} importado${count !== 1 ? "s" : ""}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ unit: "u", unit_label: "Unidad", currency: "ARS", active: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ ...p });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("El nombre es obligatorio");
    if (!form.unit) return toast.error("La unidad es obligatoria");
    const unit = UNITS.find((u) => u.value === form.unit);
    upsertMutation.mutate({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      description: form.description || null,
      category: form.category || null,
      unit: form.unit,
      unit_label: unit?.label || form.unit_label || "Unidad",
      currency: (form.currency as "ARS" | "USD" | "EUR") || "ARS",
      price: form.price !== undefined && form.price !== null ? Number(form.price) : null,
      active: form.active ?? true,
    } as ProductInsert);
  };

  const handleDownloadTemplate = () => {
    const headers = ["Nombre", "Descripción", "Categoría", "Unidad (código)", "Moneda", "Precio"];
    const example = ["Semillas de pino", "Semillas de alta germinación", "Forestal", "kg", "ARS", "4250"];
    const units = ["u=Unidad", "kg=Kilogramo", "tn=Tonelada", "m3=Metro cúbico", "m2=Metro cuadrado", "ml=Metro lineal", "ha=Hectárea", "lt=Litro", "hr=Hora", "servicio=Servicio"];
    const csv = [headers, example].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const notes = `\n\n# Unidades válidas: ${units.join(", ")}`;
    const blob = new Blob(["﻿" + csv + notes], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos_mejoracrm.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada");
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) return toast.error("El archivo está vacío");

      const nameIdx = findHeader(headers, "nombre", "name");
      if (nameIdx === -1) return toast.error("No se encontró columna 'Nombre'");

      const descIdx = findHeader(headers, "descripción", "descripcion", "description");
      const catIdx = findHeader(headers, "categoría", "categoria", "category");
      const unitIdx = findHeader(headers, "unidad", "unit");
      const currencyIdx = findHeader(headers, "moneda", "currency");
      const priceIdx = findHeader(headers, "precio", "price");

      const existingNames = new Set(products.map((p) => p.name.toLowerCase()));
      let dupes = 0;
      const parsed: ProductImportItem[] = [];

      for (const cols of rows) {
        const name = getField(cols, nameIdx);
        if (!name) continue;
        const unitCode = getField(cols, unitIdx)?.toLowerCase() || "u";
        const unit = UNITS.find((u) => u.value === unitCode);
        const isDuplicate = existingNames.has(name.toLowerCase());
        if (isDuplicate) dupes++;
        parsed.push({
          name,
          description: getField(cols, descIdx) || null,
          category: getField(cols, catIdx) || null,
          unit: unit?.value || "u",
          unit_label: unit?.label || "Unidad",
          currency: (getField(cols, currencyIdx)?.toUpperCase() || "ARS") as "ARS" | "USD" | "EUR",
          price: priceIdx >= 0 ? Number(getField(cols, priceIdx)) || null : null,
          active: true,
          isDuplicate,
        });
      }

      setImportPreview(parsed);
      setImportDuplicates(dupes);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!canManage) return <Navigate to="/" replace />;

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (showInactive || p.active);
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos en catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Plantilla
          </Button>
          <label>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer" asChild>
              <span><Upload className="h-4 w-4 mr-1" /> Importar</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <Button onClick={openNew} className="h-9">
            <Plus className="h-4 w-4 mr-1" /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o categoría..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-3 border rounded-md h-9">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} id="show-inactive" />
          <Label htmlFor="show-inactive" className="text-xs cursor-pointer">Mostrar inactivos</Label>
        </div>
      </div>

      <ProductsTable products={filtered} search={search} onEdit={openEdit} onNew={openNew} />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isPending={upsertMutation.isPending}
      />

      <ProductImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        preview={importPreview}
        duplicates={importDuplicates}
        onConfirm={() => importMutation.mutate(importPreview)}
        isPending={importMutation.isPending}
      />
    </div>
  );
}
