import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  History,
  Check,
  ArrowRight,
  Trophy,
  XCircle,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  type ProspectoResponseDTO,
  type SlaEstado,
  type EstadoProspecto,
  type ProspectoEventoRecord
} from "@/services/prospectosNucleoService";
import {
  useCalificarProspectoMutation,
  useIniciarSeguimientoMutation,
  useCerrarProspectoMutation,
  useProspectoEventos
} from "@/hooks/useProspectosNucleo";

interface ProspectosSlaTableProps {
  prospectos: ProspectoResponseDTO[];
  isLoading?: boolean;
}

const CANAL_LABELS: Record<string, string> = {
  landing_hostinger: "Landing Web (Hostinger)",
  diagnostico_4d: "Diagnóstico 4D",
  taller_mc: "Taller MC (60m)",
  after_office_12x12: "After Office 12x12",
  instagram_direct: "Instagram Direct",
  facebook_messenger: "Facebook Messenger",
  whatsapp_direct: "WhatsApp",
  crm_manual: "CRM Manual"
};

const ESTADO_LABELS: Record<EstadoProspecto, string> = {
  CAPTURADO: "Capturado (Nuevo)",
  CALIFICADO: "Calificado",
  EN_SEGUIMIENTO: "En Seguimiento",
  CERRADO_GANADO: "Cerrado Ganado",
  CERRADO_PERDIDO: "Cerrado Perdido"
};

const ESTADO_BADGES: Record<EstadoProspecto, string> = {
  CAPTURADO: "bg-blue-50 text-blue-800 border-blue-200",
  CALIFICADO: "bg-amber-50 text-amber-800 border-amber-300",
  EN_SEGUIMIENTO: "bg-purple-50 text-purple-800 border-purple-200",
  CERRADO_GANADO: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
  CERRADO_PERDIDO: "bg-slate-100 text-slate-600 border-slate-300"
};

