import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import { Eye, Pencil, UserX } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface ClientsTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDeactivate?: (client: Client) => void;
  canDeactivate?: boolean;
}

export const ClientsTable = memo(function ClientsTable({ clients, onView, onEdit, onDeactivate, canDeactivate = false }: ClientsTableProps) {
  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="hidden md:table-cell font-semibold">Empresa / Rubro</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold">Provincia</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c, i) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 0.02}s` }}
                onClick={() => onView(c)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    {c.contact_name && <p className="text-xs text-muted-foreground">{c.contact_name}</p>}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  <div>
                    {c.company && <p>{c.company}</p>}
                    {c.segment && <p className="text-xs text-muted-foreground">{c.segment}</p>}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">{c.province || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${STATUS_STYLES[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onView(c); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(c); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {canDeactivate && c.status !== "inactivo" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Marcar como inactivo"
                        onClick={(e) => { e.stopPropagation(); onDeactivate?.(c); }}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  Sin clientes encontrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});
