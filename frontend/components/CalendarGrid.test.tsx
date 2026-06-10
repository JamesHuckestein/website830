import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalendarGrid } from "@/components/CalendarGrid";
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

describe("CalendarGrid", () => {
  it("renders the Mon→Sun weekday header", () => {
    render(<CalendarGrid year={2026} month={5} events={[]} />);
    const headers = screen.getAllByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/);
    expect(headers.map((h) => h.textContent)).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("leaves leading cells blank for months that don't start on Monday", () => {
    // May 1 2026 is a Friday → 4 leading blanks (Mon..Thu)
    const { container } = render(<CalendarGrid year={2026} month={5} events={[]} />);
    const cells = container.querySelectorAll("div.grid.grid-cols-7.gap-1.mt-1 > *");
    expect(cells[0].textContent).toBe(""); // leading blank
    expect(cells[3].textContent).toBe(""); // last leading blank
    expect(cells[4].textContent).toBe("1"); // Friday May 1
  });

  it("renders all 31 days for May 2026", () => {
    const { container } = render(<CalendarGrid year={2026} month={5} events={[]} />);
    const cells = container.querySelectorAll("div.grid.grid-cols-7.gap-1.mt-1 > *");
    const labels: string[] = [];
    cells.forEach((c) => {
      const num = c.querySelector("p")?.textContent;
      if (num) labels.push(num);
    });
    expect(labels).toEqual(Array.from({ length: 31 }, (_, i) => String(i + 1)));
  });

  it("renders event title links for days that have events", () => {
    const events = [makeEvent({ id: "a", day: "2026-05-06", title: "Council Meeting" })];
    render(<CalendarGrid year={2026} month={5} events={events} />);
    expect(screen.getByText("Council Meeting")).toBeInTheDocument();
  });

  it("invokes onEventClick when an event title is clicked", () => {
    const onEventClick = vi.fn();
    const ev = makeEvent({ id: "a", day: "2026-05-06", title: "Council Meeting" });
    render(<CalendarGrid year={2026} month={5} events={[ev]} onEventClick={onEventClick} />);
    fireEvent.click(screen.getByText("Council Meeting"));
    expect(onEventClick).toHaveBeenCalledWith(ev);
  });

  it("renders day cells as buttons when onDayClick is provided", () => {
    const onDayClick = vi.fn();
    render(<CalendarGrid year={2026} month={5} events={[]} onDayClick={onDayClick} />);
    const dayBtn = screen.getByRole("button", { name: "Select day 1" });
    fireEvent.click(dayBtn);
    expect(onDayClick).toHaveBeenCalledWith("2026-05-01");
  });

  it("does not render day cells as buttons in read-only (public) mode", () => {
    render(<CalendarGrid year={2026} month={5} events={[]} />);
    expect(screen.queryByRole("button", { name: /^Select day/ })).toBeNull();
  });

  it("caps rendered events at 3 per day", () => {
    const events = [
      makeEvent({ id: "a", day: "2026-05-06", title: "One" }),
      makeEvent({ id: "b", day: "2026-05-06", title: "Two" }),
      makeEvent({ id: "c", day: "2026-05-06", title: "Three" }),
      makeEvent({ id: "d", day: "2026-05-06", title: "Four" }),
    ];
    render(<CalendarGrid year={2026} month={5} events={events} />);
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
    expect(screen.getByText("Three")).toBeInTheDocument();
    expect(screen.queryByText("Four")).toBeNull();
  });

  it("highlights the selected day", () => {
    const onDayClick = vi.fn();
    render(
      <CalendarGrid
        year={2026}
        month={5}
        events={[]}
        selectedDay="2026-05-06"
        onDayClick={onDayClick}
      />,
    );
    const btn = screen.getByRole("button", { name: "Select day 6" });
    expect(btn.className).toMatch(/border-\[#753991\]/);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("renders 30 days for April 2026", () => {
    // April 2026: April 1 = Wednesday → 2 leading blanks
    const { container } = render(<CalendarGrid year={2026} month={4} events={[]} />);
    const cells = within(
      container.querySelector("div.grid.grid-cols-7.gap-1.mt-1") as HTMLElement,
    ).getAllByText(/^\d+$/);
    expect(cells.map((c) => c.textContent)).toEqual(Array.from({ length: 30 }, (_, i) => String(i + 1)));
  });
});
