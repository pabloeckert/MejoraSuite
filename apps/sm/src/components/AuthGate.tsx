import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Login } from "@/pages/Login";
import { ResetPassword } from "@/pages/ResetPassword";
import { isElectronLocal } from "@/lib/nucleoAdapter";

// Puerta de acceso del EDA. Reinstaurada el 2026-08-31 a pedido de Pablo
// ("un solo password usuario y contraseña y el mail de registro para
// recupero") — reemplaza el estado abierto que había desde 2026-08-25.
// Una sola cuenta compartida (la que está en app_admins).
export function AuthGate({ children }: { children: ReactNode }) {
  // Bypass automático en entorno local, Electron o desarrollo para evitar bloqueo de login
  const isLocalOrDev =
    isElectronLocal() ||
    (typeof window !== "undefined" && (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    )) ||
    import.meta.env.DEV ||
    !import.meta.env.VITE_SUPABASE_URL;

  if (isLocalOrDev) {
    return <>{children}</>;
  }

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      // El link de "blanqueo" del email (si por algún motivo cae en el SPA
      // en vez de en /app/reset.html) dispara PASSWORD_RECOVERY — ahí se
      // muestra el form de nueva contraseña, no la app.
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  if (recovery) {
    return <ResetPassword onDone={() => setRecovery(false)} />;
  }

  if (!session) {
    return <Login />;
  }

  return <>{children}</>;
}
