import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Constants } from "@/integrations/supabase/types";
import { MEDIUM_LABELS } from "../InteractionCard";
import type { InteractionFormData } from "@/lib/schemas";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon } from "lucide-react";

interface StepMedioProps {
  control: Control<InteractionFormData>;
  error?: string;
  calendarConnected?: boolean;
  syncToCalendar?: boolean;
  setSyncToCalendar?: (val: boolean) => void;
}

export function StepMedio({ control, error, calendarConnected, syncToCalendar, setSyncToCalendar }: StepMedioProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <Label className="text-base font-semibold">¿Cómo lo contactaste?</Label>
        <Controller
          name="medium"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {Constants.public.Enums.interaction_medium.map((m) => {
                const active = field.value === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => field.onChange(m)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                        : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="text-[11px] font-medium text-center leading-tight">{MEDIUM_LABELS[m]}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Próximo paso</Label>
          <Controller name="next_step" control={control} render={({ field }) => (
            <Input value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} placeholder="Ej: enviar muestra" />
          )} />
        </div>
        <div>
          <Label>Fecha de seguimiento</Label>
          <Controller name="follow_up_date" control={control} render={({ field }) => (
            <Input type="date" value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} />
          )} />
        </div>
      </div>

      <div>
        <Label>Observaciones</Label>
        <Controller name="notes" control={control} render={({ field }) => (
          <Textarea value={field.value || ""} onChange={(e) => field.onChange(e.target.value || null)} rows={3} placeholder="Detalles adicionales..." />
        )} />
      </div>

      {calendarConnected && setSyncToCalendar && (
        <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <CheckboxUI
            id="sync-calendar"
            checked={syncToCalendar}
            onCheckedChange={(checked) => setSyncToCalendar(checked === true)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="sync-calendar"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              Sincronizar con Google Calendar
            </label>
            <p className="text-[10px] text-muted-foreground">
              Se creará un evento con la fecha y observaciones de esta interacción.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
