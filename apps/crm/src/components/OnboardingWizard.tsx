import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Users, MessageSquare, BarChart3, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "onboarding_dismissed";

const STEPS = [
  {
    icon: Users,
    shortLabel: "Clientes",
    title: "Cargá tu primer cliente",
    description:
      "Empezá agregando los datos de contacto de un cliente o prospecto. Podés importar varios a la vez con CSV.",
    cta: "Ir a Clientes",
    route: "/clients",
    tip: "Completá el WhatsApp — es el canal más usado en Argentina.",
  },
  {
    icon: MessageSquare,
    shortLabel: "Interacciones",
    title: "Registrá una interacción",
    description:
      "Cada contacto con un cliente es una interacción: llamadas, mensajes, reuniones, presupuestos.",
    cta: "Ir a Interacciones",
    route: "/interactions",
    tip: "Registrá siempre el resultado y el próximo paso.",
  },
  {
    icon: BarChart3,
    shortLabel: "Vista General",
    title: "Revisá tu Vista General",
    description:
      "La Vista General muestra tus ventas, presupuestos en curso y seguimientos pendientes de un vistazo.",
    cta: "Ir a Vista General",
    route: "/",
    tip: "Los vendedores ven solo sus métricas. Los dueños ven todo el equipo.",
  },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  // Permite re-activar el wizard desde Settings
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setVisible(true);
    };
    window.addEventListener("show-onboarding", handler);
    return () => window.removeEventListener("show-onboarding", handler);
  }, []);

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, "skipped");
    setVisible(false);
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "completed");
    setVisible(false);
  };

  const handleNavigate = () => {
    const route = STEPS[step].route;
    if (step === STEPS.length - 1) {
      handleComplete();
    } else {
      handleSkip();
    }
    navigate(route);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) handleSkip();
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Sheet open={visible} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[85vh] rounded-t-2xl flex flex-col p-0"
            : "flex flex-col p-0 sm:w-[420px] sm:max-w-[420px]"
        }
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header con stepper numerado */}
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Tour de inicio
            </p>

            <div className="flex items-center">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        i < step
                          ? "bg-primary text-primary-foreground"
                          : i === step
                          ? "bg-accent text-accent-foreground"
                          : "border-2 border-border text-muted-foreground bg-background"
                      }`}
                    >
                      {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span
                      className={`text-[10px] font-medium truncate max-w-[60px] ${
                        i === step ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.shortLabel}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-200 ${
                        i < step ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contenido del paso */}
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {current.description}
                </p>
              </div>

              <div className="w-full bg-accent/10 rounded-lg p-3 text-xs text-left border border-accent/20">
                <span className="font-semibold text-accent-foreground">💡 Tip:</span>{" "}
                <span className="text-accent-foreground/80">{current.tip}</span>
              </div>
            </div>
          </div>

          {/* Footer sticky */}
          <div className="px-6 py-4 border-t border-border shrink-0 space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                disabled={step === 0}
                className="h-9 flex-1"
                aria-label="Paso anterior"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Atrás
              </Button>
              <Button
                size="sm"
                onClick={handleNavigate}
                className="h-9 flex-[2]"
              >
                {current.cta}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {!isLast && (
              <button
                onClick={handleSkip}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Saltar onboarding
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
