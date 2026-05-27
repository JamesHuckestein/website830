import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DayEventPicker } from "@/components/DayEventPicker";
import type { Event } from "@/lib/api";

function makeEvent(overrides: Partial<Event>): Event {
  return {
    id: "e1",
    day: "2026-05-06",
    title: "Sample",
    description: "Desc",
    timeOfDay: null,
    location: null,
    createdBy: "8301002",
    createdAt: "2026-05-01T00:00:00Z",
    updatedAt: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("DayEventPicker", () => {
  it("renders the action label, day, and event titles", () => {
    render(
      <DayEventPicker
        day="2026-05-06"
        events={[makeEvent({ id: "a", title: "Council Meeting" }), makeEvent({ id: "b", title: "Choir" })]}
        actionLabel="Edit"
        onPick={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Edit which event?" })).toBeInTheDocument();
    expect(screen.getByText("Wednesday, May 6, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Council Meeting" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choir" })).toBeInTheDocument();
  });

  it("calls onPick with the chosen event", () => {
    const onPick = vi.fn();
    const a = makeEvent({ id: "a", title: "Council Meeting" });
    const b = makeEvent({ id: "b", title: "Choir" });
    render(
      <DayEventPicker
        day="2026-05-06"
        events={[a, b]}
        actionLabel="Delete"
        onPick={onPick}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choir" }));
    expect(onPick).toHaveBeenCalledWith(b);
  });

  it("uses the Delete action label", () => {
    render(
      <DayEventPicker
        day="2026-05-06"
        events={[makeEvent({})]}
        actionLabel="Delete"
        onPick={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Delete which event?" })).toBeInTheDocument();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(
      <DayEventPicker
        day="2026-05-06"
        events={[makeEvent({})]}
        actionLabel="Edit"
        onPick={vi.fn()}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
