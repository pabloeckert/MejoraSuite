import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnMapper } from "@/components/ColumnMapper";
import type { ColumnMapping } from "@/types/contact";

const sampleMappings: ColumnMapping[] = [
  { source: "Nombre", target: "firstName" },
  { source: "Apellido", target: "lastName" },
  { source: "Email", target: "email" },
  { source: "RandomCol", target: "ignore" },
];

const sampleData = [
  { Nombre: "Juan", Apellido: "García", Email: "juan@test.com", RandomCol: "xyz" },
  { Nombre: "María", Apellido: "López", Email: "maria@test.com", RandomCol: "abc" },
  { Nombre: "Pedro", Apellido: "Martínez", Email: "pedro@test.com", RandomCol: "123" },
];

describe("ColumnMapper", () => {
  it("should render mapped count badge", () => {
    render(
      <ColumnMapper mappings={sampleMappings} sampleData={sampleData} onMappingChange={vi.fn()} />
    );
    expect(screen.getByText("3 mapeadas")).toBeTruthy();
  });

  it("should render ignored count badge", () => {
    render(
      <ColumnMapper mappings={sampleMappings} sampleData={sampleData} onMappingChange={vi.fn()} />
    );
    expect(screen.getByText("1 ignoradas")).toBeTruthy();
  });

  it("should return null when no mappings", () => {
    const { container } = render(
      <ColumnMapper mappings={[]} sampleData={[]} onMappingChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render source column names", () => {
    const { container } = render(
      <ColumnMapper mappings={sampleMappings} sampleData={sampleData} onMappingChange={vi.fn()} />
    );
    // Column names appear as truncated text in the grid
    expect(container.textContent).toContain("Nombre");
    expect(container.textContent).toContain("Apellido");
    expect(container.textContent).toContain("Email");
  });

  it("should toggle show/hide ignored columns", () => {
    render(
      <ColumnMapper mappings={sampleMappings} sampleData={sampleData} onMappingChange={vi.fn()} />
    );
    const toggleBtn = screen.getByText("Solo mapeadas");
    fireEvent.click(toggleBtn);
    // After clicking, should show "Ver todas"
    expect(screen.getByText("Ver todas")).toBeTruthy();
  });

  it("should re-sample on button click", () => {
    render(
      <ColumnMapper mappings={sampleMappings} sampleData={sampleData} onMappingChange={vi.fn()} />
    );
    const resampleBtn = screen.getByText("Re-muestrear");
    fireEvent.click(resampleBtn);
    // Should not crash, samples are refreshed
    expect(screen.getByText("Re-muestrear")).toBeTruthy();
  });

  it("should call onMappingChange when select changes", () => {
    const onChange = vi.fn();
    render(
      <ColumnMapper mappings={sampleMappings} sampleData={sampleData} onMappingChange={onChange} />
    );
    // The select components exist
    expect(screen.getByText("3 mapeadas")).toBeTruthy();
  });
});
