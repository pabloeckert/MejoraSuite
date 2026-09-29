import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, PageSkeleton, CardSkeleton } from "../ui/skeleton";

describe("Skeleton components", () => {
  describe("Skeleton", () => {
    it("renders with pulse animation class", () => {
      const { container } = render(<Skeleton className="h-4 w-20" />);
      const el = container.firstChild as HTMLElement;
      expect(el.classList.contains("animate-pulse")).toBe(true);
      expect(el.classList.contains("bg-muted")).toBe(true);
    });

    it("applies custom className", () => {
      const { container } = render(<Skeleton className="h-8 w-64" />);
      const el = container.firstChild as HTMLElement;
      expect(el.classList.contains("h-8")).toBe(true);
      expect(el.classList.contains("w-64")).toBe(true);
    });

    it("is aria-hidden", () => {
      const { container } = render(<Skeleton />);
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("aria-hidden")).toBe("true");
    });
  });

  describe("PageSkeleton", () => {
    it("renders with status role for accessibility", () => {
      render(<PageSkeleton />);
      const status = screen.getByRole("status");
      expect(status).toBeTruthy();
    });

    it("has screen-reader only text", () => {
      render(<PageSkeleton />);
      expect(screen.getByText("Cargando contenido...")).toBeTruthy();
    });
  });

  describe("CardSkeleton", () => {
    it("renders as aria-hidden", () => {
      const { container } = render(<CardSkeleton />);
      const el = container.firstChild as HTMLElement;
      expect(el.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
