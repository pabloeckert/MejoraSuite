import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { Package, Pencil, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];

interface ProductsTableProps {
  products: Product[];
  search: string;
  onEdit: (product: Product) => void;
  onNew: () => void;
}

export function ProductsTable({ products, search, onEdit, onNew }: ProductsTableProps) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Producto</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Categoría</TableHead>
              <TableHead className="font-semibold">Unidad</TableHead>
              <TableHead className="font-semibold text-right">Precio</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    {p.description && <p className="text-xs text-muted-foreground line-clamp-1">{p.description}</p>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">{p.category || "—"}</TableCell>
                <TableCell className="text-sm">{p.unit_label}</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {p.price != null ? `${CURRENCY_SYMBOLS[p.currency]}${Number(p.price).toLocaleString()}` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={p.active
                    ? "bg-success/10 text-success border-success/20 text-xs"
                    : "bg-muted text-muted-foreground border-border text-xs"}>
                    {p.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium text-muted-foreground">Sin productos encontrados</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    {search ? "Probá con otro término de búsqueda" : "Creá tu primer producto para empezar"}
                  </p>
                  {!search && (
                    <Button size="sm" onClick={onNew}>
                      <Plus className="h-4 w-4 mr-1" /> Nuevo producto
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
