import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BRAND } from "@/lib/constants";
import type { WhatsAppStats } from "@/lib/businessLogic";

/**
 * Tarjeta de estadísticas de WhatsApp — usada en Reports.tsx (datos reales)
 * y en DemoPreview.tsx (datos ficticios), mismo componente en los dos casos.
 */
export function WhatsAppStatsCard({ stats }: { stats: WhatsAppStats }) {
  if (stats.total === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="grid grid-cols-2 gap-3 content-start">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-lg font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Respuestas detectadas</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-lg font-bold">{stats.automaticas}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Automáticas</p>
            </div>
          </div>
          <div className="lg:col-span-2 h-40">
            {stats.porSemana.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.porSemana}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" fontSize={10} tickFormatter={(v) => format(new Date(v), "d MMM", { locale: es })} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <RTooltip labelFormatter={(v) => `Semana del ${format(new Date(v), "d MMM", { locale: es })}`} />
                  <Bar dataKey="cantidad" fill={BRAND.primary} radius={[4, 4, 0, 0]} name="Respuestas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sin datos</div>}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Solo respuestas de WhatsApp detectadas automáticamente — no hay forma de contar mensajes enviados todavía.
        </p>
      </CardContent>
    </Card>
  );
}
