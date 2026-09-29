import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pwa_install_dismissed") === "true";
  });

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === "dismissed") {
      localStorage.setItem("pwa_install_dismissed", "true");
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_install_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-card border border-border/50 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Instalar MejoraCRM</p>
          <p className="text-xs text-muted-foreground">Accedé rápido desde tu pantalla de inicio</p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleInstall} className="h-8 text-xs">
            Instalar
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
