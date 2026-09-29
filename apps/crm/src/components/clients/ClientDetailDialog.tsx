import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MEDIUM_LABELS, RESULT_LABELS, RESULT_STYLES, STATUS_LABELS, STATUS_STYLES } from "@/lib/constants";
import { MapPin, Mail, Building2 } from "lucide-react";
import { WhatsAppTemplates } from "./WhatsAppTemplates";

import type { Database } from "@/integrations/supabase/types";
import { MEMORY_DEMO_INTERACTIONS } from "@/hooks/useInteractions";
import { useDemoMode } from "@/contexts/AuthContext";

import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Calendar as CalendarIcon } from "lucide-react";

type Client = Database["public"]["Tables"]["clients"]["Row"];

interface ClientDetailDialogProps {
  client: Client | null;
  onClose: () => void;
}

function fmtMoney(i: any) {
  return i.total_amount ? `${i.currency || ""} ${Number(i.total_amount).toLocaleString()}` : null;
}

export function ClientDetailDialog({ client, onClose }: ClientDetailDialogProps) {
  const { isConnected: calendarConnected, createEvent } = useGoogleCalendar();
  const demoMode = useDemoMode();
  const { data: interactions = [] } = useQuery({
    queryKey: ["client-interactions", client?.id, demoMode ? "demo" : "live"],
    enabled: !!client,
    queryFn: async () => {
      if (demoMode) {
        return MEMORY_DEMO_INTERACTIONS.filter(i => i.client_id === client!.id);
      }
      const { data } = await supabase
        .from("interactions")
        .select("*, interaction_lines(quantity, unit_price, line_total, products(name, unit_label))")
        .eq("client_id", client!.id)
        .order("interaction_date", { ascending: false });
      return data || [];
    },
  });

  return (
    <Dialog open={!!client} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {client && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg">{client.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{client.company || "Sin empresa"}</p>
              </div>
              <Badge variant="outline" className={STATUS_STYLES[client.status]}>
                {STATUS_LABELS[client.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {client.whatsapp && (
                <WhatsAppTemplates
                  phone={client.whatsapp}
                  clientName={client.name}
                  lastInteraction={interactions[0]}
                />
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm truncate hover:bg-primary/5 hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {client.email}
                </a>
              )}
              {(client.location || client.province || client.country) && (
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {[client.location, client.province, client.country].filter(Boolean).join(", ")}
                </div>
              )}
              {client.segment && (
                <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> {client.segment}
                </div>
              )}
            </div>

            {client.address && <p className="text-xs text-muted-foreground">{client.address}</p>}
            {client.notes && (
              <p className="text-sm bg-accent/10 p-3 rounded-lg border border-accent/20">{client.notes}</p>
            )}

            <div>
              <h3 className="font-semibold text-sm mb-2">Historial de interacciones ({interactions.length})</h3>
              {interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin interacciones registradas</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {interactions.map((i: any) => (
                    <div key={i.id} className="border rounded-lg p-3 text-sm space-y-1.5 hover:bg-muted/20">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${RESULT_STYLES[i.result]}`}>
                            {RESULT_LABELS[i.result]}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{MEDIUM_LABELS[i.medium]}</Badge>
                          {fmtMoney(i) && <span className="text-xs font-semibold">{fmtMoney(i)}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {calendarConnected && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-primary"
                              title="Agregar a Google Calendar"
                              onClick={() => createEvent(
                                `${RESULT_LABELS[i.result]} - ${client.name}`,
                                i.notes || `Interacción vía ${MEDIUM_LABELS[i.medium]}`,
                                new Date(i.interaction_date)
                              )}
                            >
                              <CalendarIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(i.interaction_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {i.interaction_lines?.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {i.interaction_lines.map((l: any) => `${l.products?.name} x${l.quantity}`).join(", ")}
                        </p>
                      )}
                      {i.followup_motive && <p className="text-xs italic">"{i.followup_motive}"</p>}
                      {i.loss_reason && <p className="text-xs text-destructive">Motivo: {i.loss_reason}</p>}
                      {i.next_step && <p className="text-xs">→ {i.next_step}</p>}
                      {i.notes && <p className="text-xs text-muted-foreground">{i.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
