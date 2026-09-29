import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History, Undo2, Trash2, Loader2, AlertCircle, CheckCircle2,
  FileText, Scissors, Download, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getHistory,
  restoreFromHistory,
  deleteHistoryEntry,
  clearHistory,
  type HistoryEntry,
} from "@/lib/db";

type HistoryItem = Omit<HistoryEntry, "snapshot">;

const ACTION_ICONS: Record<string, React.ReactNode> = {
  clean: <Scissors className="h-3.5 w-3.5 text-blue-500" />,
  dedup: <FileText className="h-3.5 w-3.5 text-purple-500" />,
  import: <Download className="h-3.5 w-3.5 text-green-500" />,
};

const ACTION_LABELS: Record<string, string> = {
  clean: "Limpieza",
  dedup: "Deduplicación",
  import: "Importación",
};

interface HistoryPanelProps {
  onRestore?: (contacts: unknown[]) => void;
}

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const history = await getHistory();
      setItems(history);
    } catch {
      toast.error("Error cargando historial");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleRestore = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const confirmed = window.confirm(
      `¿Restaurar a "${item.description}"?\n\nEsto va a reemplazar los contactos actuales con los de ese momento (${item.contactCount} contactos).`
    );
    if (!confirmed) return;

    setRestoring(id);
    try {
      const contacts = await restoreFromHistory(id);
      toast.success(`Restaurado: ${contacts.length} contactos recuperados`);
      onRestore?.(contacts);
    } catch {
      toast.error("Error restaurando historial");
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteHistoryEntry(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Entrada eliminada");
  };

  const handleClearAll = async () => {
    if (!window.confirm("¿Eliminar todo el historial? No se puede deshacer.")) return;
    await clearHistory();
    setItems([]);
    toast.success("Historial limpiado");
  };

  const formatTime = (d: Date) => {
    const date = new Date(d);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Historial y Deshacer
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Últimas {items.length} operaciones. Restaurá contactos a un estado anterior.
            </p>
          </div>
          {items.length > 0 && (
            <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive gap-1" onClick={handleClearAll}>
              <Trash2 className="h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-xs">Sin historial aún</p>
            <p className="text-[10px] mt-1">Se guarda automáticamente antes de cada limpieza</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-2">
            <div className="space-y-1.5">
              {items.map(item => {
                const isRestoring = restoring === item.id;
                return (
                  <div key={item.id} className="flex items-center gap-2 rounded-md border px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="shrink-0">
                      {ACTION_ICONS[item.action] || <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] py-0">
                          {ACTION_LABELS[item.action] || item.action}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {item.contactCount} contactos
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-1"
                        onClick={() => handleRestore(item.id)}
                        disabled={isRestoring}
                      >
                        {isRestoring ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Undo2 className="h-3 w-3" />
                        )}
                        Deshacer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-1.5"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
