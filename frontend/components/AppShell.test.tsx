import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/AppShell";
import * as api from "@/lib/api";

function makeToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

const OFFICER_TOKEN = makeToken({ sub: "8301001", isOfficer: true, officerPosition: "Deputy Grand Knight" });
const NON_OFFICER_TOKEN = makeToken({ sub: "8301004", isOfficer: false, officerPosition: null });

vi.mock("@/lib/api", () => ({
  loginMember: vi.fn(),
  getEvents: vi.fn().mockResolvedValue([]),
  getAnnouncements: vi.fn().mockResolvedValue([]),
  getOfficers: vi.fn().mockResolvedValue([
    { title: "Grand Knight", name: "John Akers", photoUrl: "/officers/john-h-akers.png" },
    { title: "Deputy Grand Knight", name: "James Huckestein", photoUrl: "/officers/james-h.png" },
  ]),
  getMembers: vi.fn().mockResolvedValue([]),
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

  it("hides Edit Announcements from a visitor (not logged in)", () => {
    render(<AppShell />);
    expect(screen.queryByRole("button", { name: "Edit Announcements" })).toBeNull();
  });

  it("shows Edit Announcements in the members area after an officer logs in", async () => {
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301001" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "faith830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.getByRole("button", { name: "Edit Announcements" })).toBeInTheDocument();
  });

  it("hides Edit Announcements in the members area after a non-officer logs in", async () => {
    vi.mocked(api.loginMember).mockResolvedValueOnce({ token: NON_OFFICER_TOKEN });
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301004" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "hope830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.queryByRole("button", { name: "Edit Announcements" })).toBeNull();
  });

  it("officer can navigate into Edit Announcements from the members area", async () => {
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301001" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "faith830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Announcements" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit Announcements" })).toBeInTheDocument();
    });
  });

  it("shows Update Officers for a privileged officer (Deputy Grand Knight)", async () => {
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301001" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "faith830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.getByRole("button", { name: "Update Officers" })).toBeInTheDocument();
  });

  it("hides Update Officers for a non-privileged officer (Chancellor)", async () => {
    const chancellorToken = makeToken({ sub: "8301003", isOfficer: true, officerPosition: "Chancellor" });
    vi.mocked(api.loginMember).mockResolvedValueOnce({ token: chancellorToken });
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301003" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "test" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.queryByRole("button", { name: "Update Officers" })).toBeNull();
  });

  it("hides Update Officers for a non-officer member", async () => {
    vi.mocked(api.loginMember).mockResolvedValueOnce({ token: NON_OFFICER_TOKEN });
    render(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Members Login" }));
    fireEvent.change(screen.getByLabelText("Membership Number"), { target: { value: "8301015" } });
    fireEvent.change(screen.getByLabelText("Passcode"), { target: { value: "hope830" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    await waitFor(() => screen.getByRole("heading", { name: "Members Area" }));
    expect(screen.queryByRole("button", { name: "Update Officers" })).toBeNull();
  });
});
