import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MEJORACONTACTOS_URL } from "@/lib/mejoraws-bridge";

/**
 * Fase 4 de MejoraSuite: MejoraContactos embebido dentro del CRM.
 * MejoraContactos sigue siendo su propio producto público e independiente
 * (deploy y negocio propios) — esto es solo un iframe, cero acoplamiento
 * de código. Ver mejorasuite/ESPECIFICACION.md.
 */
export default function Contactos() {
  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Contactos</h1>
          <p className="text-sm text-muted-foreground">MejoraContactos — limpieza y deduplicación de contactos</p>
        </div>
        <a href={MEJORACONTACTOS_URL} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir en pestaña nueva
          </Button>
        </a>
      </div>
      <div className="flex-1 min-h-[70vh] rounded-lg border border-border/50 overflow-hidden shadow-sm">
        {/* allow-scripts + allow-same-origin juntos técnicamente le permiten a
            un iframe sacarse su propio sandbox — pero acá el contenido es
            MejoraContactos, el propio producto de Pablo, no un tercero. Sin
            allow-same-origin, MejoraContactos no podría usar su localStorage/
            IndexedDB (ahí guarda el token cifrado del bridge y los contactos
            procesados) y quedaría roto. Ver mejorasuite/DECISIONES.md. */}
        <iframe
          src={MEJORACONTACTOS_URL}
          title="MejoraContactos"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        />
      </div>
    </div>
  );
}
