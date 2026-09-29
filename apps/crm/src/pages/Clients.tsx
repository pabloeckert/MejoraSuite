import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useDemoMode } from "@/contexts/AuthContext";
import { parseCSV, findHeader, getField } from "@/lib/csvParser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Upload, Download, FileSpreadsheet, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { ListSkeleton } from "@/components/skeletons";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { useClientsInfinite, flattenClientPages, useDeactivateClient, addDemoClient, useAllClients, pushContactoBestEffort } from "@/hooks/useClients";
import { exportClientsExcel } from "@/lib/excelExport";
import { STATUS_LABELS, PROVINCIAS, BRAND } from "@/lib/constants";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ClientDetailDialog } from "@/components/clients/ClientDetailDialog";
import { ClientImportDialog, type ImportPreviewItem } from "@/components/clients/ClientImportDialog";
import { ClientsTable } from "@/components/clients/ClientsTable";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

export default function Clients() {
  const { user, role } = useAuth();
  const demoMode = useDemoMode();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<ClientInsert>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewItem[]>([]);
  const [importDuplicates, setImportDuplicates] = useState(0);

  const { data: clientsInfinite, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useClientsInfinite();
  const clients = flattenClientPages(clientsInfinite);

  // Deep link desde otras pantallas (ej. InteractionCard) — abre el detalle
  // de un cliente puntual vía /clients?open=<id>, sin depender de qué página
  // de la lista infinita esté cargada.
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: allClients = [] } = useAllClients();
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    const match = allClients.find((c) => c.id === openId);
    if (match) {
      setDetailClient(match);
      setSearchParams((prev) => { prev.delete("open"); return prev; }, { replace: true });
    }
  }, [searchParams, allClients, setSearchParams]);

  const upsertMutation = useMutation({
    mutationFn: async (c: ClientInsert & { id?: string }) => {
      if (demoMode) {
        // En modo demo, simulamos éxito y agregamos al almacén en memoria
        addDemoClient(c);
        return;
      }
      if (c.id) {
        const { id, ...rest } = c;
        const { error } = await supabase.from("clients").update(rest).eq("id", id);
        if (error) throw error;
        pushContactoBestEffort(id);
      } else {
        const { data, error } = await supabase.from("clients").insert(c).select("id").single();
        if (error) throw error;
        pushContactoBestEffort(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-infinite"] });
      setDialogOpen(false);
      setForm({});
      setEditing(null);
      toast.success(editing ? "Cliente actualizado" : "Cliente creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMutation = useDeactivateClient();

  const importMutation = useMutation({
    mutationFn: async (items: ImportPreviewItem[]) => {
      if (demoMode) return;
      const toInsert = items
        .filter((i) => !i.isDuplicate)
        .map(({ isDuplicate, ...rest }) => rest);
      if (toInsert.length === 0) return;
      const { error } = await supabase.from("clients").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setImportDialogOpen(false);
      setImportPreview([]);
      toast.success(`${importPreview.filter((i) => !i.isDuplicate).length} clientes importados`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ assigned_to: user?.id });
    setDialogOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ ...c });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("El nombre es obligatorio");
    const whatsappValid = !form.whatsapp || /^\+?\d[\d\s\-()]{6,20}$/.test(form.whatsapp);
    if (form.whatsapp && !whatsappValid) return toast.error("Formato de WhatsApp inválido. Usá: +54 376 4000000");
    upsertMutation.mutate({
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      company: form.company || null,
      contact_name: form.contact_name || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      segment: form.segment || null,
      channel: form.channel || null,
      address: form.address || null,
      province: form.province || null,
      country: form.country || "Argentina",
      location: form.location || null,
      notes: form.notes || null,
      assigned_to: form.assigned_to || user?.id,
    } as ClientInsert);
  };

  const handleExportCSV = () => {
    const headers = ["Nombre", "Empresa", "WhatsApp", "Email", "Rubro", "Canal de Ingreso", "País", "Provincia", "Localidad", "Dirección", "Estado", "Observaciones"];
    const rows = filtered.map((c) => [
      c.name, c.company || "", c.whatsapp || "", c.email || "",
      c.segment || "", c.channel || "", c.country || "Argentina", c.province || "",
      c.location || "", c.address || "", c.status, c.notes || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_mejoracrm_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportados ${filtered.length} clientes`);
  };

  const handleExportPDF = () => {
    const rows = filtered.map((c) => `
      <tr>
        <td>${c.name}</td><td>${c.company || "—"}</td><td>${c.whatsapp || "—"}</td>
        <td>${c.segment || "—"}</td><td>${c.country || "Argentina"}</td>
        <td>${c.province || "—"}</td><td>${c.status}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Clientes - MejoraCRM</title>
<style>
  body{font-family:Arial,sans-serif;padding:20px;color:#1a1a1a}
  h1{color:${BRAND.primary};font-size:18px;margin-bottom:4px}
  p.sub{color:#656565;font-size:12px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:${BRAND.primary};color:#fff;padding:8px;text-align:left}
  td{padding:6px 8px;border-bottom:1px solid #e5e5e5}
  tr:nth-child(even){background:#f9f9f9}
  @media print{body{padding:0}}
</style></head><body>
<h1>Clientes — MejoraCRM</h1>
<p class="sub">Exportado: ${new Date().toLocaleDateString("es-AR")} · ${filtered.length} registros</p>
<table><thead><tr><th>Nombre</th><th>Empresa</th><th>WhatsApp</th><th>Rubro</th><th>País</th><th>Provincia</th><th>Estado</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (rows.length === 0) return toast.error("El archivo está vacío");

      const nameIdx = findHeader(headers, "nombre", "name");
      if (nameIdx === -1) return toast.error("No se encontró columna 'Nombre'");

      const waIdx = findHeader(headers, "whatsapp", "teléfono", "telefono", "phone");
      const emailIdx = findHeader(headers, "email", "correo");
      const companyIdx = findHeader(headers, "empresa", "company");
      const segmentIdx = findHeader(headers, "rubro", "segmento", "segment");
      const provinceIdx = findHeader(headers, "provincia", "province");
      const channelIdx = findHeader(headers, "canal", "channel");
      const locationIdx = findHeader(headers, "localidad", "ciudad", "location");
      const addressIdx = findHeader(headers, "dirección", "direccion", "address");
      const countryIdx = findHeader(headers, "país", "pais", "country");
      const notesIdx = findHeader(headers, "observaciones", "notas", "notes");

      const existingNames = new Set(clients.map((c) => c.name.toLowerCase()));
      const existingWhatsapps = new Set(clients.map((c) => c.whatsapp?.toLowerCase()).filter(Boolean));
      let dupes = 0;

      const parsed: ImportPreviewItem[] = [];
      for (const cols of rows) {
        const name = getField(cols, nameIdx);
        if (!name) continue;
        const whatsapp = getField(cols, waIdx);
        const isDuplicate =
          existingNames.has(name.toLowerCase()) ||
          !!(whatsapp && existingWhatsapps.has(whatsapp.toLowerCase()));
        if (isDuplicate) dupes++;
        parsed.push({
          name,
          company: getField(cols, companyIdx),
          whatsapp: whatsapp || null,
          email: getField(cols, emailIdx),
          segment: getField(cols, segmentIdx),
          channel: getField(cols, channelIdx),
          province: getField(cols, provinceIdx),
          location: getField(cols, locationIdx),
          address: getField(cols, addressIdx),
          country: getField(cols, countryIdx) || "Argentina",
          notes: getField(cols, notesIdx),
          isDuplicate,
          assigned_to: user?.id,
          status: "potencial",
        });
      }
      setImportPreview(parsed);
      setImportDuplicates(dupes);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (isLoading) return <ListSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="p-3 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Error al cargar clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Reintentar
        </Button>
      </div>
    );
  }

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      !!c.company?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchProvince = provinceFilter === "all" || c.province === provinceFilter;
    return matchSearch && matchStatus && matchProvince;
  });

  const statusCounts = {
    all: clients.length,
    activo: clients.filter((c) => c.status === "activo").length,
    potencial: clients.filter((c) => c.status === "potencial").length,
    inactivo: clients.filter((c) => c.status === "inactivo").length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />PDF
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => exportClientsExcel(filtered)}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
          </Button>
          <label>
            <Button variant="outline" size="sm" className="h-9 cursor-pointer" asChild>
              <span><Upload className="h-4 w-4 mr-1" />Importar</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <Button onClick={openNew} className="h-9">
            <Plus className="h-4 w-4 mr-1" />Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o empresa..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Provincia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las provincias</SelectItem>
            {PROVINCIAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1.5">
          {(["all", "activo", "potencial", "inactivo"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Todos" : STATUS_LABELS[s]} ({statusCounts[s]})
            </Button>
          ))}
        </div>
      </div>

      <ClientsTable
        clients={filtered}
        onView={setDetailClient}
        onEdit={openEdit}
        onDeactivate={(c) => deactivateMutation.mutate(c.id)}
        canDeactivate={role === "admin"}
      />

      <InfiniteScrollTrigger
        hasNextPage={!!hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isPending={upsertMutation.isPending}
      />

      <ClientDetailDialog client={detailClient} onClose={() => setDetailClient(null)} />

      <ClientImportDialog
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
