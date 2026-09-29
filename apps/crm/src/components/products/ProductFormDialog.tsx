import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, UNITS } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Product | null;
  form: Partial<ProductInsert>;
  setForm: (form: Partial<ProductInsert>) => void;
  onSave: () => void;
  isPending: boolean;
}

export function ProductFormDialog({ open, onOpenChange, editing, form, setForm, onSave, isPending }: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoría</Label>
              <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ej: Madera, Servicios" />
            </div>
            <div>
              <Label>Unidad de medida *</Label>
              <Select
                value={form.unit || "u"}
                onValueChange={(v) => {
                  const unit = UNITS.find((u) => u.value === v);
                  setForm({ ...form, unit: v, unit_label: unit?.label || v });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label} ({u.value})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Moneda</Label>
              <Select value={form.currency || "ARS"} onValueChange={(v) => setForm({ ...form, currency: v as "ARS" | "USD" | "EUR" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Precio referencia</Label>
              <Input
                type="number"
                value={form.price ?? ""}
                onChange={(e) => setForm({ ...form, price: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} id="active" />
            <Label htmlFor="active" className="cursor-pointer">Producto activo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isPending}>{editing ? "Guardar cambios" : "Crear producto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
