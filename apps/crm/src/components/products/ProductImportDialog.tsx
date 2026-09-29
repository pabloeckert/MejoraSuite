import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload } from "lucide-react";

export interface ProductImportItem {
  name: string;
  description?: string | null;
  category?: string | null;
  unit: string;
  unit_label: string;
  currency: "ARS" | "USD" | "EUR";
  price: number | null;
  active: boolean;
  isDuplicate: boolean;
}

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ProductImportItem[];
  duplicates: number;
  onConfirm: () => void;
  isPending: boolean;
}

export function ProductImportDialog({ open, onOpenChange, preview, duplicates, onConfirm, isPending }: ProductImportDialogProps) {
  const newCount = preview.filter((i) => !i.isDuplicate).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Previsualizar importación</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="bg-success/10 text-success">{newCount} nuevos</Badge>
            {duplicates > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning">{duplicates} posibles duplicados</Badge>
            )}
          </div>
          {duplicates > 0 && (
            <p className="text-xs text-muted-foreground">Los duplicados (mismo nombre) se marcarán y no se importarán.</p>
          )}
          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Nombre</TableHead>
                  <TableHead className="text-xs">Categoría</TableHead>
                  <TableHead className="text-xs">Unidad</TableHead>
                  <TableHead className="text-xs text-right">Precio</TableHead>
                  <TableHead className="text-xs w-20">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((item, i) => (
                  <TableRow key={i} className={item.isDuplicate ? "opacity-40 bg-warning/5" : ""}>
                    <TableCell className="text-sm">{item.name}</TableCell>
                    <TableCell className="text-sm">{item.category || "—"}</TableCell>
                    <TableCell className="text-sm">{item.unit_label}</TableCell>
                    <TableCell className="text-sm text-right">
                      {item.price != null ? `${item.currency} ${Number(item.price).toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell>
                      {item.isDuplicate
                        ? <Badge variant="outline" className="text-xs text-warning">Dup</Badge>
                        : <Badge variant="outline" className="text-xs text-success">OK</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={isPending || newCount === 0}>
            <Upload className="h-4 w-4 mr-1" /> Importar {newCount} productos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
