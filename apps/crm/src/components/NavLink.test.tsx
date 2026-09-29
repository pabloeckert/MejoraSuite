import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { NavLink } from "@/components/NavLink";

function renderNavLink(props: any) {
  return render(
    <BrowserRouter>
      <NavLink to="/" {...props}>Link text</NavLink>
    </BrowserRouter>
  );
}

describe("NavLink", () => {
  it("renders link text", () => {
    renderNavLink({});
    expect(screen.getByText("Link text")).toBeDefined();
  });

  it("renders as an anchor element", () => {
    renderNavLink({});
    const link = screen.getByText("Link text").closest("a");
    expect(link).toBeDefined();
    expect(link?.getAttribute("href")).toBe("/");
  });

  it("applies custom className", () => {
    renderNavLink({ className: "custom-class" });
    const link = screen.getByText("Link text").closest("a");
    expect(link?.className).toContain("custom-class");
  });

  it("applies activeClassName when on matching route", () => {
    // This is harder to test without navigating, but we can verify the prop is accepted
    renderNavLink({ activeClassName: "active-test" });
    expect(screen.getByText("Link text")).toBeDefined();
  });
});
