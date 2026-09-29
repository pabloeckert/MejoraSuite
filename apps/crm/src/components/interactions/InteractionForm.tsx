import { useMemo, useState, useRef, useEffect } from "react";
import { addDemoInteraction } from "@/hooks/useInteractions";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useDemoMode } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";
import {
  MessageCircle, Phone, Mail, Globe, Video,
  AlertCircle, FileText, ShoppingCart, Clock, X,
  Check, ChevronsUpDown, Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { interactionSchema, type InteractionFormData, type LineFormData } from "@/lib/schemas";
import type { Result } from "./InteractionCard";
import { RESULT_ICONS, RESULT_LABELS, RESULT_STYLES } from "./InteractionCard";
import { ProductLines } from "./ProductLines";
import { ProformaUpload } from "./ProformaUpload";
import type { Client, Product, Interaction } from "@/lib/types";
import {
  MEDIUM_LABELS, FOLLOWUP_SCENARIOS, LOSS_REASONS,
  NEGOTIATION_LABELS, CURRENCIES,
} from "@/lib/constants";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Constants } from "@/integrations/supabase/types";

const MEDIUM_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageCircle, llamada: Phone, email: Mail,
  reunion_presencial: Video, reunion_virtual: Video,
  md_instagram: Globe, md_facebook: Globe, md_linkedin: Globe, visita_campo: Globe,
};

// ── Client combobox ────────────────────────────────────────────────────────────

