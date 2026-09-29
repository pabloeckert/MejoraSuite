import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface LineDraft {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface ProductLinesProps {
  lines: LineDraft[];
  products: any[];
  addLine: () => void;
  removeLine: (i: number) => void;
  updateLine: (i: number, p: Partial<LineDraft>) => void;
  onProductPick: (i: number, id: string) => void;
  total: number;
  currency: string;
  onCurrencyChange: (c: string) => void;
}

export function ProductLines({
  lines, products, addLine, removeLine, updateLine, onProductPick, total, currency, onCurrencyChange,
}: ProductLinesProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Producto (múltiple)</Label>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["ARS", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
          <div className="col-span-6">
            <Select value={l.product_id} onValueChange={(v) => onProductPick(i, v)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Producto" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit_label})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input type="number" className="col-span-2 h-8 text-xs" placeholder="Cant." value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })} />
          <Input type="number" className="col-span-3 h-8 text-xs" placeholder="Precio" value={l.unit_price} onChange={(e) => updateLine(i, { unit_price: Number(e.target.value) || 0 })} />
          <Button variant="ghost" size="icon" className="col-span-1 h-8 w-8" onClick={() => removeLine(i)}>
            <Trash2 className="h-3 w-3" />
          </Button>
          {products.find((x) => x.id === l.product_id) && (
            <p className="col-span-12 text-[10px] text-muted-foreground -mt-1 pl-1">
              Subtotal: {currency} {(l.quantity * l.unit_price).toLocaleString()}
            </p>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addLine} className="w-full h-8 text-xs">
        <Plus className="h-3 w-3 mr-1" /> Agregar producto
      </Button>
      <div className="flex justify-between items-center pt-1 border-t">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-sm font-bold">{currency} {total.toLocaleString()}</span>
      </div>
    </div>
  );
}
