import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "__mc_cookie_consent__";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur border-t shadow-lg">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          Usamos cookies esenciales para el funcionamiento de la app. No usamos cookies de tracking.
          <a href={`${import.meta.env.BASE_URL}privacy`} className="underline ml-1">Política de privacidad</a>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={decline}>Rechazar</Button>
          <Button size="sm" onClick={accept}>Aceptar</Button>
        </div>
      </div>
    </div>
  );
}
