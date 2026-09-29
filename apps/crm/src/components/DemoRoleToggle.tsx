import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, User } from "lucide-react";

/**
 * Demo mode toggle — switches between Owner (admin) and Seller (vendedor) views.
 * Only visible when DEMO_MODE is active.
 */
export function DemoRoleToggle() {
  const { isDemo, demoRole, toggleDemoRole } = useAuth();

  if (!isDemo) return null;

  const isOwner = demoRole === "admin";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDemoRole}
      className="gap-2 h-8 text-xs font-medium border-dashed"
    >
      {isOwner ? (
        <>
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>Vista Dueño</span>
        </>
      ) : (
        <>
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Vista Vendedor</span>
        </>
      )}
      <span className="text-[10px] text-muted-foreground ml-1">⇄</span>
    </Button>
  );
}
