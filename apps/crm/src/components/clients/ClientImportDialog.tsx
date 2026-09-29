import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload } from "lucide-react";

export interface ImportPreviewItem {
  name: string;
  company?: string;
  whatsapp?: string | null;
  email?: string;
  segment?: string;
  channel?: string;
  province?: string;
  location?: string;
  address?: string;
  country?: string;
  notes?: string;
  isDuplicate: boolean;
  assigned_to?: string;
  status: "potencial";
}

interface ClientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ImportPreviewItem[];
  duplicates: number;
  onConfirm: () => void;
  isPending: boolean;
}

export function ClientImportDialog({ open, onOpenChange, preview, duplicates, onConfirm, isPending }: ClientImportDialogProps) {
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
            <p className="text-xs text-muted-foreground">
              Los duplicados (mismo nombre o WhatsApp) se marcarán y no se importarán.
            </p>
          )}
          <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Nombre</TableHead>
                  <TableHead className="text-xs">WhatsApp</TableHead>
                  <TableHead className="text-xs">Rubro</TableHead>
                  <TableHead className="text-xs">País</TableHead>
                  <TableHead className="text-xs">Provincia</TableHead>
                  <TableHead className="text-xs w-20">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((item, i) => (
                  <TableRow key={i} className={item.isDuplicate ? "opacity-40 bg-warning/5" : ""}>
                    <TableCell className="text-sm">{item.name}</TableCell>
                    <TableCell className="text-sm">{item.whatsapp || "—"}</TableCell>
                    <TableCell className="text-sm">{item.segment || "—"}</TableCell>
                    <TableCell className="text-sm">{item.country || "Argentina"}</TableCell>
                    <TableCell className="text-sm">{item.province || "—"}</TableCell>
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
            <Upload className="h-4 w-4 mr-1" /> Importar {newCount} clientes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
