import { useState } from "react";
import { MessageCircle, ChevronDown, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";

interface LastInteraction {
  result: string;
  total_amount?: number | null;
  currency?: string | null;
  followup_motive?: string | null;
  next_step?: string | null;
}

interface WhatsAppTemplatesProps {
  phone: string;
  clientName: string;
  lastInteraction?: LastInteraction;
}

interface Template {
  id: string;
  label: string;
  relevantFor?: string[];
  message: (ctx: { firstName: string; seller: string; amount?: string; motive?: string }) => string;
}

const TEMPLATES: Template[] = [
  {
    id: "presupuesto",
    label: "Seguimiento de presupuesto",
    relevantFor: ["presupuesto"],
    message: ({ firstName, seller, amount }) =>
      `Hola ${firstName}! Soy ${seller} de Mejora Continua. ¿Pudiste revisar el presupuesto que te enviamos${amount ? ` de ${amount}` : ""}? Quedamos disponibles para cualquier consulta 🙌`,
  },
  {
    id: "seguimiento",
    label: "Retomar seguimiento",
    relevantFor: ["seguimiento", "sin_respuesta"],
    message: ({ firstName, seller, motive }) =>
      `Hola ${firstName}! Soy ${seller}. Quedamos en retomarnos${motive ? ` sobre ${motive}` : ""}. ¿Pudiste avanzar en algo? Estoy disponible cuando puedas 📞`,
  },
  {
    id: "reactivacion",
    label: "Reactivar contacto",
    relevantFor: [],
    message: ({ firstName, seller }) =>
      `Hola ${firstName}! Soy ${seller} de Mejora Continua. ¿Cómo estás? Quería saber si hay alguna novedad o si puedo ayudarte con algo 👋`,
  },
  {
    id: "novedad",
    label: "Compartir novedad",
    relevantFor: [],
    message: ({ firstName, seller }) =>
      `Hola ${firstName}! Soy ${seller} de Mejora Continua. Tengo una novedad que creo te puede interesar. ¿Tenés un momento para charlar? 💡`,
  },
];

function buildWaUrl(phone: string, text: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppTemplates({ phone, clientName, lastInteraction }: WhatsAppTemplatesProps) {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();

  const sellerName = (profile as any)?.full_name?.split(" ")[0] ?? "yo";
  const firstName = clientName.split(" ")[0];
  const amount = lastInteraction?.total_amount
    ? `${lastInteraction.currency ?? ""} ${Number(lastInteraction.total_amount).toLocaleString()}`.trim()
    : undefined;
  const motive = lastInteraction?.followup_motive || lastInteraction?.next_step || undefined;

  const ctx = { firstName, seller: sellerName, amount, motive };

  // Relevant templates first, then the rest
  const sorted = [...TEMPLATES].sort((a, b) => {
    const aRelevant = lastInteraction && (a.relevantFor ?? []).includes(lastInteraction.result) ? -1 : 0;
    const bRelevant = lastInteraction && (b.relevantFor ?? []).includes(lastInteraction.result) ? -1 : 0;
    return aRelevant - bRelevant;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-sm hover:bg-green-500/10 hover:text-green-700 transition-colors w-full text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{phone}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-2 w-72" align="start" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium px-1 mb-2">
          Mensaje rápido
        </p>

        <div className="space-y-1">
          {sorted.map((t) => {
            const isRelevant = lastInteraction && (t.relevantFor ?? []).includes(lastInteraction.result);
            const text = t.message(ctx);
            return (
              <a
                key={t.id}
                href={buildWaUrl(phone, text)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-start gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{t.label}</span>
                    {isRelevant && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
                        SUGERIDA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{text}</p>
                </div>
                <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            );
          })}
        </div>

        <div className="border-t border-border/50 mt-2 pt-2">
          <a
            href={`https://wa.me/${phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-sm text-muted-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Abrir sin mensaje
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
