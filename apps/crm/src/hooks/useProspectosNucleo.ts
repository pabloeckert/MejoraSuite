import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  prospectosNucleoService,
  type ProspectoResponseDTO,
  type CrearProspectoInput,
  type ProspectoEventoRecord
} from "@/services/prospectosNucleoService";

export const PROSPECTOS_QUERY_KEY = ["prospectos-nucleo"];

export function useProspectosNucleo(filtros?: { estado?: string; busqueda?: string }) {
  return useQuery<ProspectoResponseDTO[]>({
    queryKey: [...PROSPECTOS_QUERY_KEY, filtros?.estado ?? "todos", filtros?.busqueda ?? ""],
    queryFn: () => prospectosNucleoService.listarProspectos(filtros),
    refetchInterval: 15_000, // Polling de 15s para semáforo SLA en tiempo real
    staleTime: 5_000
  });
}

export function useProspectoEventos(prospectoId?: string) {
  return useQuery<ProspectoEventoRecord[]>({
    queryKey: ["prospecto-eventos", prospectoId],
    queryFn: () => (prospectoId ? prospectosNucleoService.obtenerEventos(prospectoId) : Promise.resolve([])),
    enabled: Boolean(prospectoId)
  });
}

export function useCrearProspectoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CrearProspectoInput) => prospectosNucleoService.crearProspecto(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROSPECTOS_QUERY_KEY });
      toast.success(`Prospecto "${data.nombre}" registrado con SLA de 48h`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al crear el prospecto");
    }
  });
}

export function useCalificarProspectoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prospectosNucleoService.calificarProspecto(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROSPECTOS_QUERY_KEY });
      toast.success(`Prospecto "${data.nombre}" calificado exitosamente (SLA cumplido)`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al calificar el prospecto");
    }
  });
}

export function useIniciarSeguimientoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prospectosNucleoService.iniciarSeguimiento(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROSPECTOS_QUERY_KEY });
      toast.success(`Seguimiento comercial iniciado para "${data.nombre}"`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al iniciar seguimiento");
    }
  });
}

export function useCerrarProspectoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ganado }: { id: string; ganado: boolean }) =>
      prospectosNucleoService.cerrarProspecto(id, ganado),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROSPECTOS_QUERY_KEY });
      if (data.estado === "CERRADO_GANADO") {
        toast.success(`¡Venta cerrada como GANADA para "${data.nombre}"! 🎉`);
      } else {
        toast.info(`Prospecto "${data.nombre}" marcado como CERRADO PERDIDO`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Error al cerrar prospecto");
    }
  });
}
