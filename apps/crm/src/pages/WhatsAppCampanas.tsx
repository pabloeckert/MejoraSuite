import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, XCircle, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useDemoMode } from "@/contexts/AuthContext";
import { useAllClients } from "@/hooks/useClients";
import { addDemoInteraction } from "@/hooks/useInteractions";
import { samePhone } from "@/lib/calculations";
import {
  getBridgeStatus,
  loadBridgeToken,
  saveBridgeToken,
  clearBridgeToken,
  subscribeToBridgeMessages,
  MEJORAWS_PROTOCOL_URL,
  type BridgeStatus,
  type BridgeMessageEvent,
} from "@/lib/mejoraws-bridge";

const POLL_MS = 6000;

/**
 * Fase 4 de MejoraSuite: MejoraWS embebido dentro del CRM — mismo patrón
 * que el panel equivalente en MejoraContactos (src/components/MejoraWsPanel.tsx
 * de ese repo). MejoraWS sigue siendo su propia app de escritorio; esto es
 * solo un panel de estado + acceso rápido. Ver mejorasuite/ESPECIFICACION.md.
 *
 * Fase 6: además de mostrar estado, cuando la conexión con MejoraWS está
 * activa esta página escucha GET /events (SSE) y, si llega una respuesta de
 * WhatsApp de un teléfono que coincide con un cliente del CRM, crea una
 * Interacción automática (result "seguimiento", medium "whatsapp") — así el
 * mensaje deja rastro sin que el vendedor tenga que cargarlo a mano. Límite
 * conocido y aceptado: solo funciona mientras esta pestaña está abierta y
 * logueada, no hay listener en segundo plano (no hay backend propio para
 * eso — ver mejorasuite/PENDIENTES.md, Fase 4/5).
 */
export default function WhatsAppCampanas() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();
  const demoMode = useDemoMode();
  const { data: clients = [] } = useAllClients();
  const queryClient = useQueryClient();
  const clientsRef = useRef(clients);
  clientsRef.current = clients;

  useEffect(() => {
    loadBridgeToken().then(setToken);
  }, []);

  const checkStatus = useCallback(async (t: string) => {
    setChecking(true);
    const s = await getBridgeStatus(t);
    setStatus(s);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    checkStatus(token);
    const interval = setInterval(() => checkStatus(token), POLL_MS);
    return () => clearInterval(interval);
  }, [token, checkStatus]);

  const handleIncomingMessage = useCallback(
    async (evt: BridgeMessageEvent) => {
      const client = clientsRef.current.find((c) => samePhone(c.whatsapp, evt.phone));
      if (!client) return; // respuesta de un número que no está cargado como cliente — no hay a qué asociarla

      const notePreview = evt.text.length > 200 ? `${evt.text.slice(0, 200)}…` : evt.text;
      const payload = {
        client_id: client.id,
        user_id: user?.id,
        medium: "whatsapp",
        result: "seguimiento" as const,
        followup_scenario: "independiente" as const,
        notes: `Respondió por WhatsApp: "${notePreview}"`,
      };

      try {
        if (demoMode) {
          addDemoInteraction(payload);
        } else {
          const { error } = await supabase.from("interactions").insert(payload);
          if (error) throw error;
        }
        queryClient.invalidateQueries({ queryKey: ["interactions"] });
        queryClient.invalidateQueries({ queryKey: ["interactions-infinite"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
        toast.success(`Interacción automática creada para ${client.name} (respondió por WhatsApp)`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo registrar la respuesta de WhatsApp");
      }
    },
    [user?.id, queryClient, demoMode]
  );

  useEffect(() => {
    if (!token || !status?.connected) return;
    const unsubscribe = subscribeToBridgeMessages(token, handleIncomingMessage);
    return unsubscribe;
  }, [token, status?.connected, handleIncomingMessage]);

  const handleSaveToken = async () => {
    if (!tokenInput.trim()) return;
    await saveBridgeToken(tokenInput);
    setToken(tokenInput.trim());
    setTokenInput("");
    toast.success("Token guardado");
  };

  const handleClearToken = () => {
    clearBridgeToken();
    setToken(null);
    setStatus(null);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Campañas de WhatsApp</h1>
        <p className="text-sm text-muted-foreground">Estado en vivo de MejoraWS, sin salir del CRM</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="h-4 w-4 text-success" />
            MejoraWS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            MejoraWS es la app de escritorio para campañas de WhatsApp — sigue siendo un producto aparte,
            esto solo muestra su estado acá sin tener que cambiar de ventana.
          </p>

          {!token ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Pegá acá el token que te da MejoraWS (botón "Copiar token de conexión" en su ventana, arriba a la derecha).
              </p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  className="h-9"
                  placeholder="Token de conexión"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveToken()}
                />
                <Button className="h-9" onClick={handleSaveToken} disabled={!tokenInput.trim()}>
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status ? (
                    <>
                      {status.connected ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {status.connected ? "WhatsApp conectado" : `WhatsApp ${status.waStatus}`}
                      </span>
                      {status.campaignRunning && (
                        <Badge variant="secondary" className="text-xs">
                          {status.pauseRequested ? "Campaña pausada" : "Campaña enviando"}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {checking ? "Buscando MejoraWS..." : "MejoraWS no está corriendo"}
                      </span>
                    </>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleClearToken} title="Olvidar token guardado">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {!status && !checking && (
                <a href={MEJORAWS_PROTOCOL_URL}>
                  <Button variant="outline" size="sm" className="h-9 gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir MejoraWS
                  </Button>
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
