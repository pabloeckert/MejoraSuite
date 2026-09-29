import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Skeleton loading placeholder — animates with pulse */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
}

/** Full-page skeleton for route transitions */
export function PageSkeleton() {
  return (
    <div className="space-y-6 py-6" role="status" aria-label="Cargando...">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      <span className="sr-only">Cargando contenido...</span>
    </div>
  );
}

/** Card skeleton for dashboard/panel loading */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4" aria-hidden="true">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
