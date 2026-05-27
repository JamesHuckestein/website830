import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarUpdates } from "@/components/CalendarUpdates";
import * as api from "@/lib/api";
import type { Event } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  getEvents: vi.fn(),
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  deleteEvent: vi.fn(),
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

const SEED: Event[] = [
  makeEvent({ id: "a", day: "2026-05-06", title: "Council Meeting" }),
  makeEvent({ id: "b", day: "2026-05-17", title: "Breakfast" }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 4, 26)); // May 26, 2026
  vi.mocked(api.getEvents).mockResolvedValue(SEED);
  vi.mocked(api.createEvent).mockResolvedValue({ success: true, message: "Event created.", id: "new-1" });
  vi.mocked(api.updateEvent).mockResolvedValue({ success: true, message: "Event updated." });
  vi.mocked(api.deleteEvent).mockResolvedValue({ success: true, message: "Event deleted." });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CalendarUpdates", () => {
  it("fetches events and renders the current month header", async () => {
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("May 2026")).toBeInTheDocument();
      expect(screen.getByText("Council Meeting")).toBeInTheDocument();
    });
    expect(api.getEvents).toHaveBeenCalledWith("2026-05");
  });

  it("shows 'Please select a day first.' when Add is clicked without selection", async () => {
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("Please select a day first.")).toBeInTheDocument();
  });

  it("shows 'No event on this day.' when Edit is clicked on an empty day", async () => {
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("No event on this day.")).toBeInTheDocument();
  });

  it("Add saves via API, shows success modal, and refetches", async () => {
    vi.mocked(api.getEvents)
      .mockResolvedValueOnce(SEED) // initial
      .mockResolvedValueOnce([
        ...SEED,
        makeEvent({ id: "new-1", day: "2026-05-12", title: "Charity Drive" }),
      ]); // after save refetch
    render(<CalendarUpdates token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 12" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Charity Drive" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Service project." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.createEvent).toHaveBeenCalledWith("abc", {
        day: "2026-05-12",
        title: "Charity Drive",
        description: "Service project.",
        timeOfDay: null,
        location: null,
      });
      expect(screen.getByRole("heading", { name: "Success" })).toBeInTheDocument();
      expect(screen.getByText("Event created.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.getByText("Charity Drive")).toBeInTheDocument());
  });

  it("shows backend error message verbatim and keeps the form open with values preserved on Add failure", async () => {
    vi.mocked(api.createEvent).mockRejectedValueOnce(
      new Error("This day already has the maximum of 3 events."),
    );
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 12" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Charity Drive" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Service project." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Error" })).toBeInTheDocument();
      expect(screen.getByText("This day already has the maximum of 3 events.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    // Form remains open with values preserved
    expect(screen.getByRole("heading", { name: "Add Event" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Charity Drive")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Service project.")).toBeInTheDocument();
  });

  it("uses fallback message when error has no message", async () => {
    vi.mocked(api.createEvent).mockRejectedValueOnce(new Error(""));
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 12" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Y" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Failed to create event. Please try again.")).toBeInTheDocument();
    });
  });

  it("opens Edit form pre-filled when day has exactly 1 event", async () => {
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Edit Event" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Council Meeting")).toBeInTheDocument();
  });

  it("opens DayEventPicker when day has ≥2 events for Edit", async () => {
    vi.mocked(api.getEvents).mockResolvedValueOnce([
      makeEvent({ id: "a", day: "2026-05-06", title: "Council Meeting" }),
      makeEvent({ id: "b", day: "2026-05-06", title: "Choir Rehearsal" }),
    ]);
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("heading", { name: "Edit which event?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choir Rehearsal" }));
    expect(screen.getByRole("heading", { name: "Edit Event" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Choir Rehearsal")).toBeInTheDocument();
  });

  it("Edit saves via API, shows success modal, and refetches with new title", async () => {
    vi.mocked(api.getEvents)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([
        makeEvent({ id: "a", day: "2026-05-06", title: "Renamed Meeting" }),
        SEED[1],
      ]);
    render(<CalendarUpdates token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Renamed Meeting" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(api.updateEvent).toHaveBeenCalledWith("abc", "a", expect.objectContaining({
        day: "2026-05-06",
        title: "Renamed Meeting",
      }));
      expect(screen.getByText("Event updated.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => {
      expect(screen.queryByText("Council Meeting")).toBeNull();
      expect(screen.getByText("Renamed Meeting")).toBeInTheDocument();
    });
  });

  it("Delete confirms via 'Will you confirm?', calls API on Yes, refetches", async () => {
    vi.mocked(api.getEvents)
      .mockResolvedValueOnce(SEED)
      .mockResolvedValueOnce([SEED[1]]); // a is deleted
    render(<CalendarUpdates token="abc" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Will you confirm?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() => {
      expect(api.deleteEvent).toHaveBeenCalledWith("abc", "a");
      expect(screen.getByText("Event deleted.")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByText("Council Meeting")).toBeNull());
  });

  it("Delete No leaves the event in place", async () => {
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(api.deleteEvent).not.toHaveBeenCalled();
    expect(screen.queryByText("Will you confirm?")).toBeNull();
    expect(screen.getByText("Council Meeting")).toBeInTheDocument();
  });

  it("blocks Add when the day already has 3 events", async () => {
    vi.mocked(api.getEvents).mockResolvedValueOnce([
      makeEvent({ id: "a", day: "2026-05-06", title: "One" }),
      makeEvent({ id: "b", day: "2026-05-06", title: "Two" }),
      makeEvent({ id: "c", day: "2026-05-06", title: "Three" }),
    ]);
    render(<CalendarUpdates token="t" onBack={vi.fn()} />);
    await waitFor(() => screen.getByText("One"));
    fireEvent.click(screen.getByRole("button", { name: "Select day 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByText("This day already has the maximum of 3 events.")).toBeInTheDocument();
  });

  it("calls onBack when Back to Members Area is clicked", async () => {
    const onBack = vi.fn();
    render(<CalendarUpdates token="t" onBack={onBack} />);
    await waitFor(() => screen.getByText("Council Meeting"));
    fireEvent.click(screen.getByRole("button", { name: "Back to Members Area" }));
    expect(onBack).toHaveBeenCalled();
  });
});
