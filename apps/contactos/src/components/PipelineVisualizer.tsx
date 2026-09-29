import { CheckCircle2, XCircle, Clock, Loader2, Zap, Globe, Bot, Shield, Play, Wrench } from "lucide-react";
import type { PipelineStage, StageConfig } from "@/hooks/useContactProcessing";
import { PROVIDERS } from "@/lib/providers";

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  groq: <Zap className="h-3 w-3 text-yellow-500" />,
  openrouter: <Globe className="h-3 w-3 text-purple-500" />,
  together: <Zap className="h-3 w-3 text-emerald-500" />,
  cerebras: <Zap className="h-3 w-3 text-cyan-500" />,
  deepinfra: <Zap className="h-3 w-3 text-red-500" />,
  sambanova: <Zap className="h-3 w-3 text-green-500" />,
  mistral: <Zap className="h-3 w-3 text-indigo-500" />,
  deepseek: <Zap className="h-3 w-3 text-teal-500" />,
  gemini: <Zap className="h-3 w-3 text-blue-400" />,
  cloudflare: <Globe className="h-3 w-3 text-orange-400" />,
  huggingface: <Bot className="h-3 w-3 text-yellow-600" />,
  nebius: <Zap className="h-3 w-3 text-violet-500" />,
};

function getProviderName(id: string): string {
  const p = PROVIDERS.find(p => p.id === id);
  return p ? p.name.split(" (")[0] : id;
}

interface PipelineVisualizerProps {
  pipelineState: {
    mapping: PipelineStage;
    rules: PipelineStage;
    cleaning: PipelineStage;
    verifying: PipelineStage;
    correcting: PipelineStage;
    validation: PipelineStage;
    dedup: PipelineStage;
  };
  stageConfig: StageConfig;
  mode: "single" | "pipeline";
  singleProvider: string;
}

export function PipelineVisualizer({ pipelineState, stageConfig, mode, singleProvider }: PipelineVisualizerProps) {
  const stageLabels = mode === "pipeline" ? {
    clean: getProviderName(stageConfig.clean),
    verify: getProviderName(stageConfig.verify),
    correct: getProviderName(stageConfig.correct),
  } : { clean: getProviderName(singleProvider), verify: "", correct: "" };

  return (
    <div className="rounded-lg border bg-card/50 p-3" role="region" aria-label="Pipeline de procesamiento">
      <p className="text-xs font-medium text-muted-foreground mb-3">Pipeline de procesamiento</p>
      <div className="flex items-center gap-1 flex-wrap" role="list" aria-label="Etapas del pipeline">
        <PipelineStep icon={<Play className="h-3 w-3" />} label="Mapeo" state={pipelineState.mapping} />
        <Connector active={pipelineState.mapping === "done"} />
        <PipelineStep icon={<Wrench className="h-3 w-3" />} label="Reglas" sublabel="Limpieza rápida" state={pipelineState.rules} />
        <Connector active={pipelineState.rules === "done"} />
        <PipelineStep icon={PROVIDER_ICONS[stageConfig.clean] || <Zap className="h-3 w-3" />} label={stageLabels.clean} sublabel="IA Limpieza" state={pipelineState.cleaning} />
        <Connector active={pipelineState.cleaning === "done"} />
        <PipelineStep icon={PROVIDER_ICONS[stageConfig.verify] || <Globe className="h-3 w-3" />} label={stageLabels.verify} sublabel="Verificación" state={pipelineState.verifying} />
        <Connector active={pipelineState.verifying === "done"} />
        <PipelineStep icon={PROVIDER_ICONS[stageConfig.correct] || <Bot className="h-3 w-3" />} label={stageLabels.correct} sublabel="Corrección" state={pipelineState.correcting} />
        <Connector active={pipelineState.correcting === "done"} />
        <PipelineStep icon={<Shield className="h-3 w-3" />} label="Validar" sublabel="Score + IA" state={pipelineState.validation} />
        <Connector active={pipelineState.validation === "done"} />
        <PipelineStep icon={<CheckCircle2 className="h-3 w-3" />} label="Dedup" state={pipelineState.dedup} ariaLabel="Deduplicación" />
      </div>
    </div>
  );
}

function PipelineStep({ icon, label, sublabel, state, ariaLabel }: { icon: React.ReactNode; label: string; sublabel?: string; state: PipelineStage; ariaLabel?: string }) {
  const stateStyles: Record<PipelineStage, string> = {
    idle: "border-muted bg-muted/30 text-muted-foreground",
    active: "border-primary bg-primary/10 text-primary ring-2 ring-primary/30 animate-pulse",
    done: "border-green-500 bg-green-500/10 text-green-500",
    error: "border-red-500 bg-red-500/10 text-red-500",
  };
  const stateLabel: Record<PipelineStage, string> = {
    idle: "pendiente",
    active: "en progreso",
    done: "completado",
    error: "error",
  };
  const stateIcon = state === "done" ? <CheckCircle2 className="h-3 w-3" /> :
                    state === "error" ? <XCircle className="h-3 w-3" /> :
                    state === "active" ? <Loader2 className="h-3 w-3 animate-spin" /> :
                    <Clock className="h-3 w-3" />;
  return (
    <div
      role="listitem"
      aria-label={`${ariaLabel || label}: ${stateLabel[state]}`}
      className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-lg border transition-all duration-300 min-w-[52px] ${stateStyles[state]}`}
    >
      <div className="flex items-center gap-1">{stateIcon}</div>
      <span className="text-[9px] font-medium leading-none">{label}</span>
      {sublabel && <span className="text-[8px] opacity-70 leading-none">{sublabel}</span>}
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return <div className={`h-0.5 w-3 shrink-0 rounded-full transition-colors duration-500 ${active ? "bg-green-500" : "bg-muted"}`} />;
}
