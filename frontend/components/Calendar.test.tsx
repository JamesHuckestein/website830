import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "@/components/Calendar";
import * as api from "@/lib/api";
import type { Event } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getEvents: vi.fn(),
}));

function makeEvent(overrides: Partial<Event>): Event {
  return {
    id: "e1",
    day: "2026-05-06",
    title: "Council Meeting",
    description: "Monthly meeting.",
    timeOfDay: "18:30",
    location: "Parish Hall",
    createdBy: "8301002",
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 4, 26)); // May 26, 2026
  vi.mocked(api.getEvents).mockResolvedValue([makeEvent({})]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Calendar", () => {
  it("defaults to the current month and fetches its events", async () => {
    render(<Calendar />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "May 2026" })).toBeInTheDocument();
    });
    expect(api.getEvents).toHaveBeenCalledWith("2026-05");
  });

  it("renders fetched event titles in the grid", async () => {
    render(<Calendar />);
    await waitFor(() => screen.getByText("Council Meeting"));
  });

  it("opens the detail modal when an event title is clicked", async () => {
    render(<Calendar />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByText("Council Meeting"));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Council Meeting" })).toBeInTheDocument();
      expect(screen.getByText("Wednesday, May 6, 2026")).toBeInTheDocument();
    });
  });

  it("closes the detail modal when Close is clicked", async () => {
    render(<Calendar />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByText("Council Meeting"));
    await waitFor(() => screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    // After close, only the grid event-link remains (heading is just the month label)
    expect(screen.queryByText("Wednesday, May 6, 2026")).toBeNull();
  });

  it("navigates to the previous month and refetches", async () => {
    render(<Calendar />);
    await waitFor(() => screen.getByRole("heading", { name: "May 2026" }));
    vi.mocked(api.getEvents).mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "April 2026" })).toBeInTheDocument();
    });
    expect(api.getEvents).toHaveBeenCalledWith("2026-04");
  });

  it("navigates to the next month and refetches", async () => {
    render(<Calendar />);
    await waitFor(() => screen.getByRole("heading", { name: "May 2026" }));
    vi.mocked(api.getEvents).mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "June 2026" })).toBeInTheDocument();
    });
    expect(api.getEvents).toHaveBeenCalledWith("2026-06");
  });

  it("wraps from January to previous December", async () => {
    vi.setSystemTime(new Date(2026, 0, 15)); // Jan 15, 2026
    render(<Calendar />);
    await waitFor(() => screen.getByRole("heading", { name: "January 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "December 2025" })).toBeInTheDocument();
    });
    expect(api.getEvents).toHaveBeenCalledWith("2025-12");
  });

  it("wraps from December to next January", async () => {
    vi.setSystemTime(new Date(2026, 11, 15)); // Dec 15, 2026
    render(<Calendar />);
    await waitFor(() => screen.getByRole("heading", { name: "December 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "January 2027" })).toBeInTheDocument();
    });
    expect(api.getEvents).toHaveBeenCalledWith("2027-01");
  });
});
