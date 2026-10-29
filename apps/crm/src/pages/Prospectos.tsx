import { useState, useMemo } from "react";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  Server
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ProspectosSlaTable } from "@/components/prospectos/ProspectosSlaTable";
import {
  useProspectosNucleo,
  useCrearProspectoMutation
} from "@/hooks/useProspectosNucleo";

export default function Prospectos() {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [newModalOpen, setNewModalOpen] = useState(false);

  // Formulario nuevo lead
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formCanal, setFormCanal] = useState("crm_manual");

  const { data: prospectos = [], isLoading, refetch, isFetching } = useProspectosNucleo();
  const crearMutation = useCrearProspectoMutation();

  // Filtrado de prospectos
  const filteredProspectos = useMemo(() => {
    return prospectos.filter((p) => {
      if (filterEstado !== "all" && p.estado !== filterEstado) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.nombre.toLowerCase().includes(q);
        const matchesEmail = p.email.toLowerCase().includes(q);
        const matchesTel = p.telefono.includes(q);
        const matchesCanal = p.canalOrigen.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesTel && !matchesCanal) {
          return false;
        }
      }
      return true;
    });
  }, [prospectos, filterEstado, search]);

  // KPIs
  const stats = useMemo(() => {
    let rojos = 0;
    let amarillos = 0;
    let verdes = 0;
    let atendidos = 0;

    for (const p of prospectos) {
      if (p.estado === "CAPTURADO") {
        if (p.slaEstado === "ROJO") rojos++;
        else if (p.slaEstado === "AMARILLO") amarillos++;
        else verdes++;
      } else {
        atendidos++;
      }
    }
    return { rojos, amarillos, verdes, atendidos, total: prospectos.length };
  }, [prospectos]);

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formEmail.trim()) return;

    crearMutation.mutate(
      {
        nombre: formNombre.trim(),
        email: formEmail.trim(),
        telefono: formTelefono.trim(),
        canalOrigen: formCanal
      },
      {
        onSuccess: () => {
          setNewModalOpen(false);
          setFormNombre("");
          setFormEmail("");
          setFormTelefono("");
          setFormCanal("crm_manual");
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4 max-w-[1600px] mx-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-spartan">
              Prospectos del Edificio Comercial
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Server className="h-3 w-3" />
              <span>SLA 48h Activo</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitoreo en tiempo real de leads capturados, semáforo de calificación y auditoría append-only.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 gap-1.5 cursor-pointer text-xs"
            title="Recargar datos del servidor local"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-mc-azul" : ""}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setNewModalOpen(true)}
            className="h-9 gap-1.5 bg-mc-azul hover:bg-mc-azul/90 text-white cursor-pointer text-xs font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Prospecto</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas Semáforo SLA 48h */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Vencidos (> 48h) */}
        <Card className={`border-rose-300 bg-rose-50/40 shadow-sm ${stats.rojos > 0 ? "ring-2 ring-rose-400" : ""}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                <span>SLA Vencido (&gt;48h)</span>
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 mt-1 tabular-nums">
                {stats.rojos}
              </p>
              <p className="text-[10px] text-rose-700 mt-0.5">Alerta Prioridad P0</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
              <span className="h-3 w-3 rounded-full bg-rose-600 animate-ping" />
            </div>
          </CardContent>
        </Card>

        {/* En Riesgo (24h - 48h) */}
        <Card className="border-amber-300 bg-amber-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>En Riesgo (24-48h)</span>
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1 tabular-nums">
                {stats.amarillos}
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">Atención requerida hoy</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 font-bold text-sm">
              ⏳
            </div>
          </CardContent>
        </Card>

        {/* En Término (< 24h) */}
        <Card className="border-emerald-300 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>En Término (&lt;24h)</span>
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1 tabular-nums">
                {stats.verdes}
              </p>
              <p className="text-[10px] text-emerald-700 mt-0.5">Capturados recientemente</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-sm">
              ⚡
            </div>
          </CardContent>
        </Card>

        {/* Calificados / Atendidos */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                <span>Calificados / Cerrados</span>
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {stats.atendidos}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Ciclo de vida avanzado</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600 font-bold text-sm">
              ✓
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/60 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o canal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="CAPTURADO">Capturado (Pendiente SLA)</SelectItem>
              <SelectItem value="CALIFICADO">Calificado</SelectItem>
              <SelectItem value="EN_SEGUIMIENTO">En Seguimiento</SelectItem>
              <SelectItem value="CERRADO_GANADO">Cerrado Ganado</SelectItem>
              <SelectItem value="CERRADO_PERDIDO">Cerrado Perdido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla de Prospectos con SLA */}
      <ProspectosSlaTable prospectos={filteredProspectos} isLoading={isLoading} />

      {/* Modal: Alta de Nuevo Prospecto */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Registrar Nuevo Prospecto (SLA 48h)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa los datos del lead. Se inicializará con estado CAPTURADO y reloj de 48 horas activo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearSubmit} className="space-y-3.5 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nombre y Apellido / Razón Social *</Label>
              <Input
                placeholder="Ej. Gustavo Silveyra (Agroindustrias)"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Correo Electrónico *</Label>
              <Input
                type="email"
                placeholder="gustavo@empresa.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Teléfono / WhatsApp</Label>
              <Input
                placeholder="+5491122334455"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Canal de Origen</Label>
              <Select value={formCanal} onValueChange={setFormCanal}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Seleccionar canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm_manual">CRM Manual</SelectItem>
                  <SelectItem value="landing_hostinger">Landing Web (Hostinger)</SelectItem>
                  <SelectItem value="diagnostico_4d">Diagnóstico 4D</SelectItem>
                  <SelectItem value="taller_mc">Taller MC (60m)</SelectItem>
                  <SelectItem value="after_office_12x12">After Office 12x12</SelectItem>
                  <SelectItem value="instagram_direct">Instagram Direct</SelectItem>
                  <SelectItem value="facebook_messenger">Facebook Messenger</SelectItem>
                  <SelectItem value="whatsapp_direct">WhatsApp Directo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNewModalOpen(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-mc-azul hover:bg-mc-azul/90 text-white cursor-pointer font-semibold"
                disabled={crearMutation.isPending}
              >
                {crearMutation.isPending ? "Guardando..." : "Guardar Prospecto"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
