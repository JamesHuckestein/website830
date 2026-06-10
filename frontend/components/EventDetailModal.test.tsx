import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventDetailModal } from "@/components/EventDetailModal";
import type { Event } from "@/lib/api";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "e1",
    day: "2026-05-06",
    title: "Council Meeting",
    description: "Monthly council business meeting.",
    timeOfDay: "18:30",
    location: "Parish Hall",
    createdBy: "8301002",
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("EventDetailModal", () => {
  it("renders title, formatted date, time, location, and description", () => {
    render(<EventDetailModal event={makeEvent()} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Council Meeting" })).toBeInTheDocument();
    expect(screen.getByText("Wednesday, May 6, 2026")).toBeInTheDocument();
    expect(screen.getByText("Time: 6:30 PM")).toBeInTheDocument();
    expect(screen.getByText("Location: Parish Hall")).toBeInTheDocument();
    expect(screen.getByText("Monthly council business meeting.")).toBeInTheDocument();
  });

  it("omits the time line when timeOfDay is null", () => {
    render(<EventDetailModal event={makeEvent({ timeOfDay: null })} onClose={vi.fn()} />);
    expect(screen.queryByText(/Time:/)).toBeNull();
  });

  it("omits the location line when location is null", () => {
    render(<EventDetailModal event={makeEvent({ location: null })} onClose={vi.fn()} />);
    expect(screen.queryByText(/Location:/)).toBeNull();
  });

  it("formats 12:00 as 12:00 PM", () => {
    render(<EventDetailModal event={makeEvent({ timeOfDay: "12:00" })} onClose={vi.fn()} />);
    expect(screen.getByText("Time: 12:00 PM")).toBeInTheDocument();
  });

  it("formats 00:00 as 12:00 AM", () => {
    render(<EventDetailModal event={makeEvent({ timeOfDay: "00:00" })} onClose={vi.fn()} />);
    expect(screen.getByText("Time: 12:00 AM")).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", () => {
    const onClose = vi.fn();
    render(<EventDetailModal event={makeEvent()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
