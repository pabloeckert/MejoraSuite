import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

interface GoogleCalendarEvent {
  summary: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

export function useGoogleCalendar() {
  const [tokenClient, setTokenClient] = useState<GoogleTokenClient | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("mejoracrm_google_access_token"));
  const [isConnected, setIsConnected] = useState(!!localStorage.getItem("mejoracrm_google_access_token"));
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Load the Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && CLIENT_ID) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: GoogleTokenResponse) => {
            if (response.error) {
              setIsConnecting(false);
              toast.error("Error al conectar con Google");
              return;
            }
            localStorage.setItem("mejoracrm_google_access_token", response.access_token);
            localStorage.setItem("mejoracrm_google_token_expiry", (Date.now() + response.expires_in * 1000).toString());
            setAccessToken(response.access_token);
            setIsConnected(true);
            setIsConnecting(false);
            toast.success("Conectado a Google Calendar");
          },
        });
        setTokenClient(client);
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const login = useCallback(() => {
    if (!tokenClient) {
      if (!CLIENT_ID) {
        toast.error("Google Client ID no configurado");
      } else {
        toast.error("Google script no cargado");
      }
      return;
    }
    setIsConnecting(true);
    tokenClient.requestAccessToken({ prompt: "consent" });
  }, [tokenClient]);

  const logout = useCallback(() => {
    const token = localStorage.getItem("mejoracrm_google_access_token");
    if (token && window.google) {
      window.google.accounts.oauth2.revoke(token, () => {
        localStorage.removeItem("mejoracrm_google_access_token");
        localStorage.removeItem("mejoracrm_google_token_expiry");
        setAccessToken(null);
        setIsConnected(false);
        toast.success("Desconectado de Google Calendar");
      });
    } else {
      localStorage.removeItem("mejoracrm_google_access_token");
      localStorage.removeItem("mejoracrm_google_token_expiry");
      setAccessToken(null);
      setIsConnected(false);
    }
  }, []);

  const createEvent = async (summary: string, description: string, startDate: Date, durationMinutes: number = 30) => {
    const currentToken = localStorage.getItem("mejoracrm_google_access_token");
    const expiry = localStorage.getItem("mejoracrm_google_token_expiry");

    // Check expiry
    if (!currentToken || (expiry && Date.now() > parseInt(expiry))) {
      toast.error("Sesión de Google expirada. Por favor, vuelve a conectar.");
      setIsConnected(false);
      return false;
    }

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const event: GoogleCalendarEvent = {
      summary,
      description,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          throw new Error("Token no válido o expirado");
        }
        const error = await response.json();
        throw new Error(error.error.message || "Error al crear el evento");
      }

      toast.success("Evento agregado a Google Calendar");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      toast.error(msg);
      return false;
    }
  };

  return { isConnected, isConnecting, login, logout, createEvent };
}

// Add global type for window.google
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
          }) => GoogleTokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}