function ClientCombobox({
  clients, value, onChange, error,
}: {
  clients: Client[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = clients.find((c) => c.id === value);

  const filtered = search
    ? clients.filter((c) => {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q);
      })
    : clients;

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between h-9 px-3 border border-input rounded-md text-sm bg-background hover:bg-muted/20 transition-colors"
      >
        {selected ? (
          <span className="truncate text-left">
            {selected.name}{selected.company ? ` — ${selected.company}` : ""}
          </span>
        ) : (
          <span className="text-muted-foreground">Seleccionar cliente...</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-2">
          <Input
            ref={inputRef}
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 mb-2 text-sm"
          />
          <div className="max-h-52 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-center text-muted-foreground py-4">Sin resultados</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); setSearch(""); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors ${
                    value === c.id ? "bg-primary/5 text-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    value === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate block">{c.name}</span>
                    {c.company && <span className="text-[10px] text-muted-foreground">{c.company}</span>}
                  </div>
                  {value === c.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────────

interface InteractionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  products: Product[];
  presupuestos: Interaction[];
  interaction?: Interaction | null;
  initialClientId?: string;
  onClientChange?: (clientId?: string) => void;
  onResultChange?: (result?: string) => void;
}

export function InteractionForm({
  open, onOpenChange, clients, products, presupuestos, interaction,
  initialClientId, onClientChange, onResultChange,
}: InteractionFormProps) {
  const { user } = useAuth();
  const demoMode = useDemoMode();
  const queryClient = useQueryClient();
  const isEditing = !!interaction;
  const { isConnected: calendarConnected, createEvent } = useGoogleCalendar();
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [lines, setLines] = useState<LineFormData[]>([]);
  const [proformaFile, setProformaFile] = useState<File | null>(null);

  const { control, handleSubmit, watch, reset, trigger, setValue, formState: { errors } } =
    useForm<InteractionFormData>({
      resolver: zodResolver(interactionSchema),
      defaultValues: interaction
        ? {
            client_id: interaction.client_id || "",
            medium: (interaction.medium as any) || undefined,
            result: (interaction.result as any) || undefined,
            quote_path: (interaction.quote_path as any) || "catalogo",
            currency: (interaction.currency as any) || "ARS",
            total_amount: interaction.total_amount || null,
            attachment_url: interaction.attachment_url || null,
            reference_quote_id: interaction.reference_quote_id || null,
            followup_scenario: (interaction.followup_scenario as any) || null,
            followup_motive: interaction.followup_motive || null,
            negotiation_state: (interaction.negotiation_state as any) || null,
            historic_quote_amount: interaction.historic_quote_amount || null,
            historic_quote_date: interaction.historic_quote_date || null,
            loss_reason: interaction.loss_reason || null,
            estimated_loss: interaction.estimated_loss || null,
            next_step: interaction.next_step || null,
            follow_up_date: interaction.follow_up_date || null,
            notes: interaction.notes || null,
          }
        : {
            client_id: "", medium: undefined, result: undefined,
            quote_path: "catalogo", currency: "ARS", total_amount: null, attachment_url: null,
            reference_quote_id: null, followup_scenario: null, followup_motive: null,
            negotiation_state: null, historic_quote_amount: null, historic_quote_date: null,
            loss_reason: null, estimated_loss: null, next_step: null, follow_up_date: null, notes: null,
          },
    });

  const resultValue = watch("result") as Result | undefined;
  const clientId = watch("client_id");
  const quotePath = watch("quote_path");
  const followupScenario = watch("followup_scenario");
  const selectedClient = clients.find((c) => c.id === clientId);

  // Prellenar cliente al abrir para una interacción nueva (ej. FAB contextual)
  useEffect(() => {
    if (open && !isEditing && initialClientId) {
      setValue("client_id", initialClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditing, initialClientId]);

  // Notificar al padre el cliente/resultado seleccionados — usados para
  // cargar los presupuestos vinculables (reference_quote_id) de ese cliente.
  useEffect(() => {
    onClientChange?.(clientId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    onResultChange?.(resultValue || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultValue]);

  useMemo(() => {
    if (interaction?.interaction_lines && interaction.interaction_lines.length > 0) {
      setLines(
        interaction.interaction_lines.map((l: any) => ({
          product_id: l.product_id || "",
          quantity: l.quantity || 0,
          unit_price: l.unit_price || 0,
        }))
      );
    }
  }, [interaction]);

  const linesTotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.unit_price, 0), [lines]);

  const addLine = () => setLines([...lines, { product_id: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, patch: Partial<LineFormData>) =>
    setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const onProductPick = (i: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(i, { product_id: productId, unit_price: p?.price ? Number(p.price) : 0 });
  };

  const closeAndReset = () => {
    reset();
    setLines([]);
    setProformaFile(null);
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InteractionFormData) => {
      if (demoMode) {
        addDemoInteraction(data as any);
        return;
      }
      const total = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
      const payload: any = {
        client_id: data.client_id, user_id: user?.id, medium: data.medium, result: data.result,
        notes: data.notes || null, next_step: data.next_step || null, follow_up_date: data.follow_up_date || null,
      };

      if (data.result === "presupuesto") {
        payload.quote_path = data.quote_path || "catalogo";
        payload.currency = data.currency || "ARS";
        payload.total_amount = total || data.total_amount || null;
        if (data.quote_path === "adjunto") payload.attachment_url = data.attachment_url || null;
      }
      if (data.result === "venta") {
        payload.currency = data.currency || "ARS";
        payload.total_amount = total || data.total_amount || null;
        payload.reference_quote_id = data.reference_quote_id || null;
      }
      if (data.result === "seguimiento") {
        payload.followup_scenario = data.followup_scenario || "independiente";
        payload.followup_motive = data.followup_motive || null;
        payload.negotiation_state = data.negotiation_state || null;
        if (data.followup_scenario === "vinculado") payload.reference_quote_id = data.reference_quote_id || null;
        if (data.followup_scenario === "historico") {
          payload.historic_quote_amount = data.historic_quote_amount || null;
          payload.historic_quote_date = data.historic_quote_date || null;
          payload.currency = data.currency || "ARS";
        }
      }
      if (data.result === "no_interesado") {
        payload.loss_reason = data.loss_reason || null;
        payload.estimated_loss = data.estimated_loss || null;
        payload.currency = data.currency || "ARS";
      }

      const linesPayload = (interactionId: string) =>
        lines.filter((l) => l.product_id && l.quantity > 0).map((l) => ({
          interaction_id: interactionId, product_id: l.product_id, quantity: l.quantity,
          unit_price: l.unit_price, line_total: l.quantity * l.unit_price,
        }));

      const needsLines = data.result === "presupuesto" || data.result === "venta";

      if (isEditing && interaction) {
        const { error } = await supabase.from("interactions").update(payload).eq("id", interaction.id);
        if (error) throw error;
        if (needsLines) {
          await supabase.from("interaction_lines").delete().eq("interaction_id", interaction.id);
          const lp = linesPayload(interaction.id);
          if (lp.length > 0) {
            const { error: le } = await supabase.from("interaction_lines").insert(lp);
            if (le) throw le;
          }
        }
      } else {
        const { data: created, error } = await supabase.from("interactions").insert(payload).select("id").single();
        if (error) throw error;
        if (needsLines && created) {
          const lp = linesPayload(created.id);
          if (lp.length > 0) {
            const { error: le } = await supabase.from("interaction_lines").insert(lp);
            if (le) throw le;
          }
        }
      }
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["client-interactions", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });

      if (syncToCalendar) {
        const clientName = clients.find((c) => c.id === variables.client_id)?.name || "Cliente";
        await createEvent(
          `${RESULT_LABELS[variables.result as Result]} - ${clientName}`,
          variables.notes || `Interacción registrada vía ${MEDIUM_LABELS[variables.medium as string]}`,
          new Date()
        );
      }

      closeAndReset();
      toast.success(isEditing ? "Interacción actualizada" : "Interacción registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const RESULTS = Constants.public.Enums.interaction_result as readonly Result[];
  const MEDIUMS = Constants.public.Enums.interaction_medium;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeAndReset(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar interacción" : "Registrar interacción"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-5 py-1">

          {/* ── Cliente ───────────────────────────────────────── */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>
                ¿A quién contactaste? <span className="text-destructive">*</span>
              </Label>
              <ClientCombobox
                clients={clients}
                value={clientId}
                onChange={(id) => { setValue("client_id", id); trigger("client_id"); }}
                error={errors.client_id?.message}
              />
            </div>
          )}

          {/* ── Resultado ─────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>
              {selectedClient ? `¿Qué pasó con ${selectedClient.name}?` : "¿Qué pasó?"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 gap-1.5">
              {RESULTS.map((r) => {
                const Icon = RESULT_ICONS[r];
                const active = resultValue === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue("result", r)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left w-full transition-all ${
                      active
                        ? RESULT_STYLES[r] + " ring-1 ring-primary/20 shadow-sm"
                        : "border-border bg-card hover:bg-muted/20"
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${active ? "bg-white/50" : "bg-muted/50"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{RESULT_LABELS[r]}</span>
                  </button>
                );
              })}
            </div>
            {errors.result && <p className="text-xs text-destructive">{errors.result.message}</p>}
          </div>

          {/* ── Detalles condicionales ────────────────────────── */}
          {resultValue === "presupuesto" && (
            <div className="space-y-3 p-3 rounded-lg border border-primary/15 bg-primary/[0.03]">
              <Label className="text-xs font-semibold text-primary uppercase tracking-wide">Presupuesto</Label>
              <div>
                <Label className="text-xs">Origen</Label>
                <Controller name="quote_path" control={control} render={({ field }) => (
                  <Select value={field.value || "catalogo"} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="catalogo">Productos del catálogo</SelectItem>
                      <SelectItem value="adjunto">Documento adjunto</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              {(quotePath || "catalogo") === "catalogo" ? (
                <ProductLines
                  lines={lines} products={products} addLine={addLine} removeLine={removeLine}
                  updateLine={updateLine} onProductPick={onProductPick}
                  total={linesTotal} currency={watch("currency") || "ARS"}
                  onCurrencyChange={(c) => setValue("currency", c)}
                />
              ) : (
                <div className="space-y-3">
                  <ProformaUpload
                    value={watch("attachment_url")} onChange={(url) => setValue("attachment_url", url)}
                    file={proformaFile} onFileChange={setProformaFile}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Moneda</Label>
                      <Controller name="currency" control={control} render={({ field }) => (
                        <Select value={field.value || "ARS"} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      )} />
                    </div>
                    <div>
                      <Label className="text-xs">Monto total</Label>
                      <Controller name="total_amount" control={control} render={({ field }) => (
                        <Input className="h-9 mt-1" type="number" value={field.value || ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                      )} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {resultValue === "venta" && (
            <div className="space-y-3 p-3 rounded-lg border border-success/20 bg-success/[0.03]">
              <Label className="text-xs font-semibold text-success uppercase tracking-wide">Venta</Label>
              <div>
                <Label className="text-xs">Vincular presupuesto previo (opcional)</Label>
                <Controller name="reference_quote_id" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || null)}>
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} />
                    </SelectTrigger>
                    <SelectContent>
                      {presupuestos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {new Date(p.interaction_date).toLocaleDateString()} — {p.currency} {Number(p.total_amount || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <ProductLines
                lines={lines} products={products} addLine={addLine} removeLine={removeLine}
                updateLine={updateLine} onProductPick={onProductPick}
                total={linesTotal} currency={watch("currency") || "ARS"}
                onCurrencyChange={(c) => setValue("currency", c)}
              />
            </div>
          )}

          {resultValue === "seguimiento" && (
            <div className="space-y-3 p-3 rounded-lg border border-accent/20 bg-accent/[0.03]">
              <Label className="text-xs font-semibold text-accent-foreground uppercase tracking-wide">Seguimiento</Label>
              <div>
                <Label className="text-xs">Tipo de seguimiento <span className="text-destructive">*</span></Label>
                <Controller name="followup_scenario" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FOLLOWUP_SCENARIOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.followup_scenario && <p className="text-xs text-destructive mt-1">{errors.followup_scenario.message}</p>}
              </div>
              {followupScenario === "vinculado" && (
                <div>
                  <Label className="text-xs">Presupuesto vinculado</Label>
                  <Controller name="reference_quote_id" control={control} render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 mt-1">
                        <SelectValue placeholder={presupuestos.length === 0 ? "Sin presupuestos" : "Seleccionar"} />
                      </SelectTrigger>
                      <SelectContent>
                        {presupuestos.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {new Date(p.interaction_date).toLocaleDateString()} — {p.currency} {Number(p.total_amount || 0).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
              )}
              {followupScenario === "historico" && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Moneda</Label>
                    <Controller name="currency" control={control} render={({ field }) => (
                      <Select value={field.value || "ARS"} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </div>
                  <div>
                    <Label className="text-xs">Monto histórico</Label>
                    <Controller name="historic_quote_amount" control={control} render={({ field }) => (
                      <Input className="h-9 mt-1" type="number" value={field.value || ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    )} />
                  </div>
                  <div>
                    <Label className="text-xs">Fecha</Label>
                    <Controller name="historic_quote_date" control={control} render={({ field }) => (
                      <Input className="h-9 mt-1" type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />
                    )} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Estado de la negociación</Label>
                  <Controller name="negotiation_state" control={control} render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(NEGOTIATION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label className="text-xs">Motivo</Label>
                  <Controller name="followup_motive" control={control} render={({ field }) => (
                    <Input className="h-9 mt-1" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: confirmar precio" />
                  )} />
                </div>
              </div>
            </div>
          )}

          {resultValue === "no_interesado" && (
            <div className="space-y-3 p-3 rounded-lg border border-destructive/20 bg-destructive/[0.03]">
              <Label className="text-xs font-semibold text-destructive uppercase tracking-wide">No interesado</Label>
              <div>
                <Label className="text-xs">Motivo de rechazo <span className="text-destructive">*</span></Label>
                <Controller name="loss_reason" control={control} render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                    <SelectContent>
                      {LOSS_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
                {errors.loss_reason && <p className="text-xs text-destructive mt-1">{errors.loss_reason.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Moneda</Label>
                  <Controller name="currency" control={control} render={({ field }) => (
                    <Select value={field.value || "ARS"} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label className="text-xs">Pérdida estimada</Label>
                  <Controller name="estimated_loss" control={control} render={({ field }) => (
                    <Input className="h-9 mt-1" type="number" value={field.value || ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                  )} />
                </div>
              </div>
            </div>
          )}

          {/* ── Separador ─────────────────────────────────────── */}
          <div className="border-t border-border/50" />

          {/* ── Medio de contacto ─────────────────────────────── */}
          <div className="space-y-1.5">
            <Label>
              ¿Cómo lo contactaste? <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="medium"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-1.5">
                  {MEDIUMS.map((m) => {
                    const Icon = MEDIUM_ICONS[m] ?? MessageCircle;
                    const active = field.value === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => field.onChange(m)}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition-all ${
                          active
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                            : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate font-medium">{MEDIUM_LABELS[m]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.medium && <p className="text-xs text-destructive">{errors.medium.message}</p>}
          </div>

          {/* ── Próximo paso + fecha ───────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Próximo paso</Label>
              <Controller name="next_step" control={control} render={({ field }) => (
                <Input className="h-9" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: enviar muestra" />
              )} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de seguimiento</Label>
              <Controller name="follow_up_date" control={control} render={({ field }) => (
                <Input className="h-9" type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />
              )} />
            </div>
          </div>

          {/* ── Observaciones ─────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label className="text-xs">Observaciones</Label>
            <Controller name="notes" control={control} render={({ field }) => (
              <Textarea
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                rows={2}
                placeholder="Detalles adicionales..."
                className="resize-none"
              />
            )} />
          </div>

          {/* ── Google Calendar ────────────────────────────────── */}
          {calendarConnected && (
            <div className="flex items-center gap-2.5 p-3 bg-primary/5 rounded-lg border border-primary/10">
              <CheckboxUI
                id="sync-calendar"
                checked={syncToCalendar}
                onCheckedChange={(v) => setSyncToCalendar(v === true)}
              />
              <div>
                <label htmlFor="sync-calendar" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                  Sincronizar con Google Calendar
                </label>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Se creará un evento con la fecha y observaciones de esta interacción.
                </p>
              </div>
            </div>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={closeAndReset}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit((data) => createMutation.mutate(data))}
            disabled={createMutation.isPending}
          >
            <Check className="h-4 w-4 mr-1.5" />
            {isEditing ? "Guardar cambios" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
