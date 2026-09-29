import { Controller, type Control, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FOLLOWUP_SCENARIOS, LOSS_REASONS, NEGOTIATION_LABELS } from "@/lib/constants";
import { ProductLines } from "../ProductLines";
import { ProformaUpload } from "../ProformaUpload";
import type { InteractionFormData, LineFormData } from "@/lib/schemas";
import type { Result } from "../InteractionCard";

const CURRENCIES = ["ARS", "USD", "EUR"] as const;

interface StepDetallesProps {
  result: Result;
  control: Control<InteractionFormData>;
  watch: UseFormWatch<InteractionFormData>;
  setValue: UseFormSetValue<InteractionFormData>;
  lines: LineFormData[];
  products: any[];
  presupuestos: any[];
  linesTotal: number;
  proformaFile: File | null;
  onFileChange: (file: File | null) => void;
  addLine: () => void;
  removeLine: (i: number) => void;
  updateLine: (i: number, patch: Partial<LineFormData>) => void;
  onProductPick: (i: number, productId: string) => void;
  errors: Record<string, any>;
}

function FieldError({ field, errors }: { field: string; errors: Record<string, any> }) {
  const msg = errors[field]?.message;
  return msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;
}

export function StepDetalles({
  result, control, watch, setValue, lines, products, presupuestos,
  linesTotal, proformaFile, onFileChange, addLine, removeLine, updateLine, onProductPick, errors,
}: StepDetallesProps) {
  const quotePath = watch("quote_path");
  const followupScenario = watch("followup_scenario");

  return (
    <div className="space-y-4 animate-fade-in">
      <Label className="text-base font-semibold">Detalles</Label>

      {result === "presupuesto" && (
        <div className="space-y-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <div>
            <Label>Origen del presupuesto</Label>
            <Controller name="quote_path" control={control} render={({ field }) => (
              <Select value={field.value || "catalogo"} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                file={proformaFile} onFileChange={onFileChange}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Moneda</Label>
                  <Controller name="currency" control={control} render={({ field }) => (
                    <Select value={field.value || "ARS"} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div>
                  <Label>Monto total</Label>
                  <Controller name="total_amount" control={control} render={({ field }) => (
                    <Input type="number" value={field.value || ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                  )} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {result === "venta" && (
        <div className="space-y-3 p-3 bg-success/5 rounded-lg border border-success/10">
          <div>
            <Label>Vincular presupuesto previo (opcional)</Label>
            <Controller name="reference_quote_id" control={control} render={({ field }) => (
              <Select value={field.value || ""} onValueChange={(v) => field.onChange(v || null)}>
                <SelectTrigger>
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

      {result === "seguimiento" && (
        <div className="space-y-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
          <div>
            <Label>Tipo de seguimiento *</Label>
            <Controller name="followup_scenario" control={control} render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FOLLOWUP_SCENARIOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            <FieldError field="followup_scenario" errors={errors} />
          </div>
          {followupScenario === "vinculado" && (
            <div>
              <Label>Presupuesto previo</Label>
              <Controller name="reference_quote_id" control={control} render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger>
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
                <Label>Moneda</Label>
                <Controller name="currency" control={control} render={({ field }) => (
                  <Select value={field.value || "ARS"} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                )} />
              </div>
              <div>
                <Label>Monto histórico</Label>
                <Controller name="historic_quote_amount" control={control} render={({ field }) => (
                  <Input type="number" value={field.value || ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                )} />
              </div>
              <div>
                <Label>Fecha</Label>
                <Controller name="historic_quote_date" control={control} render={({ field }) => (
                  <Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />
                )} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estado de la negociación</Label>
              <Controller name="negotiation_state" control={control} render={({ field }) => (
                <Select value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(NEGOTIATION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>Motivo</Label>
              <Controller name="followup_motive" control={control} render={({ field }) => (
                <Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: confirmar precio" />
              )} />
            </div>
          </div>
        </div>
      )}

      {result === "sin_respuesta" && (
        <div className="p-3 bg-muted/30 rounded-lg border text-center">
          <p className="text-sm text-muted-foreground">Sin datos adicionales requeridos.</p>
          <p className="text-xs text-muted-foreground mt-1">Podés agregar observaciones en el paso siguiente.</p>
        </div>
      )}

      {result === "no_interesado" && (
        <div className="space-y-3 p-3 bg-destructive/5 rounded-lg border border-destructive/10">
          <div>
            <Label>Motivo de rechazo *</Label>
            <Controller name="loss_reason" control={control} render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar motivo" /></SelectTrigger>
                <SelectContent>
                  {LOSS_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
            <FieldError field="loss_reason" errors={errors} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Moneda</Label>
              <Controller name="currency" control={control} render={({ field }) => (
                <Select value={field.value || "ARS"} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div>
              <Label>Pérdida estimada</Label>
              <Controller name="estimated_loss" control={control} render={({ field }) => (
                <Input type="number" value={field.value || ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
              )} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