export function ProspectosSlaTable({ prospectos, isLoading }: ProspectosSlaTableProps) {
  const [selectedProspectoId, setSelectedProspectoId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [cerrarModalOpen, setCerrarModalOpen] = useState(false);
  const [prospectoParaCerrar, setProspectoParaCerrar] = useState<ProspectoResponseDTO | null>(null);

  const calificarMutation = useCalificarProspectoMutation();
  const seguimientoMutation = useIniciarSeguimientoMutation();
  const cerrarMutation = useCerrarProspectoMutation();
  const { data: eventos = [], isLoading: isLoadingEventos } = useProspectoEventos(
    selectedProspectoId ?? undefined
  );

  const handleOpenHistory = (p: ProspectoResponseDTO) => {
    setSelectedProspectoId(p.id);
    setHistoryModalOpen(true);
  };

  const handleOpenCerrar = (p: ProspectoResponseDTO) => {
    setProspectoParaCerrar(p);
    setCerrarModalOpen(true);
  };

  const handleConfirmarCierre = (ganado: boolean) => {
    if (!prospectoParaCerrar) return;
    cerrarMutation.mutate(
      { id: prospectoParaCerrar.id, ganado },
      {
        onSettled: () => {
          setCerrarModalOpen(false);
          setProspectoParaCerrar(null);
        }
      }
    );
  };

  const renderSlaBadge = (slaEstado: SlaEstado, horasRestantes: number, createdAt: string) => {
    switch (slaEstado) {
      case "ROJO":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-300 font-bold text-xs flex items-center gap-1.5 py-1 px-2.5 animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
            <span>SLA VENCIDO (&gt;48h)</span>
          </Badge>
        );
      case "AMARILLO":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs flex items-center gap-1.5 py-1 px-2.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span>{horasRestantes}h restantes (En riesgo)</span>
          </Badge>
        );
      case "VERDE":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 font-medium text-xs flex items-center gap-1.5 py-1 px-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{horasRestantes}h restantes</span>
          </Badge>
        );
      case "CUMPLIDO":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs flex items-center gap-1 py-0.5 px-2">
            <CheckCircle2 className="h-3 w-3 text-slate-500" />
            <span>SLA Atendido</span>
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Prospecto
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Canal de Origen
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Semáforo SLA (48h)
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Estado
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-700 text-right">
                  Acciones de Ciclo de Vida
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Cargando prospectos del servidor local...
                  </TableCell>
                </TableRow>
              ) : prospectos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No se encontraron prospectos en la base de datos.
                  </TableCell>
                </TableRow>
              ) : (
                prospectos.map((p) => {
                  const telDigits = p.telefono.replace(/\D/g, "");
                  const whatsappUrl = telDigits ? `https://wa.me/${telDigits}` : null;

                  return (
                    <TableRow
                      key={p.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        p.slaEstado === "ROJO" ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Nombre y Contacto */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-slate-900 leading-snug">
                            {p.nombre}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {p.email && (
                              <a
                                href={`mailto:${p.email}`}
                                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                <span>{p.email}</span>
                              </a>
                            )}
                            {p.telefono && (
                              <div className="inline-flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <span>{p.telefono}</span>
                                {whatsappUrl && (
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold flex items-center gap-0.5 ml-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                    title="Abrir conversación en WhatsApp"
                                  >
                                    <span>WA</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Capturado{" "}
                            {formatDistanceToNow(new Date(p.createdAt), {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </TableCell>

                      {/* Canal de Origen */}
                      <TableCell className="align-top py-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
                          {CANAL_LABELS[p.canalOrigen] || p.canalOrigen}
                        </span>
                      </TableCell>

                      {/* SLA 48 Horas */}
                      <TableCell className="align-top py-3.5">
                        {renderSlaBadge(p.slaEstado, p.slaHorasRestantes, p.createdAt)}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="align-top py-3.5">
                        <Badge
                          variant="outline"
                          className={`text-xs px-2.5 py-1 ${ESTADO_BADGES[p.estado]}`}
                        >
                          {ESTADO_LABELS[p.estado]}
                        </Badge>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="align-top py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Transición 1: Calificar */}
                          {p.estado === "CAPTURADO" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                              onClick={() => calificarMutation.mutate(p.id)}
                              disabled={calificarMutation.isPending}
                              title="Marcar como calificado (detiene el contador SLA)"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Calificar</span>
                            </Button>
                          )}

                          {/* Transición 2: Iniciar Seguimiento */}
                          {p.estado === "CALIFICADO" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs font-semibold gap-1 bg-purple-700 hover:bg-purple-800 text-white cursor-pointer"
                              onClick={() => seguimientoMutation.mutate(p.id)}
                              disabled={seguimientoMutation.isPending}
                              title="Avanzar a seguimiento comercial"
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                              <span>Seguimiento</span>
                            </Button>
                          )}

                          {/* Transición 3: Cerrar */}
                          {(p.estado === "EN_SEGUIMIENTO" || p.estado === "CALIFICADO") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-semibold gap-1 border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                              onClick={() => handleOpenCerrar(p)}
                              disabled={cerrarMutation.isPending}
                              title="Cerrar el ciclo comercial del prospecto"
                            >
                              <span>Cerrar...</span>
                            </Button>
                          )}

                          {/* Auditoría / Historial de Eventos */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 cursor-pointer"
                            onClick={() => handleOpenHistory(p)}
                            title="Ver registro append-only de eventos"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Historial de Auditoría Append-Only (prospecto_eventos_log) */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <History className="h-5 w-5 text-mc-azul" />
              <span>Registro de Eventos y Auditoría (SRE)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Traza append-only inmutable almacenada en SQLite para el prospecto seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {isLoadingEventos ? (
              <p className="text-center text-sm text-muted-foreground py-6">Cargando eventos...</p>
            ) : eventos.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No hay eventos registrados aún para este prospecto.
              </div>
            ) : (
              <div className="relative pl-5 border-l-2 border-slate-200 space-y-4">
                {eventos.map((ev: ProspectoEventoRecord, idx: number) => (
                  <div key={ev.id || idx} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full bg-mc-azul border-2 border-white shadow-sm" />
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{ev.evento}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {format(new Date(ev.timestamp), "dd/MM/yyyy HH:mm:ss")}
                        </span>
                      </div>
                      <p className="text-slate-600">{ev.detalles || "Sin detalles adicionales"}</p>
                      {ev.estadoAnterior && (
                        <p className="text-[11px] text-slate-500 font-mono">
                          Transición: {ev.estadoAnterior} → {ev.estadoNuevo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryModalOpen(false)}
              className="cursor-pointer"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Decisión de Cierre (Ganado / Perdido) */}
      <Dialog open={cerrarModalOpen} onOpenChange={setCerrarModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Cierre Comercial del Prospecto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define el resultado definitivo para &quot;{prospectoParaCerrar?.nombre}&quot;. Esta
              acción sella el ciclo del lead.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-xs text-slate-700">
              Selecciona el resultado comercial:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1.5 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-800 cursor-pointer"
                onClick={() => handleConfirmarCierre(true)}
                disabled={prospectoParaCerrar?.estado !== "EN_SEGUIMIENTO"}
              >
                <Trophy className="h-5 w-5 text-emerald-600" />
                <span className="font-bold text-xs">Cerrado Ganado</span>
                {prospectoParaCerrar?.estado !== "EN_SEGUIMIENTO" && (
                  <span className="text-[10px] text-amber-600">(Requiere seguimiento)</span>
                )}
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-1.5 border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-700 hover:text-rose-800 cursor-pointer"
                onClick={() => handleConfirmarCierre(false)}
              >
                <XCircle className="h-5 w-5 text-rose-500" />
                <span className="font-bold text-xs">Cerrado Perdido</span>
                <span className="text-[10px] text-slate-500">(Descarte)</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCerrarModalOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
