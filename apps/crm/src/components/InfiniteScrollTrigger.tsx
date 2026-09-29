import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** Optional loader element */
  loader?: React.ReactNode;
}

/**
 * Invisible trigger element for infinite scroll.
 * Uses IntersectionObserver to detect when it enters the viewport,
 * then calls fetchNextPage automatically.
 */
export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loader,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" } // Trigger 200px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage) return null;

  return (
    <div ref={triggerRef} className="py-4 text-center">
      {isFetchingNextPage ? (
        loader || (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Cargando más...
          </div>
        )
      ) : (
        <div className="h-1" /> // Invisible trigger
      )}
    </div>
  );
}
