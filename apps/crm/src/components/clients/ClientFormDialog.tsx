import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CHANNELS, PAISES, PROVINCIAS, RUBROS } from "@/lib/constants";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Client | null;
  form: Partial<ClientInsert>;
  setForm: (form: Partial<ClientInsert>) => void;
  onSave: () => void;
  isPending: boolean;
}

export function ClientFormDialog({ open, onOpenChange, editing, form, setForm, onSave, isPending }: ClientFormDialogProps) {
  const whatsappValid = !form.whatsapp || /^\+?\d[\d\s\-()]{6,20}$/.test(form.whatsapp);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Nombre y Apellido *</Label>
            <Input id="name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre y apellido del cliente" />
          </div>
          <div>
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={form.whatsapp || ""}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+54 376 4000000"
                className={form.whatsapp && !whatsappValid ? "border-destructive" : ""}
              />
              {form.whatsapp && !whatsappValid && (
                <p className="text-xs text-destructive mt-1">Formato: +54 376 4000000</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="segment">Rubro</Label>
              <Select value={form.segment || ""} onValueChange={(v) => setForm({ ...form, segment: v })}>
                <SelectTrigger id="segment"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{RUBROS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="channel">Canal de Ingreso</Label>
              <Select value={form.channel || ""} onValueChange={(v) => setForm({ ...form, channel: v })}>
                <SelectTrigger id="channel"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Select value={form.province || ""} onValueChange={(v) => setForm({ ...form, province: v })}>
                <SelectTrigger id="province"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PROVINCIAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Localidad</Label>
              <Input id="location" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ciudad / pueblo" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="country">País</Label>
              <Select value={form.country || "Argentina"} onValueChange={(v) => setForm({ ...form, country: v })}>
                <SelectTrigger id="country"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PAISES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea id="notes" value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isPending}>{editing ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
