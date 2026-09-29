import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Copy, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * WhatsApp Link Generator
 * Creates a pre-filled WhatsApp message link for clients to submit their info.
 * The link can be shared via WhatsApp — the client fills 3 fields and sends.
 */

const WHATSAPP_NUMBER = ""; // Configure: e.g. "+543764000000"

export default function WhatsAppLink() {
  const [businessName, setBusinessName] = useState("Mejora Continua");
  const [whatsappNumber, setWhatsappNumber] = useState(WHATSAPP_NUMBER);
  const [customMessage, setCustomMessage] = useState(
    "Hola! Me interesa sus productos/servicios. Mis datos son:"
  );
  const [copied, setCopied] = useState(false);

  const generatedLink = (() => {
    if (!whatsappNumber) return "";
    const phone = whatsappNumber.replace(/[^\d+]/g, "").replace(/^\+/, "");
    const text = encodeURIComponent(
      `${customMessage}\n\n` +
      `📌 *Formulario de contacto — ${businessName}*\n\n` +
      `1️⃣ Nombre y empresa:\n` +
      `2️⃣ ¿Qué producto/servicio les interesa?\n` +
      `3️⃣ ¿Cómo nos encontraron?\n\n` +
      `_Respondé cada pregunta con un mensaje._`
    );
    return `https://wa.me/${phone}?text=${text}`;
  })();

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Link de WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Generá un link para que tus clientes te contacten directamente por WhatsApp
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-success" /> Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Nombre de tu negocio</Label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Mejora Continua"
              />
            </div>
            <div>
              <Label>Número de WhatsApp *</Label>
              <Input
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+54 376 4000000"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Formato internacional sin espacios ni guiones funciona mejor</p>
            </div>
          </div>
          <div>
            <Label>Mensaje inicial (opcional)</Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {generatedLink && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Link generado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview */}
            <div className="p-4 rounded-lg bg-success/5 border border-success/10">
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Vista previa del mensaje</p>
              <div className="text-sm whitespace-pre-line bg-white p-3 rounded-lg border shadow-sm">
                {customMessage}
                {"\n\n"}📌 <strong>Formulario de contacto — {businessName}</strong>
                {"\n\n"}1️⃣ Nombre y empresa:
                {"\n"}2️⃣ ¿Qué producto/servicio les interesa?
                {"\n"}3️⃣ ¿Cómo nos encontraron?
                {"\n\n"}<em>Respondé cada pregunta con un mensaje.</em>
              </div>
            </div>

            {/* Link */}
            <div className="flex gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="sm" className="shrink-0 h-9" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="sm" className="shrink-0 h-9" onClick={() => window.open(generatedLink, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-1" /> Abrir
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Compartí este link por redes sociales, email o QR. El cliente hace clic y te escribe directo.
            </p>
          </CardContent>
        </Card>
      )}

      {!whatsappNumber && (
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="py-8 text-center">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Ingresá tu número de WhatsApp para generar el link</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
