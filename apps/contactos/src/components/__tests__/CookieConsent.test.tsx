import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CookieConsent } from "@/components/CookieConsent";

const CONSENT_KEY = "__mc_cookie_consent__";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should show banner when no consent stored", () => {
    render(<CookieConsent />);
    expect(screen.getByText(/Usamos cookies esenciales/)).toBeTruthy();
    expect(screen.getByText("Aceptar")).toBeTruthy();
    expect(screen.getByText("Rechazar")).toBeTruthy();
  });

  it("should not show banner when consent is accepted", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<CookieConsent />);
    expect(screen.queryByText(/Usamos cookies esenciales/)).toBeNull();
  });

  it("should not show banner when consent is declined", () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    render(<CookieConsent />);
    expect(screen.queryByText(/Usamos cookies esenciales/)).toBeNull();
  });

  it("should save 'accepted' to localStorage and hide banner on accept", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("Aceptar"));
    expect(localStorage.getItem(CONSENT_KEY)).toBe("accepted");
    expect(screen.queryByText(/Usamos cookies esenciales/)).toBeNull();
  });

  it("should save 'declined' to localStorage and hide banner on decline", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText("Rechazar"));
    expect(localStorage.getItem(CONSENT_KEY)).toBe("declined");
    expect(screen.queryByText(/Usamos cookies esenciales/)).toBeNull();
  });

  it("should link to privacy policy", () => {
    render(<CookieConsent />);
    const link = screen.getByText("Política de privacidad");
    expect(link).toBeTruthy();
    expect(link.closest("a")?.getAttribute("href")).toContain("privacy");
  });
});
