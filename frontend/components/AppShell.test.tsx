import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/AppShell";

// Fake JWT: base64url({"alg":"HS256"}).base64url({"sub":"8301001","isOfficer":true}).sig
vi.mock("@/lib/api", () => ({
  loginMember: vi.fn().mockResolvedValue({
    token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4MzAxMDAxIiwiaXNPZmZpY2VyIjp0cnVlfQ.sig",
  }),
}));

describe("AppShell", () => {
  it("shows Home by default and navigates to another section", () => {
    render(<AppShell />);

    expect(screen.getByText("Council 830 Leadership")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "About Our Council" }));
    expect(screen.getByRole("heading", { name: "About Our Council" })).toBeInTheDocument();
  });

  it("opens Officers when the home carousel card is clicked", () => {
    render(<AppShell />);

    fireEvent.click(screen.getByRole("button", { name: "View full officers list" }));
    expect(screen.getByRole("heading", { name: "Officers" })).toBeInTheDocument();
  });

  it("shows error for invalid member login and members area for valid login", async () => {
    render(<AppShell />);

    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(
      screen.getByText("Both membership number and passcode are required."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Membership Number"), {
      target: { value: "8301001" },
    });
    fireEvent.change(screen.getByLabelText("Passcode"), {
      target: { value: "faith830" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Members Area" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});
