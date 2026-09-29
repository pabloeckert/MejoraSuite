import type { ReactNode } from "react";
import { Upload, Zap, Download, BarChart3, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: "import" | "process" | "results" | "export" | "dashboard" | "custom";
}

const ILLUSTRATIONS: Record<string, ReactNode> = {
  import: (
    <div className="relative">
      <div className="h-20 w-20 rounded-2xl bg-blue-500/10 flex items-center justify-center">
        <Upload className="h-10 w-10 text-blue-500" />
      </div>
      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center animate-bounce">
        <span className="text-xs">📄</span>
      </div>
    </div>
  ),
  process: (
    <div className="relative">
      <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
        <Zap className="h-10 w-10 text-violet-500" />
      </div>
      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-violet-500/20 flex items-center justify-center animate-pulse">
        <span className="text-xs">✨</span>
      </div>
    </div>
  ),
  results: (
    <div className="relative">
      <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
        <FileSearch className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="absolute -top-1 -left-1 h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
        <span className="text-xs">👥</span>
      </div>
    </div>
  ),
  export: (
    <div className="relative">
      <div className="h-20 w-20 rounded-2xl bg-orange-500/10 flex items-center justify-center">
        <Download className="h-10 w-10 text-orange-500" />
      </div>
      <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
        <span className="text-xs">📦</span>
      </div>
    </div>
  ),
  dashboard: (
    <div className="relative">
      <div className="h-20 w-20 rounded-2xl bg-pink-500/10 flex items-center justify-center">
        <BarChart3 className="h-10 w-10 text-pink-500" />
      </div>
      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-pink-500/20 flex items-center justify-center animate-bounce">
        <span className="text-xs">📊</span>
      </div>
    </div>
  ),
};

export function EmptyState({ icon, title, description, action, illustration = "custom" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon || ILLUSTRATIONS[illustration] || (
        <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center">
          <FileSearch className="h-10 w-10 text-muted-foreground/50" />
        </div>
      )}
      <h3 className="text-lg font-semibold mt-5 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
