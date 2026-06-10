import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { News } from "@/components/News";
import * as api from "@/lib/api";
import type { Announcement } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getAnnouncements: vi.fn(),
}));

function makeAnnouncement(overrides: Partial<Announcement>): Announcement {
  return {
    id: "a1",
    title: "Spring Charity Dinner",
    details: "Details here.",
    deleteDate: "2026-05-31",
    createdBy: "8301002",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

const SEED: Announcement[] = [
  makeAnnouncement({ id: "a1", title: "New Member Welcome Reception", details: "Welcome details." }),
  makeAnnouncement({ id: "a2", title: "Volunteer Sign-Up", details: "Volunteer details." }),
  makeAnnouncement({ id: "a3", title: "Spring Charity Dinner", details: "Dinner details." }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getAnnouncements).mockResolvedValue(SEED);
});

describe("News", () => {
  it("renders each announcement title as a clickable box", async () => {
    render(<News />);
    await waitFor(() => screen.getByRole("button", { name: "New Member Welcome Reception" }));
    expect(screen.getByRole("button", { name: "Volunteer Sign-Up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spring Charity Dinner" })).toBeInTheDocument();
  });

  it("opens the detail modal with the right details when a box is clicked", async () => {
    render(<News />);
    await waitFor(() => screen.getByRole("button", { name: "Volunteer Sign-Up" }));
    fireEvent.click(screen.getByRole("button", { name: "Volunteer Sign-Up" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Volunteer Sign-Up" })).toBeInTheDocument();
      expect(screen.getByText("Volunteer details.")).toBeInTheDocument();
    });
  });

  it("dismisses the modal when Close is clicked", async () => {
    render(<News />);
    await waitFor(() => screen.getByRole("button", { name: "Spring Charity Dinner" }));
    fireEvent.click(screen.getByRole("button", { name: "Spring Charity Dinner" }));
    await waitFor(() => screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    // Heading present in the list-button only; the modal heading is gone
    expect(screen.queryByText("Dinner details.")).toBeNull();
  });

  it("shows a Loading placeholder before the first fetch resolves", () => {
    vi.mocked(api.getAnnouncements).mockReturnValue(new Promise(() => {})); // never resolves
    render(<News />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows an empty-state message when the list is empty", async () => {
    vi.mocked(api.getAnnouncements).mockResolvedValueOnce([]);
    render(<News />);
    await waitFor(() => screen.getByText("No current announcements."));
  });
});
