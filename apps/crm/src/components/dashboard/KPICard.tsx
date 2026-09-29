import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  onClick?: () => void;
  index?: number;
}

export const KPICard = memo(function KPICard({ label, value, sub, icon: Icon, color, bg, onClick, index = 0 }: KPICardProps) {
  return (
    <Card
      className={`animate-slide-up stagger-${index + 1} opacity-0 cursor-pointer hover:shadow-md transition-all duration-200 group border-border/50`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
