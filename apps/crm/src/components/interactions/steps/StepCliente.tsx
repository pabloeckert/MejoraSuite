import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Client {
  id: string;
  name: string;
  company?: string | null;
}

interface StepClienteProps {
  clients: Client[];
  searchClient: string;
  onSearchChange: (v: string) => void;
  selectedClientId: string;
  onSelectClient: (id: string) => void;
  error?: string;
}

export function StepCliente({ clients, searchClient, onSearchChange, selectedClientId, onSelectClient, error }: StepClienteProps) {
  const filtered = searchClient
    ? clients.filter((c) => {
        const q = searchClient.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
      })
    : clients;

  return (
    <div className="space-y-3 animate-fade-in">
      <Label className="text-base font-semibold">¿A quién visitaste o contactaste?</Label>
      <Input placeholder="Buscar cliente..." value={searchClient} onChange={(e) => onSearchChange(e.target.value)} className="mb-2" />
      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectClient(c.id)}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              selectedClientId === c.id
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedClientId === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              {c.company && <p className="text-xs text-muted-foreground truncate">{c.company}</p>}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
