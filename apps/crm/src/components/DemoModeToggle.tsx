import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import { useDemoMode } from "@/contexts/AuthContext";
import { setDemoMode } from "@/lib/demoMode";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Toggle de modo demostración (Fase 7 de MejoraSuite) — apaga/prende datos
 * ficticios en runtime, sin build ni reinicio. Cuando lo prende el launcher
 * de MejoraSuite (query param al abrir la app), o esta misma UI, el valor
 * se guarda en localStorage y todos los hooks de datos lo leen reactivo vía
 * @/lib/demoMode. Por defecto arranca prendido — ver ese archivo.
 */
export function DemoModeToggle() {
  const demoMode = useDemoMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <label className="flex items-center gap-1.5 h-8 px-2 rounded-md border border-dashed text-xs font-medium cursor-pointer hover:bg-muted/50 transition-colors">
            <Sparkles className={`h-3.5 w-3.5 ${demoMode ? "text-primary" : "text-muted-foreground"}`} />
            <span className="hidden sm:inline">Modo demostración</span>
            <Switch
              checked={demoMode}
              onCheckedChange={setDemoMode}
              className="ml-0.5 scale-90"
              aria-label={demoMode ? "Apagar modo demostración" : "Prender modo demostración"}
            />
          </label>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px] text-xs">
          {demoMode
            ? "Estás viendo datos ficticios de ejemplo. Apagalo para usar tus datos reales."
            : "Estás usando tus datos reales. Prendelo para explorar el sistema con datos de ejemplo, sin tocar nada real."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
