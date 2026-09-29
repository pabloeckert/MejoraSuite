import { z } from "zod";
import { Constants } from "@/integrations/supabase/types";

const results = Constants.public.Enums.interaction_result;
const mediums = Constants.public.Enums.interaction_medium;

export const interactionSchema = z.object({
  client_id: z.string().min(1, "Seleccioná un cliente"),
  medium: z.enum(mediums as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Seleccioná un medio" }),
  }),
  result: z.enum(results as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "Seleccioná un resultado" }),
  }),

  // Presupuesto
  quote_path: z.enum(["catalogo", "adjunto"]).optional(),
  currency: z.string().optional().default("ARS"),
  total_amount: z.number().nullable().optional(),
  attachment_url: z.string().url().nullable().optional(),

  // Venta
  reference_quote_id: z.string().uuid().nullable().optional(),

  // Seguimiento
  followup_scenario: z.enum(["vinculado", "independiente", "historico"]).nullable().optional(),
  followup_motive: z.string().nullable().optional(),
  negotiation_state: z.enum(["con_interes", "sin_respuesta", "revisando", "pidio_cambios"]).nullable().optional(),
  historic_quote_amount: z.number().nullable().optional(),
  historic_quote_date: z.string().nullable().optional(),

  // No interesado
  loss_reason: z.string().nullable().optional(),
  estimated_loss: z.number().nullable().optional(),

  // Common
  next_step: z.string().nullable().optional(),
  follow_up_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
}).refine(
  (data) => {
    if (data.result === "no_interesado") return !!data.loss_reason;
    return true;
  },
  { message: "Indicá el motivo de pérdida", path: ["loss_reason"] }
).refine(
  (data) => {
    if (data.result === "seguimiento") return !!data.followup_scenario;
    return true;
  },
  { message: "Seleccioná el tipo de seguimiento", path: ["followup_scenario"] }
);

export type InteractionFormData = z.infer<typeof interactionSchema>;

export const lineSchema = z.object({
  product_id: z.string(),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
});

export type LineFormData = z.infer<typeof lineSchema>;
