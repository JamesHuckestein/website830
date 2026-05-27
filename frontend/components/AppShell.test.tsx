import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/AppShell";
import * as api from "@/lib/api";

const OFFICER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4MzAxMDAxIiwiaXNPZmZpY2VyIjp0cnVlfQ.sig";
const NON_OFFICER_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI4MzAxMDA0IiwiaXNPZmZpY2VyIjpmYWxzZX0.sig";

vi.mock("@/lib/api", () => ({
  loginMember: vi.fn(),
  getEvents: vi.fn().mockResolvedValue([]),
}));

beforeEach(() => {
  vi.mocked(api.loginMember).mockResolvedValue({ token: OFFICER_TOKEN });
});

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

  it("hides Calendar Updates from a visitor (not logged in)", () => {
    render(<AppShell />);
    expect(screen.queryByRole("button", { name: "Calendar Updates" })).toBeNull();
  });

  it("shows Calendar Updates in the members area after an officer logs in", async () => {
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301001" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "faith830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.getByRole("button", { name: "Calendar Updates" })).toBeInTheDocument();
  });

  it("hides Calendar Updates in the members area after a non-officer logs in", async () => {
    vi.mocked(api.loginMember).mockResolvedValueOnce({ token: NON_OFFICER_TOKEN });
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301004" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "hope830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.queryByRole("button", { name: "Calendar Updates" })).toBeNull();
  });

  it("officer can navigate into Calendar Updates from the members area", async () => {
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301001" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "faith830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Calendar Updates" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Calendar Updates" })).toBeInTheDocument();
    });
  });
});
