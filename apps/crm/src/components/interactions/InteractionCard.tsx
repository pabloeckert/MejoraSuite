import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MessageCircle, Phone, Mail, Globe, Video, AlertCircle,
  FileText, ShoppingCart, Clock, X, Pencil, Trash2, Timer,
} from "lucide-react";
import { isBefore, differenceInDays, differenceInHours } from "date-fns";
import { RESULT_LABELS, RESULT_STYLES, MEDIUM_LABELS, AGING_THRESHOLDS } from "@/lib/constants";
import type { Result } from "@/lib/constants";

import { LucideIcon } from "lucide-react";
import type { Interaction } from "@/lib/types";

const MEDIUM_ICONS: Record<string, LucideIcon> = {
  whatsapp: MessageCircle, llamada: Phone, email: Mail,
  reunion_presencial: Video, reunion_virtual: Video,
  md_instagram: Globe, md_facebook: Globe, md_linkedin: Globe, visita_campo: Globe,
};

const RESULT_ICONS: Record<Result, LucideIcon> = {
  presupuesto: FileText, venta: ShoppingCart, seguimiento: Clock, sin_respuesta: AlertCircle, no_interesado: X,
};

interface InteractionCardProps {
  interaction: Interaction;
  index: number;
  onNavigate: (path: string) => void;
  onEdit?: (interaction: Interaction) => void;
  onDelete?: (interaction: Interaction) => void;
}

export function InteractionCard({ interaction: i, index, onNavigate, onEdit, onDelete }: InteractionCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const MediumIcon = MEDIUM_ICONS[i.medium] || MessageCircle;
  const ResultIcon = RESULT_ICONS[i.result as Result] || FileText;
  const isOverdue = i.follow_up_date && isBefore(new Date(i.follow_up_date), new Date());
  const daysOverdue = isOverdue ? differenceInDays(new Date(), new Date(i.follow_up_date)) : 0;

  const OPEN_RESULTS = ["presupuesto", "seguimiento", "sin_respuesta"];
  const hoursAging = OPEN_RESULTS.includes(i.result)
    ? differenceInHours(new Date(), new Date(i.interaction_date))
    : 0;
  const daysAging = Math.floor(hoursAging / 24);
  const showAgingBadge = hoursAging >= AGING_THRESHOLDS.AMBER_HOURS;
  const isRedAging = hoursAging >= AGING_THRESHOLDS.RED_HOURS;
  const agingClass = isRedAging
    ? "text-destructive border-destructive/40"
    : "text-amber-600 border-amber-400/40";
  const agingLabel = daysAging >= 1 ? `${daysAging}d` : `${hoursAging}h`;
  const agingTooltip = isRedAging
    ? `Sin actividad hace ${agingLabel}. Acción urgente — este negocio está en riesgo de perderse.`
    : `Sin actividad hace ${agingLabel}. Conviene retomar contacto pronto.`;

  return (
    <Card
      className={`border-border/50 hover:shadow-sm transition-all duration-200 animate-fade-in ${
        isOverdue ? "border-l-2 border-l-destructive" : ""
      }`}
      style={{ animationDelay: `${index * 0.02}s` }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${RESULT_STYLES[i.result as Result]}`}>
            <ResultIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => onNavigate(`/clients?open=${i.client_id}`)}
              >
                {i.clients?.name}
              </span>
              <Badge variant="outline" className={`text-xs ${RESULT_STYLES[i.result as Result]}`}>
                {RESULT_LABELS[i.result as Result]}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <MediumIcon className="h-3 w-3" />
                {MEDIUM_LABELS[i.medium]}
              </span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {daysOverdue}d vencido
                </Badge>
              )}
              {showAgingBadge && !isOverdue && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`text-xs cursor-default ${agingClass}`}>
                      <Timer className="h-3 w-3 mr-1" />
                      {agingLabel}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-56 text-center">
                    {agingTooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {i.total_amount && (
              <p className="text-sm font-semibold mt-1">{i.currency} {Number(i.total_amount).toLocaleString()}</p>
            )}
            {i.interaction_lines?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {i.interaction_lines.length} producto(s):{" "}
                {i.interaction_lines.map((l) => l.products?.name).filter(Boolean).join(", ")}
              </p>
            )}
            {i.followup_motive && <p className="text-xs mt-1 italic">"{i.followup_motive}"</p>}
            {i.loss_reason && <p className="text-xs text-destructive mt-1 italic">Motivo: {i.loss_reason}</p>}
            {i.next_step && <p className="text-sm mt-1">→ {i.next_step}</p>}
            {i.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.notes}</p>}
          </div>
          <div className="text-right shrink-0 flex items-start gap-1">
            <div>
              <p className="text-xs text-muted-foreground">{new Date(i.interaction_date).toLocaleDateString()}</p>
              {i.follow_up_date && (
                <p className={`text-xs mt-0.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  Seg: {i.follow_up_date}
                </p>
              )}
            </div>
            {onEdit && !confirmDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(i); }}
                className="p-1 rounded hover:bg-muted/50 transition-colors"
                title="Editar interacción"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            {onDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { onDelete(i); setConfirmDelete(false); }}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-[10px] rounded hover:bg-muted/50 transition-colors text-muted-foreground"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
                  title="Eliminar interacción"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { RESULT_LABELS, RESULT_STYLES, MEDIUM_LABELS };
export { RESULT_ICONS, MEDIUM_ICONS };
export type { Result };
