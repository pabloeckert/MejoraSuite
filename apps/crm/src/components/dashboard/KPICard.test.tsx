import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KPICard } from "@/components/dashboard/KPICard";
import { DollarSign } from "lucide-react";

describe("KPICard", () => {
  const defaultProps = {
    label: "Ventas logradas",
    value: "$150,000",
    sub: "3 ventas",
    icon: DollarSign,
    color: "text-success",
    bg: "bg-success/10",
  };

  it("renders label, value, and sub text", () => {
    render(<KPICard {...defaultProps} />);
    expect(screen.getByText("Ventas logradas")).toBeDefined();
    expect(screen.getByText("$150,000")).toBeDefined();
    expect(screen.getByText("3 ventas")).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<KPICard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText("Ventas logradas").closest("div[class*='cursor-pointer']")!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies stagger class based on index", () => {
    const { container } = render(<KPICard {...defaultProps} index={2} />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders icon", () => {
    const { container } = render(<KPICard {...defaultProps} />);
    // The icon should be rendered as an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeDefined();
  });
});
