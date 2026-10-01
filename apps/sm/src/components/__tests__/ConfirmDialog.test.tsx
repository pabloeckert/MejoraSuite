import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders when open", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        title="Delete item?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />
    );

    expect(screen.queryByText("Delete item?")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete item?"
        description="This cannot be undone."
        confirmText="Eliminar"
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByText("Eliminar"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("shows custom button text", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Confirm?"
        description="Are you sure?"
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText("Sí, eliminar")).toBeInTheDocument();
    expect(screen.getByText("No, cancelar")).toBeInTheDocument();
  });
});
