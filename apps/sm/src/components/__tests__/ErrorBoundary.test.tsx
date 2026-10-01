import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

function ThrowComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Content rendered</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("Content rendered")).toBeInTheDocument();
  });

  it("renders fallback UI when error occurs", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    expect(screen.getByText("Reintentar")).toBeInTheDocument();

    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();

    spy.mockRestore();
  });
});
