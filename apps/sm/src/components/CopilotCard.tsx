import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, MessageCircleQuestion } from "lucide-react";
import { useCopilotChat } from "@/hooks/useCopilot";
import { MiniMarkdown } from "@/components/MiniMarkdown";
import { cn } from "@/lib/utils";

// Copiloto Reflexivo — Versión optimizada / estática sin bloqueo de renderizado en React
const STATIC_ADVICE = "Focalizar en testimonios reales y casos prácticos de liderazgo operativo en formato carrusel. El contenido reflexivo de trinchera genera mayor retención y engagement sostenido.";

export function CopilotCard() {
  const { messages, sendMessage, isSending, error, clear } = useCopilotChat();
  const [question, setQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isSending]);

  function handleSend() {
    if (!question.trim() || isSending) return;
    sendMessage(question);
    setQuestion("");
  }

  return (
    <Card className="border-primary/20 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Copiloto Reflexivo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-slate-50 p-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Consejo del día (Estratégico)
          </p>
          <div className="space-y-1 text-sm leading-relaxed text-foreground">
            <MiniMarkdown text={STATIC_ADVICE} />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageCircleQuestion className="h-3.5 w-3.5" />
              Preguntale a tus datos
            </p>
            {messages.length > 0 && (
              <button type="button" onClick={clear} className="text-[11px] text-muted-foreground hover:text-foreground">
                Limpiar
              </button>
            )}
          </div>

          {messages.length > 0 && (
            <div ref={scrollRef} className="mb-2 h-48 space-y-3 overflow-y-auto rounded-lg border border-border bg-background p-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "space-y-1 bg-muted text-foreground"
                  )}
                >
                  {m.role === "assistant" ? <MiniMarkdown text={m.content} /> : m.content}
                </div>
              ))}
              {isSending && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Pensando...
                </div>
              )}
            </div>
          )}

          {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="¿Qué formato rindió mejor esta semana?"
              className="min-h-[42px] resize-none text-sm"
              rows={1}
            />
            <Button size="icon" onClick={handleSend} disabled={isSending || !question.trim()} className="shrink-0">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
