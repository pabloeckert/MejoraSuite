import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ColumnMapping, ContactField } from "@/types/contact";
import { CONTACT_FIELDS } from "@/types/contact";
import { ArrowRight, Shuffle, Eye, EyeOff } from "lucide-react";

interface ColumnMapperProps {
  mappings: ColumnMapping[];
  sampleData: Record<string, string>[];
  onMappingChange: (index: number, target: ContactField) => void;
}

const SAMPLE_COUNT = 5;

function pickRandomSamples(rows: Record<string, string>[], col: string, n: number, seed: number): string[] {
  const nonEmpty = rows
    .map((r) => (r[col] ?? "").toString().trim())
    .filter((v) => v.length > 0);
  if (nonEmpty.length === 0) return [];
  if (nonEmpty.length <= n) return nonEmpty.slice(0, n);
  // Deterministic-ish shuffle using seed
  const indices = Array.from({ length: nonEmpty.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const r = Math.floor(((Math.sin(seed + i) + 1) / 2) * (i + 1));
    [indices[i], indices[r]] = [indices[r], indices[i]];
  }
  return indices.slice(0, n).map((i) => nonEmpty[i]);
}

export function ColumnMapper({ mappings, sampleData, onMappingChange }: ColumnMapperProps) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1000));
  const [showAll, setShowAll] = useState(true);

  const samplesByCol = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const m of mappings) {
      map[m.source] = pickRandomSamples(sampleData, m.source, SAMPLE_COUNT, seed);
    }
    return map;
  }, [mappings, sampleData, seed]);

  if (mappings.length === 0) return null;

  const mappedCount = mappings.filter((m) => m.target !== "ignore").length;
  const ignoredCount = mappings.length - mappedCount;
  const visibleMappings = showAll ? mappings : mappings.filter((m) => m.target !== "ignore");

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="text-sm flex items-center gap-2">
              Mapeo de columnas
              <Badge variant="default" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                {mappedCount} mapeadas
              </Badge>
              {ignoredCount > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {ignoredCount} ignoradas
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {SAMPLE_COUNT} muestras aleatorias
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Asigná cada columna detectada al campo destino. Las muestras son aleatorias del dataset real.
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showAll ? "Solo mapeadas" : "Ver todas"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] gap-1"
              onClick={() => setSeed(Math.floor(Math.random() * 10000))}
            >
              <Shuffle className="h-3 w-3" />
              Re-muestrear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[480px]">
          <div className="divide-y">
            {visibleMappings.map((mapping) => {
              const originalIndex = mappings.findIndex((m) => m.source === mapping.source);
              const samples = samplesByCol[mapping.source] || [];
              const isIgnored = mapping.target === "ignore";
              return (
                <div
                  key={mapping.source}
                  className={`grid grid-cols-12 gap-3 px-4 py-3 items-center transition-colors ${
                    isIgnored ? "bg-muted/20 opacity-70" : "hover:bg-muted/30"
                  }`}
                >
                  {/* Source column */}
                  <div className="col-span-12 sm:col-span-3 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate" title={mapping.source}>
                      {mapping.source}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {samples.length} valores no vacíos
                    </p>
                  </div>

                  {/* Samples */}
                  <div className="col-span-12 sm:col-span-6 min-w-0">
                    {samples.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">— sin datos —</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {samples.map((s, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-muted/60 border border-border/40 rounded px-1.5 py-0.5 max-w-[180px] truncate"
                            title={s}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow + Select */}
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-2 justify-end">
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
                    <Select
                      value={mapping.target}
                      onValueChange={(v) => onMappingChange(originalIndex, v as ContactField)}
                    >
                      <SelectTrigger
                        className={`w-full sm:w-[150px] h-8 text-xs ${
                          isIgnored ? "border-muted text-muted-foreground" : "border-primary/40"
                        }`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value} className="text-xs">
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
