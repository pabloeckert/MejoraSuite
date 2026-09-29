import { Label } from "@/components/ui/label";
import { Constants } from "@/integrations/supabase/types";
import { RESULT_ICONS, RESULT_LABELS, RESULT_STYLES, type Result } from "../InteractionCard";

interface StepResultadoProps {
  clientName?: string;
  value: Result | undefined;
  onChange: (result: Result) => void;
  error?: string;
}

export function StepResultado({ clientName, value, onChange, error }: StepResultadoProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      <Label className="text-base font-semibold">
        ¿Qué pasó{clientName ? ` con ${clientName}` : ""}?
      </Label>
      <div className="grid grid-cols-1 gap-2">
        {(Constants.public.Enums.interaction_result as readonly Result[]).map((r) => {
          const Icon = RESULT_ICONS[r];
          const active = value === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onChange(r)}
              className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                active
                  ? RESULT_STYLES[r] + " ring-2 ring-primary/20 shadow-sm"
                  : "border-border bg-card hover:bg-muted/20 hover:border-muted-foreground/20"
              }`}
            >
              <div className={`p-2.5 rounded-lg ${active ? "bg-white/50" : "bg-muted/50"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">{RESULT_LABELS[r]}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
