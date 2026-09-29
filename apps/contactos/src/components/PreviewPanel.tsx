import { useMemo } from "react";
import { AlertTriangle, CheckCircle, Users, Mail, Phone, Building2, Briefcase, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParsedFile } from "@/types/contact";

interface PreviewPanelProps {
  files: ParsedFile[];
}

interface PreviewStats {
  totalRows: number;
  columns: string[];
  hasEmail: boolean;
  hasPhone: boolean;
  hasName: boolean;
  hasCompany: boolean;
  hasJobTitle: boolean;
  emptyEmails: number;
  emptyPhones: number;
  emptyNames: number;
  potentialDuplicates: number;
  formatBreakdown: Record<string, number>;
}

function analyzeFiles(files: ParsedFile[]): PreviewStats {
  let totalRows = 0;
  const columnsSet = new Set<string>();
  const formatBreakdown: Record<string, number> = {};
  let emptyEmails = 0;
  let emptyPhones = 0;
  let emptyNames = 0;
  const seenKeys = new Set<string>();
  let potentialDuplicates = 0;

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";
    formatBreakdown[ext] = (formatBreakdown[ext] || 0) + 1;

    for (const row of file.rows) {
      totalRows++;
      for (const key of Object.keys(row)) {
        columnsSet.add(key.toLowerCase());
      }

      const email = (row.email || row.Email || row.EMAIL || "").toString().trim().toLowerCase();
      const phone = (row.phone || row.Phone || row.PHONE || row.whatsapp || row.Whatsapp || row.tel || row.Tel || "").toString().trim();
      const firstName = (row.firstName || row.FirstName || row.first_name || row.nombre || row.Nombre || "").toString().trim();
      const lastName = (row.lastName || row.LastName || row.last_name || row.apellido || row.Apellido || "").toString().trim();

      if (!email) emptyEmails++;
      if (!phone) emptyPhones++;
      if (!firstName && !lastName) emptyNames++;

      // Simple duplicate detection by email or phone
      const key = email || phone;
      if (key && seenKeys.has(key)) {
        potentialDuplicates++;
      } else if (key) {
        seenKeys.add(key);
      }
    }
  }

  const columns = Array.from(columnsSet);
  const hasEmail = columns.some((c) => ["email", "correo", "e-mail"].includes(c));
  const hasPhone = columns.some((c) => ["phone", "tel", "telefono", "teléfono", "whatsapp", "mobile", "celular"].includes(c));
  const hasName = columns.some((c) => ["name", "nombre", "firstname", "first_name", "first name"].includes(c));
  const hasCompany = columns.some((c) => ["company", "empresa", "organization", "organización"].includes(c));
  const hasJobTitle = columns.some((c) => ["jobtitle", "job_title", "cargo", "puesto", "title"].includes(c));

  return {
    totalRows,
    columns,
    hasEmail,
    hasPhone,
    hasName,
    hasCompany,
    hasJobTitle,
    emptyEmails,
    emptyPhones,
    emptyNames,
    potentialDuplicates,
    formatBreakdown,
  };
}

export function PreviewPanel({ files }: PreviewPanelProps) {
  const stats = useMemo(() => analyzeFiles(files), [files]);

  if (files.length === 0) return null;

  const issues: { icon: React.ReactNode; label: string; count: number; severity: "warn" | "info" }[] = [];

  if (stats.emptyNames > 0)
    issues.push({ icon: <Users className="h-3.5 w-3.5" />, label: "sin nombre", count: stats.emptyNames, severity: "warn" });
  if (stats.emptyEmails > 0)
    issues.push({ icon: <Mail className="h-3.5 w-3.5" />, label: "sin email", count: stats.emptyEmails, severity: "info" });
  if (stats.emptyPhones > 0)
    issues.push({ icon: <Phone className="h-3.5 w-3.5" />, label: "sin teléfono", count: stats.emptyPhones, severity: "info" });
  if (stats.potentialDuplicates > 0)
    issues.push({ icon: <Copy className="h-3.5 w-3.5" />, label: "duplicados potenciales", count: stats.potentialDuplicates, severity: "warn" });

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Vista previa — {stats.totalRows.toLocaleString()} contactos detectados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Column detection */}
        <div className="flex flex-wrap gap-1.5">
          {stats.hasName && <Badge variant="secondary" className="text-xs"><Users className="h-3 w-3 mr-1" />Nombres</Badge>}
          {stats.hasEmail && <Badge variant="secondary" className="text-xs"><Mail className="h-3 w-3 mr-1" />Emails</Badge>}
          {stats.hasPhone && <Badge variant="secondary" className="text-xs"><Phone className="h-3 w-3 mr-1" />Teléfonos</Badge>}
          {stats.hasCompany && <Badge variant="secondary" className="text-xs"><Building2 className="h-3 w-3 mr-1" />Empresas</Badge>}
          {stats.hasJobTitle && <Badge variant="secondary" className="text-xs"><Briefcase className="h-3 w-3 mr-1" />Cargos</Badge>}
        </div>

        {/* Issues summary */}
        {issues.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {issues.map((issue, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                issue.severity === "warn"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                {issue.icon}
                <span className="font-medium">{issue.count}</span>
                <span>{issue.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Format breakdown */}
        <div className="text-xs text-muted-foreground">
          {Object.entries(stats.formatBreakdown).map(([fmt, count], i) => (
            <span key={fmt}>
              {i > 0 && " · "}
              {count} {fmt.toUpperCase()}
            </span>
          ))}
        </div>

        {/* Action hint */}
        <p className="text-xs text-muted-foreground/80 italic">
          💡 El pipeline limpiará nombres, normalizará teléfonos a formato E.164, validará emails y eliminará duplicados.
        </p>
      </CardContent>
    </Card>
  );
}
